import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/services/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DateSelector from "./date-selector";

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatHora(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data: dataParam } = await searchParams;
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const dataFiltro = dataParam ?? hoje;

  // Intervalo do dia em UTC considerando fuso SP (UTC-3): meia-noite SP = 03:00 UTC
  const inicioDia = new Date(`${dataFiltro}T03:00:00.000Z`);
  const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000 - 1);

  const [pedidosFechados, pedidosAbertos] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: "PAGO", closedAt: { gte: inicioDia, lte: fimDia } },
      include: { items: { include: { product: true } }, table: true },
      orderBy: { closedAt: "desc" },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "PENDENTE" },
      include: { items: { include: { product: true } }, table: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const faturamento = pedidosFechados.reduce((s, p) => s + Number(p.total), 0);
  const ticketMedio = pedidosFechados.length > 0 ? faturamento / pedidosFechados.length : 0;

  const porForma = {
    DINHEIRO: pedidosFechados.filter((p) => p.formaPagamento === "DINHEIRO").reduce((s, p) => s + Number(p.total), 0),
    CARTAO: pedidosFechados.filter((p) => p.formaPagamento === "CARTAO").reduce((s, p) => s + Number(p.total), 0),
    PIX: pedidosFechados.filter((p) => p.formaPagamento === "PIX").reduce((s, p) => s + Number(p.total), 0),
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <div className="flex items-center gap-4">
          <Suspense>
            <DateSelector dataAtual={dataFiltro} />
          </Suspense>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Voltar
          </Link>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Faturamento do dia</CardDescription>
            <CardTitle className="text-2xl text-green-700">{moeda(faturamento)}</CardTitle>
          </CardHeader>
        </Card>
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
      <div className="grid grid-cols-3 gap-4">
        {(["DINHEIRO", "CARTAO", "PIX"] as const).map((forma) => (
          <div key={forma} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
            <span className="text-sm font-semibold text-slate-500">
              {forma === "DINHEIRO" ? "Dinheiro" : forma === "CARTAO" ? "Cartão" : "Pix"}
            </span>
            <span className="text-lg font-bold text-slate-900">{moeda(porForma[forma])}</span>
          </div>
        ))}
      </div>

      {/* Mesas em aberto */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Mesas em Aberto</h2>
        {pedidosAbertos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma mesa aberta no momento.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
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

      {/* Vendas do dia */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Vendas de {new Date(dataFiltro + "T12:00:00").toLocaleDateString("pt-BR")}
        </h2>
        {pedidosFechados.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma venda registrada nesta data.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Mesa</th>
                  <th className="px-4 py-3 text-left">Fechamento</th>
                  <th className="px-4 py-3 text-left">Pagamento</th>
                  <th className="px-4 py-3 text-left">Itens</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedidosFechados.map((p) => (
                  <tr key={p.id} className="bg-white">
                    <td className="px-4 py-3 font-semibold text-slate-900">Mesa {p.table.numero}</td>
                    <td className="px-4 py-3 text-slate-500">{p.closedAt ? formatHora(p.closedAt) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.formaPagamento === "DINHEIRO" ? "bg-green-100 text-green-700" :
                        p.formaPagamento === "CARTAO"   ? "bg-blue-100 text-blue-700" :
                        p.formaPagamento === "PIX"      ? "bg-purple-100 text-purple-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {p.formaPagamento === "DINHEIRO" ? "Dinheiro" :
                         p.formaPagamento === "CARTAO"   ? "Cartão" :
                         p.formaPagamento === "PIX"      ? "Pix" : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.items.map((i) => `${Number(i.quantidade)}× ${i.product.nome}`).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{moeda(Number(p.total))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-700">Total do dia</td>
                  <td className="px-4 py-3 text-right text-base font-bold text-green-700">{moeda(faturamento)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
