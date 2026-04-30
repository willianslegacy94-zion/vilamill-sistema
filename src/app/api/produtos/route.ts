import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
  const produtos = await prisma.product.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });
  return NextResponse.json(produtos);
}

export async function POST(request: NextRequest) {
  const { nome, categoria, preco } = await request.json();

  if (!nome || !categoria || preco === undefined) {
    return NextResponse.json({ error: "Nome, categoria e preço são obrigatórios" }, { status: 400 });
  }

  const produto = await prisma.product.create({
    data: { nome, categoria, preco: Number(preco) },
  });

  return NextResponse.json(produto, { status: 201 });
}
