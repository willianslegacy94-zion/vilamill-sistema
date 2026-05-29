import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
  try {
    const funcionarios = await prisma.funcionarioExterno.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    });

    if (funcionarios.length === 0) return NextResponse.json([]);

    const empresas = [...new Set(funcionarios.map((f) => f.empresa))];

    const [creditosPorEmpresa, consumosPorEmpresa] = await Promise.all([
      prisma.creditoFuncionario.groupBy({
        by: ["empresa"],
        where: { empresa: { in: empresas }, tipo: "COLETIVO", liquidado: false },
        _sum: { valor: true },
      }),
      prisma.consumoFuncionario.findMany({
        where: { funcionario: { empresa: { in: empresas } }, liquidado: false },
        include: { funcionario: { select: { empresa: true } } },
      }),
    ]);

    const saldoPorEmpresa: Record<string, number> = {};
    for (const emp of empresas) {
      const creditos =
        creditosPorEmpresa.find((r) => r.empresa === emp)?._sum.valor ?? 0;
      const consumos = consumosPorEmpresa
        .filter((c) => c.funcionario.empresa === emp)
        .reduce((s, c) => s + Number(c.subtotal), 0);
      saldoPorEmpresa[emp] = Number((Number(creditos) - consumos).toFixed(2));
    }

    const resultado = funcionarios.map((f) => ({
      id: f.id,
      nome: f.nome,
      empresa: f.empresa,
      ativo: f.ativo,
      createdAt: f.createdAt,
      saldo: saldoPorEmpresa[f.empresa] ?? 0,
    }));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("GET /api/parceiros/funcionarios:", error);
    return NextResponse.json({ error: "Erro ao buscar funcionários." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, empresa } = await request.json();
    if (!nome || !empresa) {
      return NextResponse.json({ error: "Nome e empresa são obrigatórios." }, { status: 400 });
    }
    const funcionario = await prisma.funcionarioExterno.create({
      data: { nome, empresa },
    });
    return NextResponse.json(funcionario, { status: 201 });
  } catch (error) {
    console.error("POST /api/parceiros/funcionarios:", error);
    return NextResponse.json({ error: "Erro ao cadastrar funcionário." }, { status: 500 });
  }
}
