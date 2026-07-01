const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Idempotente — seguro rodar de novo a qualquer momento (ex: após restore de
// banco, ou se o cadastro sumir de novo por qualquer motivo). Só cria quem
// ainda não existe nessa empresa.
const EMPRESA = "Equipe Villa Mill";
const NOMES = [
  "Tarson", "Fernando", "Arthur", "Raul", "Hiago", "Mateus",
  "Ana Júlia", "Ednalva", "Jamille", "Kamila", "Larissa", "Mill",
];

async function main() {
  for (const nome of NOMES) {
    const existente = await prisma.funcionarioExterno.findFirst({ where: { nome, empresa: EMPRESA } });
    if (existente) {
      console.log(`já existe: ${nome}`);
      continue;
    }
    const criado = await prisma.funcionarioExterno.create({
      data: { nome, empresa: EMPRESA, setor: EMPRESA, ativo: true },
    });
    console.log(`criado: ${criado.nome} (${criado.id})`);
  }
}

main().finally(() => prisma.$disconnect());
