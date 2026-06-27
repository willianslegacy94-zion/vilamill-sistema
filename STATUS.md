# Villa Mill Tamboré — Status do Projeto

**Última atualização:** 2026-06-27

---

## Funcionalidades Implementadas

### Módulo: Mesas (PDV / Salão)
- Visualização das mesas com status: **Livre** (verde), **Ocupada** (vermelho), **Conta** (vermelho escuro)
- Abertura de mesa e criação de pedido
- Adição e remoção de itens em tempo real com busca e filtro por categoria
- **Opcionais por produto** — grupos radio (escolha única) e checkbox (múltipla, com limite) configurados como JSON no cadastro de cada produto
- **Seletor de preparo dinâmico** — detecta " ou " no nome do produto (ex: "Filé de Tilápia Empanado ou Grelhado") e gera botões de seleção automaticamente sem hardcode de categoria
- **Campo "Observações / Retiradas"** — texto livre enviado à comanda e exibido no KDS (ex: "Sem cebola, molho à parte")
- **Pagamento simples** (Dinheiro, Crédito, Débito, Pix, Voucher VR/VA)
- **Pagamento dividido (split)** — múltiplas formas de pagamento em um mesmo fechamento
- Campo de desconto (R$) com total atualizado em tempo real
- **Desconto com autorização de admin** — botão "Aplicar" ao lado do campo; CAIXA precisa informar a senha do admin para confirmar; ADMIN aplica diretamente
- Fechamento de conta com baixa automática de estoque (via Ficha Técnica)
- **Cupom térmico 80mm** — gerado no fechamento; pop de confirmação pergunta se cliente quer cupom antes de fechar; botão "Imprimir Cupom" disponível mesmo sem itens
- **Cancelamento de pedido** com motivo obrigatório e log no banco
- **Modo Treinamento** — simula abertura, itens e fechamento sem persistir no banco
- Liberação de emergência de mesa travada
- **SWR polling em tempo real** — atualização automática a cada 3 segundos sem flicker

### Módulo: KDS — Cozinha (Kitchen Display System)
- Tela dedicada `/cozinha` com tema escuro para ambiente de cozinha
- **Abas Pendentes / Concluídos** — separa itens em preparo dos já finalizados no dia
- **Reset diário automático** — aba Concluídos zera automaticamente à meia-noite (SP)
- **Urgência visual por tempo** — card neutro (<8min), âmbar (+8min), vermelho (+15min)
- Exibe número da mesa, categoria do produto, tempo decorrido e observações em destaque âmbar
- Botão **✓ PRONTO** marca o item como concluído (`PATCH /api/cozinha/pedidos/:itemId`)
- Polling SWR a cada 2 segundos para atualização em tempo real
- Role `COZINHA` — acesso exclusivo à tela `/cozinha`, sem acesso ao PDV

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
- Faturamento por forma de pagamento (Dinheiro, Crédito, Débito, Pix, Voucher VR/VA)
- Ticket médio e total de pedidos fechados
- Registro e listagem de despesas do dia
- Seção "Cancelamentos do dia" com motivo e responsável
- **SWR polling em tempo real** — atualização a cada 3 segundos
- **Coluna Pagamento** exibe split empilhado: badge colorido por método + valor fracionado discreto
- **Edição de transações fechadas** — altera total (R$) e forma de pagamento (simples ou split) via modal; `PATCH /api/pedidos/[id]`

### Autenticação e Controle de Acesso
- Login com email e senha (NextAuth v5)
- Middleware protege todas as rotas — redireciona para `/login` sem sessão
- Navbar dinâmica filtrada por role
- **Alterar senha do Admin** — página `/alterar-senha` acessível pelo nome do usuário na navbar; valida senha atual via bcrypt antes de atualizar; rota protegida por role ADMIN (`POST /api/admin/change-password`)
- **Verificação de senha Admin** — endpoint `POST /api/admin/verify-password` usado para autorizar desconto via CAIXA

**Usuários cadastrados:**

| Login       | Senha      | Role  | Acesso                          |
|-------------|------------|-------|---------------------------------|
| admin       | admin123   | ADMIN | Tudo                            |
| caixa       | caixa123   | CAIXA | Mesas + Cardápio + Estoque      |
| treinamento | —          | CAIXA | Modo Treinamento (sem banco)    |

> Login = campo `email` no banco (sem @domínio). Usuário `treinamento` ativa o Modo Treinamento via flag `isTrainee` no JWT.

### Módulo: Parceria Lava-Rápido (Caixinha)
- Gestão de funcionários externos por empresa (`/parceiros` — ADMIN)
- Cadastro de funcionário com seletor de empresa (Lava-Rápido / Villa Mill) — sem digitação livre
- **Exclusão de parceiro** — soft delete (`ativo: false`) com confirmação inline na tabela; histórico de créditos e consumos preservado; `DELETE /api/parceiros/funcionarios/[id]` (ADMIN)
- Crédito **individual** (nominativo) e **coletivo** (pool por empresa) — sem multiplicação por funcionário
- Consumo de produtos do restaurante descontado do pool coletivo da empresa
- Saldo do pool calculado em tempo real: `SUM(créditos COLETIVO) − SUM(consumos)` — sem campo desnormalizado
- Bloqueio de consumo quando subtotal > saldo do pool (sem saldo negativo para parceiro externo)
- Modal Caixinha na home com seletor de segmento (Lava-Rápido / Villa Mill) — isolamento por empresa
- Baixa de funcionário via modal em `/mesas` (caixa e admin)
- ConsumoFuncionario isolado do faturamento real — não gera Order
- **fix:** saldo da caixinha exibia sempre R$0,00 no modal (campo `poolSaldo` → `saldo` alinhado com a API)

### Deploy e Infraestrutura
- **Hostinger VPS** com Docker Compose
- PostgreSQL 16 em container Docker
- Build multi-stage (deps → builder → runner) com imagem Alpine enxuta
- `prisma migrate deploy` executado automaticamente no startup do container — migrations aplicadas a cada deploy sem intervenção manual
- **Favicon** — `src/app/favicon.ico` gerado a partir do logo Villa Mill em 4 tamanhos (16, 32, 48, 64px via Sharp); substitui o ícone padrão Next.js

---

## Pendente / Próximos Passos

- Relatório mensal e exportação de dados
- Controle de usuários pelo painel Admin (criar/desativar)
- Backup automatizado do banco
- Ativação completa da baixa de estoque por ficha técnica (RecipeItem) no fechamento

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
| `20260527110042_parceria_lava_rapido` | FuncionarioExterno, CreditoFuncionario, ConsumoFuncionario, TipoCreditoFuncionario |
| `20260527144124_credito_pool_coletivo` | CreditoFuncionario.funcionarioId nullable + campo empresa (pool coletivo) |
| `20260529040638_add_voucher_pagamento` | Valor VOUCHER no enum FormaPagamento |
| `20260603025637_add_caixa_model` | Model Caixa (funcionárias autorizadas a abrir mesa) |
| `20260613000000_add_lancamento_vale` | Model LancamentoVale; campo setor em FuncionarioExterno; enums TipoLancamento e StatusLancamento |
| `20260613161904_add_opcionais_observacoes` | Campo opcionais (JSONB) em Product; campo observacoes (TEXT) em OrderItem; remove unique (orderId, productId) |
| `20260627031855_add_cozinha_kds` | Role COZINHA em UserRole; campos status e createdAt em OrderItem |
| `20260627042546_add_pronto_em_order_item` | Campo prontoEm (TIMESTAMP) em OrderItem |
