# Villa Mill Tambore - Sistema de PDV e Gestao

Projeto base para o sistema de PDV e gestao operacional do restaurante Villa Mill Tambore.

## Visao Geral

Este repositorio utiliza **Next.js 15 (App Router)** com **TypeScript** e **Tailwind CSS** para construir uma plataforma moderna, escalavel e de baixo acoplamento para os modulos principais do restaurante:

- Mesas (operacao de salao e pedidos)
- Estoque (controle de insumos)
- Financeiro (caixa e indicadores)

## Stack Tecnologica

- Next.js 15
- React 19
- TypeScript 5
- Tailwind CSS 4
- ESLint

## Estrutura de Pastas

```txt
src/
  app/
    financeiro/
    estoque/
    mesas/
  components/
    ui/
  services/
  types/
```

### Convencoes adotadas

- `src/app`: rotas do App Router e composicao de telas por dominio.
- `src/components/ui`: componentes reutilizaveis de interface inspirados no padrao do shadcn/ui.
- `src/services`: camada de integracao com API e configuracao de conexao com banco.
- `src/types`: contratos TypeScript centrais de entidades de negocio.

## Entidades Tipadas

As seguintes interfaces iniciais estao prontas para evolucao:

- `Produto`
- `Insumo`
- `Mesa`
- `Pedido`

## Como Executar Localmente

1. Instale dependencias:

```bash
yarn install
```

2. Rode em desenvolvimento:

```bash
yarn dev
```

3. Acesse no navegador:

```txt
http://localhost:3000
```

## Scripts Disponiveis

- `yarn dev`: inicia ambiente local
- `yarn build`: gera build de producao
- `yarn start`: executa build em producao
- `yarn lint`: analisa qualidade de codigo

## Proximos Passos Recomendados

- Integrar autenticacao por perfil (caixa, gerente, admin)
- Definir ORM e migrations (Prisma ou Drizzle)
- Implementar fluxo completo de pedidos e fechamento de caixa
- Adicionar testes de unidade e integracao
