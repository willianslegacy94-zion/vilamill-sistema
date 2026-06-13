"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Trash2, Eye, CheckCircle } from "lucide-react";
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

function formatDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
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

  // Modal confirmação de baixa
  const [confirmBaixa, setConfirmBaixa] = useState<{ colaboradorId: string; nome: string; saldo: number } | null>(null);
  const [liquidandoBaixa, setLiquidandoBaixa] = useState(false);

  // Exclusão de colaborador
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

  function pedirBaixa(col: Colaborador) {
    if (col.saldo <= 0) return;
    setConfirmBaixa({ colaboradorId: col.id, nome: col.nome, saldo: col.saldo });
  }

  async function executarBaixa() {
    if (!confirmBaixa) return;
    setLiquidandoBaixa(true);
    try {
      const res = await fetch("/api/vales/liquidar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colaboradorId: confirmBaixa.colaboradorId }),
      });
      if (!res.ok) throw new Error("Falha ao liquidar.");

      // Atualização otimista imediata
      setColaboradores((prev) =>
        prev.map((c) => c.id === confirmBaixa.colaboradorId ? { ...c, saldo: 0 } : c)
      );

      // Se o extrato desse colaborador estiver aberto, atualiza também
      if (colaboradorExtrato?.id === confirmBaixa.colaboradorId) {
        setColaboradorExtrato((prev) => prev ? { ...prev, saldo: 0 } : null);
        setLancamentos((prev) => prev.map((l) => ({ ...l, status: "PAGO" as const })));
      }

      setConfirmBaixa(null);
    } catch {
      alert("Erro ao liquidar saldo. Tente novamente.");
    } finally {
      setLiquidandoBaixa(false);
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
  const lancamentosPendentes = lancamentos.filter((l) => l.status === "PENDENTE");

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
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {colaboradores.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.nome}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {c.setor}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${c.saldo > 0 ? "text-red-600" : "text-slate-400"}`}>
                    {moeda(c.saldo)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {/* Ver Extrato */}
                      <button
                        onClick={() => abrirExtrato(c)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                        title="Ver extrato de lançamentos"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Extrato
                      </button>

                      {/* Dar Baixa */}
                      <button
                        onClick={() => pedirBaixa(c)}
                        disabled={c.saldo <= 0}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        title={c.saldo <= 0 ? "Sem saldo pendente" : "Dar baixa no saldo devedor"}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Dar Baixa
                      </button>

                      {/* Excluir */}
                      {confirmandoId === c.id ? (
                        <div className="flex items-center gap-1.5">
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
                    </div>
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

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Descrição</label>
                  <input
                    value={valeDescricao}
                    onChange={(e) => setValeDescricao(e.target.value)}
                    placeholder={valeTipo === "DINHEIRO" ? "Ex: Adiantamento em dinheiro" : "Ex: Consumo almoço"}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

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
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{colaboradorExtrato.nome}</h3>
                <p className="text-xs text-slate-500">{colaboradorExtrato.setor} · Lançamentos pendentes do mês atual</p>
              </div>
              <button onClick={fecharExtrato} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-xl leading-none">
                ×
              </button>
            </div>

            {/* Tabela de lançamentos */}
            <div className="flex-1 overflow-y-auto">
              {carregandoExtrato ? (
                <p className="py-10 text-center text-sm text-slate-400">Carregando extrato...</p>
              ) : lancamentosPendentes.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">Nenhum lançamento pendente no mês atual.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-left">Data / Hora</th>
                      <th className="px-5 py-3 text-left">Tipo</th>
                      <th className="px-5 py-3 text-left">Descrição</th>
                      <th className="px-5 py-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lancamentosPendentes.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                          {formatDataHora(l.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          {l.tipo === "DINHEIRO" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                              💵 Dinheiro
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                              🍽️ Produto
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-700">{l.descricao}</td>
                        <td className="px-5 py-3 text-right font-semibold text-red-600">
                          {moeda(l.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                    <tr>
                      <td colSpan={3} className="px-5 py-3 text-sm font-bold text-slate-700">
                        Total pendente
                      </td>
                      <td className="px-5 py-3 text-right text-base font-bold text-red-600">
                        {moeda(lancamentosPendentes.reduce((s, l) => s + Number(l.valor), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-6 py-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Saldo devedor</span>
                <span className={`text-xl font-bold ${colaboradorExtrato.saldo > 0 ? "text-red-600" : "text-slate-400"}`}>
                  {moeda(colaboradorExtrato.saldo)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fecharExtrato}
                  className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Fechar
                </button>
                <Button
                  onClick={() => pedirBaixa(colaboradorExtrato)}
                  disabled={colaboradorExtrato.saldo <= 0}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                  Liquidar Saldo Total
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Confirmação de Baixa */}
      {confirmBaixa && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Confirmar Baixa</h3>
            </div>

            <p className="mb-1.5 text-sm text-slate-700">
              Tem certeza que deseja dar baixa no saldo de{" "}
              <span className="font-bold text-red-600">{moeda(confirmBaixa.saldo)}</span>{" "}
              do colaborador{" "}
              <span className="font-semibold text-slate-900">{confirmBaixa.nome}</span>?
            </p>
            <p className="mb-6 text-xs text-slate-500">
              Esta ação irá zerar os débitos pendentes deste período.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmBaixa(null)}
                disabled={liquidandoBaixa}
                className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <Button
                onClick={executarBaixa}
                disabled={liquidandoBaixa}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {liquidandoBaixa ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processando...
                  </span>
                ) : (
                  "Confirmar Baixa"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
