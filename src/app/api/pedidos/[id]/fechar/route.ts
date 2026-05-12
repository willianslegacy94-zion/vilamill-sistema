import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { formaPagamento, desconto = 0 } = await request.json();

  if (!formaPagamento) {
    return NextResponse.json({ error: "Forma de pagamento é obrigatória" }, { status: 400 });
  }

  const pedido = await prisma.order.findUnique({ where: { id } });
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  const totalFinal = Math.max(0, Number(pedido.total) - Number(desconto));

  const itensPedido = await prisma.orderItem.findMany({
    where: { orderId: id },
    include: { product: { include: { recipeItems: true } } },
  });

  // Baixa direta em produtos com track_inventory=true e sem RecipeItems vinculados
  const deducoesEstoque = itensPedido
    .filter((item) => item.product.track_inventory && item.product.recipeItems.length === 0)
    .map((item) =>
      prisma.product.update({
        where: { id: item.product.id },
        data: { estoque: { decrement: Number(item.quantidade) } },
      })
    );

  // --- Lógica de Ficha Técnica (RecipeItem) em standby para uso futuro ---
  // function calcularDeducoesReceita(itens: typeof itensPedido) {
  //   const deducoes = new Map<string, number>();
  //   for (const item of itens) {
  //     for (const ri of item.product.recipeItems) {
  //       const qtd = Number(ri.quantidade) * Number(item.quantidade);
  //       deducoes.set(ri.ingredientId, (deducoes.get(ri.ingredientId) ?? 0) + qtd);
  //     }
  //   }
  //   return Array.from(deducoes.entries()).map(([ingredientId, qtd]) =>
  //     prisma.ingredient.update({
  //       where: { id: ingredientId },
  //       data: { quantidadeAtual: { decrement: qtd } },
  //     })
  //   );
  // }

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { paymentStatus: "PAGO", closedAt: new Date(), formaPagamento, total: totalFinal, desconto },
    }),
    prisma.table.update({ where: { id: pedido.mesaId }, data: { status: "LIVRE" } }),
    ...deducoesEstoque,
  ]);

  return NextResponse.json({ ok: true });
}
