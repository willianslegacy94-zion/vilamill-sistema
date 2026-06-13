---
status: approved
domain: governance
created: 2026-05-24
updated: 2026-05-24
owner: willians
---

# ai-collaboration-protocol — vilamill-sistema

## proposito

define como o Claude e outros agentes de IA devem colaborar no desenvolvimento do vilamill-sistema (Villa Mill Tamboré — PDV e Gestão).

o objetivo é:
- reduzir regressões entre sessões
- manter consistência arquitetural em um stack TypeScript/Next.js 15 complexo
- preservar contexto operacional
- evitar decisões conflitantes
- transformar conhecimento em infraestrutura persistente

---

# principios

## contexto-explicito

o Claude não deve depender de memória conversacional como source of truth.

contexto importante deve existir em `docs/` como markdown persistente.

---

## output-nao-e-verdade

outputs gerados pelo Claude são material bruto.

apenas conteúdos revisados e aprovados por Willians devem virar referência oficial.

---

## dominio-acima-da-ia

conhecimento pertence ao domínio funcional do sistema.

não à IA que gerou o conteúdo.

---

## aprovado-deve-ser-protegido

fluxos com status `approved` ou `stable` não devem sofrer alterações casuais.

fluxos protegidos no vilamill-sistema:
- fluxo de mesas: abertura → adição de itens → fechamento com pagamento
- split payment (JSONB `pagamentos`)
- dedução automática de estoque via fichas técnicas ao fechar conta
- SWR polling de 3s nas telas operacionais (mesas, financeiro)
- middleware de autenticação NextAuth (protege todas as rotas)

---

# contexto-minimo-obrigatorio

antes de qualquer sessão de trabalho no vilamill-sistema, o Claude deve considerar:

```
docs/00-governance/system-rules.md
docs/00-governance/ai-collaboration-protocol.md
AGENTS.md                                  → breaking changes do Next.js 15
STATUS.md                                  → estado atual do projeto
```

---

# fluxo-operacional

## 1. problema-identificado

problema ou feature nova é identificada por Willians.

---

## 2. contexto

Claude recebe:
- estado atual do arquivo afetado (leitura completa)
- schema Prisma relevante (prisma/schema.prisma)
- STATUS.md → contexto de onde paramos

---

## 3. execucao

Claude modifica o código seguindo as regras de `system-rules.md` e `AGENTS.md`.

mudanças que afetam o schema do Prisma devem:
1. ser comunicadas antes de executar
2. criar migration via `npx prisma migrate dev --name <nome>`
3. ter nome de migration descritivo

---

## 4. validacao

Willians valida:
- comportamento correto no navegador
- ausência de regressão nas telas operacionais (mesas, financeiro)
- integridade dos dados no banco (Prisma Studio se necessário)
- polling SWR funcionando sem flicker

---

## 5. documentacao

após validação, atualizar `STATUS.md` com:
- o que foi implementado
- decisões tomadas
- próximos passos

---

# regras-para-o-claude

## next-js-15-tem-breaking-changes

SEMPRE ler `AGENTS.md` antes de usar qualquer API do Next.js.

APIs de navegação, Server Components, Route Handlers — todas podem ter comportamento diferente do treinamento.

---

## nunca-assumir-contexto-total

o Claude deve operar assumindo que o contexto da conversa pode estar incompleto.

em caso de dúvida: ler o arquivo antes de modificar.

---

## evitar-regressao

antes de modificar qualquer componente, rota ou hook:
- ler o arquivo completo
- identificar dependências (SWR keys, hooks relacionados, Prisma includes)
- não remover campos do schema sem migration documentada
- não alterar SWR keys sem atualizar todos os mutate() correspondentes

---

## prisma-exige-migracao

qualquer mudança no schema.prisma deve ser acompanhada de migration.

nunca usar `prisma db push` em produção — apenas `prisma migrate deploy`.

---

## swr-e-tempo-real

o vilamill usa SWR com polling de 3s nas telas críticas.

regra: não remover refreshInterval sem justificativa arquitetural.

atualizar dados localmente via mutate() antes da confirmação do servidor para evitar lag visual.

---

## contexto-de-negocio

o vilamill-sistema é um PDV de restaurante/bar, não um sistema genérico.

o contexto de negócio importa:
- "mesa" = unidade de atendimento (pode ter múltiplos pedidos abertos)
- "pedido" = conjunto de itens de uma mesa em um atendimento
- "item de pedido" = produto do cardápio com quantidade
- "ficha técnica" = receita que define quais insumos são consumidos por produto
- pagamento: Cash, PIX, Crédito, Débito (pode ser split entre métodos)
- "modo treino" = simulação sem persistência no banco

---

# estrutura-minima-de-contexto

toda interação operacional relevante deve considerar:

```
docs/00-governance/system-rules.md        → regras do projeto
AGENTS.md                                 → breaking changes Next.js 15
STATUS.md                                 → estado atual
prisma/schema.prisma                      → fonte de verdade do banco
src/app/[domínio]/page.tsx                → tela relevante
src/hooks/use[Dominio].ts                 → hook relevante
src/app/api/[domínio]/route.ts            → endpoint relevante
```

---

# objetivo-final

criar uma infraestrutura de desenvolvimento onde:
- contexto persiste entre sessões
- decisões possuem rastreabilidade
- regressões são detectadas antes de chegar ao usuário final (operadores de caixa)
- o sistema evolui sem perder coerência

---

# historico-de-versao

| versão | data | descrição |
|---|---|---|
| v1.0 | 2026-05-24 | criação inicial — adaptado de 00-governance do workspace |
