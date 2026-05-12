# Villa Mill Tamboré — Documentação Técnica

**Versão:** 1.1  
**Data:** Maio 2026  
**Desenvolvedor:** Willians de Oliveira Santana  
**Suporte:** willians.legacy94@gmail.com

---

## 1. Visão Geral da Arquitetura

O sistema é uma aplicação web full-stack construída com **Next.js 15 (App Router)**. O frontend e backend coexistem no mesmo repositório — as páginas são React Server Components e as APIs são Route Handlers dentro de `src/app/api/`.

```
Browser → Nginx (proxy reverso — porta 80/443)
               │
          Next.js (App Router — porta 3000)
              ├── Server Components (páginas, leitura de dados via Prisma)
              ├── Client Components (interatividade: mesas-grid, tabelas)
              ├── Route Handlers /api/** (mutações: POST/PATCH/DELETE)
              └── Middleware (auth guard + controle por role)
                       │
                  Prisma ORM
                       │
                 PostgreSQL 16 (container Docker — porta 5432)
```

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js | 15.5.15 |
| Linguagem | TypeScript | — |
| ORM | Prisma | 6.19.3 |
| Banco de dados | PostgreSQL | 16 (via Docker) |
| Autenticação | NextAuth v5 (Auth.js) | 5.x |
| Estilização | Tailwind CSS + shadcn/ui | — |
| Criptografia | bcryptjs | — |
| Datas | date-fns | — |
| Container | Docker + Docker Compose | — |
| Proxy reverso | Nginx | 1.24 |
| SSL | Let's Encrypt (Certbot) | auto-renovação |
| Gerenciador de pacotes | npm (produção) / Yarn (dev local) | — |

---

## 3. Infraestrutura de Produção

| Item | Valor |
|---|---|
| VPS | Hostinger Ubuntu 24.04 |
| IP | 2.24.93.178 |
| Domínio | villamill.online / www.villamill.online |
| SSL | /etc/letsencrypt/live/villamill.online/ (expira 2026-08-10, auto-renova) |
| Nginx config | /etc/nginx/sites-enabled/villamill |
| Repositório | /var/www/vilamill-sistema |
| Docker | db (postgres:16) + app (Next.js) |

---

## 4. Estrutura de Arquivos

```
vilamill-sistema/
├── prisma/
│   ├── schema.prisma          # Definição do banco
│   ├── seed.ts                # Seed de dados iniciais (usuários, produtos, mesas)
│   └── migrations/            # Histórico de migrações SQL
├── scripts/
│   └── dev.js                 # Orquestrador do ambiente de dev local
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
├── docker-compose.yml         # Serviços db + app
├── Dockerfile                 # Build multi-stage (deps → builder → runner)
├── .env                       # Variáveis de ambiente (não commitado)
├── .env.example               # Template das variáveis (commitado)
└── entrypoint.sh              # (removido — migrations rodadas manualmente)
```

---

## 5. Schema do Banco de Dados

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

## 6. Rotas de API

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

## 7. Autenticação e Controle de Acesso

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

## 8. Lógica de Negócio Relevante

### CMV (Custo de Mercadoria Vendida)
- Cada `Product` tem `costPrice` (custo unitário de aquisição).
- Ao adicionar um item ao pedido (`POST /api/pedidos/:id/items`), `custoUnit` é gravado com o `costPrice` vigente — snapshot histórico, não é afetado por mudanças futuras no produto.
- O módulo Financeiro soma `custoUnit × quantidade` de todos os `OrderItem` do período.

### Dedução de Estoque
- Ativada apenas para produtos com `track_inventory = true` e **sem** RecipeItems vinculados.
- Ocorre nos endpoints `/fechar` e `/fechar-e-liberar`.
- A lógica de RecipeItem (ficha técnica → baixa em ingredientes) está implementada mas em standby.

### Fuso Horário (SP — UTC-3)
- Meia-noite SP = `03:00:00 UTC`.
- O módulo financeiro usa `${dateStr}T03:00:00.000Z` como início e `+ 24h - 1ms` como fim de dia.

### Modo Treinamento
- Detectado via flag `isTrainee` no JWT (email `treinamento@villamill.com`).
- O middleware intercepta todos os `POST / PATCH / DELETE` para `/api/**` e retorna `{ ok: true, _treinamento: true }`.
- O frontend não percebe diferença (recebe sucesso), mas ao recarregar a página o dado original é restaurado.
- Banner amarelo fixo no topo da tela indica o modo ao usuário.

---

## 9. Ambiente de Desenvolvimento Local

### Pré-requisitos
- Node.js ≥ 20
- Docker Desktop rodando
- Yarn 1.22+

### Configuração inicial
```bash
git clone <repo>
cd vilamill-sistema
yarn install
cp .env.example .env   # ajustar se necessário
yarn dev               # inicia Docker + migrate + Next.js
```

### `.env` para desenvolvimento local
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/villamill"
AUTH_SECRET="dev-secret-mude-em-producao"
AUTH_TRUST_HOST=true
```

### Comandos úteis (dev)
```bash
yarn dev                    # Ambiente completo (Docker + DB + Next.js)
yarn prisma studio          # Interface visual do banco (porta 5555)
yarn prisma migrate deploy  # Aplica migrações pendentes
yarn prisma db seed         # Recria dados iniciais (usuários, produtos, mesas)
yarn prisma generate        # Regenera o client após mudanças no schema
```

---

## 10. Deploy em Produção (VPS)

### `.env` de produção (`/var/www/vilamill-sistema/.env`)
```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/villamill"
AUTH_SECRET="villa-mill-secret-producao-2026"
AUTH_URL="https://villamill.online"
AUTH_TRUST_HOST=true
```

> **Nota:** O host é `db` (nome do serviço Docker Compose), não `localhost`.

### Atualizar o sistema após um push
```bash
cd /var/www/vilamill-sistema
git pull origin main
docker compose up -d --build
```

### Aplicar migrações no banco de produção
```bash
docker compose exec app npx prisma@6.4.1 migrate deploy
```

> Use sempre `npx prisma@6.4.1` (versão explícita) para evitar que o `npx` baixe o Prisma 7.

### Popular o banco (seed) — rodar apenas uma vez
```bash
docker compose exec app npx prisma@6.4.1 db seed
```

### Comandos úteis (produção)
```bash
docker compose ps                        # Status dos containers
docker compose logs -f app               # Logs em tempo real
docker compose down                      # Para os containers
docker compose up -d --build             # Rebuilda e sobe
docker compose exec app npx prisma@6.4.1 migrate status  # Status das migrações
```

### Nginx
```bash
sudo nginx -t                            # Testa configuração
sudo systemctl restart nginx             # Reinicia
sudo systemctl status nginx              # Status
```

### SSL (Let's Encrypt)
- Certificado em: `/etc/letsencrypt/live/villamill.online/`
- Expira em: **2026-08-10** (renovação automática via systemd timer)
- Renovar manualmente se necessário: `sudo certbot renew`

---

## 11. Histórico de Migrações

| Arquivo | O que faz |
|---|---|
| `20260429231207_init` | Criação das tabelas base (Table, Product, Order, OrderItem, User, Ingredient, RecipeItem) |
| `20260429234601_add_order_timestamps` | Adiciona timestamps `createdAt` e `closedAt` em Order |
| `20260430002057_add_payment_method` | Adiciona campo `formaPagamento` e enum `FormaPagamento` em Order |
| `20260511000000_add_cost_inventory_fields` | Adiciona `costPrice`, `track_inventory`, `estoque` em Product; `custoUnit` em OrderItem |
| `20260511000001_add_auth_cancel_discount` | Adiciona `email`, `senhaHash` em User; `desconto` em Order; cria CancelamentoLog |
| `20260511000002_add_credito_debito_pagamento` | Adiciona valores `CREDITO` e `DEBITO` ao enum `FormaPagamento` |

---

## 12. Usuários do Sistema

| Nome | Email | Senha | Role |
|---|---|---|---|
| Admin | admin@villamill.com | admin123 | ADMIN |
| Caixa | caixa@villamill.com | caixa123 | CAIXA |
| Treinamento | treinamento@villamill.com | treino123 | CAIXA (sandbox) |

> **Importante:** Alterar a senha do Admin em produção. Faça via Prisma Studio ou script com `bcrypt.hash()`.

---

## 13. Cenários de Suporte

### "O sistema não abre / erro de conexão com banco"
```bash
docker compose ps                  # Verificar se containers estão rodando
docker compose logs --tail=30 app  # Ver erro no app
docker compose logs --tail=30 db   # Ver erro no banco
docker compose restart             # Reiniciar tudo
```

### "Erro ao fazer login (invalid credentials)"
1. Confirmar email e senha no banco via Prisma Studio → tabela `User`.
2. Se usuários não existem: rodar o seed com `docker compose exec app npx prisma@6.4.1 db seed`.
3. Se senha esquecida, rodar script de reset:
```js
const hash = await bcrypt.hash("nova-senha", 10);
await prisma.user.update({ where: { email: "..." }, data: { senhaHash: hash } });
```

### "Comanda sumiu da mesa / mesa não fecha"
- Verificar no banco se existe `Order` com `paymentStatus: PENDENTE` para a mesa.
- Se mesa travada: usar **Liberar Mesa (emergência)** na UI ou `PATCH /api/mesas/:id/liberar`.

### "Migrações falham ao subir"
```bash
docker compose exec app npx prisma@6.4.1 migrate status
docker compose exec app npx prisma@6.4.1 migrate resolve
```

### "Usuário de treinamento está salvando dados reais"
Verificar se o email do usuário é exatamente `treinamento@villamill.com` no banco. A flag `isTrainee` é definida por comparação de email no `auth.ts`.

### "Produto aparece duplicado após seed"
O seed usa `updateMany` + `create` baseado no nome. Se o nome mudar, um novo produto é criado. Resolver via Prisma Studio excluindo o duplicado.

---

## 14. Pendências / Próximas Evoluções

- [ ] Rodar seed no banco de produção (`npx prisma@6.4.1 db seed`)
- [ ] Alterar senha do Admin em produção
- [ ] Relatório por produto (ranking de vendas)
- [ ] Ativação da lógica de RecipeItem para baixa automática de ingredientes por ficha técnica
- [ ] Gestão de usuários pela interface (criar/editar/excluir sem precisar do Prisma Studio)
- [ ] Impressão de comanda via impressora térmica (layout `/comanda/[id]` já existe)
