import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function POST(request: NextRequest) {
  const { mesaId, caixaNome } = await request.json();

  const mesa = await prisma.table.findUnique({ where: { id: mesaId } });
  if (!mesa) return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 });
  if (mesa.status !== "LIVRE") return NextResponse.json({ error: "Mesa não está livre" }, { status: 400 });

  const [pedido] = await prisma.$transaction([
    prisma.order.create({ data: { mesaId, total: 0, paymentStatus: "PENDENTE", caixaNome: caixaNome ?? null } }),
    prisma.table.update({ where: { id: mesaId }, data: { status: "OCUPADA" } }),
  ]);

  return NextResponse.json(pedido, { status: 201 });
}
