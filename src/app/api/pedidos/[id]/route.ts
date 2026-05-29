import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { total, formaPagamento, pagamentosSplit } = await request.json();

  const pedido = await prisma.order.findUnique({ where: { id } });
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (pedido.paymentStatus !== "PAGO")
    return NextResponse.json({ error: "Apenas pedidos fechados podem ser editados" }, { status: 400 });

  await prisma.order.update({
    where: { id },
    data: {
      ...(total !== undefined && { total: Number(total) }),
      ...(formaPagamento !== undefined && { formaPagamento: formaPagamento as any }),
      pagamentosSplit: pagamentosSplit ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}

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

  if (pedido.paymentStatus === "PAGO") {
    // Exclusão administrativa (financeiro) — sem log de cancelamento, mesa já LIVRE
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } }),
    ]);
  } else {
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
  }

  return NextResponse.json({ ok: true });
}
