import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
  try {
    const funcionarios = await prisma.funcionarioExterno.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    });

    if (funcionarios.length === 0) return NextResponse.json([]);

    const saldos = await prisma.lancamentoVale.groupBy({
      by: ["colaboradorId"],
      where: { status: "PENDENTE" },
      _sum: { valor: true },
    });

    const saldoPorId: Record<string, number> = Object.fromEntries(
      saldos.map((s) => [s.colaboradorId, Number(s._sum.valor ?? 0)])
    );

    const resultado = funcionarios.map((f) => ({
      id: f.id,
      nome: f.nome,
      empresa: f.empresa,
      setor: f.setor,
      saldo: saldoPorId[f.id] ?? 0,
    }));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("GET /api/parceiros/funcionarios:", error);
    return NextResponse.json({ error: "Erro ao buscar colaboradores." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, setor } = await request.json();
    if (!nome || !setor) {
      return NextResponse.json({ error: "Nome e setor são obrigatórios." }, { status: 400 });
    }
    const funcionario = await prisma.funcionarioExterno.create({
      data: { nome, empresa: setor, setor },
    });
    return NextResponse.json(funcionario, { status: 201 });
  } catch (error) {
    console.error("POST /api/parceiros/funcionarios:", error);
    return NextResponse.json({ error: "Erro ao cadastrar colaborador." }, { status: 500 });
  }
}
