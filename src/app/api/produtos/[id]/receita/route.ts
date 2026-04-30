import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const itens = await prisma.recipeItem.findMany({
    where: { productId: id },
    include: { ingredient: true },
    orderBy: { ingredient: { nome: "asc" } },
  });

  return NextResponse.json(itens);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { ingredientId, quantidade } = await request.json();

  if (!ingredientId || !quantidade) {
    return NextResponse.json({ error: "Ingrediente e quantidade são obrigatórios" }, { status: 400 });
  }

  const item = await prisma.recipeItem.upsert({
    where: { productId_ingredientId: { productId: id, ingredientId } },
    update: { quantidade: Number(quantidade) },
    create: { productId: id, ingredientId, quantidade: Number(quantidade) },
    include: { ingredient: true },
  });

  return NextResponse.json(item, { status: 201 });
}
