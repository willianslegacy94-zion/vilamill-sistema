import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const pedido = await prisma.order.findUnique({ where: { id } });
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: id } }),
    prisma.order.delete({ where: { id } }),
    prisma.table.update({ where: { id: pedido.mesaId }, data: { status: "LIVRE" } }),
  ]);

  return NextResponse.json({ ok: true });
}
