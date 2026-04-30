import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;

  await prisma.orderItem.delete({ where: { id: itemId } });

  const allItems = await prisma.orderItem.findMany({ where: { orderId: id } });
  const total = allItems.reduce((acc, i) => acc + Number(i.subtotal), 0);
  await prisma.order.update({ where: { id }, data: { total } });

  return NextResponse.json({ ok: true });
}
