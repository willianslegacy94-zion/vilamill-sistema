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

  const agrupado = await prisma.consumoFuncionario.groupBy({
    by: ["funcionarioId"],
    where: { registradoEm: { gte: inicioPeriodo, lte: fimPeriodo } },
    _sum: { subtotal: true },
    _count: { _all: true },
  });

  if (agrupado.length === 0) {
    return NextResponse.json({ resumo: [], fromStr, toStr });
  }

  const funcionarios = await prisma.funcionarioExterno.findMany({
    where: { id: { in: agrupado.map((g) => g.funcionarioId) } },
  });
  const funcionarioPorId = Object.fromEntries(funcionarios.map((f) => [f.id, f]));

  const resumo = agrupado
    .map((g) => ({
      funcionarioId: g.funcionarioId,
      nome: funcionarioPorId[g.funcionarioId]?.nome ?? "—",
      empresa: funcionarioPorId[g.funcionarioId]?.empresa ?? "—",
      totalConsumido: Number(g._sum.subtotal ?? 0),
      quantidadeItens: g._count._all,
    }))
    .sort((a, b) => b.totalConsumido - a.totalConsumido);

  return NextResponse.json({ resumo, fromStr, toStr });
}
