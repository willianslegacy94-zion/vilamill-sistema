import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;

  const item = await prisma.orderItem.update({
    where: { id: itemId },
    data: { status: "PRONTO" },
  });

  return NextResponse.json({ ok: true, id: item.id, status: item.status });
}
