import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { formaPagamento } = await request.json();

  if (!formaPagamento) {
    return NextResponse.json({ error: "Forma de pagamento é obrigatória" }, { status: 400 });
  }

  const pedido = await prisma.order.findUnique({ where: { id } });
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  // Busca itens do pedido com a ficha técnica de cada produto
  const itensPedido = await prisma.orderItem.findMany({
    where: { orderId: id },
    include: { product: { include: { recipeItems: true } } },
  });

  // Monta as deduções de estoque agrupadas por ingrediente
  const deducoes = new Map<string, number>();
  for (const item of itensPedido) {
    for (const ri of item.product.recipeItems) {
      const qtd = Number(ri.quantidade) * Number(item.quantidade);
      deducoes.set(ri.ingredientId, (deducoes.get(ri.ingredientId) ?? 0) + qtd);
    }
  }

  const operacoesEstoque = Array.from(deducoes.entries()).map(([ingredientId, qtd]) =>
    prisma.ingredient.update({
      where: { id: ingredientId },
      data: { quantidadeAtual: { decrement: qtd } },
    })
  );

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { paymentStatus: "PAGO", closedAt: new Date(), formaPagamento },
    }),
    prisma.table.update({ where: { id: pedido.mesaId }, data: { status: "LIVRE" } }),
    ...operacoesEstoque,
  ]);

  return NextResponse.json({ ok: true });
}
