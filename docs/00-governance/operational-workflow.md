---
status: approved
domain: governance
created: 2026-05-24
updated: 2026-05-24
owner: willians
---

# operational-workflow — vilamill-sistema

## proposito

define o modo de trabalho padrão para desenvolvimento do vilamill-sistema (Villa Mill Tamboré).

aplica-se a qualquer sessão com o Claude ou outro agente de IA.

---

# fase-1-inicio-de-sessao

## antes-de-qualquer-codigo

ler na seguinte ordem:

```
1. AGENTS.md                                  → breaking changes do Next.js 15
2. docs/00-governance/ai-collaboration-protocol.md
3. STATUS.md → última entrada ou seção relevante
```

objetivo: retomar contexto exatamente de onde parou, sem repetir trabalho já feito.

---

# fase-2-planejamento

## 1. analise-o-estado-atual

responder antes de codar:
- o que está funcionando em produção?
- o que está em desenvolvimento?
- qual o próximo passo documentado em STATUS.md?

## 2. defina-o-escopo

deixe claro para o Claude:
- qual domínio será modificado (mesas, cardápio, estoque, financeiro)
- qual arquivo(s) será(ão) modificado(s)
- qual comportamento esperado após a mudança
- a mudança afeta o schema do Prisma?

## 3. identifique-dependencias

antes de modificar qualquer arquivo:
- quais hooks usam o mesmo endpoint SWR?
- quais SWR keys precisam ser invalidadas via mutate()?
- a mudança afeta o schema? Precisa de migration?
- o middleware de autenticação precisa ser atualizado?

---

# fase-3-execucao

## 4. mudancas-no-schema-prisma

se a mudança afeta o banco:

1. modificar `prisma/schema.prisma`
2. criar migration:
   ```bash
   npx prisma migrate dev --name descricao-da-mudanca
   ```
3. verificar migration gerada em `prisma/migrations/`
4. atualizar seed se necessário (`prisma/seed.ts`)

**regra:** nunca usar `prisma db push` em produção.

## 5. execute-por-camada

ordem recomendada para mudanças full-stack:
1. schema + migration (Prisma)
2. API Route Handler (`src/app/api/`)
3. hook SWR (`src/hooks/`)
4. componente de página (`src/app/[domínio]/page.tsx`)
5. validar no navegador

## 6. next-js-15

antes de usar qualquer API do Next.js, verificar `AGENTS.md`.

APIs críticas que mudaram:
- params e searchParams agora são Promises em Server Components
- fetch com cache funciona diferente
- Server Actions têm nova semântica

---

# fase-4-validacao

## 7. validacao-de-funcionalidade

após cada mudança, validar:
- fluxo completo de mesa funciona? (abrir → adicionar itens → fechar → pagar)
- SWR polling atualizando dados corretamente (sem flicker)?
- split payment calculando corretamente?
- estoque sendo deduzido ao fechar conta?
- middleware bloqueando rotas não autenticadas?

## 8. validacao-do-willians

Willians valida o comportamento no ambiente Docker:
- `docker compose up -d`
- acesso via http://localhost:3000 (dev) ou http://localhost (prod)
- teste com usuário admin@villamill.com (admin) ou emilly@villamill.com (caixa)

---

# fase-5-documentacao-e-handoff

## 9. atualizar-status

ao final de cada sessão de trabalho, atualizar `STATUS.md` com:

```markdown
## [DATA] — [resumo do que foi feito]

**Implementado:**
- feature 1 (domínio: mesas)
- feature 2 (domínio: financeiro)

**Decisões:**
- decisão e motivo

**Pendente:**
- próximo item
```

regra: entradas são acumuladas em ordem cronológica — a entrada mais recente sempre no final.

## 10. proxima-sessao

para retomar, dizer ao Claude:

```
Antes de começar, leia:
1. AGENTS.md
2. docs/00-governance/ai-collaboration-protocol.md
3. STATUS.md → últimas entradas
```

---

# arquivos-operacionais

```
vilamill-sistema/
├── docs/
│   ├── 00-governance/
│   │   ├── system-rules.md              → regras do projeto
│   │   ├── ai-collaboration-protocol.md → protocolo do Claude
│   │   └── operational-workflow.md      → este arquivo
│   └── *.html                           → manuais gerados
├── CLAUDE.md       → bootstrap de contexto para IA
├── AGENTS.md       → avisos de breaking changes Next.js 15
├── STATUS.md       → estado atual e handoff entre sessões
├── TECNICO.md      → documentação técnica
└── prisma/
    └── schema.prisma → fonte de verdade do banco
```

---

# usuarios-e-acessos

| nome | email | senha | role | acesso |
|---|---|---|---|---|
| Admin | admin@villamill.com | admin123 | ADMIN | tudo |
| Emilly | emilly@villamill.com | emilly123 | CAIXA | mesas + cardápio |
| Melissa | melissa@villamill.com | melissa123 | CAIXA | mesas + cardápio |

---

# ambiente-de-desenvolvimento

```bash
# subir ambiente completo
docker compose up -d

# rodar dev local (sem Docker)
npm run dev

# criar migration
npx prisma migrate dev --name nome-da-mudanca

# aplicar migrations em produção
docker compose exec app npx prisma migrate deploy

# abrir Prisma Studio (inspeção do banco)
npx prisma studio

# ver logs
docker compose logs -f app
```

---

# deploy-producao

```bash
# Hostinger VPS — via Docker Compose
docker compose -f docker-compose.yml up -d --build

# aplicar migrations após deploy
docker compose exec app npx prisma migrate deploy
```

---

# historico-de-versao

| versão | data | descrição |
|---|---|---|
| v1.0 | 2026-05-24 | criação inicial — adaptado de 00-governance do workspace |
