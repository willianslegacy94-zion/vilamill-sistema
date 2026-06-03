import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.caixa.update({ where: { id }, data: { ativo: false } });
  return NextResponse.json({ ok: true });
}
