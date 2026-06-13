import { PrismaClient, TableStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Mesas ──────────────────────────────────────────────────────────────────
  const mesas = Array.from({ length: 15 }, (_, i) => i + 1);
  await Promise.all(
    mesas.map((numero) =>
      prisma.table.upsert({
        where: { numero },
        update: { status: TableStatus.LIVRE },
        create: { numero, status: TableStatus.LIVRE },
      })
    )
  );

  // ── Opcionais reutilizáveis ────────────────────────────────────────────────
  const PONTO   = { nome: "Ponto da Carne",   tipo: "radio",    obrigatorio: true,  opcoes: ["Ao Ponto", "Bem Passado", "Mal Passado"] };
  const SALADA  = { nome: "Salada",           tipo: "radio",    obrigatorio: false, opcoes: ["Tradicional", "Vinagrete"] };
  const ACOMP   = { nome: "Acompanhamento",   tipo: "checkbox", obrigatorio: false, limite: 3, opcoes: ["Arroz", "Feijão", "Fritas", "Farofa"] };

  const COM_PONTO  = [PONTO, SALADA, ACOMP];
  const SEM_PONTO  = [SALADA, ACOMP];
  const SO_PONTO   = [PONTO];

  // ── Cardápio real — Villa Mill Tamboré ─────────────────────────────────────
  const produtos: { nome: string; preco: string; categoria: string; opcionais?: object[] }[] = [
    // Pratos do Dia
    { nome: "Costela Cozida com Mandioca",            preco: "35.00", categoria: "Pratos do Dia",  opcionais: COM_PONTO },
    { nome: "Strogonoff de Frango",                   preco: "30.00", categoria: "Pratos do Dia",  opcionais: SEM_PONTO },
    { nome: "Lasanha",                                preco: "35.00", categoria: "Pratos do Dia",  opcionais: SEM_PONTO },
    { nome: "Feijoada Completa",                      preco: "36.00", categoria: "Pratos do Dia",  opcionais: SEM_PONTO },
    { nome: "Rabada Cozida com Batata",               preco: "35.00", categoria: "Pratos do Dia",  opcionais: COM_PONTO },
    { nome: "Filé de Tilápia Empanado ou Grelhado",   preco: "35.00", categoria: "Pratos do Dia",  opcionais: SEM_PONTO },
    { nome: "Picadinho de Carne com Batata",          preco: "35.00", categoria: "Pratos do Dia",  opcionais: COM_PONTO },

    // Todos os Dias
    { nome: "Bife a Cavalo com Fritas",               preco: "48.00", categoria: "Todos os Dias",  opcionais: COM_PONTO },
    { nome: "Filé de Frango com Purê ou Fritas",      preco: "30.00", categoria: "Todos os Dias",  opcionais: SEM_PONTO },
    { nome: "Contra Filé Acebolado com Fritas",       preco: "45.00", categoria: "Todos os Dias",  opcionais: COM_PONTO },
    { nome: "Linguiça Calabresa",                     preco: "29.00", categoria: "Todos os Dias",  opcionais: COM_PONTO },
    { nome: "Hambúrguer 90g com Ovo e Fritas",        preco: "29.00", categoria: "Todos os Dias",  opcionais: COM_PONTO },
    { nome: "Linguiça Toscana com Vinagrete",         preco: "29.00", categoria: "Todos os Dias",  opcionais: COM_PONTO },
    { nome: "Frango ao Molho com Macarrão",           preco: "30.00", categoria: "Todos os Dias",  opcionais: SEM_PONTO },
    { nome: "Omelete (Tomate, Cebola e Muçarela)",    preco: "29.00", categoria: "Todos os Dias",  opcionais: SEM_PONTO },
    { nome: "Almôndegas de Carne",                    preco: "32.00", categoria: "Todos os Dias",  opcionais: COM_PONTO },
    { nome: "Parmegiana de Carne com Fritas",         preco: "40.00", categoria: "Todos os Dias",  opcionais: COM_PONTO },
    { nome: "Parmegiana de Frango com Fritas",        preco: "35.00", categoria: "Todos os Dias",  opcionais: SEM_PONTO },
    { nome: "Misto de Carne e Linguiça",              preco: "46.00", categoria: "Todos os Dias",  opcionais: COM_PONTO },

    // Lanches Artesanais
    { nome: "Kwid",                                   preco: "28.00", categoria: "Lanches Artesanais", opcionais: SO_PONTO },
    { nome: "Polo",                                   preco: "33.00", categoria: "Lanches Artesanais", opcionais: SO_PONTO },
    { nome: "BMW 320i",                               preco: "42.00", categoria: "Lanches Artesanais", opcionais: SO_PONTO },
    { nome: "Porsche Macan",                          preco: "40.00", categoria: "Lanches Artesanais", opcionais: SO_PONTO },
    { nome: "Mercedes GLA 200",                       preco: "40.00", categoria: "Lanches Artesanais", opcionais: SO_PONTO },
    { nome: "BYD Song",                               preco: "30.00", categoria: "Lanches Artesanais", opcionais: SO_PONTO },

    // Acompanhamentos
    { nome: "Arroz",                                  preco: "10.00", categoria: "Acompanhamentos" },
    { nome: "Feijão",                                 preco: "12.00", categoria: "Acompanhamentos" },
    { nome: "Ovo",                                    preco: "3.00",  categoria: "Acompanhamentos" },
    { nome: "Vinagrete",                              preco: "5.00",  categoria: "Acompanhamentos" },
    { nome: "Purê de Batata",                         preco: "8.00",  categoria: "Acompanhamentos" },
    { nome: "Hambúrguer",                             preco: "8.00",  categoria: "Acompanhamentos" },
    { nome: "Salada",                                 preco: "8.00",  categoria: "Acompanhamentos" },
    { nome: "Fritas",                                 preco: "8.00",  categoria: "Acompanhamentos" },

    // Lanches Tradicionais 90g
    { nome: "X-Burguer",                              preco: "18.00", categoria: "Lanches Tradicionais" },
    { nome: "X-Salada",                               preco: "25.00", categoria: "Lanches Tradicionais" },
    { nome: "X-Bacon",                                preco: "29.00", categoria: "Lanches Tradicionais" },
    { nome: "X-Calabresa",                            preco: "29.00", categoria: "Lanches Tradicionais" },
    { nome: "X-Egg",                                  preco: "27.00", categoria: "Lanches Tradicionais" },
    { nome: "X-Tudo",                                 preco: "32.00", categoria: "Lanches Tradicionais" },

    // Lanches na Baguete
    { nome: "Baguete Calabresa",                      preco: "50.00", categoria: "Lanches na Baguete" },
    { nome: "Baguete Frango",                         preco: "50.00", categoria: "Lanches na Baguete" },
    { nome: "Baguete Contra Filé",                    preco: "60.00", categoria: "Lanches na Baguete" },


    // Porções — P (pequena)
    { nome: "Batata Frita (P)",                       preco: "20.00", categoria: "Porções" },
    { nome: "Batata Frita Cheddar & Bacon (P)",       preco: "30.00", categoria: "Porções" },
    { nome: "Calabresa Acebolada (P)",                preco: "35.00", categoria: "Porções" },
    { nome: "Frango à Passarinho (P)",                preco: "35.00", categoria: "Porções" },
    { nome: "Contra Filé Acebolado (P)",              preco: "60.00", categoria: "Porções" },
    { nome: "Mandioca Frita (P)",                     preco: "35.00", categoria: "Porções" },
    { nome: "Carne Seca com Mandioca (P)",            preco: "60.00", categoria: "Porções" },
    { nome: "Batata Frita com Cheddar, Bacon e Calabresa (P)", preco: "40.00", categoria: "Porções" },
    { nome: "Frango à Passarinho com Batata Frita (P)", preco: "40.00", categoria: "Porções" },

    // Porções — M (média)
    { nome: "Batata Frita (M)",                       preco: "25.00", categoria: "Porções" },
    { nome: "Batata Frita Cheddar & Bacon (M)",       preco: "35.00", categoria: "Porções" },
    { nome: "Calabresa Acebolada (M)",                preco: "48.00", categoria: "Porções" },
    { nome: "Frango à Passarinho (M)",                preco: "48.00", categoria: "Porções" },
    { nome: "Contra Filé Acebolado (M)",              preco: "85.00", categoria: "Porções" },
    { nome: "Mandioca Frita (M)",                     preco: "48.00", categoria: "Porções" },
    { nome: "Carne Seca com Mandioca (M)",            preco: "85.00", categoria: "Porções" },
    { nome: "Batata Frita com Cheddar, Bacon e Calabresa (M)", preco: "55.00", categoria: "Porções" },
    { nome: "Frango à Passarinho com Batata Frita (M)", preco: "55.00", categoria: "Porções" },

    // Sucos 330ml
    { nome: "Suco de Laranja Natural",                preco: "10.00", categoria: "Sucos" },
    { nome: "Suco de Limão Natural",                  preco: "10.00", categoria: "Sucos" },
    { nome: "Suco de Abacaxi com Hortelã",            preco: "10.00", categoria: "Sucos" },
    { nome: "Suco de Maracujá",                       preco: "10.00", categoria: "Sucos" },
    { nome: "Suco de Morango",                        preco: "10.00", categoria: "Sucos" },

    // Refrigerantes
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

    // Cervejas
    { nome: "Heineken Lata 350ml",                    preco: "10.00",  categoria: "Cervejas" },
    { nome: "Skol Lata 350ml",                        preco: "7.00",   categoria: "Cervejas" },
    { nome: "Brahma Duplo Malte 350ml",               preco: "8.00",   categoria: "Cervejas" },
    { nome: "Império Puro Malte 350ml",               preco: "7.00",   categoria: "Cervejas" },
    { nome: "Original Lata 350ml",                    preco: "7.00",   categoria: "Cervejas" },
    { nome: "Heineken Long Neck",                     preco: "13.00",  categoria: "Cervejas" },
    { nome: "Heineken Long Neck sem Álcool",          preco: "13.00",  categoria: "Cervejas" },
    { nome: "Corona Long Neck 330ml",                 preco: "14.00",  categoria: "Cervejas" },
    { nome: "Heineken 600ml",                         preco: "19.00",  categoria: "Cervejas" },
    { nome: "Original 600ml",                         preco: "17.00",  categoria: "Cervejas" },
    { nome: "Balde 6x Heineken 600ml",                preco: "108.00", categoria: "Cervejas" },
    { nome: "Balde 6x Original 600ml",                preco: "96.00",  categoria: "Cervejas" },

    // Sobremesas
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
      const { opcionais, ...base } = produto;
      const data = opcionais ? { ...base, opcionais } : base;
      const atualizado = await prisma.product.updateMany({
        where: { nome: produto.nome },
        data,
      });
      if (atualizado.count === 0) {
        await prisma.product.create({ data });
      }
    })
  );

  console.log(`✓ ${produtos.length} produtos sincronizados.`);

  // ── Usuários ───────────────────────────────────────────────────────────────
  const usuarios = [
    { nome: "Admin",       email: "admin",       senha: "admin123",  role: "ADMIN" },
    { nome: "Caixa",       email: "caixa",       senha: "caixa123",  role: "CAIXA" },
    { nome: "Treinamento", email: "treinamento", senha: "treino123", role: "CAIXA" },
  ] as const;

  for (const u of usuarios) {
    const senhaHash = await bcrypt.hash(u.senha, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { nome: u.nome, role: u.role },
      create: { nome: u.nome, email: u.email, senhaHash, role: u.role },
    });
  }

  console.log(`✓ ${usuarios.length} usuários sincronizados.`);
  console.log(`✓ ${mesas.length} mesas sincronizadas.`);

  // ── Caixas (funcionárias autorizadas a abrir mesa) ─────────────────────────
  const caixasAutorizadas = [
    "Ana Júlia",
    "Ednalva",
    "Jamille",
    "Jhenifer",
    "Kamila",
    "Larissa",
    "Mill",
  ];

  await Promise.all(
    caixasAutorizadas.map((nome) =>
      prisma.caixa.upsert({
        where: { nome },
        update: { ativo: true },
        create: { nome },
      })
    )
  );

  console.log(`✓ ${caixasAutorizadas.length} caixas sincronizadas.`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error("Erro ao executar seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
