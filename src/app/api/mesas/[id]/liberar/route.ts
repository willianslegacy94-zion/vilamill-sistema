import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

// Emergência: libera o status da mesa sem tocar no pedido
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const mesa = await prisma.table.findUnique({ where: { id } });
  if (!mesa) return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 });

  await prisma.table.update({ where: { id }, data: { status: "LIVRE" } });

  return NextResponse.json({ ok: true });
}
