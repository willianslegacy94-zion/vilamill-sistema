import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
  const caixas = await prisma.caixa.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(caixas);
}

export async function POST(request: NextRequest) {
  const { nome } = await request.json();
  if (!nome?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  try {
    const caixa = await prisma.caixa.upsert({
      where: { nome: nome.trim() },
      update: { ativo: true },
      create: { nome: nome.trim() },
    });
    return NextResponse.json(caixa, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar caixa" }, { status: 500 });
  }
}
