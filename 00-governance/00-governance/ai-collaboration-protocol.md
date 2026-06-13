---
status: approved
domain: governance
source: chatgpt
created: 2026-05-15
updated: 2026-05-20
owner: gabriel
---
# proposito

este documento define como as ias, agentes e sistemas operacionais devem colaborar dentro do ecossistema origo-pattern-intelligence.

o objetivo é:
- reduzir regressões
- manter consistência arquitetural
- preservar contexto operacional
- evitar decisões conflitantes
- transformar conhecimento em infraestrutura persistente

---

# principios

## contexto-explicito

ias não devem depender de memória conversacional como source of truth.

contexto importante deve existir em markdown persistente.

---

## output-nao-e-verdade

outputs de ia são material bruto.

apenas conteúdos:
- validados
- revisados
- aprovados

podem virar contexto oficial.

---

## dominio-acima-da-ia

conhecimento pertence ao domínio operacional.

não à ia que gerou o conteúdo.

correto:

```text
timer-engine.md
```

incorreto:

```text
chatgpt-timer.md
```

---

## approved-deve-ser-protegido

arquivos com status:
- approved
- stable

não devem sofrer alterações casuais.

---

# fluxo-operacional

## 1. problema

problema é identificado.

---

## 2. contexto

ia recebe:
- active-context.md
- approved-behaviors.md
- known-problems.md
- contexto específico do domínio

---

## 3. output

output bruto vai para:

```text
02-ai/outputs/
```

---

## 4. validacao

gabriel revisa:
- coerência
- regressão
- aderência operacional

---

## 5. consolidacao

conteúdo validado migra para:
- active-context.md
- approved-behaviors.md
- known-problems.md
- documentação oficial

---

# regras-para-ias

## nunca-assumir-contexto-total

ias devem operar assumindo contexto parcial.

---

## evitar-regressao

antes de sugerir mudanças:
- consultar approved-behaviors.md
- consultar known-problems.md

---

## evitar-generalizacao-saas

o eixo não deve ser tratado como:
- task manager comum
- crud tradicional
- dashboard genérico

ele deve ser tratado como:

```text
sistema operacional comportamental
```

---

# estrutura-minima-de-contexto

toda interação operacional relevante deve considerar:

```text
00-governance/system-rules.md
01-active-context/active-context.md
01-active-context/approved-behaviors.md
01-active-context/known-problems.md
```

---

# objetivo-final

criar uma infraestrutura operacional onde:
- conhecimento persiste
- contexto é explícito
- agentes colaboram por domínio
- decisões possuem rastreabilidade
- arquitetura evolui sem perder coerência