import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (from) where.data = { ...where.data, gte: new Date(`${from}T03:00:00.000Z`) };
  if (to)   where.data = { ...where.data, lte: new Date(new Date(`${to}T03:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000 - 1) };

  const despesas = await prisma.despesa.findMany({ where, orderBy: { data: "desc" } });
  return NextResponse.json(despesas);
}

export async function POST(request: NextRequest) {
  const { descricao, valor, categoria, data, registradoPor } = await request.json();
  if (!descricao || !valor || !categoria || !data || !registradoPor) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
  }
  const despesa = await prisma.despesa.create({
    data: { descricao, valor: Number(valor), categoria, data: new Date(data), registradoPor },
  });
  return NextResponse.json(despesa, { status: 201 });
}
