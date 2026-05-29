"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

type Funcionario = { id: string; nome: string; empresa: string; poolSaldo: number };
type Produto = { id: string; nome: string; preco: string };

function moeda(v: number | string) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const EMPRESAS = [
  { id: "Lava-Rápido", label: "Lava-Rápido", icon: "🚗" },
  { id: "Villa Mill",  label: "Villa Mill",  icon: "🍖" },
] as const;

type EmpresaId = (typeof EMPRESAS)[number]["id"];

export default function CaixinhaModal({
  emailOperador,
  onClose,
}: {
  emailOperador: string;
  onClose: () => void;
}) {
  const [aba, setAba] = useState<"consumo" | "caixinha">("consumo");
  const [empresaSel, setEmpresaSel] = useState<EmpresaId>("Lava-Rápido");

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  // consumo
  const [funcId, setFuncId] = useState("");
  const [prodId, setProdId] = useState("");
  const [qtd, setQtd] = useState(1);
  const [erroConsumo, setErroConsumo] = useState("");
  const [okConsumo, setOkConsumo] = useState("");
  const [salvandoConsumo, setSalvandoConsumo] = useState(false);

  // caixinha
  const [tipo, setTipo] = useState<"COLETIVO" | "INDIVIDUAL">("COLETIVO");
  const [caixinhaFuncId, setCaixinhaFuncId] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [okCaixinha, setOkCaixinha] = useState("");
  const [erroCaixinha, setErroCaixinha] = useState("");
  const [salvandoCaixinha, setSalvandoCaixinha] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [rf, rp] = await Promise.all([
      fetch("/api/parceiros/funcionarios"),
      fetch("/api/produtos"),
    ]);
    const [funcs, prods] = await Promise.all([rf.json(), rp.json()]);
    setFuncionarios(funcs);
    setProdutos(prods);
    if (prods.length > 0) setProdId(prods[0].id);
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Funcionários do segmento ativo
  const funcsEmpresa = funcionarios.filter((f) => f.empresa === empresaSel);

  // Reset seleção ao trocar empresa
  useEffect(() => {
    const primeiro = funcionarios.find((f) => f.empresa === empresaSel);
    setFuncId(primeiro?.id ?? "");
    setCaixinhaFuncId(primeiro?.id ?? "");
    setErroConsumo(""); setOkConsumo("");
    setOkCaixinha(""); setErroCaixinha("");
  }, [empresaSel, funcionarios]);

  const funcSelecionado = funcsEmpresa.find((f) => f.id === funcId);
  const prodSelecionado = produtos.find((p) => p.id === prodId);
  const subtotal = prodSelecionado ? Number(prodSelecionado.preco) * qtd : 0;
  // Pool é compartilhado — todos do segmento têm o mesmo saldo disponível
  const poolSaldo = funcsEmpresa[0]?.poolSaldo ?? 0;
  const semSaldo = subtotal > poolSaldo;

  async function registrarConsumo() {
    setErroConsumo(""); setOkConsumo("");
    setSalvandoConsumo(true);
    try {
      const res = await fetch("/api/parceiros/consumo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funcionarioId: funcId,
          productId: prodId,
          quantidade: qtd,
          registradoPor: emailOperador,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErroConsumo(data.error ?? "Erro ao registrar."); return; }
      setOkConsumo(`Baixa de ${moeda(subtotal)} registrada para ${funcSelecionado?.nome}.`);
      setQtd(1);
      carregar();
    } finally { setSalvandoConsumo(false); }
  }

  async function registrarCaixinha() {
    setOkCaixinha(""); setErroCaixinha("");
    setSalvandoCaixinha(true);
    try {
      const body: Record<string, unknown> = {
        tipo,
        valor: Number(valor),
        descricao: descricao || null,
        registradoPor: emailOperador,
        ...(tipo === "INDIVIDUAL"
          ? { funcionarioId: caixinhaFuncId }
          : { empresa: empresaSel }),
      };
      const res = await fetch("/api/parceiros/credito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErroCaixinha(data.error ?? "Erro."); return; }
      setOkCaixinha(
        tipo === "COLETIVO"
          ? `${moeda(Number(valor))} creditado para ${data.criados} funcionário(s) do ${empresaSel}.`
          : `Crédito registrado para ${funcsEmpresa.find((f) => f.id === caixinhaFuncId)?.nome}.`
      );
      setValor(""); setDescricao("");
      carregar();
    } finally { setSalvandoCaixinha(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/50 sm:px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Alça mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Caixinha</h2>
              <p className="text-xs text-slate-400 mt-0.5">Consumo e crédito por segmento</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Seletor de empresa (segmento) */}
          <div className="mb-4 flex rounded-lg bg-slate-100 p-1 gap-1">
            {EMPRESAS.map((emp) => (
              <button
                key={emp.id}
                onClick={() => setEmpresaSel(emp.id)}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                  empresaSel === emp.id
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {emp.icon} {emp.label}
              </button>
            ))}
          </div>

          {/* Abas de operação */}
          <div className="mb-5 flex rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => { setAba("consumo"); setErroConsumo(""); setOkConsumo(""); }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                aba === "consumo"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Consumo
            </button>
            <button
              onClick={() => { setAba("caixinha"); setOkCaixinha(""); setErroCaixinha(""); }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                aba === "caixinha"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Caixinha
            </button>
          </div>

          {carregando ? (
            <p className="py-8 text-center text-sm text-slate-400">Carregando...</p>
          ) : funcsEmpresa.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhum funcionário de <strong>{empresaSel}</strong> cadastrado.{" "}
              <a href="/parceiros" className="text-violet-600 underline">Cadastrar em Parceiros</a>
            </p>
          ) : (
            <div className="space-y-4">

              {/* ── ABA CONSUMO ── */}
              {aba === "consumo" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Funcionário · {empresaSel}
                    </label>
                    <select
                      value={funcId}
                      onChange={(e) => { setFuncId(e.target.value); setErroConsumo(""); setOkConsumo(""); }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      {funcsEmpresa.map((f) => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                    <p className={`mt-1 text-xs font-semibold ${poolSaldo <= 0 ? "text-red-500" : "text-emerald-600"}`}>
                      Saldo da caixinha {empresaSel}: {moeda(poolSaldo)}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Produto</label>
                    <select
                      value={prodId}
                      onChange={(e) => { setProdId(e.target.value); setErroConsumo(""); setOkConsumo(""); }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
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
                      value={qtd}
                      onChange={(e) => {
                        setQtd(Math.max(1, Number(e.target.value)));
                        setErroConsumo(""); setOkConsumo("");
                      }}
                      className="w-24 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>

                  {subtotal > 0 && (
                    <div className={`flex justify-between rounded-lg px-4 py-3 text-sm font-semibold ${semSaldo ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-700"}`}>
                      <span>Total a debitar</span>
                      <span>{moeda(subtotal)}</span>
                    </div>
                  )}

                  {semSaldo && (
                    <p className="text-xs font-semibold text-red-600">
                      Saldo insuficiente na caixinha — disponível: {moeda(poolSaldo)}
                    </p>
                  )}
                  {erroConsumo && <p className="text-xs font-semibold text-red-600">{erroConsumo}</p>}
                  {okConsumo && (
                    <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      {okConsumo}
                    </div>
                  )}

                  <Button
                    onClick={registrarConsumo}
                    disabled={salvandoConsumo || semSaldo || !funcId || !prodId}
                    className="w-full py-4 text-base"
                  >
                    {salvandoConsumo ? "Registrando..." : "Confirmar Baixa"}
                  </Button>
                </>
              )}

              {/* ── ABA CAIXINHA ── */}
              {aba === "caixinha" && (
                <>
                  <div className="flex gap-2">
                    {(["COLETIVO", "INDIVIDUAL"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTipo(t)}
                        className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                          tipo === t
                            ? "border-slate-800 bg-slate-800 text-white"
                            : "border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {t === "COLETIVO" ? "Coletivo" : "Individual"}
                      </button>
                    ))}
                  </div>

                  {tipo === "INDIVIDUAL" && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">
                        Funcionário · {empresaSel}
                      </label>
                      <select
                        value={caixinhaFuncId}
                        onChange={(e) => setCaixinhaFuncId(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                      >
                        {funcsEmpresa.map((f) => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Valor
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={valor}
                        onChange={(e) => { setValor(e.target.value); setOkCaixinha(""); setErroCaixinha(""); }}
                        placeholder="0,00"
                        className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Descrição (opcional)</label>
                    <input
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder={`Caixinha ${new Date().toLocaleDateString("pt-BR")}`}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>

                  {tipo === "COLETIVO" && Number(valor) > 0 && (
                    <div className="rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-700">
                      <strong>{funcsEmpresa.length}</strong> funcionário(s) de <strong>{empresaSel}</strong>{" "}
                      receberão <strong>{moeda(Number(valor))}</strong> cada
                    </div>
                  )}

                  {erroCaixinha && <p className="text-xs font-semibold text-red-600">{erroCaixinha}</p>}
                  {okCaixinha && (
                    <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      {okCaixinha}
                    </div>
                  )}

                  <Button
                    onClick={registrarCaixinha}
                    disabled={
                      salvandoCaixinha ||
                      !valor ||
                      Number(valor) <= 0 ||
                      (tipo === "INDIVIDUAL" && !caixinhaFuncId)
                    }
                    className="w-full py-4 text-base bg-violet-600 hover:bg-violet-700"
                  >
                    {salvandoCaixinha ? "Registrando..." : "Confirmar Crédito"}
                  </Button>
                </>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
