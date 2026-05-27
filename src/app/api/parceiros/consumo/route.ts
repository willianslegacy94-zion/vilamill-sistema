import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function POST(request: NextRequest) {
  const { funcionarioId, productId, quantidade, registradoPor } = await request.json();

  if (!funcionarioId || !productId || !quantidade || !registradoPor) {
    return NextResponse.json({ error: "Campos obrigatórios: funcionarioId, productId, quantidade, registradoPor." }, { status: 400 });
  }

  const [produto, funcionario] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.funcionarioExterno.findUnique({ where: { id: funcionarioId } }),
  ]);
  if (!produto) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  if (!funcionario) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });

  const precoUnit = Number(produto.preco);
  const qtd = Number(quantidade);
  const subtotal = Number((precoUnit * qtd).toFixed(2));

  // Saldo do pool coletivo da empresa (valor depositado menos tudo que foi consumido pelo grupo)
  const empresa = funcionario.empresa;
  const [creditosPool, consumosPool] = await Promise.all([
    prisma.creditoFuncionario.findMany({
      where: { empresa, tipo: "COLETIVO", liquidado: false },
    }),
    prisma.consumoFuncionario.findMany({
      where: { funcionario: { empresa }, liquidado: false },
    }),
  ]);
  const saldoPool =
    creditosPool.reduce((s, c) => s + Number(c.valor), 0) -
    consumosPool.reduce((s, c) => s + Number(c.subtotal), 0);

  if (subtotal > saldoPool) {
    return NextResponse.json(
      { error: `Saldo insuficiente na caixinha. Disponível: R$ ${saldoPool.toFixed(2)}`, saldo: saldoPool },
      { status: 422 }
    );
  }

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
}
