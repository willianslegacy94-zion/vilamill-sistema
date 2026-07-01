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
  const body = await request.json();

  const registro = await prisma.consumoFuncionario.findUnique({ where: { id } });
  if (!registro)
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });

  if (typeof body.liquidado === "boolean") {
    const atualizado = await prisma.consumoFuncionario.update({
      where: { id },
      data: { liquidado: body.liquidado, liquidadoEm: body.liquidado ? new Date() : null },
    });
    return NextResponse.json(atualizado);
  }

  const novaQtd = Number(body.quantidade);
  const novoSubtotal = Number((Number(registro.precoUnit) * novaQtd).toFixed(2));

  await prisma.consumoFuncionario.update({
    where: { id },
    data: { quantidade: novaQtd, subtotal: novoSubtotal },
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

  const registro = await prisma.consumoFuncionario.findUnique({ where: { id } });
  if (!registro)
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });

  await prisma.consumoFuncionario.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
