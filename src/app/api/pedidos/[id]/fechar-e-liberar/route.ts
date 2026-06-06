import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

type PagamentoEntry = { forma: string; valor: number };

function resolverPagamentos(pagamentos: PagamentoEntry[], totalFinal: number) {
  const validos = pagamentos.filter((p) => p.valor > 0);
  if (validos.length === 0) {
    return { formaPagamento: pagamentos[0]?.forma ?? "DINHEIRO", pagamentosSplit: null };
  }
  const primario = validos.reduce((a, b) => (b.valor > a.valor ? b : a));
  const pagamentosSplit = validos.length > 1 ? validos : null;
  return { formaPagamento: primario.forma, pagamentosSplit };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const pagamentos: PagamentoEntry[] = body.pagamentos ?? [{ forma: body.formaPagamento, valor: 9999 }];
  const desconto = Number(body.desconto ?? 0);

  if (!pagamentos.length || !pagamentos[0]?.forma) {
    return NextResponse.json({ error: "Forma de pagamento é obrigatória" }, { status: 400 });
  }

  const pedido = await prisma.order.findUnique({ where: { id } });
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  const totalFinal = Math.max(0, Number(pedido.total) - desconto);
  const { formaPagamento, pagamentosSplit } = resolverPagamentos(pagamentos, totalFinal);

  const itensPedido = await prisma.orderItem.findMany({
    where: { orderId: id },
    include: { product: { include: { recipeItems: { include: { ingredient: true } } } } },
  });

  // Produtos sem ficha técnica: debita estoque do próprio produto
  const deducoesEstoque = itensPedido
    .filter((item) => item.product.track_inventory && item.product.recipeItems.length === 0)
    .map((item) =>
      prisma.product.update({
        where: { id: item.product.id },
        data: { estoque: { decrement: Number(item.quantidade) } },
      })
    );

  // Produtos com ficha técnica: debita quantidadeAtual de cada insumo
  const deducoesInsumos = itensPedido
    .filter((item) => item.product.recipeItems.length > 0)
    .flatMap((item) =>
      item.product.recipeItems.map((recipeItem) =>
        prisma.ingredient.update({
          where: { id: recipeItem.ingredientId },
          data: {
            quantidadeAtual: {
              decrement: Number(recipeItem.quantidade) * Number(item.quantidade),
            },
          },
        })
      )
    );

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: {
        paymentStatus: "PAGO",
        closedAt: new Date(),
        formaPagamento: formaPagamento as any,
        total: totalFinal,
        desconto,
        pagamentosSplit: pagamentosSplit ?? undefined,
      },
    }),
    prisma.table.update({ where: { id: pedido.mesaId }, data: { status: "LIVRE" } }),
    ...deducoesEstoque,
    ...deducoesInsumos,
  ]);

  return NextResponse.json({ ok: true });
}
