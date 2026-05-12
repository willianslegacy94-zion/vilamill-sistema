"use strict";
const { PrismaClient, TableStatus } = require("@prisma/client");

const prisma = new PrismaClient();

const HASHES = {
  admin123:  "$2b$10$HVEC9V8qA2SoS0.dczmL7.RtCCIbYtDUg3mOZJAyj0XfcaNAb0ISK",
  caixa123:  "$2b$10$fWN1pw3E7rde.xZYofYKU.OKwO0yvd41TYLPXcwlnRr3xGhzya7Qm",
  treino123: "$2b$10$SUJmUlYdQeKuxSg4CRXjDe.rYp9zPeJCS6Ux6T6HlByltYooYCM9a",
};

async function main() {
  // Mesas
  const mesas = Array.from({ length: 15 }, (_, i) => i + 1);
  await Promise.all(
    mesas.map((numero) =>
      prisma.table.upsert({
        where: { numero },
        update: { status: "LIVRE" },
        create: { numero, status: "LIVRE" },
      })
    )
  );

  // Produtos
  const produtos = [
    { nome: "Costela Cozida com Mandioca",            preco: "35.00", categoria: "Pratos do Dia" },
    { nome: "Strogonoff de Frango",                   preco: "30.00", categoria: "Pratos do Dia" },
    { nome: "Lasanha",                                preco: "35.00", categoria: "Pratos do Dia" },
    { nome: "Feijoada Completa",                      preco: "36.00", categoria: "Pratos do Dia" },
    { nome: "Rabada Cozida com Batata",               preco: "35.00", categoria: "Pratos do Dia" },
    { nome: "Filé de Tilápia Empanado ou Grelhado",   preco: "35.00", categoria: "Pratos do Dia" },
    { nome: "Picadinho de Carne com Batata",          preco: "35.00", categoria: "Pratos do Dia" },
    { nome: "Bife a Cavalo com Fritas",               preco: "48.00", categoria: "Todos os Dias" },
    { nome: "Filé de Frango com Purê ou Fritas",      preco: "30.00", categoria: "Todos os Dias" },
    { nome: "Contra Filé Acebolado com Fritas",       preco: "45.00", categoria: "Todos os Dias" },
    { nome: "Linguiça Calabresa",                     preco: "29.00", categoria: "Todos os Dias" },
    { nome: "Hambúrguer 90g com Ovo e Fritas",        preco: "29.00", categoria: "Todos os Dias" },
    { nome: "Linguiça Toscana com Vinagrete",         preco: "29.00", categoria: "Todos os Dias" },
    { nome: "Frango ao Molho com Macarrão",           preco: "30.00", categoria: "Todos os Dias" },
    { nome: "Omelete (Tomate, Cebola e Muçarela)",    preco: "29.00", categoria: "Todos os Dias" },
    { nome: "Almôndegas de Carne",                    preco: "32.00", categoria: "Todos os Dias" },
    { nome: "Parmegiana de Carne com Fritas",         preco: "40.00", categoria: "Todos os Dias" },
    { nome: "Parmegiana de Frango com Fritas",        preco: "35.00", categoria: "Todos os Dias" },
    { nome: "Misto de Carne e Linguiça",              preco: "46.00", categoria: "Todos os Dias" },
    { nome: "Arroz",                                  preco: "10.00", categoria: "Acompanhamentos" },
    { nome: "Feijão",                                 preco: "12.00", categoria: "Acompanhamentos" },
    { nome: "Ovo",                                    preco: "3.00",  categoria: "Acompanhamentos" },
    { nome: "Vinagrete",                              preco: "5.00",  categoria: "Acompanhamentos" },
    { nome: "Purê de Batata",                         preco: "8.00",  categoria: "Acompanhamentos" },
    { nome: "Hambúrguer",                             preco: "8.00",  categoria: "Acompanhamentos" },
    { nome: "Salada",                                 preco: "8.00",  categoria: "Acompanhamentos" },
    { nome: "Fritas",                                 preco: "8.00",  categoria: "Acompanhamentos" },
    { nome: "X-Burguer",                              preco: "18.00", categoria: "Lanches Tradicionais" },
    { nome: "X-Salada",                               preco: "25.00", categoria: "Lanches Tradicionais" },
    { nome: "X-Bacon",                                preco: "29.00", categoria: "Lanches Tradicionais" },
    { nome: "X-Calabresa",                            preco: "29.00", categoria: "Lanches Tradicionais" },
    { nome: "X-Egg",                                  preco: "27.00", categoria: "Lanches Tradicionais" },
    { nome: "X-Tudo",                                 preco: "32.00", categoria: "Lanches Tradicionais" },
    { nome: "Baguete Calabresa",                      preco: "50.00", categoria: "Lanches na Baguete" },
    { nome: "Baguete Frango",                         preco: "50.00", categoria: "Lanches na Baguete" },
    { nome: "Baguete Contra Filé",                    preco: "60.00", categoria: "Lanches na Baguete" },
    { nome: "Kwid",                                   preco: "28.00", categoria: "Lanches Artesanais" },
    { nome: "Polo",                                   preco: "33.00", categoria: "Lanches Artesanais" },
    { nome: "BMW 320i",                               preco: "42.00", categoria: "Lanches Artesanais" },
    { nome: "Porsche Macan",                          preco: "40.00", categoria: "Lanches Artesanais" },
    { nome: "Mercedes GLA 200",                       preco: "40.00", categoria: "Lanches Artesanais" },
    { nome: "BYD Song",                               preco: "30.00", categoria: "Lanches Artesanais" },
    { nome: "Batata Frita (P)",                       preco: "20.00", categoria: "Porções" },
    { nome: "Batata Frita Cheddar & Bacon (P)",       preco: "30.00", categoria: "Porções" },
    { nome: "Calabresa Acebolada (P)",                preco: "35.00", categoria: "Porções" },
    { nome: "Frango à Passarinho (P)",                preco: "35.00", categoria: "Porções" },
    { nome: "Contra Filé Acebolado (P)",              preco: "60.00", categoria: "Porções" },
    { nome: "Mandioca Frita (P)",                     preco: "35.00", categoria: "Porções" },
    { nome: "Carne Seca com Mandioca (P)",            preco: "60.00", categoria: "Porções" },
    { nome: "Batata Frita com Cheddar, Bacon e Calabresa (P)", preco: "40.00", categoria: "Porções" },
    { nome: "Frango à Passarinho com Batata Frita (P)", preco: "40.00", categoria: "Porções" },
    { nome: "Batata Frita (M)",                       preco: "25.00", categoria: "Porções" },
    { nome: "Batata Frita Cheddar & Bacon (M)",       preco: "35.00", categoria: "Porções" },
    { nome: "Calabresa Acebolada (M)",                preco: "48.00", categoria: "Porções" },
    { nome: "Frango à Passarinho (M)",                preco: "48.00", categoria: "Porções" },
    { nome: "Contra Filé Acebolado (M)",              preco: "85.00", categoria: "Porções" },
    { nome: "Mandioca Frita (M)",                     preco: "48.00", categoria: "Porções" },
    { nome: "Carne Seca com Mandioca (M)",            preco: "85.00", categoria: "Porções" },
    { nome: "Batata Frita com Cheddar, Bacon e Calabresa (M)", preco: "55.00", categoria: "Porções" },
    { nome: "Frango à Passarinho com Batata Frita (M)", preco: "55.00", categoria: "Porções" },
    { nome: "Suco de Laranja Natural",                preco: "10.00", categoria: "Sucos" },
    { nome: "Suco de Limão Natural",                  preco: "10.00", categoria: "Sucos" },
    { nome: "Suco de Abacaxi com Hortelã",            preco: "10.00", categoria: "Sucos" },
    { nome: "Suco de Maracujá",                       preco: "10.00", categoria: "Sucos" },
    { nome: "Suco de Morango",                        preco: "10.00", categoria: "Sucos" },
    { nome: "Coca-Cola 350ml",                        preco: "8.00",  categoria: "Refrigerantes" },
    { nome: "Coca-Cola Zero 350ml",                   preco: "8.00",  categoria: "Refrigerantes" },
    { nome: "Fanta Laranja 350ml",                    preco: "7.00",  categoria: "Refrigerantes" },
    { nome: "Fanta Uva 350ml",                        preco: "7.00",  categoria: "Refrigerantes" },
    { nome: "Sprite 350ml",                           preco: "7.00",  categoria: "Refrigerantes" },
    { nome: "Itubaína 350ml",                         preco: "7.00",  categoria: "Refrigerantes" },
    { nome: "Guaraná 350ml",                          preco: "7.00",  categoria: "Refrigerantes" },
    { nome: "Guaraná Zero 350ml",                     preco: "7.00",  categoria: "Refrigerantes" },
    { nome: "H2O Limoneto 500ml",                     preco: "12.00", categoria: "Refrigerantes" },
    { nome: "Coca-Cola 600ml",                        preco: "10.00", categoria: "Refrigerantes" },
    { nome: "Guaraná 600ml",                          preco: "9.00",  categoria: "Refrigerantes" },
    { nome: "Água Tônica",                            preco: "7.00",  categoria: "Refrigerantes" },
    { nome: "Guaraviton",                             preco: "6.00",  categoria: "Refrigerantes" },
    { nome: "Gatorade",                               preco: "10.00", categoria: "Refrigerantes" },
    { nome: "Água 500ml",                             preco: "4.00",  categoria: "Refrigerantes" },
    { nome: "Água com Gás",                           preco: "4.50",  categoria: "Refrigerantes" },
    { nome: "Guaraná 1L",                             preco: "13.00", categoria: "Refrigerantes" },
    { nome: "Coca-Cola 1L",                           preco: "15.00", categoria: "Refrigerantes" },
    { nome: "Dolly 2L",                               preco: "10.00", categoria: "Refrigerantes" },
    { nome: "Coca-Cola 2L",                           preco: "20.00", categoria: "Refrigerantes" },
    { nome: "Red Bull 250ml",                         preco: "17.00", categoria: "Refrigerantes" },
    { nome: "Heineken Lata 350ml",                    preco: "10.00", categoria: "Cervejas" },
    { nome: "Skol Lata 350ml",                        preco: "7.00",  categoria: "Cervejas" },
    { nome: "Brahma Duplo Malte 350ml",               preco: "8.00",  categoria: "Cervejas" },
    { nome: "Império Puro Malte 350ml",               preco: "7.00",  categoria: "Cervejas" },
    { nome: "Original Lata 350ml",                    preco: "7.00",  categoria: "Cervejas" },
    { nome: "Heineken Long Neck",                     preco: "13.00", categoria: "Cervejas" },
    { nome: "Heineken Long Neck sem Álcool",          preco: "13.00", categoria: "Cervejas" },
    { nome: "Corona Long Neck 330ml",                 preco: "14.00", categoria: "Cervejas" },
    { nome: "Heineken 600ml",                         preco: "19.00", categoria: "Cervejas" },
    { nome: "Original 600ml",                         preco: "17.00", categoria: "Cervejas" },
    { nome: "Balde 6x Heineken 600ml",                preco: "108.00", categoria: "Cervejas" },
    { nome: "Balde 6x Original 600ml",                preco: "96.00", categoria: "Cervejas" },
    { nome: "Mousse de Limão",                        preco: "7.00",  categoria: "Sobremesas" },
    { nome: "Mousse de Maracujá",                     preco: "7.00",  categoria: "Sobremesas" },
    { nome: "Torta de Limão com Chocolate Branco",    preco: "10.00", categoria: "Sobremesas" },
    { nome: "Delícia de Abacaxi com Chantilly",       preco: "10.00", categoria: "Sobremesas" },
    { nome: "Cone Tradicional",                       preco: "10.00", categoria: "Sobremesas" },
    { nome: "Cone Variado",                           preco: "12.00", categoria: "Sobremesas" },
    { nome: "Cone Especial",                          preco: "15.00", categoria: "Sobremesas" },
  ];

  await Promise.all(
    produtos.map(async (produto) => {
      const atualizado = await prisma.product.updateMany({
        where: { nome: produto.nome },
        data: { preco: produto.preco, categoria: produto.categoria },
      });
      if (atualizado.count === 0) {
        await prisma.product.create({ data: produto });
      }
    })
  );

  console.log(`✓ ${produtos.length} produtos sincronizados.`);

  // Usuários
  const usuarios = [
    { nome: "Admin",       email: "admin@villamill.com",       senhaHash: HASHES["admin123"],  role: "ADMIN" },
    { nome: "Caixa",       email: "caixa@villamill.com",       senhaHash: HASHES["caixa123"],  role: "CAIXA" },
    { nome: "Treinamento", email: "treinamento@villamill.com", senhaHash: HASHES["treino123"], role: "CAIXA" },
  ];

  for (const u of usuarios) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { nome: u.nome, email: u.email, senhaHash: u.senhaHash, role: u.role },
    });
  }

  console.log(`✓ ${usuarios.length} usuários sincronizados.`);
  console.log(`✓ 15 mesas sincronizadas.`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error("Erro ao executar seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
