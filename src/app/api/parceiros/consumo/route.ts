import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

// Consumo livre: sem checagem de saldo/caixinha. Acumula para auditoria humana posterior.
export async function POST(request: NextRequest) {
  try {
  const { funcionarioId, productId, quantidade, registradoPor, valorTotal } = await request.json();

  if (!funcionarioId || !productId || !quantidade || !registradoPor) {
    return NextResponse.json({ error: "Campos obrigatórios: funcionarioId, productId, quantidade, registradoPor." }, { status: 400 });
  }
  if (valorTotal !== undefined && (typeof valorTotal !== "number" || !(valorTotal > 0))) {
    return NextResponse.json({ error: "valorTotal deve ser um número maior que zero." }, { status: 400 });
  }

  const [produto, funcionario] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.funcionarioExterno.findUnique({ where: { id: funcionarioId } }),
  ]);
  if (!produto) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  if (!funcionario) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });

  const qtd = Number(quantidade);
  // Permite editar o valor no lançamento (ex: 2 funcionários dividindo uma mesma Coca-Cola)
  const subtotal = valorTotal !== undefined ? Number(valorTotal.toFixed(2)) : Number((Number(produto.preco) * qtd).toFixed(2));
  const precoUnit = Number((subtotal / qtd).toFixed(2));

  // Registrar consumo e deduzir estoque
  const consumo = await prisma.$transaction(async (tx) => {
    const registro = await tx.consumoFuncionario.create({
      data: { funcionarioId, productId, quantidade: qtd, precoUnit, subtotal, registradoPor },
    });

    if (produto.track_inventory) {
      const receita = await tx.recipeItem.findMany({ where: { productId } });
      for (const item of receita) {
        await tx.ingredient.update({
          where: { id: item.ingredientId },
          data: { quantidadeAtual: { decrement: Number(item.quantidade) * qtd } },
        });
      }
      if (receita.length === 0) {
        await tx.product.update({
          where: { id: productId },
          data: { estoque: { decrement: qtd } },
        });
      }
    }

    return registro;
  });

  return NextResponse.json(consumo, { status: 201 });
  } catch (error) {
    console.error("POST /api/parceiros/consumo:", error);
    return NextResponse.json({ error: "Erro ao registrar consumo." }, { status: 500 });
  }
}
