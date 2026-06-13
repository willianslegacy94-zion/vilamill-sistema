import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const colaboradorId = searchParams.get("colaboradorId");
  const mes = searchParams.get("mes"); // formato: YYYY-MM

  if (!colaboradorId) {
    return NextResponse.json({ error: "colaboradorId é obrigatório." }, { status: 400 });
  }

  const where: Parameters<typeof prisma.lancamentoVale.findMany>[0]["where"] = { colaboradorId };

  if (mes) {
    const [year, month] = mes.split("-").map(Number);
    where.createdAt = { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) };
  }

  const lancamentos = await prisma.lancamentoVale.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(lancamentos);
}

export async function POST(request: NextRequest) {
  try {
    const { colaboradorId, tipo, descricao, valor, registradoPor } = await request.json();

    if (!colaboradorId || !tipo || !descricao || valor === undefined || !registradoPor) {
      return NextResponse.json(
        { error: "Campos obrigatórios: colaboradorId, tipo, descricao, valor, registradoPor." },
        { status: 400 }
      );
    }

    if (!["DINHEIRO", "PRODUTO"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido. Use DINHEIRO ou PRODUTO." }, { status: 400 });
    }

    const colaborador = await prisma.funcionarioExterno.findUnique({ where: { id: colaboradorId } });
    if (!colaborador || !colaborador.ativo) {
      return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
    }

    const lancamento = await prisma.lancamentoVale.create({
      data: {
        colaboradorId,
        tipo,
        descricao,
        valor: Number(valor),
        registradoPor,
      },
    });

    return NextResponse.json(lancamento, { status: 201 });
  } catch (error) {
    console.error("POST /api/vales:", error);
    return NextResponse.json({ error: "Erro ao registrar lançamento." }, { status: 500 });
  }
}
