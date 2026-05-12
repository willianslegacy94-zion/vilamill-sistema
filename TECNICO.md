# Villa Mill Tamboré — Documentação Técnica

**Versão:** 1.0  
**Data:** Maio 2026  
**Desenvolvedor:** Willians (DataMeet)

---

## 1. Visão Geral da Arquitetura

O sistema é uma aplicação web full-stack construída com **Next.js 15 (App Router)**. O frontend e backend coexistem no mesmo repositório — as páginas são React Server Components e as APIs são Route Handlers dentro de `src/app/api/`.

```
Browser → Next.js (App Router)
              ├── Server Components (páginas, leitura de dados via Prisma)
              ├── Client Components (interatividade: mesas-grid, tabelas)
              ├── Route Handlers /api/** (mutações: POST/PATCH/DELETE)
              └── Middleware (auth guard + controle por role)
                       │
                  Prisma ORM
                       │
                 PostgreSQL (Docker / porta 5433)
```

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js | 15.5.15 |
| Linguagem | TypeScript | — |
| ORM | Prisma | 6.8.2 |
| Banco de dados | PostgreSQL | 16 (via Docker) |
| Autenticação | NextAuth v5 (Auth.js) | 5.x |
| Estilização | Tailwind CSS + shadcn/ui | — |
| Criptografia | bcryptjs | — |
| Datas | date-fns | — |
| Container | Docker + Docker Compose | — |
| Gerenciador de pacotes | Yarn | 1.22.x |

---

## 3. Estrutura de Arquivos

```
vilamill-sistema/
├── prisma/
│   ├── schema.prisma          # Definição do banco
│   ├── seed.ts                # Seed de dados iniciais
│   └── migrations/            # Histórico de migrações SQL
│       ├── 0_init/
│       ├── 20260511000000_add_cost_inventory_fields/
│       ├── 20260511000001_add_auth_cancel_discount/
│       └── 20260511000002_add_credito_debito_pagamento/
├── scripts/
│   └── dev.js                 # Orquestrador do ambiente de dev
├── src/
│   ├── auth.ts                # Configuração NextAuth (JWT, callbacks)
│   ├── middleware.ts           # Auth guard + controle de role + sandbox treinamento
│   ├── app/
│   │   ├── layout.tsx         # Layout raiz (Navbar + Providers)
│   │   ├── page.tsx           # Home (dashboard com cards de módulos)
│   │   ├── login/             # Tela de login
│   │   ├── mesas/             # Módulo de mesas e comanda
│   │   ├── produtos/          # Módulo de cardápio
│   │   ├── estoque/           # Módulo de estoque de insumos
│   │   ├── financeiro/        # Módulo financeiro (ADMIN only)
│   │   ├── comanda/           # Layout de impressão de comanda
│   │   └── api/               # Todas as rotas de API
│   ├── components/
│   │   ├── navbar.tsx         # Barra de navegação com controle por role
│   │   ├── session-provider.tsx
│   │   └── ui/                # Componentes shadcn/ui
│   └── services/
│       └── prisma.ts          # Singleton do Prisma Client
├── docker-compose.yml         # Postgres na porta 5433
├── .env                       # Variáveis de ambiente (não commitado)
├── .env.example               # Template das variáveis (commitado)
└── scripts/dev.js             # Startup automático do ambiente
```

---

## 4. Schema do Banco de Dados

### Modelos

**Table** — Mesas do restaurante
```
id, numero (único), status (LIVRE | OCUPADA | CONTA)
→ tem muitos Order
```

**Product** — Cardápio
```
id, nome, preco, costPrice, categoria, track_inventory, estoque
→ tem muitos OrderItem, RecipeItem
```

**Ingredient** — Insumos do estoque
```
id, nome, unidade (KG | UN | L), quantidadeAtual, nivelMinimoAlerta
→ tem muitos RecipeItem
```

**RecipeItem** — Ficha técnica (produto ↔ ingrediente)
```
id, productId, ingredientId, quantidade
Unique: (productId, ingredientId)
```

**Order** — Pedido/comanda ativa ou fechada
```
id, mesaId, paymentStatus (PENDENTE | PAGO), total, desconto,
closedAt, createdAt, formaPagamento (DINHEIRO | CARTAO | CREDITO | DEBITO | PIX)
→ pertence a Table, tem muitos OrderItem
```

**OrderItem** — Item da comanda
```
id, orderId, productId, quantidade, precoUnit, custoUnit, subtotal
Unique: (orderId, productId)
```

**CancelamentoLog** — Log de mesas canceladas
```
id, mesaNumero, motivoCancelamento, canceladoPor, canceladoEm
```

**User** — Usuários do sistema
```
id, nome, email (único), senhaHash, role (ADMIN | CAIXA)
```

### Diagrama de Relacionamentos

```
Table ──< Order ──< OrderItem >── Product ──< RecipeItem >── Ingredient
```

---

## 5. Rotas de API

### Pedidos
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/pedidos` | Abre pedido para uma mesa |
| DELETE | `/api/pedidos/:id` | Cancela pedido (registra log) |
| POST | `/api/pedidos/:id/items` | Adiciona item (grava custoUnit) |
| DELETE | `/api/pedidos/:id/items/:itemId` | Remove item |
| PATCH | `/api/pedidos/:id/fechar` | Fecha conta (status→CONTA, mesa→LIVRE) |
| PATCH | `/api/pedidos/:id/fechar-e-liberar` | Fecha e paga (status→PAGO, mesa→LIVRE) |

### Mesas
| Método | Rota | Descrição |
|---|---|---|
| PATCH | `/api/mesas/:id/liberar` | Libera mesa de emergência |

### Produtos
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/produtos` | Lista todos os produtos |
| POST | `/api/produtos` | Cria produto |
| PATCH | `/api/produtos/:id` | Edita produto |
| DELETE | `/api/produtos/:id` | Exclui produto |
| GET | `/api/produtos/:id/receita` | Lista ficha técnica |
| POST | `/api/produtos/:id/receita` | Adiciona ingrediente à ficha |
| DELETE | `/api/produtos/:id/receita/:itemId` | Remove ingrediente da ficha |

### Insumos
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/insumos` | Lista insumos |
| POST | `/api/insumos` | Cria insumo |
| PATCH | `/api/insumos/:id` | Edita ou registra movimentação (delta) |
| DELETE | `/api/insumos/:id` | Exclui insumo |

---

## 6. Autenticação e Controle de Acesso

### Estratégia
NextAuth v5 com **Credentials Provider** + **JWT**. A senha é armazenada como hash bcrypt (salt 10). O token JWT carrega `role` e `isTrainee`.

### Roles

| Role | Módulos acessíveis | Pode escrever |
|---|---|---|
| `ADMIN` | Tudo | Sim |
| `CAIXA` | Mesas, Cardápio, Estoque (entrada/saída) | Sim (exceto criar/editar/excluir insumos) |
| `CAIXA` + `isTrainee` | Mesas, Cardápio, Estoque (visual) | Não — middleware retorna `{ ok: true }` sem gravar |

### Middleware (`src/middleware.ts`)
Executa em todas as rotas exceto `/login`, `/api/auth`, assets estáticos.

1. Sem sessão → redireciona para `/login`
2. `isTrainee === true` + método não-GET em `/api/**` → retorna `{ ok: true }` sem processar
3. Role `CAIXA` + rota de página fora da lista permitida → redireciona para `/mesas`
4. Role `ADMIN` → sem restrição

### Proteção de página no servidor
`/financeiro/page.tsx` chama `await auth()` e faz `redirect("/")` se role ≠ ADMIN. Dupla proteção: middleware + servidor.

---

## 7. Lógica de Negócio Relevante

### CMV (Custo de Mercadoria Vendida)
- Cada `Product` tem `costPrice` (custo unitário de aquisição).
- Ao adicionar um item ao pedido (`POST /api/pedidos/:id/items`), `custoUnit` é gravado com o `costPrice` vigente — snapshot histórico, não é afetado por mudanças futuras no produto.
- O módulo Financeiro soma `custoUnit × quantidade` de todos os `OrderItem` do período.

### Deducão de Estoque
- Ativada apenas para produtos com `track_inventory = true` e **sem** RecipeItems vinculados.
- Ocorre nos endpoints `/fechar` e `/fechar-e-liberar`.
- A lógica de RecipeItem (ficha técnica → baixa em ingredientes) está implementada mas em standby (bloco comentado nos routes).

### Fuso Horário (SP — UTC-3)
- Meia-noite SP = `03:00:00 UTC`.
- O módulo financeiro usa `${dateStr}T03:00:00.000Z` como início e `+ 24h - 1ms` como fim de dia.

### Modo Treinamento
- Detectado via flag `isTrainee` no JWT (email `treinamento@villamill.com`).
- O middleware intercepta todos os `POST / PATCH / DELETE` para `/api/**` e retorna `{ ok: true, _treinamento: true }`.
- O frontend não percebe diferença (recebe sucesso), mas ao recarregar a página o dado original é restaurado.
- Banner amarelo fixo no topo da tela indica o modo ao usuário.

---

## 8. Ambiente de Desenvolvimento

### Pré-requisitos
- Node.js ≥ 20
- Docker Desktop rodando
- Yarn 1.22+

### Configuração inicial
```bash
git clone <repo>
cd vilamill-sistema
yarn install
cp .env.example .env   # editar se necessário
yarn dev               # inicia Docker + migrate + Next.js
```

### `.env` obrigatório
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/villamill"
DIRECT_URL="postgresql://postgres:postgres@localhost:5433/villamill"
AUTH_SECRET="dev-secret-mude-em-producao"
```

### Comandos úteis
```bash
yarn dev                    # Ambiente completo (Docker + DB + Next.js)
yarn prisma studio          # Interface visual do banco (porta 5555)
yarn prisma migrate deploy  # Aplica migrações pendentes
yarn prisma db seed         # Recria dados iniciais
yarn prisma generate        # Regenera o client após mudanças no schema
```

### Conflito de porta (Docker)
O projeto usa a porta **5433** para o PostgreSQL (não 5432) para evitar conflito com outros containers. Se houver outro projeto usando 5433, alterar em:
- `docker-compose.yml` → `ports: "5433:5432"`
- `.env` → `localhost:5433`
- `scripts/dev.js` → `const DB_PORT = 5433`

---

## 9. Histórico de Migrações

| Arquivo | O que faz |
|---|---|
| `0_init` | Criação das tabelas base (Table, Product, Order, OrderItem, User, Ingredient, RecipeItem) |
| `20260511000000_add_cost_inventory_fields` | Adiciona `costPrice`, `track_inventory`, `estoque` em Product; `custoUnit` em OrderItem |
| `20260511000001_add_auth_cancel_discount` | Adiciona `email`, `senhaHash` em User; `desconto` em Order; cria CancelamentoLog |
| `20260511000002_add_credito_debito_pagamento` | Adiciona valores `CREDITO` e `DEBITO` ao enum `FormaPagamento` |

---

## 10. Usuários do Sistema

| Nome | Email | Senha | Role |
|---|---|---|---|
| Admin | admin@villamill.com | admin123 | ADMIN |
| Caixa | caixa@villamill.com | caixa123 | CAIXA |
| Treinamento | treinamento@villamill.com | treino123 | CAIXA (sandbox) |

> **Alterar senhas em produção** via Prisma Studio ou script com `bcrypt.hash()`.

---

## 11. Cenários de Suporte

### "O sistema não abre / erro de conexão com banco"
1. Verificar se Docker Desktop está rodando.
2. Verificar se o container `vilamill-db` está ativo: `docker ps`.
3. Testar conexão: `yarn prisma db pull`.
4. Se porta 5433 em uso por outro processo: `netstat -ano | findstr :5433`.

### "Erro ao fazer login (invalid credentials)"
1. Confirmar email e senha no banco via Prisma Studio → tabela `User`.
2. Se senha esquecida, rodar script de reset:
```js
const hash = await bcrypt.hash("nova-senha", 10);
await prisma.user.update({ where: { email: "..." }, data: { senhaHash: hash } });
```

### "Produto aparece duplicado após seed"
O seed usa `updateMany` + `create` baseado no nome. Se o nome mudar, um novo produto é criado. Resolver via Prisma Studio excluindo o duplicado.

### "Comanda sumiu da mesa / mesa não fecha"
- Verificar no banco se existe `Order` com `paymentStatus: PENDENTE` para a mesa.
- Se mesa travada: usar "Liberar Mesa (emergência)" na UI ou `PATCH /api/mesas/:id/liberar`.

### "Migrações falham ao subir"
- Verificar se as migrações já foram aplicadas: `yarn prisma migrate status`.
- Se houver divergência entre schema e banco: `yarn prisma migrate resolve`.

### "yarn dev trava na geração do Prisma (EPERM)"
Ocorre quando o servidor Next.js está rodando e trava o arquivo `.dll.node`. Solução: encerrar todos os processos Node antes de rodar `prisma generate`.
```powershell
Get-Process node | Stop-Process -Force
yarn prisma generate
yarn dev
```

### "Usuário de treinamento está salvando dados reais"
Verificar se o email do usuário é exatamente `treinamento@villamill.com` no banco. A flag `isTrainee` é definida por comparação de email no `auth.ts`.

---

## 12. Pendências / Próximas Evoluções

- [ ] Relatório por produto (ranking de vendas)
- [ ] Ativação da lógica de RecipeItem para baixa automática de ingredientes por ficha técnica
- [ ] Gestão de usuários pela interface (criar/editar/excluir sem precisar do Prisma Studio)
- [ ] Deploy em produção (Vercel + Supabase recomendado)
- [ ] Impressão de comanda via impressora térmica (layout `/comanda/[id]` já existe)
