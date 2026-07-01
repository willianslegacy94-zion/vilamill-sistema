import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { isAdmin } from "@/lib/require-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const { tipo, descricao, valor, status } = await request.json();

  const registro = await prisma.lancamentoVale.findUnique({ where: { id } });
  if (!registro) return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });

  const atualizado = await prisma.lancamentoVale.update({
    where: { id },
    data: {
      ...(tipo !== undefined && { tipo }),
      ...(descricao !== undefined && { descricao }),
      ...(valor !== undefined && { valor: Number(valor) }),
      ...(status !== undefined && {
        status,
        liquidadoEm: status === "PAGO" ? new Date() : null,
      }),
    },
  });

  return NextResponse.json(atualizado);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;

  const registro = await prisma.lancamentoVale.findUnique({ where: { id } });
  if (!registro) return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });

  await prisma.lancamentoVale.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
