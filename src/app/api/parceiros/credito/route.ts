import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function POST(request: NextRequest) {
  try {
    const { tipo, funcionarioId, empresa, valor, descricao, registradoPor } = await request.json();

    if (!tipo || !valor || !registradoPor) {
      return NextResponse.json({ error: "Campos obrigatórios: tipo, valor, registradoPor." }, { status: 400 });
    }
    if (tipo === "INDIVIDUAL" && !funcionarioId) {
      return NextResponse.json({ error: "funcionarioId é obrigatório para crédito individual." }, { status: 400 });
    }
    if (tipo === "COLETIVO" && !empresa) {
      return NextResponse.json({ error: "empresa é obrigatória para crédito coletivo." }, { status: 400 });
    }

    if (tipo === "INDIVIDUAL") {
      const credito = await prisma.creditoFuncionario.create({
        data: {
          funcionarioId,
          valor: Number(valor),
          descricao: descricao ?? null,
          tipo: "INDIVIDUAL",
          registradoPor,
        },
      });
      return NextResponse.json({ criados: 1, creditos: [credito] }, { status: 201 });
    }

    // COLETIVO — um único crédito para o pool da empresa (valor não se multiplica)
    const loteId = crypto.randomUUID();
    const credito = await prisma.creditoFuncionario.create({
      data: {
        funcionarioId: null,
        empresa,
        valor: Number(valor),
        descricao: descricao ?? null,
        tipo: "COLETIVO",
        loteId,
        registradoPor,
      },
    });

    return NextResponse.json({ criados: 1, loteId, creditos: [credito] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/parceiros/credito:", error);
    return NextResponse.json({ error: "Erro ao registrar crédito." }, { status: 500 });
  }
}
