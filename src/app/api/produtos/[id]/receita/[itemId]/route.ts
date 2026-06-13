import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { itemId } = await params;

  await prisma.recipeItem.delete({ where: { id: itemId } });

  return NextResponse.json({ ok: true });
}
