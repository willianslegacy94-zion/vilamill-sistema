const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NUMERO_MESA = 1;

async function main() {
  const registros = await prisma.cancelamentoLog.findMany({ where: { mesaNumero: NUMERO_MESA } });
  console.log(`Cancelamentos encontrados para mesa ${NUMERO_MESA}:`, registros.length);
  registros.forEach((r) => console.log(` - ${r.id} | ${r.canceladoEm} | motivo: ${r.motivoCancelamento ?? "(sem motivo)"} | por: ${r.canceladoPor}`));

  const { count } = await prisma.cancelamentoLog.deleteMany({ where: { mesaNumero: NUMERO_MESA } });
  console.log(`Apagados: ${count}`);
}

main().finally(() => prisma.$disconnect());
