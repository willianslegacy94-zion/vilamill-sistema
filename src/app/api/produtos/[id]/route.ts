import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { nome, categoria, preco, costPrice, track_inventory, estoque } = await request.json();

  const produto = await prisma.product.update({
    where: { id },
    data: {
      ...(nome !== undefined && { nome }),
      ...(categoria !== undefined && { categoria }),
      ...(preco !== undefined && { preco: Number(preco) }),
      ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
      ...(track_inventory !== undefined && { track_inventory: Boolean(track_inventory) }),
      ...(estoque !== undefined && { estoque: Number(estoque) }),
    },
  });

  return NextResponse.json(produto);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [pedidos, receitas] = await Promise.all([
    prisma.orderItem.findFirst({ where: { productId: id } }),
    prisma.recipeItem.findFirst({ where: { productId: id } }),
  ]);

  if (pedidos) {
    return NextResponse.json({ error: "Produto possui pedidos registrados e não pode ser excluído" }, { status: 400 });
  }
  if (receitas) {
    return NextResponse.json({ error: "Produto está vinculado a receitas. Remova-as antes de excluir" }, { status: 400 });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
