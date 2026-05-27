import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
  const funcionarios = await prisma.funcionarioExterno.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  if (funcionarios.length === 0) return NextResponse.json([]);

  // Pool saldo por empresa: SUM(créditos coletivos) - SUM(consumos de todos da empresa)
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

  const poolPorEmpresa: Record<string, number> = {};
  for (const emp of empresas) {
    const creditos =
      creditosPorEmpresa.find((r) => r.empresa === emp)?._sum.valor ?? 0;
    const consumos = consumosPorEmpresa
      .filter((c) => c.funcionario.empresa === emp)
      .reduce((s, c) => s + Number(c.subtotal), 0);
    poolPorEmpresa[emp] = Number((Number(creditos) - consumos).toFixed(2));
  }

  const resultado = funcionarios.map((f) => ({
    id: f.id,
    nome: f.nome,
    empresa: f.empresa,
    ativo: f.ativo,
    createdAt: f.createdAt,
    poolSaldo: poolPorEmpresa[f.empresa] ?? 0,
  }));

  return NextResponse.json(resultado);
}

export async function POST(request: NextRequest) {
  const { nome, empresa } = await request.json();
  if (!nome || !empresa) {
    return NextResponse.json({ error: "Nome e empresa são obrigatórios." }, { status: 400 });
  }
  const funcionario = await prisma.funcionarioExterno.create({
    data: { nome, empresa },
  });
  return NextResponse.json(funcionario, { status: 201 });
}
