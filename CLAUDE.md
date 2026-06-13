@AGENTS.md

# vilamill-sistema — Bootstrap de Contexto para o Claude

## O que é este sistema

Sistema de PDV e Gestão para o **Villa Mill Tamboré** (restaurante/bar).

Permite gerenciar mesas em tempo real, registrar pedidos, controlar estoque, fechar contas com split payment e gerar relatórios financeiros.

**Stack:** Next.js 15 (App Router) + TypeScript + React 19 + Prisma + PostgreSQL 16 + NextAuth v5 + SWR + Docker Compose

> Next.js 15 tem breaking changes — ler AGENTS.md antes de usar qualquer API do Next.js.

---

## Leia antes de codar

Ao iniciar qualquer sessão de desenvolvimento:

```
1. AGENTS.md                                             → breaking changes Next.js 15
2. docs/00-governance/ai-collaboration-protocol.md       → como colaborar neste projeto
3. docs/00-governance/system-rules.md                    → regras de nomenclatura e domínios
4. STATUS.md → última entrada                            → onde paramos
```

---

## Estrutura rápida

```
src/app/api/          → Route Handlers (REST endpoints)
src/app/mesas/        → PDV — gestão de mesas (fluxo principal)
src/app/cardapio/     → produtos, preços, fichas técnicas
src/app/estoque/      → insumos e controle de estoque
src/app/financeiro/   → relatórios, despesas, cancelamentos
src/hooks/            → SWR hooks (polling 3s nas telas operacionais)
src/services/prisma.ts → singleton do Prisma Client
prisma/schema.prisma  → fonte de verdade do banco
prisma/migrations/    → histórico de migrações SQL
```

---

## Fluxos protegidos (não alterar sem aprovação)

- Fluxo de mesa: abertura → pedidos → fechamento com pagamento
- Split payment (campo `pagamentos` JSONB)
- Dedução de estoque via fichas técnicas ao fechar conta
- SWR polling de 3s nas telas operacionais (não remover refreshInterval)
- Middleware NextAuth protegendo todas as rotas

---

## Ambiente

```bash
docker compose up -d    # sobe tudo
npm run dev             # dev local sem Docker
npx prisma studio       # inspeção do banco

# usuários:
# admin@villamill.com / admin123    → admin
# emilly@villamill.com / emilly123  → caixa
```

---

## Regra sobre migrations

Qualquer mudança no schema.prisma **deve** criar uma migration:
```bash
npx prisma migrate dev --name descricao-da-mudanca
```
Nunca usar `prisma db push` em produção.

---

Ver [Workflow completo](docs/00-governance/operational-workflow.md) · [Regras do projeto](docs/00-governance/system-rules.md)
