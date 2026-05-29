"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DateRangeFilter from "./date-selector";
import { useFinanceiro } from "@/hooks/useAppData";

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatHora(d: string) {
  return new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}
function formatData(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
function hojeStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}
function primeiroDiaMes() {
  const [y, m] = hojeStr().split("-");
  return `${y}-${m}-01`;
}

type PagEntry = { forma: string; valor: number };
type Item = { custoUnit: string | number; quantidade: string | number; product: { nome: string } };
type Pedido = {
  id: string; total: string | number; formaPagamento: string | null;
  pagamentosSplit: PagEntry[] | null; closedAt: string | null; createdAt: string;
  items: Item[]; table: { numero: number };
};
type EditForm = { total: string; formaPagamento: string };

const PAGAMENTOS_OPTIONS = [
  { valor: "DINHEIRO", label: "Dinheiro" },
  { valor: "CREDITO",  label: "Crédito" },
  { valor: "DEBITO",   label: "Débito" },
  { valor: "PIX",      label: "Pix" },
  { valor: "VOUCHER",  label: "Voucher VR/VA" },
];
type PedidoAberto = {
  id: string; total: string | number; createdAt: string;
  items: Item[]; table: { numero: number };
};
type Cancelamento = { id: string; mesaNumero: number; motivoCancelamento: string | null; canceladoPor: string; canceladoEm: string };
type Despesa = { id: string; descricao: string; valor: string | number; categoria: string; data: string; registradoPor: string };

function FinanceiroSkeleton() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="h-8 w-32 rounded bg-slate-200" />
        <div className="h-8 w-56 rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 h-3 w-24 rounded bg-slate-200" />
            <div className="h-8 w-28 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 h-3 w-24 rounded bg-slate-200" />
            <div className="h-8 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </main>
  );
}

export default function FinanceiroContent() {
  const params = useSearchParams();
  const fromStr = params.get("from") ?? primeiroDiaMes();
  const toStr   = params.get("to")   ?? hojeStr();

  const [editando, setEditando] = useState<Pedido | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ total: "", formaPagamento: "DINHEIRO" });
  const [salvando, setSalvando] = useState(false);

  const { data, isLoading, isValidating, mutate } = useFinanceiro(fromStr, toStr) as any;

  async function salvarEdicao() {
    if (!editando) return;
    setSalvando(true);
    try {
      const res = await fetch(`/api/pedidos/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: Number(editForm.total),
          formaPagamento: editForm.formaPagamento,
          pagamentosSplit: null,
        }),
      });
      if (!res.ok) throw new Error();
      mutate();
      setEditando(null);
    } catch {
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  function abrirEdicao(p: Pedido) {
    setEditando(p);
    setEditForm({
      total: Number(p.total).toFixed(2),
      formaPagamento: p.formaPagamento ?? "DINHEIRO",
    });
  }

  // Show skeleton only on true initial load (no data at all).
  // keepPreviousData ensures data stays populated during date-range key changes,
  // so the skeleton won't flash when switching periods.
  if (isLoading && !data) return <FinanceiroSkeleton />;

  const pedidosFechados: Pedido[]       = data?.pedidosFechados ?? [];
  const pedidosAbertos: PedidoAberto[]  = data?.pedidosAbertos  ?? [];
  const cancelamentos: Cancelamento[]   = data?.cancelamentos   ?? [];
  const despesas: Despesa[]             = data?.despesas        ?? [];

  const receitaBruta  = pedidosFechados.reduce((s, p) => s + Number(p.total), 0);
  const cmv           = pedidosFechados.reduce((s, p) => s + p.items.reduce((si, i) => si + Number(i.custoUnit) * Number(i.quantidade), 0), 0);
  const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0);
  const resultado     = receitaBruta - cmv - totalDespesas;
  const ticketMedio   = pedidosFechados.length > 0 ? receitaBruta / pedidosFechados.length : 0;

  const todasEntradas: PagEntry[] = pedidosFechados.flatMap((p) => {
    if (p.pagamentosSplit && p.pagamentosSplit.length > 0) return p.pagamentosSplit;
    return [{ forma: p.formaPagamento ?? "DINHEIRO", valor: Number(p.total) }];
  });
  const somaForma = (forma: string) =>
    todasEntradas.filter((e) => e.forma === forma).reduce((s, e) => s + e.valor, 0);
  const porForma = {
    DINHEIRO: somaForma("DINHEIRO"),
    CREDITO:  somaForma("CREDITO"),
    DEBITO:   somaForma("DEBITO"),
    PIX:      somaForma("PIX"),
    VOUCHER:  somaForma("VOUCHER"),
    CARTAO:   somaForma("CARTAO"),
  };

  const labelPeriodo =
    fromStr === toStr
      ? formatData(`${fromStr}T12:00:00`)
      : `${formatData(`${fromStr}T12:00:00`)} → ${formatData(`${toStr}T12:00:00`)}`;

  const pagLabel: Record<string, string> = { DINHEIRO: "Dinheiro", CREDITO: "Crédito", DEBITO: "Débito", PIX: "Pix", VOUCHER: "Voucher VR/VA", CARTAO: "Cartão" };
  const pagColor: Record<string, string> = {
    DINHEIRO: "bg-green-100 text-green-700",
    CREDITO:  "bg-blue-100 text-blue-700",
    DEBITO:   "bg-indigo-100 text-indigo-700",
    PIX:      "bg-purple-100 text-purple-700",
    VOUCHER:  "bg-amber-100 text-amber-700",
    CARTAO:   "bg-blue-100 text-blue-600",
  };

  return (
  <>
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          {/* Subtle live-sync indicator — visible only while fetching, never hides content */}
          <span
            className={`h-2 w-2 rounded-full bg-emerald-400 transition-opacity duration-500 ${isValidating ? "opacity-100" : "opacity-0"}`}
            title="Sincronizando..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Suspense>
            <DateRangeFilter from={fromStr} to={toStr} />
          </Suspense>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Voltar
          </Link>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardDescription className="text-green-700">Receita Bruta</CardDescription>
            <CardTitle className="text-2xl text-green-800">{moeda(receitaBruta)}</CardTitle>
            <p className="text-xs text-green-600">Total recebido no período</p>
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardDescription className="text-red-700">CMV</CardDescription>
            <CardTitle className="text-2xl text-red-800">{moeda(cmv)}</CardTitle>
            <p className="text-xs text-red-600">Custo dos itens vendidos</p>
          </CardHeader>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardDescription className="text-orange-700">Despesas</CardDescription>
            <CardTitle className="text-2xl text-orange-800">{moeda(totalDespesas)}</CardTitle>
            <p className="text-xs text-orange-600">{despesas.length} lançamento{despesas.length !== 1 ? "s" : ""} no período</p>
          </CardHeader>
        </Card>
        <Card className={resultado >= 0 ? "border-blue-200 bg-blue-50" : "border-red-300 bg-red-50"}>
          <CardHeader>
            <CardDescription className={resultado >= 0 ? "text-blue-700" : "text-red-700"}>Resultado</CardDescription>
            <CardTitle className={`text-2xl ${resultado >= 0 ? "text-blue-800" : "text-red-800"}`}>{moeda(resultado)}</CardTitle>
            <p className={`text-xs ${resultado >= 0 ? "text-blue-600" : "text-red-600"}`}>
              Bruto − CMV − Despesas
              {receitaBruta > 0 && (
                <span className="ml-1 font-semibold">
                  ({((resultado / receitaBruta) * 100).toFixed(1)}%)
                </span>
              )}
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Pedidos fechados</CardDescription>
            <CardTitle className="text-2xl">{pedidosFechados.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Ticket médio</CardDescription>
            <CardTitle className="text-2xl">{moeda(ticketMedio)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Mesas abertas agora</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{pedidosAbertos.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Breakdown por forma de pagamento */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {(["DINHEIRO", "CREDITO", "DEBITO", "PIX", "VOUCHER"] as const).map((forma) => (
          <div key={forma} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4">
            <span className="text-sm font-semibold text-slate-500">{pagLabel[forma]}</span>
            <span className="text-base font-bold text-slate-900">{moeda(porForma[forma])}</span>
          </div>
        ))}
      </div>
      {porForma.CARTAO > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Cartão (legado)</span>
          <span className="text-base font-bold text-slate-700">{moeda(porForma.CARTAO)}</span>
        </div>
      )}

      {/* Transações */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Transações — {labelPeriodo}</h2>
        {pedidosFechados.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma venda registrada neste período.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Mesa</th>
                  <th className="px-4 py-3 text-left">Data / Hora</th>
                  <th className="px-4 py-3 text-left">Pagamento</th>
                  <th className="px-4 py-3 text-right">CMV</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedidosFechados.map((p) => {
                  const cmvPedido = p.items.reduce((s, i) => s + Number(i.custoUnit) * Number(i.quantidade), 0);
                  return (
                    <tr key={p.id} className="bg-white">
                      <td className="px-4 py-3 font-semibold text-slate-900">Mesa {p.table.numero}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.closedAt ? `${formatData(p.closedAt)} ${formatHora(p.closedAt)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${pagColor[p.formaPagamento ?? ""] ?? "bg-slate-100 text-slate-500"}`}>
                          {pagLabel[p.formaPagamento ?? ""] ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">{moeda(cmvPedido)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{moeda(Number(p.total))}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => abrirEdicao(p)}
                          className="text-xs font-medium text-blue-500 hover:text-blue-700"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-700">Total do período</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-red-700">{moeda(cmv)}</td>
                  <td className="px-4 py-3 text-right text-base font-bold text-green-700">{moeda(receitaBruta)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Mesas em aberto */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Mesas em Aberto</h2>
        {pedidosAbertos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma mesa aberta no momento.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Mesa</th>
                  <th className="px-4 py-3 text-left">Abertura</th>
                  <th className="px-4 py-3 text-left">Itens</th>
                  <th className="px-4 py-3 text-right">Total parcial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedidosAbertos.map((p) => (
                  <tr key={p.id} className="bg-white">
                    <td className="px-4 py-3 font-semibold text-slate-900">Mesa {p.table.numero}</td>
                    <td className="px-4 py-3 text-slate-500">{formatHora(p.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.items.map((i) => `${Number(i.quantidade)}× ${i.product.nome}`).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-700">{moeda(Number(p.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Despesas */}
      {despesas.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-orange-700">Despesas ({despesas.length})</h2>
          <div className="overflow-x-auto rounded-xl border border-orange-200">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-orange-50 text-xs font-semibold uppercase tracking-wide text-orange-500">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Descrição</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-left">Registrado por</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {despesas.map((d) => (
                  <tr key={d.id} className="bg-white">
                    <td className="px-4 py-3 text-slate-500">{formatData(d.data)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{d.descricao}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">{d.categoria}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{d.registradoPor}</td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-700">{moeda(Number(d.valor))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-orange-200 bg-orange-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold text-orange-700">Total de despesas</td>
                  <td className="px-4 py-3 text-right text-base font-bold text-orange-700">{moeda(totalDespesas)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* Cancelamentos */}
      {cancelamentos.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-red-700">Cancelamentos ({cancelamentos.length})</h2>
          <div className="overflow-x-auto rounded-xl border border-red-200">
            <table className="w-full min-w-[380px] text-sm">
              <thead className="bg-red-50 text-xs font-semibold uppercase tracking-wide text-red-500">
                <tr>
                  <th className="px-4 py-3 text-left">Hora</th>
                  <th className="px-4 py-3 text-left">Mesa</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                  <th className="px-4 py-3 text-left">Cancelado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {cancelamentos.map((c) => (
                  <tr key={c.id} className="bg-white">
                    <td className="px-4 py-3 text-slate-500">{formatHora(c.canceladoEm)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">Mesa {c.mesaNumero}</td>
                    <td className="px-4 py-3 text-slate-500">{c.motivoCancelamento || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.canceladoPor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>

    {/* Modal de edição de transação */}
    {editando && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <h3 className="mb-1 text-lg font-bold text-slate-900">Editar Transação</h3>
          <p className="mb-4 text-sm text-slate-500">
            Mesa {editando.table.numero} · {editando.closedAt ? `${formatData(editando.closedAt)} ${formatHora(editando.closedAt)}` : "—"}
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Total (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={editForm.total}
                onChange={(e) => setEditForm((f) => ({ ...f, total: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Forma de Pagamento</label>
              <select
                value={editForm.formaPagamento}
                onChange={(e) => setEditForm((f) => ({ ...f, formaPagamento: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {PAGAMENTOS_OPTIONS.map(({ valor, label }) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
              {editando.pagamentosSplit && editando.pagamentosSplit.length > 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Transação tinha split payment — ao salvar será convertida para forma única.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setEditando(null)}
              className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={salvarEdicao}
              disabled={salvando}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
