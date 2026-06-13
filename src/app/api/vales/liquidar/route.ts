import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/services/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { colaboradorId } = await request.json();
    if (!colaboradorId) {
      return NextResponse.json({ error: "colaboradorId é obrigatório." }, { status: 400 });
    }

    const { count } = await prisma.lancamentoVale.updateMany({
      where: { colaboradorId, status: "PENDENTE" },
      data: { status: "PAGO", liquidadoEm: new Date() },
    });

    return NextResponse.json({ liquidados: count });
  } catch (error) {
    console.error("POST /api/vales/liquidar:", error);
    return NextResponse.json({ error: "Erro ao liquidar saldo." }, { status: 500 });
  }
}
