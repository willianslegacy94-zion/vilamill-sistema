# Villa Mill Tambore - Sistema de PDV e Gestao

Sistema de PDV e gestão operacional do restaurante Villa Mill Tamboré. Roda em produção na Hostinger via Docker.

## Visão Geral

Plataforma construída com **Next.js 15 (App Router)**, **TypeScript** e **Tailwind CSS 4**, cobrindo os módulos principais do restaurante:

- **Mesas** — operação de salão, pedidos, fechamento de conta e modo treinamento
- **Estoque** — insumos, fichas técnicas e alertas de nível mínimo
- **Financeiro** — relatórios diários, despesas e indicadores
- **Cardápio** — CRUD de produtos com preço de custo e categoria

## Stack

| Item | Versão |
|------|--------|
| Next.js | 15 (App Router) |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| Prisma ORM | 6.4.1 |
| PostgreSQL | 16 (Docker) |
| NextAuth | v5 (Auth.js beta) |
| SWR | 2.4.1 |
| Lucide React | 1.14.0 |

## Estrutura de Pastas

```
src/
  app/
    api/           # Route Handlers (REST)
    dashboard/
    financeiro/
    estoque/
    mesas/
    cardapio/
    login/
  components/
    ui/            # Botão, inputs reutilizáveis
  hooks/           # useMesas, useAppData (SWR)
  services/        # prisma.ts (singleton PrismaClient)
prisma/
  schema.prisma
  migrations/      # histórico de migrations SQL
  seed.ts
```

## Como Executar Localmente

```bash
npm install --legacy-peer-deps
npm run dev
```

Acesse: `http://localhost:3000`

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia ambiente local |
| `npm run build` | Gera build de produção |
| `npm run start` | Executa build em produção |
| `npm run lint` | Analisa qualidade de código |
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run prisma:migrate:dev` | Cria e aplica migration (dev) |
| `npm run prisma:studio` | Abre o Prisma Studio |

## Variáveis de Ambiente

```env
DATABASE_URL=        # URL de conexão PostgreSQL
AUTH_SECRET=         # Segredo NextAuth
NEXTAUTH_URL=        # URL da aplicação
```

## Deploy (Produção)

O sistema roda na **Hostinger VPS** via Docker Compose. Para subir:

```bash
git pull
docker compose up --build -d
```

Para aplicar migrations pendentes no banco:

```bash
docker compose exec app npx prisma migrate deploy
```
