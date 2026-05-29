---
status: approved
domain: governance
created: 2026-05-24
updated: 2026-05-24
owner: willians
---

# system-rules — vilamill-sistema

## proposito

define as regras operacionais, padrões de nomenclatura e protocolos para o desenvolvimento do vilamill-sistema (Villa Mill Tamboré — Sistema de PDV e Gestão).

essas regras existem para:
- preservar consistência arquitetural
- reduzir regressões entre sessões de desenvolvimento
- padronizar comportamento do Claude e outros agentes
- manter continuidade operacional entre sessões

---

# tech-stack

| camada | tecnologia |
|---|---|
| framework | Next.js 15 (App Router) |
| linguagem | TypeScript 5 |
| frontend | React 19, Tailwind CSS 4 |
| banco de dados | PostgreSQL 16 (Docker) |
| orm | Prisma 6.4 (com migrations) |
| autenticação | NextAuth v5 (Auth.js beta) |
| data fetching | SWR 2.4 (polling 3s nas telas operacionais) |
| infra | Docker Compose (dev + prod) |
| deploy | Hostinger VPS |

> ATENÇÃO: Next.js 15 tem breaking changes em relação a versões anteriores.
> Antes de modificar qualquer código Next.js, ler AGENTS.md na raiz.

---

# naming-convention

## arquivos e pastas (App Router)

- pastas de rotas: kebab-case (Next.js App Router)
- arquivos de componente: PascalCase com extensão .tsx
- hooks: camelCase com prefixo `use`, extensão .ts
- server actions / api routes: camelCase, extensão .ts
- types: kebab-case ou PascalCase por domínio

correto:
```
mesas/page.tsx
cardapio/page.tsx
useAppData.ts
useMesas.ts
prisma.ts
```

incorreto:
```
Mesas/page.tsx
use_mesas.ts
claude-types.ts
```

---

## banco de dados (Prisma)

- modelos: PascalCase singular (conforme Prisma schema)
- tabelas geradas: snake_case plural (Prisma padrão)
- colunas: camelCase no schema, snake_case no banco
- migrations: prefixo de timestamp automático do Prisma

correto (schema.prisma):
```
model Mesa { ... }
model Pedido { ... }
model ItemPedido { ... }
```

---

# metadata-standard

todo documento em `docs/` deve começar com frontmatter yaml:

```yaml
---
status:
domain:
created:
updated:
owner:
---
```

---

# metadata-fields

## status

define maturidade operacional do artefato ou feature.

valores permitidos:

```
draft          → em desenvolvimento, instável, não usar como referência
experimental   → funcional mas não validado em uso real
validating     → em uso real, feedback sendo coletado
approved       → validado, comportamento protegido contra mudanças casuais
stable         → invariante do sistema, mudanças exigem justificativa arquitetural
deprecated     → substituído, mantido apenas por referência histórica
archived       → congelado, sem manutenção ativa
```

## domain

define o domínio funcional do artefato.

domínios do vilamill-sistema:

```
governance      → regras e protocolos do projeto
auth            → autenticação (NextAuth), roles, middleware, alterar senha
mesas           → abertura, pedidos, fechamento de mesas (PDV)
cardapio        → produtos, preços, categorias, fichas técnicas
estoque         → insumos, entradas/saídas, alertas de mínimo
financeiro      → relatórios, despesas, cancelamentos
pagamentos      → métodos de pagamento, split payment, desconto com autorização
parceiros       → caixinha, crédito/consumo de funcionários externos
infra           → docker, prisma, deploy, banco de dados
```

## created / updated

formato: `yyyy-mm-dd`

## owner

responsável principal: `willians`

---

# operational-principles

## arquitetura-acima-da-memoria

decisões arquiteturais importantes nunca devem existir apenas em conversa.

todo padrão validado deve ser documentado em `docs/`.

## dominio-acima-da-autoria

organização do conhecimento deve priorizar domínio funcional, não a IA que gerou o conteúdo.

## contexto-explicito

o Claude e outros agentes performam melhor com regras explícitas.

decisões importantes devem virar contexto persistente em `docs/`.

## comportamentos-aprovados-protegidos

features e fluxos em status `approved` ou `stable` não devem ser alterados casualmente.

o fluxo de mesas (abertura → pedido → fechamento/pagamento) é um fluxo `stable` — qualquer alteração exige justificativa documentada.

---

# estrutura-de-pastas

```
vilamill-sistema/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── change-password/  → POST — altera senha do admin (role ADMIN)
│   │   │   │   └── verify-password/  → POST — verifica senha do admin (autoriza desconto)
│   │   │   └── parceiros/
│   │   │       ├── funcionarios/[id] → DELETE soft delete (ativo=false, ADMIN)
│   │   │       ├── credito/          → POST crédito individual ou coletivo
│   │   │       └── consumo/          → POST consumo, valida saldo do pool
│   │   ├── alterar-senha/  → página de troca de senha (ADMIN only)
│   │   ├── mesas/          → PDV — gestão de mesas
│   │   ├── cardapio/       → gestão do cardápio
│   │   ├── estoque/        → controle de estoque
│   │   ├── financeiro/     → relatórios financeiros
│   │   └── login/          → autenticação
│   ├── components/
│   │   └── ui/             → componentes reutilizáveis
│   ├── hooks/              → lógica de estado e SWR
│   ├── services/           → prisma.ts (singleton)
│   ├── types/              → interfaces TypeScript
│   ├── lib/                → utilitários
│   └── middleware.ts       → proteção de rotas (NextAuth)
├── prisma/
│   ├── schema.prisma       → definição do banco
│   ├── migrations/         → histórico de migrações SQL
│   └── seed.ts             → dados iniciais
├── docs/
│   ├── 00-governance/      → este diretório
│   └── *.html              → manuais gerados
├── CLAUDE.md               → bootstrap de contexto para IA
├── AGENTS.md               → avisos de breaking changes Next.js 15
├── STATUS.md               → status atual do projeto
└── docker-compose.yml
```

---

# regras-anti-regressao

antes de modificar qualquer componente ou rota existente, o Claude deve:
1. ler o arquivo atual completo
2. verificar se o fluxo está sendo usado por outras páginas ou hooks
3. não alterar o schema do Prisma sem criar migration documentada
4. respeitar o comportamento de SWR polling (não remover sem aprovação)
5. não alterar o fluxo de pagamento (incluindo split payment) sem aprovação explícita
6. verificar `AGENTS.md` antes de usar qualquer API do Next.js

---

# historico-de-versao

| versão | data | descrição |
|---|---|---|
| v1.0 | 2026-05-24 | criação inicial — adaptado de 00-governance do workspace |
| v1.1 | 2026-05-29 | adiciona domínios `parceiros` e `auth` expandido; rotas `/api/admin/*`; página `/alterar-senha`; regra de desconto com autorização admin |
| v1.2 | 2026-05-29 | exclusão de parceiro (soft delete); favicon gerado do logo; detalha rotas `/api/parceiros/*` na estrutura |
