const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NUMERO_MESA = 1;

async function main() {
  const mesa = await prisma.table.findUnique({ where: { numero: NUMERO_MESA } });
  if (!mesa) { console.log(`Mesa ${NUMERO_MESA} não encontrada.`); return; }

  const pedidosPendentes = await prisma.order.findMany({
    where: { mesaId: mesa.id, paymentStatus: 'PENDENTE' },
    include: { items: true },
  });
  console.log(`Mesa ${NUMERO_MESA} (status atual: ${mesa.status}) — pedidos pendentes encontrados:`, pedidosPendentes.length);
  pedidosPendentes.forEach((p) => console.log(` - pedido ${p.id}, ${p.items.length} item(ns), total R$ ${p.total}`));

  const ids = pedidosPendentes.map((p) => p.id);

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } }),
    prisma.order.deleteMany({ where: { id: { in: ids } } }),
    prisma.table.update({ where: { id: mesa.id }, data: { status: 'LIVRE' } }),
  ]);

  console.log(`Mesa ${NUMERO_MESA} limpa e resetada para LIVRE.`);
}

main().finally(() => prisma.$disconnect());
