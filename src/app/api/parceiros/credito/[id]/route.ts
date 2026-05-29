import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/services/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") return false;
  return true;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin()))
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const { valor, descricao } = await request.json();

  const registro = await prisma.creditoFuncionario.findUnique({ where: { id } });
  if (!registro)
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });

  await prisma.creditoFuncionario.update({
    where: { id },
    data: {
      ...(valor !== undefined && { valor: Number(valor) }),
      ...(descricao !== undefined && { descricao: descricao || null }),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin()))
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;

  const registro = await prisma.creditoFuncionario.findUnique({ where: { id } });
  if (!registro)
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });

  await prisma.creditoFuncionario.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
