import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const inicioDia = new Date(`${hoje}T03:00:00.000Z`);
  const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000 - 1);

  const [mesasAbertas, todosInsumos, vendasHoje] = await Promise.all([
    prisma.order.count({ where: { paymentStatus: "PENDENTE" } }),
    prisma.ingredient.findMany({
      select: { id: true, nome: true, quantidadeAtual: true, nivelMinimoAlerta: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAGO", closedAt: { gte: inicioDia, lte: fimDia } },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  const insumoCriticos = todosInsumos
    .filter((i) => Number(i.quantidadeAtual) <= Number(i.nivelMinimoAlerta))
    .map((i) => ({ id: i.id, nome: i.nome }));

  return NextResponse.json({
    mesasAbertas,
    insumoCriticos,
    vendasHoje: {
      total: Number(vendasHoje._sum.total ?? 0),
      count: vendasHoje._count,
    },
  });
}
