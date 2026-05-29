import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

function intervaloSP(dateStr: string): { inicio: Date; fim: Date } {
  const inicio = new Date(`${dateStr}T03:00:00.000Z`);
  const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { inicio, fim };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const hojeStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const [y, m] = hojeStr.split("-");
  const defaultFrom = `${y}-${m}-01`;

  const fromStr = searchParams.get("from") ?? defaultFrom;
  const toStr = searchParams.get("to") ?? hojeStr;

  const inicioPeriodo = intervaloSP(fromStr).inicio;
  const fimPeriodo = intervaloSP(toStr).fim;

  const [pedidosFechados, pedidosAbertos, cancelamentos, despesas, creditosCaixinha, consumosCaixinha] =
    await Promise.all([
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
      prisma.creditoFuncionario.findMany({
        where: { registradoEm: { gte: inicioPeriodo, lte: fimPeriodo } },
        include: { funcionario: true },
        orderBy: { registradoEm: "desc" },
      }),
      prisma.consumoFuncionario.findMany({
        where: { registradoEm: { gte: inicioPeriodo, lte: fimPeriodo } },
        include: { funcionario: true, product: true },
        orderBy: { registradoEm: "desc" },
      }),
    ]);

  return NextResponse.json(
    JSON.parse(
      JSON.stringify({
        pedidosFechados,
        pedidosAbertos,
        cancelamentos,
        despesas,
        creditosCaixinha,
        consumosCaixinha,
        fromStr,
        toStr,
      })
    )
  );
}
