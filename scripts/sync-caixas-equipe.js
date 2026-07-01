const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Idempotente — garante que todo Caixa ativo tenha um FuncionarioExterno
// correspondente (empresa "Equipe Villa Mill"), pra aparecer na aba Equipe.
// Útil como backfill pontual; o dia a dia já fica sincronizado sozinho via
// POST/DELETE /api/caixas.
const EMPRESA_EQUIPE = "Equipe Villa Mill";

async function main() {
  const caixas = await prisma.caixa.findMany({ where: { ativo: true } });
  for (const c of caixas) {
    const existente = await prisma.funcionarioExterno.findFirst({
      where: { nome: c.nome, empresa: EMPRESA_EQUIPE },
    });
    if (existente) {
      if (!existente.ativo) {
        await prisma.funcionarioExterno.update({ where: { id: existente.id }, data: { ativo: true } });
        console.log(`reativado: ${c.nome}`);
      } else {
        console.log(`já existe: ${c.nome}`);
      }
      continue;
    }
    const criado = await prisma.funcionarioExterno.create({
      data: { nome: c.nome, empresa: EMPRESA_EQUIPE, setor: EMPRESA_EQUIPE, ativo: true },
    });
    console.log(`criado: ${criado.nome} (${criado.id})`);
  }
}

main().finally(() => prisma.$disconnect());
