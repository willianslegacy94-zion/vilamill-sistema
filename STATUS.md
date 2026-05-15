# Villa Mill Tamboré — Status do Projeto

**Última atualização:** 2026-05-14

---

## Funcionalidades Implementadas

### Módulo: Mesas (PDV / Salão)
- Visualização das mesas com status: **Livre** (verde), **Ocupada** (vermelho), **Conta** (vermelho escuro)
- Abertura de mesa e criação de pedido
- Adição e remoção de itens em tempo real com busca e filtro por categoria
- **Pagamento simples** (Dinheiro, Crédito, Débito, Pix)
- **Pagamento dividido (split)** — múltiplas formas de pagamento em um mesmo fechamento
- Campo de desconto (R$) com total atualizado em tempo real
- Fechamento de conta com baixa automática de estoque (via Ficha Técnica)
- **Cancelamento de pedido** com motivo obrigatório e log no banco
- **Modo Treinamento** — simula abertura, itens e fechamento sem persistir no banco
- Liberação de emergência de mesa travada
- **SWR polling em tempo real** — atualização automática a cada 3 segundos sem flicker

### Módulo: Estoque
- CRUD completo de insumos (nome, unidade, quantidade, nível mínimo)
- Entradas e saídas manuais de estoque
- Alerta visual de estoque mínimo na tela de Estoque
- Alerta de Estoque Crítico no Dashboard (cards vermelhos)
- Ficha Técnica por produto — vinculação de ingredientes com quantidade

### Módulo: Cardápio (Produtos)
- CRUD de produtos com nome, preço de venda, preço de custo e categoria
- Gestão da ficha técnica por produto
- Controle de rastreamento de estoque por produto (`track_inventory`)

### Módulo: Financeiro
- Relatório diário de vendas com filtro de data
- Faturamento por forma de pagamento (Dinheiro, Crédito, Débito, Pix)
- Ticket médio e total de pedidos fechados
- Registro e listagem de despesas do dia
- Seção "Cancelamentos do dia" com motivo e responsável
- **SWR polling em tempo real** — atualização a cada 3 segundos

### Autenticação e Controle de Acesso
- Login com email e senha (NextAuth v5)
- Middleware protege todas as rotas — redireciona para `/login` sem sessão
- Navbar dinâmica filtrada por role

**Usuários cadastrados:**

| Nome    | Email                 | Senha      | Role  | Acesso                          |
|---------|-----------------------|------------|-------|---------------------------------|
| Admin   | admin@villamill.com   | admin123   | ADMIN | Tudo                            |
| Emilly  | emilly@villamill.com  | emilly123  | CAIXA | Mesas + Cardápio                |
| Melissa | melissa@villamill.com | melissa123 | CAIXA | Mesas + Cardápio                |

> Usuários com flag `isTrainee` acessam o **Modo Treinamento** — operações simuladas sem gravação no banco.

### Deploy e Infraestrutura
- **Hostinger VPS** com Docker Compose
- PostgreSQL 16 em container Docker
- Build multi-stage (deps → builder → runner) com imagem Alpine enxuta
- Migrations versionadas com `prisma migrate deploy` no container

---

## Pendente / Próximos Passos

- Impressão de comanda para cozinha/bar (`/comanda/[id]` — página térmica 80mm)
- Relatório mensal e exportação de dados
- Controle de usuários pelo painel Admin (criar/desativar)
- Backup automatizado do banco

---

## Stack Técnica

| Item | Tecnologia |
|------|------------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript 5 |
| Banco de dados | PostgreSQL 16 (Docker) |
| ORM | Prisma 6.4.1 |
| Autenticação | NextAuth v5 (Auth.js) |
| Polling em tempo real | SWR 2.4.1 |
| Estilo | Tailwind CSS 4 |
| Ícones | Lucide React 1.14.0 |
| Deploy | Hostinger VPS + Docker Compose |

---

## Variáveis de Ambiente

```env
DATABASE_URL=        # URL de conexão PostgreSQL
AUTH_SECRET=         # Segredo NextAuth
NEXTAUTH_URL=        # URL da aplicação
```

---

## Migrations Aplicadas

| Migration | Descrição |
|-----------|-----------|
| `20260429231207_init` | Schema inicial (Table, Product, Order, OrderItem) |
| `20260429234601_add_order_timestamps` | createdAt / closedAt em Order |
| `20260430002057_add_payment_method` | formaPagamento em Order |
| `20260511000000_add_cost_inventory_fields` | costPrice, track_inventory, custoUnit |
| `20260511000001_add_auth_cancel_discount` | User, CancelamentoLog, desconto em Order |
| `20260511000002_add_credito_debito_pagamento` | Enum CREDITO e DEBITO em FormaPagamento |
| `20260512000000_add_despesa` | Model Despesa |
| `20260514000000_add_pagamentos_split` | pagamentosSplit JSONB em Order |
