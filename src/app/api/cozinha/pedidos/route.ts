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
  const [itensAtivos, concluidos] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        status: { in: ["PENDENTE", "PRONTO"] },
        product: { categoria: { in: CATEGORIAS_COZINHA } },
        order: { paymentStatus: "PENDENTE" },
      },
      include: {
        product: { select: { nome: true, categoria: true } },
        order: { select: { id: true, createdAt: true, table: { select: { numero: true } } } },
      },
      orderBy: { createdAt: "asc" },
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

  const mesasPorOrder = new Map<string, { orderId: string; mesa: number; createdAt: string; items: typeof itensAtivos }>();
  for (const item of itensAtivos) {
    const existente = mesasPorOrder.get(item.order.id);
    if (existente) {
      existente.items.push(item);
    } else {
      mesasPorOrder.set(item.order.id, {
        orderId: item.order.id,
        mesa: item.order.table.numero,
        createdAt: item.order.createdAt.toISOString(),
        items: [item],
      });
    }
  }

  // Só mantemos o card enquanto houver pelo menos 1 item ainda pendente.
  // Se todos os itens de uma mesa forem concluídos, o card some da fila;
  // um novo lançamento na mesma mesa cria um item PENDENTE e o card volta.
  const mesas = Array.from(mesasPorOrder.values())
    .filter((m) => m.items.some((i) => i.status === "PENDENTE"))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return NextResponse.json({ mesas, concluidos });
}
