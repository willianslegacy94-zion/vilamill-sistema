import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

const CATEGORIAS_COZINHA = [
  "Pratos do Dia",
  "Todos os Dias",
  "Acompanhamentos",
  "Lanches Tradicionais",
  "Lanches na Baguete",
  "Lanches Artesanais",
  "Porções",
  "Café da Manhã",
];

function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const [pendentes, concluidos] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        status: "PENDENTE",
        product: { categoria: { in: CATEGORIAS_COZINHA } },
        order: { paymentStatus: "PENDENTE" },
      },
      include: {
        product: { select: { nome: true, categoria: true } },
        order: { select: { createdAt: true, table: { select: { numero: true } } } },
      },
      orderBy: { order: { createdAt: "asc" } },
    }),
    prisma.orderItem.findMany({
      where: {
        status: "PRONTO",
        prontoEm: { gte: inicioDoDia() },
        product: { categoria: { in: CATEGORIAS_COZINHA } },
      },
      include: {
        product: { select: { nome: true, categoria: true } },
        order: { select: { createdAt: true, table: { select: { numero: true } } } },
      },
      orderBy: { prontoEm: "desc" },
    }),
  ]);

  return NextResponse.json({ pendentes, concluidos });
}
