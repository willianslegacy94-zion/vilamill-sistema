import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const insumo = await prisma.ingredient.findUnique({ where: { id } });
  if (!insumo) return NextResponse.json({ error: "Insumo não encontrado" }, { status: 404 });

  if (body.delta !== undefined) {
    const nova = Number(insumo.quantidadeAtual) + Number(body.delta);
    if (nova < 0) return NextResponse.json({ error: "Quantidade insuficiente em estoque" }, { status: 400 });
    const atualizado = await prisma.ingredient.update({ where: { id }, data: { quantidadeAtual: nova } });
    return NextResponse.json(atualizado);
  }

  const { nome, unidade, quantidadeAtual, nivelMinimoAlerta } = body;
  const atualizado = await prisma.ingredient.update({
    where: { id },
    data: {
      ...(nome !== undefined && { nome }),
      ...(unidade !== undefined && { unidade }),
      ...(quantidadeAtual !== undefined && { quantidadeAtual: Number(quantidadeAtual) }),
      ...(nivelMinimoAlerta !== undefined && { nivelMinimoAlerta: Number(nivelMinimoAlerta) }),
    },
  });

  return NextResponse.json(atualizado);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const emUso = await prisma.recipeItem.findFirst({ where: { ingredientId: id } });
  if (emUso) {
    return NextResponse.json({ error: "Insumo em uso em receitas e não pode ser excluído" }, { status: 400 });
  }

  await prisma.ingredient.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
