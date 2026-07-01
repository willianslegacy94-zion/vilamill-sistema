const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const antes = {
    pedidos: await prisma.order.count(),
    itens: await prisma.orderItem.count(),
    cancelamentos: await prisma.cancelamentoLog.count(),
    despesas: await prisma.despesa.count(),
    creditos: await prisma.creditoFuncionario.count(),
    consumos: await prisma.consumoFuncionario.count(),
    vales: await prisma.lancamentoVale.count(),
  };
  console.log('Antes:', antes);

  await prisma.$transaction([
    prisma.orderItem.deleteMany({}),
    prisma.order.deleteMany({}),
    prisma.cancelamentoLog.deleteMany({}),
    prisma.despesa.deleteMany({}),
    prisma.creditoFuncionario.deleteMany({}),
    prisma.consumoFuncionario.deleteMany({}),
    prisma.lancamentoVale.deleteMany({}),
    prisma.table.updateMany({ data: { status: 'LIVRE' } }),
  ]);

  const depois = {
    pedidos: await prisma.order.count(),
    itens: await prisma.orderItem.count(),
    cancelamentos: await prisma.cancelamentoLog.count(),
    despesas: await prisma.despesa.count(),
    creditos: await prisma.creditoFuncionario.count(),
    consumos: await prisma.consumoFuncionario.count(),
    vales: await prisma.lancamentoVale.count(),
  };
  console.log('Depois:', depois);
}

main().finally(() => prisma.$disconnect());
