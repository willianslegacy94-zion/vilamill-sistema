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
  const { mesaNumero, motivoCancelamento, canceladoPor, canceladoEm } = await request.json();

  const registro = await prisma.cancelamentoLog.findUnique({ where: { id } });
  if (!registro) return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });

  const atualizado = await prisma.cancelamentoLog.update({
    where: { id },
    data: {
      ...(mesaNumero !== undefined && { mesaNumero: Number(mesaNumero) }),
      ...(motivoCancelamento !== undefined && { motivoCancelamento }),
      ...(canceladoPor !== undefined && { canceladoPor }),
      ...(canceladoEm !== undefined && { canceladoEm: new Date(canceladoEm) }),
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

  const registro = await prisma.cancelamentoLog.findUnique({ where: { id } });
  if (!registro) return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });

  await prisma.cancelamentoLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
