import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
  const insumos = await prisma.ingredient.findMany({
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(insumos);
}

export async function POST(request: NextRequest) {
  const { nome, unidade, quantidadeAtual, nivelMinimoAlerta } = await request.json();

  if (!nome || !unidade) {
    return NextResponse.json({ error: "Nome e unidade são obrigatórios" }, { status: 400 });
  }

  const insumo = await prisma.ingredient.create({
    data: { nome, unidade, quantidadeAtual: Number(quantidadeAtual) || 0, nivelMinimoAlerta: Number(nivelMinimoAlerta) || 0 },
  });

  return NextResponse.json(insumo, { status: 201 });
}
