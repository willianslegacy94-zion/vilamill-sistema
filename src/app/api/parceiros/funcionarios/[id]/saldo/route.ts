import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const creditos = await prisma.creditoFuncionario.findMany({
    where: { funcionarioId: id, liquidado: false },
  });
  const consumos = await prisma.consumoFuncionario.findMany({
    where: { funcionarioId: id, liquidado: false },
  });

  const totalCreditos = creditos.reduce((s, c) => s + Number(c.valor), 0);
  const totalConsumos = consumos.reduce((s, c) => s + Number(c.subtotal), 0);
  const saldo = Number((totalCreditos - totalConsumos).toFixed(2));

  return NextResponse.json({ saldo });
}
