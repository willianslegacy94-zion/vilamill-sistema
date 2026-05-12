import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { descricao, valor, categoria, data } = await request.json();
  const despesa = await prisma.despesa.update({
    where: { id },
    data: {
      ...(descricao !== undefined && { descricao }),
      ...(valor    !== undefined && { valor: Number(valor) }),
      ...(categoria !== undefined && { categoria }),
      ...(data     !== undefined && { data: new Date(data) }),
    },
  });
  return NextResponse.json(despesa);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.despesa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
