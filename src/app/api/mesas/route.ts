import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
  try {
    const mesas = await prisma.table.findMany({
      orderBy: { numero: "asc" },
      include: {
        orders: {
          where: { paymentStatus: "PENDENTE" },
          include: { items: { include: { product: true } } },
        },
      },
    });
    return NextResponse.json(JSON.parse(JSON.stringify(mesas)));
  } catch (err) {
    console.error("[GET /api/mesas]", err);
    return NextResponse.json({ error: "Erro interno ao buscar mesas" }, { status: 500 });
  }
}
