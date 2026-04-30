import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const insumos = [
  { nome: "Picanha", unidade: "KG", quantidadeAtual: 12.5, nivelMinimoAlerta: 5.0 },
  { nome: "Fraldinha", unidade: "KG", quantidadeAtual: 8.0, nivelMinimoAlerta: 4.0 },
  { nome: "Costela Suína", unidade: "KG", quantidadeAtual: 3.2, nivelMinimoAlerta: 4.0 },
  { nome: "Maminha", unidade: "KG", quantidadeAtual: 6.8, nivelMinimoAlerta: 3.0 },
  { nome: "Linguiça", unidade: "KG", quantidadeAtual: 9.0, nivelMinimoAlerta: 5.0 },
  { nome: "Coração de Frango", unidade: "KG", quantidadeAtual: 4.5, nivelMinimoAlerta: 5.0 },
  { nome: "Asa de Frango", unidade: "KG", quantidadeAtual: 7.0, nivelMinimoAlerta: 3.0 },
  { nome: "Pernil Suíno", unidade: "KG", quantidadeAtual: 5.5, nivelMinimoAlerta: 4.0 },
  { nome: "Carvão", unidade: "KG", quantidadeAtual: 30.0, nivelMinimoAlerta: 10.0 },
  { nome: "Sal Grosso", unidade: "KG", quantidadeAtual: 2.0, nivelMinimoAlerta: 3.0 },
  { nome: "Cerveja Long Neck", unidade: "UN", quantidadeAtual: 144, nivelMinimoAlerta: 24 },
  { nome: "Chopp Artesanal (barril)", unidade: "L", quantidadeAtual: 20.0, nivelMinimoAlerta: 10.0 },
  { nome: "Refrigerante Lata", unidade: "UN", quantidadeAtual: 60, nivelMinimoAlerta: 12 },
  { nome: "Água Mineral", unidade: "UN", quantidadeAtual: 48, nivelMinimoAlerta: 12 },
  { nome: "Cachaça", unidade: "L", quantidadeAtual: 4.5, nivelMinimoAlerta: 2.0 },
  { nome: "Vodka", unidade: "L", quantidadeAtual: 1.5, nivelMinimoAlerta: 2.0 },
  { nome: "Limão", unidade: "UN", quantidadeAtual: 80, nivelMinimoAlerta: 20 },
  { nome: "Maracujá", unidade: "UN", quantidadeAtual: 15, nivelMinimoAlerta: 20 },
  { nome: "Açúcar", unidade: "KG", quantidadeAtual: 3.0, nivelMinimoAlerta: 1.0 },
  { nome: "Gelo", unidade: "KG", quantidadeAtual: 40.0, nivelMinimoAlerta: 15.0 },
] as const;

async function main() {
  const existentes = await prisma.ingredient.findMany({ select: { nome: true } });
  const existentesSet = new Set(existentes.map((i) => i.nome));

  const novos = insumos.filter((i) => !existentesSet.has(i.nome));

  if (novos.length === 0) {
    console.log("Todos os insumos já existem.");
    return;
  }

  await prisma.ingredient.createMany({ data: novos });
  console.log(`${novos.length} insumos inseridos:`);
  novos.forEach((i) => console.log(`  - ${i.nome} (${i.unidade}) — atual: ${i.quantidadeAtual}, mínimo: ${i.nivelMinimoAlerta}`));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
