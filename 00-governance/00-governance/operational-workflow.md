---
status: stable
domain: governance
created: 2026-05-15
updated: 2026-05-20
owner: gabriel
---

# Operational Workflow — origo-pattern-intelligence

Modo de trabalho padrão para qualquer sistema dentro de `origo-pattern-intelligence`.

Aplica-se a: [[active-context|eixo]], [[war-reset]], `war-30D`, `business-system`, qualquer sistema futuro.

---

## Dois ambientes, papéis distintos

| Ambiente | Caminho | Para que serve |
|---|---|---|
| **Obsidian** | `workspace/obsidian/mundo-origo/` | Contexto, governança, logs, handoff, validação — o que Gabriel lê e valida |
| **Projeto** | `workspace/origo-pattern-intelligence/[sistema]/` | Código, stories, specs técnicas — onde o sistema é construído |

Ver [[vault-guide]] para navegar o Obsidian. Ver [[ecosystem-guide]] para navegar o origo-pattern-intelligence.

Os arquivos de contexto e log vivem no **Obsidian**.  
Os arquivos de execução (stories, docs técnicas) vivem no **Projeto**.

---

## Fase 1 — Planejamento

### 1. Analise o estado atual

Leia no **Obsidian** antes de qualquer decisão:
- [[session-context]] → última entrada
- [[active-context]]
- [[known-problems]]

### 2. Defina o backlog

Referência no **Obsidian**: [[backlog]]

Arquivos de épicos e stories no **Projeto**:
```
workspace/origo-pattern-intelligence/[sistema]/docs/
```

### 3. Defina o agente executor

- **AIOX** — execução multi-agente estruturada
- **Claude / Codex / Gemini** — sessão direta com Gabriel

---

## Fase 2 — Execução

### 4. Execute as stories

Stories e docs técnicas estão no **Projeto**:
```
workspace/origo-pattern-intelligence/[sistema]/docs/
```

### 5. Atualize o decision-log

A cada decisão arquitetural relevante, atualize no **Obsidian**: [[decision-log]]

O que registrar:
- O que foi decidido e por quê
- Impacto nos outros componentes
- Status da decisão

Não registrar: ajustes pontuais, correções cosméticas, mudanças sem impacto sistêmico.

### 6. Gabriel valida

- **OK** → story concluída, avança para a próxima
- **Volta ao backlog** → registrar motivo na story e reabrir

---

## Fase 3 — Handoff

### 7. Salve o contexto ao finalizar

Ao encerrar uma sessão de trabalho, diga à IA:

> *"Finalizamos por aqui. Salve o contexto em `mundo-origo/origo-pattern-intelligence/[sistema]/01-active-context/session-context.md`"*

O contexto deve incluir:
- O que foi trabalhado
- Decisões tomadas
- Onde paramos
- O que retomar na próxima sessão

Salvo no **Obsidian** — acessível em qualquer sessão futura, com qualquer LLM.

---

## Fase 4 — Retomada

### 8. Inicie a próxima sessão

```
Antes de iniciarmos, leia na ordem:
1. workspace/obsidian/mundo-origo/00-governance/ai-protocol.md
2. workspace/obsidian/mundo-origo/origo-pattern-intelligence/00-governance/ai-collaboration-protocol.md
3. workspace/obsidian/mundo-origo/origo-pattern-intelligence/[sistema]/01-active-context/session-context.md → última entrada
```

Funciona com qualquer LLM — Claude, Codex, Gemini.

---

## Arquivos operacionais por sistema

### Obsidian — contexto e logs

```
mundo-origo/origo-pattern-intelligence/[sistema]/01-active-context/
├── session-context.md   → handoff entre sessões
├── backlog.md           → referência de épicos e stories
├── decision-log.md      → decisões arquiteturais
├── active-context.md    → estado operacional atual
└── known-problems.md    → problemas conhecidos e abertos
```

### Projeto — execução

```
workspace/origo-pattern-intelligence/[sistema]/
├── docs/                → stories, épicos, specs técnicas
└── [código do sistema]
```
