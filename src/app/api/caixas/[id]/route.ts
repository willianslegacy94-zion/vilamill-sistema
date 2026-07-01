import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

const EMPRESA_EQUIPE = "Equipe Villa Mill";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const caixa = await prisma.caixa.update({ where: { id }, data: { ativo: false } });

  const funcionario = await prisma.funcionarioExterno.findFirst({
    where: { nome: caixa.nome, empresa: EMPRESA_EQUIPE },
  });
  if (funcionario) {
    await prisma.funcionarioExterno.update({ where: { id: funcionario.id }, data: { ativo: false } });
  }

  return NextResponse.json({ ok: true });
}
