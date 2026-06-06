/**
 * Script de correção: debita do estoque as vendas do dia 05/06/2026
 * que não foram processadas pelo bug de dedução.
 *
 * Cobre:
 *   - Produtos sem ficha técnica (track_inventory=true): debita product.estoque
 *   - Produtos com ficha técnica: debita ingredient.quantidadeAtual
 *
 * Execução: npx tsx prisma/scripts/corrigir-estoque-05062026.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const inicio = new Date("2026-06-05T00:00:00.000-03:00");
  const fim = new Date("2026-06-05T23:59:59.999-03:00");

  const pedidos = await prisma.order.findMany({
    where: {
      paymentStatus: "PAGO",
      closedAt: { gte: inicio, lte: fim },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              recipeItems: { include: { ingredient: true } },
            },
          },
        },
      },
    },
  });

  if (pedidos.length === 0) {
    console.log("Nenhum pedido pago encontrado em 05/06/2026.");
    return;
  }

  console.log(`Encontrados ${pedidos.length} pedido(s) pago(s) em 05/06/2026.`);

  // Acumula totais por produto/ingrediente para um único update por entidade
  const estoqueMap = new Map<string, number>();    // productId → qtd a decrementar
  const insumoMap  = new Map<string, number>();    // ingredientId → qtd a decrementar

  for (const pedido of pedidos) {
    for (const item of pedido.items) {
      const produto = item.product;
      const qtdItem = Number(item.quantidade);

      if (produto.recipeItems.length > 0) {
        // Produto com ficha técnica → debita insumos
        for (const recipeItem of produto.recipeItems) {
          const id  = recipeItem.ingredientId;
          const qtd = Number(recipeItem.quantidade) * qtdItem;
          insumoMap.set(id, (insumoMap.get(id) ?? 0) + qtd);
        }
      } else if (produto.track_inventory) {
        // Produto sem ficha técnica com controle de estoque → debita produto
        estoqueMap.set(produto.id, (estoqueMap.get(produto.id) ?? 0) + qtdItem);
      }
    }
  }

  // ── Preview ────────────────────────────────────────────────────────────────
  console.log("\n=== DEDUÇÕES A APLICAR ===");

  if (estoqueMap.size > 0) {
    console.log("\nProdutos (sem ficha técnica):");
    for (const [id, qtd] of estoqueMap) {
      const p = await prisma.product.findUnique({ where: { id } });
      console.log(`  ${p?.nome ?? id}: -${qtd} (estoque atual: ${p?.estoque})`);
    }
  }

  if (insumoMap.size > 0) {
    console.log("\nInsumos (via ficha técnica):");
    for (const [id, qtd] of insumoMap) {
      const ing = await prisma.ingredient.findUnique({ where: { id } });
      console.log(`  ${ing?.nome ?? id}: -${qtd} ${ing?.unidade} (atual: ${ing?.quantidadeAtual})`);
    }
  }

  if (estoqueMap.size === 0 && insumoMap.size === 0) {
    console.log("Nenhuma dedução necessária (nenhum item com controle de estoque ou ficha técnica).");
    return;
  }

  // ── Aplica correções em transação ─────────────────────────────────────────
  const ops = [
    ...[...estoqueMap.entries()].map(([id, qtd]) =>
      prisma.product.update({
        where: { id },
        data: { estoque: { decrement: qtd } },
      })
    ),
    ...[...insumoMap.entries()].map(([id, qtd]) =>
      prisma.ingredient.update({
        where: { id },
        data: { quantidadeAtual: { decrement: qtd } },
      })
    ),
  ];

  await prisma.$transaction(ops);

  console.log(`\n✓ Correção aplicada: ${estoqueMap.size} produto(s) e ${insumoMap.size} insumo(s) atualizados.`);
}

main()
  .catch((e) => {
    console.error("Erro ao executar correção:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
