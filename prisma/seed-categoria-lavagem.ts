import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Lista todos os produtos para inspecionar
  const todos = await prisma.product.findMany({
    select: { id: true, nome: true, categoria: true },
    orderBy: { nome: "asc" },
  });

  console.log("\n=== Produtos cadastrados ===");
  todos.forEach((p) => console.log(`  [${p.categoria}] ${p.nome}`));

  // Identifica serviços automotivos pelo nome ou categoria atual
  const servicosLavagem = todos.filter((p) => {
    const nome = p.nome.toLowerCase();
    const cat = p.categoria.toLowerCase();
    return (
      cat === "lavagem" ||
      cat === "lava rápido" ||
      cat === "lava rapido" ||
      cat === "serviços automotivos" ||
      cat === "automotivo" ||
      nome.includes("carro") ||
      nome.includes("caminhão") ||
      nome.includes("caminhao") ||
      nome.includes("vuc") ||
      nome.includes("lavagem") ||
      nome.includes("lava ")
    );
  });

  if (servicosLavagem.length === 0) {
    console.log("\nNenhum serviço de lavagem encontrado automaticamente.");
    console.log("Acesse /produtos no sistema e edite a categoria dos serviços manualmente para 'Lavagem'.");
    return;
  }

  console.log("\n=== Serviços identificados para categoria Lavagem ===");
  servicosLavagem.forEach((p) => console.log(`  ${p.nome} (categoria atual: ${p.categoria})`));

  const ids = servicosLavagem.map((p) => p.id);

  const { count } = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { categoria: "Lavagem" },
  });

  console.log(`\n✓ ${count} produto(s) atualizado(s) para categoria "Lavagem".`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
