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
];

export async function GET() {
  const items = await prisma.orderItem.findMany({
    where: {
      product: { categoria: { in: CATEGORIAS_COZINHA } },
      order: { paymentStatus: "PENDENTE" },
    },
    include: {
      product: { select: { nome: true, categoria: true } },
      order: { select: { createdAt: true, table: { select: { numero: true } } } },
    },
    orderBy: { order: { createdAt: "asc" } },
  });

  return NextResponse.json(items);
}
