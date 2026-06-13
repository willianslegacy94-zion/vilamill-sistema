import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { productId, quantidade, observacoes } = await request.json();

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const preco = Number(product.preco);
  const custo = Number(product.costPrice);
  const obs: string | null = observacoes?.trim() || null;

  // Só faz merge se não tiver observações (produto sem opcionais)
  if (!obs) {
    const existing = await prisma.orderItem.findFirst({
      where: { orderId: id, productId, observacoes: null },
    });

    if (existing) {
      const novaQtd = Number(existing.quantidade) + Number(quantidade);
      await prisma.orderItem.update({
        where: { id: existing.id },
        data: { quantidade: novaQtd, subtotal: preco * novaQtd },
      });
    } else {
      await prisma.orderItem.create({
        data: { orderId: id, productId, quantidade, precoUnit: preco, custoUnit: custo, subtotal: preco * quantidade },
      });
    }
  } else {
    // Com opcionais: sempre cria novo item
    await prisma.orderItem.create({
      data: { orderId: id, productId, quantidade, precoUnit: preco, custoUnit: custo, subtotal: preco * quantidade, observacoes: obs },
    });
  }

  const allItems = await prisma.orderItem.findMany({ where: { orderId: id } });
  const total = allItems.reduce((acc, i) => acc + Number(i.subtotal), 0);
  await prisma.order.update({ where: { id }, data: { total } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
