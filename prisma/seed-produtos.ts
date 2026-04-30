import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const produtos = [
  { nome: "Picanha Grelhada", preco: "45.90", categoria: "Carne" },
  { nome: "Fraldinha no Espeto", preco: "22.90", categoria: "Carne" },
  { nome: "Costela de Porco", preco: "29.90", categoria: "Carne" },
  { nome: "Maminha na Brasa", preco: "38.90", categoria: "Carne" },
  { nome: "Linguiça Toscana", preco: "18.90", categoria: "Carne" },
  { nome: "Coração de Frango", preco: "11.90", categoria: "Carne" },
  { nome: "Asa de Frango Grelhada", preco: "16.90", categoria: "Carne" },
  { nome: "Pernil Suíno", preco: "32.90", categoria: "Carne" },
  { nome: "Heineken Long Neck", preco: "12.90", categoria: "Bebida" },
  { nome: "Stella Artois Long Neck", preco: "13.90", categoria: "Bebida" },
  { nome: "Budweiser Lata", preco: "9.90", categoria: "Bebida" },
  { nome: "Chopp Artesanal 300ml", preco: "14.90", categoria: "Bebida" },
  { nome: "Caipirinha de Limão", preco: "18.90", categoria: "Bebida" },
  { nome: "Caipiroska de Maracujá", preco: "21.90", categoria: "Bebida" },
  { nome: "Suco de Laranja Natural", preco: "8.90", categoria: "Bebida" },
  { nome: "Coca-Cola 600ml", preco: "9.90", categoria: "Bebida" },
  { nome: "Água com Gás", preco: "5.90", categoria: "Bebida" },
  { nome: "Suco de Uva", preco: "7.90", categoria: "Bebida" },
];

async function main() {
  const existentes = await prisma.product.findMany({ select: { nome: true } });
  const nomesExistentes = new Set(existentes.map((p) => p.nome));

  const novos = produtos.filter((p) => !nomesExistentes.has(p.nome));

  if (novos.length === 0) {
    console.log("Todos os produtos já existem.");
    return;
  }

  await prisma.product.createMany({ data: novos });
  console.log(`${novos.length} produtos inseridos:`);
  novos.forEach((p) => console.log(`  - ${p.nome} (${p.categoria})`));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
