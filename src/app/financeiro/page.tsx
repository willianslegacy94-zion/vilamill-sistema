import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { format, startOfMonth } from "date-fns";
import { prisma } from "@/services/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DateRangeFilter from "./date-selector";

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatHora(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

function formatData(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

/** Computa os limites UTC para uma data YYYY-MM-DD no fuso SP (UTC-3).
 *  Meia-noite SP = 03:00 UTC  |  23:59:59 SP = 02:59:59 UTC do dia seguinte.
 */
function intervaloSP(dateStr: string): { inicio: Date; fim: Date } {
  const inicio = new Date(`${dateStr}T03:00:00.000Z`);
  const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { inicio, fim };
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") redirect("/");

  const { from: fromParam, to: toParam } = await searchParams;

  // Defaults: primeiro dia do mês até hoje (SP)
  const hojeStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const [y, m, d] = hojeStr.split("-").map(Number);
  const spToday = new Date(y, m - 1, d); // local midnight — usado apenas para date-fns
  const defaultFrom = format(startOfMonth(spToday), "yyyy-MM-dd");
  const defaultTo = hojeStr;

  const fromStr = fromParam ?? defaultFrom;
  const toStr = toParam ?? defaultTo;

  const inicioPeriodo = intervaloSP(fromStr).inicio;
  const fimPeriodo = intervaloSP(toStr).fim; // 23:59:59.999 SP do dia `to`

  const [pedidosFechados, pedidosAbertos, cancelamentos, despesas] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: "PAGO", closedAt: { gte: inicioPeriodo, lte: fimPeriodo } },
      include: { items: { include: { product: true } }, table: true },
      orderBy: { closedAt: "desc" },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "PENDENTE" },
      include: { items: { include: { product: true } }, table: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.cancelamentoLog.findMany({
      where: { canceladoEm: { gte: inicioPeriodo, lte: fimPeriodo } },
      orderBy: { canceladoEm: "desc" },
    }),
    prisma.despesa.findMany({
      where: { data: { gte: inicioPeriodo, lte: fimPeriodo } },
      orderBy: { data: "desc" },
    }),
  ]);

  const receitaBruta = pedidosFechados.reduce((s, p) => s + Number(p.total), 0);
  const cmv = pedidosFechados.reduce(
    (s, p) => s + p.items.reduce((si, i) => si + Number(i.custoUnit) * Number(i.quantidade), 0),
    0
  );
  const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0);
  const receitaLiquida = receitaBruta - cmv;
  const resultado = receitaBruta - cmv - totalDespesas;
  const ticketMedio = pedidosFechados.length > 0 ? receitaBruta / pedidosFechados.length : 0;

  const porForma = {
    DINHEIRO: pedidosFechados.filter((p) => p.formaPagamento === "DINHEIRO").reduce((s, p) => s + Number(p.total), 0),
    CREDITO:  pedidosFechados.filter((p) => p.formaPagamento === "CREDITO").reduce((s, p) => s + Number(p.total), 0),
    DEBITO:   pedidosFechados.filter((p) => p.formaPagamento === "DEBITO").reduce((s, p) => s + Number(p.total), 0),
    PIX:      pedidosFechados.filter((p) => p.formaPagamento === "PIX").reduce((s, p) => s + Number(p.total), 0),
    CARTAO:   pedidosFechados.filter((p) => p.formaPagamento === "CARTAO").reduce((s, p) => s + Number(p.total), 0),
  };

  const labelPeriodo =
    fromStr === toStr
      ? `${formatData(new Date(`${fromStr}T12:00:00`))}`
      : `${formatData(new Date(`${fromStr}T12:00:00`))} → ${formatData(new Date(`${toStr}T12:00:00`))}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Suspense>
            <DateRangeFilter from={fromStr} to={toStr} />
          </Suspense>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Voltar
          </Link>
        </div>
      </div>

      {/* Fluxo de Caixa — cards principais */}
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(["DINHEIRO", "CREDITO", "DEBITO", "PIX"] as const).map((forma) => {
          const labels: Record<string, string> = { DINHEIRO: "Dinheiro", CREDITO: "Crédito", DEBITO: "Débito", PIX: "Pix" };
          return (
            <div key={forma} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4">
              <span className="text-sm font-semibold text-slate-500">{labels[forma]}</span>
              <span className="text-base font-bold text-slate-900">{moeda(porForma[forma])}</span>
            </div>
          );
        })}
      </div>
      {porForma.CARTAO > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Cartão (legado)</span>
          <span className="text-base font-bold text-slate-700">{moeda(porForma.CARTAO)}</span>
        </div>
      )}

      {/* Histórico de transações */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Transações — {labelPeriodo}
        </h2>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedidosFechados.map((p) => {
                  const cmvPedido = p.items.reduce(
                    (s, i) => s + Number(i.custoUnit) * Number(i.quantidade),
                    0
                  );
                  return (
                    <tr key={p.id} className="bg-white">
                      <td className="px-4 py-3 font-semibold text-slate-900">Mesa {p.table.numero}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.closedAt ? `${formatData(p.closedAt)} ${formatHora(p.closedAt)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          p.formaPagamento === "DINHEIRO" ? "bg-green-100 text-green-700" :
                          p.formaPagamento === "CREDITO"  ? "bg-blue-100 text-blue-700" :
                          p.formaPagamento === "DEBITO"   ? "bg-indigo-100 text-indigo-700" :
                          p.formaPagamento === "PIX"      ? "bg-purple-100 text-purple-700" :
                          p.formaPagamento === "CARTAO"   ? "bg-blue-100 text-blue-600" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {p.formaPagamento === "DINHEIRO" ? "Dinheiro" :
                           p.formaPagamento === "CREDITO"  ? "Crédito" :
                           p.formaPagamento === "DEBITO"   ? "Débito" :
                           p.formaPagamento === "PIX"      ? "Pix" :
                           p.formaPagamento === "CARTAO"   ? "Cartão" : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">{moeda(cmvPedido)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{moeda(Number(p.total))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold text-slate-700">Total do período</td>
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

      {/* Despesas do período */}
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

      {/* Cancelamentos do período */}
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
  );
}
