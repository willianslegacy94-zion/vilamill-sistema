---
status: stable
domain: governance
created: 2026-05-15
updated: 2026-05-20
owner: gabriel
---

# Estrutura do origo-pattern-intelligence

Mapa de cada pasta dentro de `origo-pattern-intelligence`: o que representa, quando é usada e o que não pertence a ela.

Toda pasta nova criada aqui deve estar registrada neste documento antes de ser usada.

---

## 00-governance

**O que é:** lei dos documentos dentro dos projetos de `origo-pattern-intelligence`. Define o que um arquivo de projeto precisa ter.

Contém:
- propriedades obrigatórias de frontmatter (source, created, updated, status, domain, owner)
- estrutura de pastas do `origo-pattern-intelligence` (este documento)
- workflow operacional
- protocolo de colaboração com IA
- regras de promoção de status

Diferença do `mundo-origo/00-governance`: aquele define o mínimo universal do vault. Este define o padrão dos documentos de projeto — mais denso, com propriedades que uma nota de diário não precisa seguir.

---

## 00-governance-systems

**O que é:** lei de criação de sistemas. Define o que um sistema precisa ter para começar a ser construído — não sobre arquivos, mas sobre requisitos de existência.

Contém:
- o que um sistema precisa como input mínimo antes de abrir uma pasta
- quais perguntas precisam estar respondidas antes de criar `eixo/`, `war-reset/`, `war-30D/` ou qualquer novo sistema
- exemplo de sistema que passou pelo threshold (Laurindão) vs sistema que ainda não passou (war-30D)

Quando usar: sempre que um novo sistema ou produto estiver sendo cogitado. Se não passa pelo threshold definido aqui, não vira pasta.

---

## 00-growth-engine

**O que é:** o motor. Define como a inteligência processa cada tipo de input e gera os sistemas.

Contém:
- `business-system/` — motor empresarial: processo documentado, 9 módulos reutilizáveis, caso Laurindão
- `human-system/` — motor humano: processo sendo construído a partir da história de Gabriel

Relação com as pastas de produto: o `00-growth-engine` não é o produto — é o processo que gera o produto. O que está aqui documenta *como* construir, não o que foi construído.

---

## 00-output

**O que é:** outputs gerais do `origo-pattern-intelligence` que ainda não foram classificados em um sistema específico.

Quando usar: quando um output é gerado mas ainda não tem um destino claro dentro de `eixo/`, `war-reset/` ou outro sistema.

Objetivo: deve ser periodicamente esvaziada — cada output migra para o sistema ao qual pertence.

---

## eixo

**O que é:** produto do sistema humano — sistema operacional comportamental individual.

Contém:
- `00-context/` — especificações: o que é, o que não é, arquitetura, produto, runtime, AIOX
- `00-outputs/` — artefatos produzidos: análises, vocabulário, mapeamentos de tela
- `01-active-context/` — estado operacional ativo: decisões recentes, problemas conhecidos, contratos de produto, comportamentos aprovados
- `02-ai/` — histórico do ciclo de desenvolvimento: prompts e outputs das sessões de construção do EIXO

Quando é gerado: quando uma pessoa conecta sua história ao `human-system/`, o EIXO é o produto que emerge.

---

## war-reset

**O que é:** produto do sistema humano — metodologia de reset e libertação pessoal.

Contém:
- análise de frequências de persona
- ideias e estrutura do WAR Reset
- documentação do sistema

---

## war-30D

**O que é:** produto do sistema humano — metodologia de 30 dias.

Status atual: pasta criada, construção não iniciada. Precisa passar pelo threshold de `00-governance-systems` antes de começar.

---

## shared

**O que é:** material compartilhado entre sistemas — não pertence a um único produto.

Contém:
- pesquisa de persona Reddit (alimenta war-reset e eixo)

Quando usar: quando um recurso é referenciado por mais de um sistema e não faz sentido duplicar.

---

## Pastas pendentes de classificação

| pasta | situação |
|---|---|
| `00-apoio/` | material de apoio (roadmaps, visão geral do ecossistema WAR) — provável destino: `war-reset/` |
| `aiox/` | infraestrutura de agentes IA — provável destino: `eixo/` |

---

## Fluxo dentro do origo-pattern-intelligence

```
00-governance-systems  →  define o threshold de criação
00-growth-engine       →  processa os inputs e gera os sistemas
eixo / war-reset / war-30D  →  os produtos gerados
00-governance          →  define como os documentos devem ser estruturados
```
