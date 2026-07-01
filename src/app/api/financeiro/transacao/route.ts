import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { isAdmin } from "@/lib/require-admin";

// Cria uma venda fechada manualmente (backfill/correção administrativa) —
// não passa pelo fluxo normal de abertura de mesa e não altera Table.status.
// O pedido nasce vazio (total 0, sem itens); o admin completa itens e
// pagamento no mesmo modal de edição já usado para vendas reais.
export async function POST(request: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { mesaId, data } = await request.json();
  if (!mesaId) return NextResponse.json({ error: "mesaId é obrigatório." }, { status: 400 });

  const mesa = await prisma.table.findUnique({ where: { id: mesaId } });
  if (!mesa) return NextResponse.json({ error: "Mesa não encontrada." }, { status: 404 });

  const momento = data ? new Date(data) : new Date();

  const pedido = await prisma.order.create({
    data: {
      mesaId,
      total: 0,
      paymentStatus: "PAGO",
      createdAt: momento,
      closedAt: momento,
    },
    include: { items: { include: { product: true } }, table: true },
  });

  return NextResponse.json(pedido, { status: 201 });
}
