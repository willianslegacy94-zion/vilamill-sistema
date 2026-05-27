"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

type Funcionario = { id: string; nome: string; empresa: string; saldo: number };
type Produto = { id: string; nome: string; preco: string; categoria: string };

function moeda(v: number | string) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Props = { emailOperador: string; isAdmin: boolean };

export default function CaixinhaClient({ emailOperador, isAdmin }: Props) {
  const [aba, setAba] = useState<"consumo" | "caixinha">("consumo");
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  // consumo
  const [funcionarioId, setFuncionarioId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [salvandoConsumo, setSalvandoConsumo] = useState(false);
  const [erroConsumo, setErroConsumo] = useState("");
  const [sucessoConsumo, setSucessoConsumo] = useState("");

  // caixinha
  const [caixinhaTipo, setCaixinhaTipo] = useState<"COLETIVO" | "INDIVIDUAL">("COLETIVO");
  const [caixinhaFuncId, setCaixinhaFuncId] = useState("");
  const [caixinhaValor, setCaixinhaValor] = useState("");
  const [caixinhaDescricao, setCaixinhaDescricao] = useState("");
  const [salvandoCaixinha, setSalvandoCaixinha] = useState(false);
  const [feedbackCaixinha, setFeedbackCaixinha] = useState("");

  // novo funcionário (admin)
  const [showNovoFuncionario, setShowNovoFuncionario] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaEmpresa, setNovaEmpresa] = useState("Lava-Rápido");
  const [salvandoFuncionario, setSalvandoFuncionario] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [resF, resP] = await Promise.all([
        fetch("/api/parceiros/funcionarios"),
        fetch("/api/produtos"),
      ]);
      const [funcs, prods] = await Promise.all([resF.json(), resP.json()]);
      setFuncionarios(funcs);
      setProdutos(prods);
      if (funcs.length > 0 && !funcionarioId) setFuncionarioId(funcs[0].id);
      if (prods.length > 0 && !produtoId) setProdutoId(prods[0].id);
    } finally {
      setCarregando(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { carregar(); }, [carregar]);

  const funcionarioSelecionado = funcionarios.find((f) => f.id === funcionarioId);
  const produtoSelecionado = produtos.find((p) => p.id === produtoId);
  const subtotal = produtoSelecionado ? Number(produtoSelecionado.preco) * quantidade : 0;
  const saldoInsuficiente = !!funcionarioSelecionado && subtotal > funcionarioSelecionado.saldo;

  async function registrarConsumo() {
    if (!funcionarioId || !produtoId || quantidade <= 0) return;
    setSalvandoConsumo(true);
    setErroConsumo("");
    setSucessoConsumo("");
    try {
      const res = await fetch("/api/parceiros/consumo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funcionarioId, productId: produtoId, quantidade, registradoPor: emailOperador }),
      });
      const data = await res.json();
      if (!res.ok) { setErroConsumo(data.error ?? "Erro ao registrar."); return; }
      setSucessoConsumo(`Baixa registrada — ${moeda(subtotal)} debitado de ${funcionarioSelecionado?.nome}.`);
      setQuantidade(1);
      carregar();
    } finally {
      setSalvandoConsumo(false);
    }
  }

  async function registrarCaixinha() {
    if (!caixinhaValor || Number(caixinhaValor) <= 0) return;
    if (caixinhaTipo === "INDIVIDUAL" && !caixinhaFuncId) return;
    setSalvandoCaixinha(true);
    setFeedbackCaixinha("");
    try {
      const body: Record<string, unknown> = {
        tipo: caixinhaTipo,
        valor: Number(caixinhaValor),
        descricao: caixinhaDescricao || null,
        registradoPor: emailOperador,
      };
      if (caixinhaTipo === "INDIVIDUAL") body.funcionarioId = caixinhaFuncId;
      else body.empresa = "Lava-Rápido";

      const res = await fetch("/api/parceiros/credito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setFeedbackCaixinha(data.error ?? "Erro."); return; }
      setFeedbackCaixinha(
        caixinhaTipo === "COLETIVO"
          ? `✓ Caixinha de ${moeda(Number(caixinhaValor))} registrada para ${data.criados} funcionário(s).`
          : `✓ Caixinha registrada para ${funcionarios.find(f => f.id === caixinhaFuncId)?.nome}.`
      );
      setCaixinhaValor("");
      setCaixinhaDescricao("");
      carregar();
    } finally {
      setSalvandoCaixinha(false);
    }
  }

  async function criarFuncionario() {
    if (!novoNome.trim()) return;
    setSalvandoFuncionario(true);
    try {
      await fetch("/api/parceiros/funcionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome.trim(), empresa: novaEmpresa.trim() }),
      });
      setNovoNome("");
      setNovaEmpresa("Lava-Rápido");
      setShowNovoFuncionario(false);
      carregar();
    } finally {
      setSalvandoFuncionario(false);
    }
  }

  if (carregando) {
    return <p className="text-sm text-slate-400">Carregando...</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Coluna esquerda — Saldos */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Funcionários</h2>
          {isAdmin && (
            <button
              onClick={() => setShowNovoFuncionario(!showNovoFuncionario)}
              className="text-xs font-semibold text-violet-600 hover:text-violet-800"
            >
              + Novo
            </button>
          )}
        </div>

        {showNovoFuncionario && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome do funcionário"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <input
              value={novaEmpresa}
              onChange={(e) => setNovaEmpresa(e.target.value)}
              placeholder="Empresa"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowNovoFuncionario(false)} className="flex-1 rounded-lg border border-slate-300 py-2 text-xs text-slate-500 hover:bg-slate-50">Cancelar</button>
              <Button onClick={criarFuncionario} disabled={salvandoFuncionario || !novoNome.trim()} className="flex-1 py-2 text-xs">
                {salvandoFuncionario ? "..." : "Cadastrar"}
              </Button>
            </div>
          </div>
        )}

        {funcionarios.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum funcionário cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {funcionarios.map((f) => (
              <button
                key={f.id}
                onClick={() => { setFuncionarioId(f.id); setCaixinhaFuncId(f.id); }}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  funcionarioId === f.id
                    ? "border-violet-400 bg-violet-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="font-semibold text-slate-900">{f.nome}</div>
                <div className="text-xs text-slate-400">{f.empresa}</div>
                <div className={`mt-1 text-sm font-bold ${f.saldo < 0 ? "text-red-600" : f.saldo === 0 ? "text-slate-400" : "text-emerald-600"}`}>
                  {moeda(f.saldo)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Coluna direita — Ações */}
      <div className="lg:col-span-2">
        {/* Abas */}
        <div className="mb-5 flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => { setAba("consumo"); setErroConsumo(""); setSucessoConsumo(""); }}
            className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-colors ${aba === "consumo" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Registrar Consumo
          </button>
          <button
            onClick={() => { setAba("caixinha"); setFeedbackCaixinha(""); }}
            className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-colors ${aba === "caixinha" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Registrar Caixinha
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">

          {/* ABA CONSUMO */}
          {aba === "consumo" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Funcionário</label>
                <select
                  value={funcionarioId}
                  onChange={(e) => { setFuncionarioId(e.target.value); setErroConsumo(""); setSucessoConsumo(""); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome} — saldo: {moeda(f.saldo)}</option>
                  ))}
                </select>
                {funcionarioSelecionado && (
                  <p className={`mt-1 text-xs font-semibold ${funcionarioSelecionado.saldo <= 0 ? "text-red-500" : "text-emerald-600"}`}>
                    Saldo disponível: {moeda(funcionarioSelecionado.saldo)}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Produto</label>
                <select
                  value={produtoId}
                  onChange={(e) => { setProdutoId(e.target.value); setErroConsumo(""); setSucessoConsumo(""); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome} — {moeda(p.preco)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Quantidade</label>
                <input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => { setQuantidade(Math.max(1, Number(e.target.value))); setErroConsumo(""); setSucessoConsumo(""); }}
                  className="w-28 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {subtotal > 0 && (
                <div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold ${saldoInsuficiente ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-700"}`}>
                  <span>Subtotal</span>
                  <span className="text-base">{moeda(subtotal)}</span>
                </div>
              )}

              {saldoInsuficiente && (
                <p className="text-sm font-semibold text-red-600">
                  Saldo insuficiente — disponível: {moeda(funcionarioSelecionado!.saldo)}
                </p>
              )}
              {erroConsumo && <p className="text-sm font-semibold text-red-600">{erroConsumo}</p>}
              {sucessoConsumo && (
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {sucessoConsumo}
                </div>
              )}

              <Button
                onClick={registrarConsumo}
                disabled={salvandoConsumo || saldoInsuficiente || !funcionarioId || !produtoId || funcionarios.length === 0}
                className="w-full py-4 text-base"
              >
                {salvandoConsumo ? "Registrando..." : "Confirmar Baixa"}
              </Button>
            </>
          )}

          {/* ABA CAIXINHA */}
          {aba === "caixinha" && (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => setCaixinhaTipo("COLETIVO")}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${caixinhaTipo === "COLETIVO" ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                >
                  Caixinha-Lava-Rápido
                </button>
                <button
                  onClick={() => setCaixinhaTipo("INDIVIDUAL")}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${caixinhaTipo === "INDIVIDUAL" ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                >
                  Individual
                </button>
              </div>

              {caixinhaTipo === "INDIVIDUAL" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Funcionário</label>
                  <select
                    value={caixinhaFuncId}
                    onChange={(e) => setCaixinhaFuncId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="">Selecionar funcionário</option>
                    {funcionarios.map((f) => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Valor por funcionário</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={caixinhaValor}
                    onChange={(e) => { setCaixinhaValor(e.target.value); setFeedbackCaixinha(""); }}
                    placeholder="0,00"
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Descrição (opcional)</label>
                <input
                  value={caixinhaDescricao}
                  onChange={(e) => setCaixinhaDescricao(e.target.value)}
                  placeholder={`Caixinha ${new Date().toLocaleDateString("pt-BR")}`}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {caixinhaTipo === "COLETIVO" && Number(caixinhaValor) > 0 && funcionarios.length > 0 && (
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Será creditado para <strong>{funcionarios.length}</strong> funcionário(s) ·{" "}
                  Total: <strong>{moeda(Number(caixinhaValor) * funcionarios.length)}</strong>
                </div>
              )}

              {feedbackCaixinha && (
                <div className={`rounded-lg px-4 py-3 text-sm font-semibold ${feedbackCaixinha.startsWith("✓") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {feedbackCaixinha}
                </div>
              )}

              <Button
                onClick={registrarCaixinha}
                disabled={salvandoCaixinha || !caixinhaValor || Number(caixinhaValor) <= 0 || (caixinhaTipo === "INDIVIDUAL" && !caixinhaFuncId) || funcionarios.length === 0}
                className="w-full py-4 text-base bg-emerald-600 hover:bg-emerald-700"
              >
                {salvandoCaixinha ? "Registrando..." : "Confirmar Crédito"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
