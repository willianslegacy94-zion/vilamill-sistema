import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { motivoCancelamento, canceladoPor } = await request.json().catch(() => ({}));

  const pedido = await prisma.order.findUnique({
    where: { id },
    include: { table: true },
  });
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  await prisma.$transaction([
    prisma.cancelamentoLog.create({
      data: {
        mesaNumero: pedido.table.numero,
        motivoCancelamento: motivoCancelamento || null,
        canceladoPor: canceladoPor || "Sistema",
      },
    }),
    prisma.orderItem.deleteMany({ where: { orderId: id } }),
    prisma.order.delete({ where: { id } }),
    prisma.table.update({ where: { id: pedido.mesaId }, data: { status: "LIVRE" } }),
  ]);

  return NextResponse.json({ ok: true });
}
