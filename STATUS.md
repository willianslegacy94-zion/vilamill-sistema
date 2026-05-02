# Villa Mill Tamboré — Status do Projeto

**Última atualização:** 2026-05-01

---

## ✅ Funcionalidades Implementadas

### Etapa 1 — PDV / Mapa de Mesas
- Visualização das mesas com status: **Livre** (verde), **Ocupada** (vermelho), **Conta** (vermelho escuro)
- Abertura e fechamento de pedidos com forma de pagamento (Dinheiro, Cartão, Pix)
- Adição e remoção de itens em tempo real
- Baixa automática de estoque ao fechar conta (via Ficha Técnica)

### Etapa 1 — Estoque e Ficha Técnica
- CRUD completo de insumos (ingredientes)
- Registro de entradas e saídas de estoque
- Alertas visuais de estoque mínimo na tela de Estoque
- **Alerta de Estoque Crítico** no Dashboard (cards vermelhos com ícone de aviso)
- Ficha Técnica por produto — vinculação de ingredientes com quantidade

### Etapa 1 — Cardápio (Produtos)
- CRUD de produtos com nome, preço e categoria
- Gestão da ficha técnica por produto

### Etapa 1 — Financeiro
- Relatório diário de vendas com filtro de data
- Faturamento por forma de pagamento (Dinheiro, Cartão, Pix)
- Ticket médio e total de pedidos fechados
- Listagem de mesas abertas com total parcial

### Etapa 2 — Autenticação e Controle de Acesso
- Login com email e senha (NextAuth v5)
- Três usuários cadastrados:

| Nome    | Email                    | Senha       | Acesso                   |
|---------|--------------------------|-------------|--------------------------|
| Admin   | admin@villamill.com      | admin123    | Tudo                     |
| Emilly  | emilly@villamill.com     | emilly123   | Mesas + Cardápio         |
| Melissa | melissa@villamill.com    | melissa123  | Mesas + Cardápio         |

- Navbar dinâmica: links filtrados por role (ADMIN / CAIXA)
- Dashboard: cards de Estoque e Financeiro ocultos para CAIXA
- Middleware protege todas as rotas — redireciona para `/login` sem sessão

### Etapa 2 — Descontos e Log de Cancelamentos
- Campo de desconto (R$) no fechamento de conta com total atualizado em tempo real
- Modal de cancelamento com campo de motivo (opcional)
- Log de cancelamentos registrado no banco (mesa, motivo, quem cancelou, horário)
- Seção "Cancelamentos do dia" no Financeiro

### Etapa 3 — Impressão de Pedidos (Cozinha/Bar)
- Botão **"Enviar para Cozinha"** no modal da mesa (aparece quando há itens)
- Página `/comanda/[id]` otimizada para impressora térmica 80mm
- Auto-impressão ao abrir a aba (`?print=true`)
- Botão "Imprimir" para reimpressão manual
- Sem dependências externas — usa impressão nativa do browser

---

## 🔲 Pendente

### Etapa 4 — Deploy na Vercel
- Configurar variáveis de ambiente na Vercel
- Deploy da aplicação com banco Neon (já configurado)
- Acesso remoto via internet

---

## Stack Técnica

| Item | Tecnologia |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript 5 |
| Banco de dados | PostgreSQL — Neon (sa-east-1) |
| ORM | Prisma 6.8.2 |
| Autenticação | NextAuth v5 (Auth.js) |
| Estilo | Tailwind CSS 4 |
| Ícones | Lucide React |
| Deploy (pendente) | Vercel + Neon |

---

## Variáveis de Ambiente (.env)

```
DATABASE_URL=       # Neon pooler URL
DIRECT_URL=         # Neon direct URL (para migrations)
AUTH_SECRET=        # Segredo NextAuth
NEXTAUTH_URL=       # URL da aplicação
```
