## proposito

este documento define as regras operacionais, padrões organizacionais e protocolos cognitivos utilizados em todo o ecossistema origo-pattern-intelligence.

essas regras existem para:
- preservar consistência arquitetural
- reduzir regressões
- padronizar comportamento dos agentes
- melhorar colaboração entre ias
- manter continuidade operacional
- evitar conhecimento tribal
- criar infraestrutura contextual persistente

---

# naming-convention

## arquivos

todos os arquivos devem seguir:

- apenas minúsculas
- hífen no lugar de espaços
- nomes semânticos
- sem acentos
- sem caracteres especiais
- sem underscore
- sem nomes de ia nos arquivos
- sem numeração desnecessária nos arquivos

---

## correto

```text
core-principles.md
approved-behaviors.md
known-problems.md
timer-engine.md
spotlight-system.md
```

---

## incorreto

```text
Core Principles.md
01-chatgpt-principios.md
timer_engine.md
princípios.md
```

---

# folder-structure

pastas organizam domínios operacionais.

pastas podem utilizar prefixos numéricos para preservar hierarquia e navegação.

---

## correto

```text
00-context
01-system
02-architecture
03-aiox
04-product
05-runtime
```

---

## incorreto

```text
System Files
Arquitetura
AIOX Stuff
```

---

# metadata-standard

todos os arquivos operacionais devem começar com metadata yaml.

---

## estrutura-obrigatoria

```yaml
---
status:
domain:
source:
created:
updated:
owner:
---
```

---

# metadata-fields

## status

define maturidade operacional e confiabilidade.

valores permitidos:

```text
draft
experimental
validating
approved
stable
deprecated
archived
```

---

## domain

define domínio/sistema responsável.

exemplos:

```text
onboarding
timer-engine
spotlight-system
behavior-engine
execution-flow
```

---

## source

define origem do documento.

exemplos:

```text
chatgpt
claude
aiox
manual
```

---

## created

data de criação.

formato:

```text
yyyy-mm-dd
```

---

## updated

última atualização.

formato:

```text
yyyy-mm-dd
```

---

## owner

responsável principal.

exemplo:

```text
gabriel
```

---

# status-system

## draft

exploração inicial.
não confiável.
altamente mutável.

---

## experimental

em teste operacional.
pode quebrar.
ainda não validado.

---

## validating

funcionando mas em observação.
feedback ainda sendo coletado.

---

## approved

comportamento/sistema aprovado.
não deve ser alterado casualmente.

---

## stable

comportamento operacional consolidado.
mudanças exigem justificativa arquitetural.

---

## deprecated

não recomendado para uso.
mantido apenas para histórico/referência.

---

## archived

material congelado.
sem manutenção ativa.

---

# operational-principles

## architecture-over-memory

conhecimento importante nunca deve existir apenas em conversa ou memória humana.

todo padrão validado deve ser documentado.

---

## domain-over-authorship

organização do conhecimento deve priorizar domínio operacional e não autoria da ia.

correto:

```text
timer-engine.md
```

incorreto:

```text
chatgpt-timer.md
```

---

## semantic-over-chronological

arquivos representam conceitos e sistemas.

evitar:
- nomes temporais
- nomes conversacionais
- nomes de prompts

---

## explicit-context

ias performam melhor com regras operacionais explícitas.

decisões importantes devem virar contexto persistente.

---

## approved-behaviors-protection

comportamentos aprovados devem ser protegidos contra regressões.

agentes devem:
- consultar approved-behaviors.md
- evitar alterar fluxos aprovados sem justificativa
- preservar comportamento operacional validado

---

# agent-rules

## agents-operate-by-domain

agentes atuam por domínio.

exemplos:

```text
ux-agent
performance-agent
behavior-agent
architecture-agent
```

---

## agents-must-read-context

antes de modificar sistemas, agentes devem consultar:

```text
core-principles.md
approved-behaviors.md
known-problems.md
```

---

## agents-must-respect-approved-status

sistemas approved e stable exigem alto cuidado antes de alterações.

---

## no-hidden-decisions

decisões importantes devem ser documentadas.

evitar:
- correções invisíveis
- mudanças silenciosas
- alterações comportamentais não registradas

---

# ordem-de-entradas-em-logs

arquivos de log acumulam entradas em **ordem cronológica crescente** — a entrada mais recente sempre no final do arquivo.

aplica-se a:
- `decision-log.md`
- `session-context.md`
- qualquer arquivo que acumule registros por data

**regra para IAs:** ao adicionar uma nova entrada, sempre anexar ao final do arquivo — nunca inserir no início ou no meio.

**motivo:** "leia a última entrada" significa ler o final do arquivo. Inserir no início inverte a ordem e quebra o protocolo de leitura.

---

# wikilinks

todo arquivo criado dentro do ecossistema deve ter pelo menos um `[[wikilink]]` conectando-o a outro arquivo relevante.

objetivo: manter o graph do Obsidian como representação visual real do ecossistema — sem nós isolados.

## regras por tipo de arquivo

| tipo de arquivo | o que linkar |
|---|---|
| governança / guia | os arquivos que descreve ou referencia |
| contexto ativo | arquivos irmãos do mesmo `01-active-context/` |
| output | o sistema e o contexto de origem |
| decision-log | os componentes impactados pela decisão |
| session-context | `[[decision-log]]`, `[[backlog]]`, `[[active-context]]` |
| novo sistema | `[[system-creation-threshold]]`, `[[operational-workflow]]` |

## regra mínima

se não souber o que linkar, linke ao menos para o arquivo de governança do seu sistema:
- arquivos em `origo-pattern-intelligence/` → `[[ecosystem-guide]]`
- arquivos em `mundo-origo/` → `[[vault-guide]]`

---

# regras-por-sistema

regras técnicas e comportamentais específicas de cada sistema vivem dentro do próprio sistema, não aqui.

| sistema | arquivo de regras |
|---|---|
| eixo | `eixo/01-active-context/approved-behaviors.md` |

---

# knowledge-system

## context-is-infrastructure

documentação é tratada como infraestrutura operacional.

não como documentação passiva.

---

## conversations-are-not-source-of-truth

conhecimento validado deve migrar para markdown persistente.

---

## obsidian-is-operational-memory

obsidian funciona como:
- memória persistente
- contexto operacional
- registro arquitetural
- infraestrutura de colaboração entre ias

---

# runtime-philosophy

o sistema deve priorizar:

- clareza operacional
- continuidade contextual
- consistência comportamental
- baixa fricção cognitiva
- resiliência arquitetural
- lógica operacional explícita

---

# final-principle

o ecossistema origo-pattern-intelligence não é tratado como um projeto tradicional de software.

ele é tratado como:

```text
um sistema operacional cognitivo
```

portanto:
- contexto é infraestrutura
- comportamento é arquitetura
- lógica operacional deve ser explícita
- conhecimento validado deve persistir