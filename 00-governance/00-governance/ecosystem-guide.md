---
status: stable
domain: governance
created: 2026-05-20
updated: 2026-05-20
owner: gabriel
---

# Guia do Ecossistema — origo-pattern-intelligence

Para Gabriel. Responde: onde estou, o que essa pasta representa dentro do origo-pattern-intelligence, e quando devo abrir cada uma.

Para entender o contexto maior do cofre, ver [[vault-guide]].

---

## Visão rápida

| Pasta | Tipo | O que representa |
|---|---|---|
| `00-governance` | lei | Regras dos documentos de projeto |
| `00-governance-systems` | lei | Regras de criação de sistemas |
| `00-growth-engine` | motor | Como a inteligência processa inputs e gera sistemas |
| `00-output` | buffer | Outputs ainda não classificados |
| `eixo` | produto | Sistema operacional comportamental individual |
| `war-reset` | produto | Metodologia de reset e libertação pessoal |
| `war-30D` | produto | Metodologia de 30 dias (threshold não aprovado) |
| `shared` | compartilhado | Material que pertence a mais de um sistema |

---

## 00-governance

**Tipo:** lei dos documentos de projeto

**O que é:** define o padrão que todos os arquivos dentro de `origo-pattern-intelligence` precisam seguir — frontmatter obrigatório, estrutura de pastas, workflow, protocolo com IAs.

**Diferença do `mundo-origo/00-governance`:** aquele define o mínimo universal do cofre. Este define o padrão dos documentos de projeto — mais denso, com propriedades que uma nota de diário não precisa seguir.

**Quando abrir:** antes de criar qualquer arquivo dentro de qualquer sistema aqui. Antes de iniciar qualquer sessão de trabalho com uma IA neste ecossistema.

**Responde:**
- Quais propriedades de frontmatter são obrigatórias? → [[system-rules]]
- Como organizar as pastas de cada sistema? → [[folder-purpose]]
- Qual é o ciclo de status dos documentos (draft → stable)? → [[status-promotion-rules]]
- Como colaborar com IAs aqui dentro? → [[ai-collaboration-protocol]]
- Como iniciar, pausar e retomar o trabalho? → [[operational-workflow]]

---

## 00-governance-systems

**Tipo:** lei de criação de sistemas

**O que é:** define o que um sistema precisa ter para começar a ser construído — não sobre arquivos, mas sobre requisitos de existência.

**Diferença do `00-governance`:** o `00-governance` define como os documentos devem ser estruturados. O `00-governance-systems` define o que um sistema precisa provar antes de virar pasta.

**Quando abrir:** sempre que um novo sistema ou produto estiver sendo cogitado.

**Responde:**
- Esse sistema está pronto para virar uma pasta?
- Quais perguntas precisam estar respondidas antes de começar a construir? → [[system-creation-threshold]]
- Quais frameworks usar para construir cada camada do sistema?

---

## 00-growth-engine

**Tipo:** motor

**O que é:** o motor. Define como a inteligência processa cada tipo de input e gera os sistemas.

**Contém dois braços:**
- `business-system/` — motor empresarial: processo documentado, 9 módulos reutilizáveis, caso Laurindão
- `human-system/` — motor humano: processo sendo construído a partir da história de Gabriel

**Não é o produto** — é o processo que gera o produto.

**Quando abrir:** quando for trabalhar no processo de construção de um sistema, não no sistema em si.

**Responde:**
- Como se constrói um sistema empresarial a partir de transcrições?
- Quais são os módulos reutilizáveis do sistema empresarial?
- Como a história de uma pessoa se transforma em produto (EIXO, WAR Reset)?

---

## 00-output

**Tipo:** buffer

**O que é:** outputs gerais que ainda não foram classificados em um sistema específico.

**Regra:** deve ser periodicamente esvaziada — cada output migra para o sistema ao qual pertence.

**Quando abrir:** quando um output foi gerado mas ainda não tem destino claro dentro de `eixo/`, `war-reset/` ou outro sistema.

---

## eixo

**Tipo:** produto do sistema humano

**O que é:** sistema operacional comportamental individual. O produto que emerge quando uma pessoa conecta sua história ao `human-system/`.

**Contém:**
- `00-context/` — o que é, arquitetura, produto, runtime, AIOX
- `00-outputs/` — artefatos produzidos
- `01-active-context/` — estado operacional ativo: decisões, problemas, contratos, comportamentos aprovados
- `02-ai/` — histórico do ciclo de desenvolvimento

**Quando abrir:** quando for trabalhar no EIXO — produto, desenvolvimento, contexto, sessões de IA.

**Responde:**
- O que é o EIXO e como funciona? → [[active-context]]
- Quais comportamentos estão aprovados? → [[approved-behaviors]]
- Quais problemas estão abertos? → [[known-problems]]
- O que foi decidido recentemente? → [[decision-log]]
- Onde paramos na última sessão? → [[session-context]]

---

## war-reset

**Tipo:** produto do sistema humano

**O que é:** metodologia de reset e libertação pessoal.

**Quando abrir:** quando for trabalhar no WAR Reset — estrutura, conteúdo, análise de personas, documentação do sistema.

→ [[war-reset]] · [[analise-frequencias]] · [[ideias-war-reset]]

---

## war-30D

**Tipo:** produto do sistema humano (em intenção)

**O que é:** metodologia de 30 dias.

**Status atual:** pasta criada, construção não iniciada. Precisa passar pelo threshold de [[system-creation-threshold]] antes de qualquer construção começar.

**Quando abrir:** quando o threshold for aprovado.

---

## shared

**Tipo:** compartilhado

**O que é:** material que pertence a mais de um sistema e não faz sentido duplicar.

**Contém:** pesquisa de persona Reddit (alimenta `war-reset` e `eixo`).

**Quando abrir:** quando um recurso precisa ser consultado por mais de um sistema.

---

## Fluxo dentro do origo-pattern-intelligence

```
00-governance-systems  →  define o threshold de criação de sistemas
00-growth-engine       →  processa os inputs e gera os sistemas
eixo / war-reset / war-30D  →  os produtos gerados
00-governance          →  define como os documentos devem ser estruturados
shared                 →  material reutilizado entre sistemas
```
