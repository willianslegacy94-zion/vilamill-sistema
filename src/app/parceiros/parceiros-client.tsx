"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Colaborador = {
  id: string;
  nome: string;
  setor: string;
  saldo: number;
};

type LancamentoVale = {
  id: string;
  tipo: "DINHEIRO" | "PRODUTO";
  descricao: string;
  valor: string;
  status: "PENDENTE" | "PAGO";
  createdAt: string;
};

const SETORES = ["Restaurante", "Cozinha", "Lava-Rápido"] as const;

function moeda(v: number | string) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ParceirosClient() {
  const { data: session } = useSession();
  const emailOperador = session?.user?.email ?? "sistema";

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal novo colaborador
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoSetor, setNovoSetor] = useState<string>(SETORES[0]);
  const [salvando, setSalvando] = useState(false);

  // Modal lançar vale
  const [showValeModal, setShowValeModal] = useState(false);
  const [valeColaboradorId, setValeColaboradorId] = useState("");
  const [valeTipo, setValeTipo] = useState<"DINHEIRO" | "PRODUTO">("DINHEIRO");
  const [valeDescricao, setValeDescricao] = useState("");
  const [valeValor, setValeValor] = useState("");
  const [salvandoVale, setSalvandoVale] = useState(false);
  const [feedbackVale, setFeedbackVale] = useState("");

  // Modal extrato
  const [colaboradorExtrato, setColaboradorExtrato] = useState<Colaborador | null>(null);
  const [lancamentos, setLancamentos] = useState<LancamentoVale[]>([]);
  const [carregandoExtrato, setCarregandoExtrato] = useState(false);
  const [liquidando, setLiquidando] = useState(false);

  // Exclusão
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/parceiros/funcionarios");
      const data = await res.json();
      setColaboradores(data);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function criarColaborador() {
    if (!novoNome.trim()) return;
    setSalvando(true);
    try {
      await fetch("/api/parceiros/funcionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome.trim(), setor: novoSetor }),
      });
      setNovoNome("");
      setNovoSetor(SETORES[0]);
      setShowNovoModal(false);
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function lancarVale() {
    if (!valeColaboradorId || !valeDescricao.trim() || !valeValor || Number(valeValor) <= 0) return;
    setSalvandoVale(true);
    setFeedbackVale("");
    try {
      const res = await fetch("/api/vales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: valeColaboradorId,
          tipo: valeTipo,
          descricao: valeDescricao.trim(),
          valor: Number(valeValor),
          registradoPor: emailOperador,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackVale(data.error ?? "Erro ao registrar.");
        return;
      }
      setFeedbackVale("Lançamento registrado com sucesso.");
      setValeColaboradorId("");
      setValeDescricao("");
      setValeValor("");
      setValeTipo("DINHEIRO");
      carregar();
    } finally {
      setSalvandoVale(false);
    }
  }

  async function abrirExtrato(col: Colaborador) {
    setColaboradorExtrato(col);
    setCarregandoExtrato(true);
    setLancamentos([]);
    try {
      const res = await fetch(`/api/vales?colaboradorId=${col.id}&mes=${mesAtual()}`);
      const data = await res.json();
      setLancamentos(data);
    } finally {
      setCarregandoExtrato(false);
    }
  }

  function fecharExtrato() {
    setColaboradorExtrato(null);
    setLancamentos([]);
  }

  async function liquidarSaldo() {
    if (!colaboradorExtrato) return;
    setLiquidando(true);
    try {
      await fetch("/api/vales/liquidar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colaboradorId: colaboradorExtrato.id }),
      });
      fecharExtrato();
      carregar();
    } finally {
      setLiquidando(false);
    }
  }

  async function excluirColaborador(id: string) {
    setExcluindoId(id);
    try {
      await fetch(`/api/parceiros/funcionarios/${id}`, { method: "DELETE" });
      setConfirmandoId(null);
      carregar();
    } finally {
      setExcluindoId(null);
    }
  }

  const totalColaboradores = colaboradores.length;
  const totalSaldo = colaboradores.reduce((s, c) => s + c.saldo, 0);

  return (
    <>
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Colaboradores Ativos</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">{totalColaboradores}</div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-red-500">Saldo Devedor Acumulado</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{moeda(totalSaldo)}</div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <Button
          onClick={() => { setFeedbackVale(""); setShowValeModal(true); }}
          className="bg-amber-600 hover:bg-amber-700"
        >
          + Lançar Vale / Consumo
        </Button>
        <Button variant="outline" onClick={() => setShowNovoModal(true)}>
          + Novo Colaborador
        </Button>
      </div>

      {/* Tabela */}
      {carregando ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : colaboradores.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum colaborador cadastrado ainda.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Colaborador</th>
                <th className="px-4 py-3 text-left">Setor Operacional</th>
                <th className="px-4 py-3 text-right">Saldo Devedor</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {colaboradores.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => abrirExtrato(c)}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{c.nome}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {c.setor}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${c.saldo > 0 ? "text-red-600" : "text-slate-400"}`}>
                    {moeda(c.saldo)}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {confirmandoId === c.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-slate-500">Excluir?</span>
                        <button
                          onClick={() => excluirColaborador(c.id)}
                          disabled={excluindoId === c.id}
                          className="rounded px-2 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          {excluindoId === c.id ? "..." : "Sim"}
                        </button>
                        <button
                          onClick={() => setConfirmandoId(null)}
                          className="rounded px-2 py-1 text-xs font-semibold text-slate-600 border border-slate-300 hover:bg-slate-50"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmandoId(c.id)}
                        className="rounded p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Excluir colaborador"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal — Novo Colaborador */}
      {showNovoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Novo Colaborador</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Nome</label>
                <input
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Nome do colaborador"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Setor Operacional</label>
                <select
                  value={novoSetor}
                  onChange={(e) => setNovoSetor(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowNovoModal(false)}
                className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <Button onClick={criarColaborador} disabled={salvando || !novoNome.trim()} className="flex-1 py-3">
                {salvando ? "Salvando..." : "Cadastrar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Lançar Vale / Consumo */}
      {showValeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/50 sm:px-4">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>
            <div className="p-6">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Lançar Vale / Consumo</h3>
              <div className="space-y-4">

                {/* Colaborador */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Colaborador</label>
                  <select
                    value={valeColaboradorId}
                    onChange={(e) => setValeColaboradorId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="">Selecionar colaborador</option>
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome} — {c.setor}</option>
                    ))}
                  </select>
                </div>

                {/* Tipo */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Tipo</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setValeTipo("DINHEIRO"); setValeDescricao(""); }}
                      className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                        valeTipo === "DINHEIRO"
                          ? "border-amber-600 bg-amber-600 text-white"
                          : "border-slate-300 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      💵 Dinheiro
                    </button>
                    <button
                      onClick={() => { setValeTipo("PRODUTO"); setValeDescricao(""); }}
                      className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                        valeTipo === "PRODUTO"
                          ? "border-amber-600 bg-amber-600 text-white"
                          : "border-slate-300 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      🍽️ Produto
                    </button>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Descrição</label>
                  <input
                    value={valeDescricao}
                    onChange={(e) => setValeDescricao(e.target.value)}
                    placeholder={valeTipo === "DINHEIRO" ? "Ex: Adiantamento em dinheiro" : "Ex: Consumo almoço"}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Valor (R$)</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={valeValor}
                      onChange={(e) => setValeValor(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>

                {feedbackVale && (
                  <p className={`text-sm font-medium ${feedbackVale.toLowerCase().includes("erro") ? "text-red-600" : "text-emerald-600"}`}>
                    {feedbackVale}
                  </p>
                )}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => { setShowValeModal(false); setFeedbackVale(""); setValeDescricao(""); setValeValor(""); }}
                  className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Fechar
                </button>
                <Button
                  onClick={lancarVale}
                  disabled={
                    salvandoVale ||
                    !valeColaboradorId ||
                    !valeDescricao.trim() ||
                    !valeValor ||
                    Number(valeValor) <= 0
                  }
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700"
                >
                  {salvandoVale ? "Registrando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Extrato do Colaborador */}
      {colaboradorExtrato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{colaboradorExtrato.nome}</h3>
                <p className="text-xs text-slate-500">{colaboradorExtrato.setor} · Mês atual</p>
              </div>
              <button onClick={fecharExtrato} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>

            {/* Lista de lançamentos */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {carregandoExtrato ? (
                <p className="py-6 text-center text-sm text-slate-400">Carregando extrato...</p>
              ) : lancamentos.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Nenhum lançamento no mês atual.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {lancamentos.map((l) => (
                    <div key={l.id} className="flex items-center justify-between py-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-base">{l.tipo === "DINHEIRO" ? "💵" : "🍽️"}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{l.descricao}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(l.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${l.status === "PENDENTE" ? "text-red-600" : "text-slate-400"}`}>
                          {moeda(l.valor)}
                        </p>
                        <span className={`text-xs font-medium ${l.status === "PENDENTE" ? "text-amber-600" : "text-emerald-600"}`}>
                          {l.status === "PENDENTE" ? "Pendente" : "Pago"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer com total e botão liquidar */}
            <div className="border-t border-slate-100 px-6 py-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Saldo devedor</span>
                <span className="text-xl font-bold text-red-600">{moeda(colaboradorExtrato.saldo)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fecharExtrato}
                  className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Fechar
                </button>
                <Button
                  onClick={liquidarSaldo}
                  disabled={liquidando || colaboradorExtrato.saldo === 0}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {liquidando ? "Liquidando..." : "✓ Liquidar Saldo"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
