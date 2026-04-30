import { PrismaClient, TableStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mesas = Array.from({ length: 10 }, (_, index) => index + 1);

  await Promise.all(
    mesas.map((numero) =>
      prisma.table.upsert({
        where: { numero },
        update: { status: TableStatus.LIVRE },
        create: {
          numero,
          status: TableStatus.LIVRE,
        },
      })
    )
  );

  const produtos = [
    { nome: "Espetinho de Carne", preco: "14.90", categoria: "Comida" },
    { nome: "Espetinho de Frango", preco: "12.90", categoria: "Comida" },
    { nome: "Cerveja Long Neck", preco: "9.90", categoria: "Bebida" },
    { nome: "Refrigerante Lata", preco: "6.50", categoria: "Bebida" },
    { nome: "Água Mineral", preco: "4.50", categoria: "Bebida" },
    { nome: "Porção de Fritas", preco: "24.90", categoria: "Comida" },
  ];

  await Promise.all(
    produtos.map(async (produto) => {
      const atualizacao = await prisma.product.updateMany({
        where: { nome: produto.nome },
        data: {
          preco: produto.preco,
          categoria: produto.categoria,
        },
      });

      if (atualizacao.count === 0) {
        await prisma.product.create({ data: produto });
      }
    })
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Erro ao executar seed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
