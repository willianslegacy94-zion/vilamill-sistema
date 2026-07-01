import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

// Toda pessoa cadastrada como caixa também vira um FuncionarioExterno neste
// grupo, pra aparecer automaticamente na aba Equipe (mesas) sem precisar de
// cadastro duplicado manual.
const EMPRESA_EQUIPE = "Equipe Villa Mill";

export async function GET() {
  const caixas = await prisma.caixa.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
  return NextResponse.json(caixas);
}

export async function POST(request: NextRequest) {
  const { nome } = await request.json();
  if (!nome?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  const nomeTrim = nome.trim();

  try {
    const caixa = await prisma.caixa.upsert({
      where: { nome: nomeTrim },
      update: { ativo: true },
      create: { nome: nomeTrim },
    });

    const funcionario = await prisma.funcionarioExterno.findFirst({
      where: { nome: nomeTrim, empresa: EMPRESA_EQUIPE },
    });
    if (funcionario) {
      await prisma.funcionarioExterno.update({ where: { id: funcionario.id }, data: { ativo: true } });
    } else {
      await prisma.funcionarioExterno.create({
        data: { nome: nomeTrim, empresa: EMPRESA_EQUIPE, setor: EMPRESA_EQUIPE, ativo: true },
      });
    }

    return NextResponse.json(caixa, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar caixa" }, { status: 500 });
  }
}
