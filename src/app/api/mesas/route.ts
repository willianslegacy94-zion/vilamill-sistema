import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
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
}
