---
status: approved
domain: governance
source: claude
created: 2026-05-15
updated: 2026-05-15
owner: gabriel
---

# status-promotion-rules

## proposito

define o lifecycle operacional de todos os artefatos do ecossistema origo-pattern-intelligence.

status reflete maturidade operacional real — nao intencao nem esforco.
promocao depende de comportamento do sistema — nao de aprovacao subjetiva.

---

## tipos-de-artefato

todo artefato do ecossistema pertence a uma das quatro categorias abaixo.
as regras de promocao variam conforme o tipo.

### output-bruto
- origem: sessao de ia
- destino: `02-ai/outputs/`
- caracteristica: material nao validado
- nao pode virar contexto oficial automaticamente
- requer revisao e validacao antes de qualquer promocao
- exemplos: analises, sinteses, avaliações de risco geradas por ia

### contexto-consolidado
- origem: output validado e aprovado por gabriel
- destino: `01-active-context/`
- caracteristica: estado vivo e atual do sistema
- serve como bootstrap para todas as ias
- pode ser alterado conforme o estado do sistema evolui
- exemplos: active-context.md, known-problems.md, approved-behaviors.md

### contrato-operacional
- origem: decisao arquitetural validada
- destino: `01-active-context/` ou `00-governance/`
- caracteristica: define invariantes e fronteiras
- mudancas exigem justificativa arquitetural documentada
- exemplos: protected-systems-contracts.md, domain-ownership.md

### runtime-protegido
- origem: comportamento validado e estabilizado em uso real
- destino: `01-active-context/approved-behaviors.md`
- caracteristica: comportamento critico que nao pode regredir
- qualquer alteracao e tratada como regressao ate prova em contrario
- exemplos: timer-engine behavior, floating-resume-button behavior

---

# status-system

## draft

### significado-operacional
exploracao inicial. o artefato existe mas nao foi validado.

### nivel-de-confiabilidade
baixo. conteudo e provisorio e altamente mutavel.

### objetivo
capturar ideia, analise ou estrutura inicial para revisao futura.

### comportamento-esperado
- pode ser alterado livremente
- nao deve ser usado como referencia por outros artefatos
- nao deve ser consumido por ias como contexto confiavel

### riscos-do-status
- ser tratado como contexto oficial antes da validacao
- permanecer em draft indefinidamente sem promocao ou descarte

### quando-usar
- outputs iniciais de ia antes de qualquer validacao
- ideias e exploracoes nao estruturadas
- estruturas que precisam de revisao antes de qualquer uso

### o-que-impede-promocao
- conteudo nao revisado por gabriel
- ausencia de metadata-standard
- violacao de naming-convention
- conteudo contraditorio com artefatos approved ou stable

### requisitos-para-promocao-para-validating
- gabriel revisou o conteudo
- conteudo e coerente com o sistema atual
- metadata-standard presente e correto
- naming-convention respeitada

### quem-pode-promover
- gabriel (unico owner atual)

### validacao-empirica-necessaria
nao — revisao conceitual suficiente para sair de draft

### uso-operacional-real-necessario
nao

---

## experimental

### significado-operacional
em teste operacional ativo. pode funcionar, mas ainda nao foi validado em condicoes reais suficientes.

### nivel-de-confiabilidade
baixo-medio. pode quebrar. nao confiar como referencia permanente.

### objetivo
testar hipotese operacional em condicao real antes de validar.

### comportamento-esperado
- pode ser alterado durante o periodo de teste
- deve ser monitorado ativamente
- resultados do teste devem ser documentados antes da promocao

### riscos-do-status
- feature critica sendo colocada em producao como experimental sem contrato de fallback
- permanecer experimental sem criterio de saida definido

### quando-usar
- features ou sistemas em teste antes de validacao formal
- comportamentos novos que precisam de uso real para confirmar estabilidade

### o-que-impede-promocao
- ausencia de periodo de teste em uso real
- problemas conhecidos nao resolvidos
- comportamento inconsistente entre sessoes

### requisitos-para-promocao-para-validating
- periodo de uso real sem regressao documentada
- comportamento consistente em mobile e desktop
- nenhum sinal de regressao no periodo de observacao

### quem-pode-promover
- gabriel

### validacao-empirica-necessaria
sim — uso real e obrigatorio para sair de experimental

### uso-operacional-real-necessario
sim

---

## validating

### significado-operacional
funcionando em uso real mas ainda em observacao. feedback sendo coletado. confiavel o suficiente para referenciar, mas nao o suficiente para tratar como invariante.

### nivel-de-confiabilidade
medio. conteudo e operacional mas pode evoluir.

### objetivo
coletar feedback operacional real para confirmar ou refinar antes de aprovar.

### comportamento-esperado
- pode ser referenciado por outros artefatos com ressalva de mutabilidade
- alteracoes devem ser documentadas
- sinal de regressao ou inconsistencia deve bloquear promocao

### riscos-do-status
- artefato permanecendo em validating indefinidamente sem criterio de saida
- ser tratado como approved antes do tempo, gerando falsa seguranca

### quando-usar
- contexto consolidado recentemente criado ainda sem historico de uso
- contratos operacionais recentes ainda em primeiro ciclo de uso real
- comportamentos aprovados em novos dominios ainda nao testados em todas as condicoes

### o-que-impede-promocao
- problema ativo nao resolvido relacionado ao artefato
- comportamento inconsistente com o que o artefato define
- contrato violado sem justificativa documentada
- ausencia de uso operacional real no periodo de observacao

### requisitos-para-promocao-para-approved
- pelo menos um ciclo de uso operacional real sem regressao
- nenhum problema ativo relacionado ao artefato em known-problems.md
- conteudo coerente com todos os contratos e dominios aprovados
- gabriel validou explicitamente

### quem-pode-promover
- gabriel

### validacao-empirica-necessaria
sim — pelo menos um ciclo de uso real

### uso-operacional-real-necessario
sim

---

## approved

### significado-operacional
comportamento ou sistema aprovado. confiavel como referencia. nao deve ser alterado casualmente.

### nivel-de-confiabilidade
alto. pode ser consumido por ias como contexto confiavel.

### objetivo
marcar artefatos que passaram por validacao e podem ser usados como referencia operacional.

### comportamento-esperado
- pode ser consumido por ias sem ressalva
- alteracoes exigem justificativa documentada
- mudancas devem ser registradas no historico-de-versao do artefato
- violacoes sao tratadas como regressao

### riscos-do-status
- promotion inflation: promover para approved sem ciclo real de validating
- artefato ficar desatualizado mas manter status approved — gerando falsa seguranca
- mudancas silenciosas sem registro de versao

### quando-usar
- contratos operacionais validados em uso real
- comportamentos aprovados de sistemas protegidos
- regras de governanca em vigor
- contexto consolidado com ciclo de uso sem regressao

### o-que-impede-mudanca-sem-justificativa
- qualquer mudanca em artefato approved exige:
  - descricao da mudanca
  - motivo arquitetural
  - sistemas impactados
  - atualizacao do campo `updated` no metadata
  - entrada no historico-de-versao do artefato

### requisitos-para-promocao-para-stable
- multiplos ciclos de uso sem necessidade de alteracao
- nenhuma regressao registrada relacionada ao artefato
- comportamento consistente em todas as condicoes documentadas
- gabriel avaliou que o artefato atingiu maturidade de invariante

### quem-pode-promover
- gabriel

### validacao-empirica-necessaria
sim — multiplos ciclos

### uso-operacional-real-necessario
sim

---

## stable

### significado-operacional
maturidade operacional consolidada. o artefato define um invariante do sistema. mudancas exigem justificativa arquitetural — nao apenas operacional.

### nivel-de-confiabilidade
muito alto. tratado como lei do sistema.

### objetivo
marcar artefatos que nao devem mais mudar sem razao arquitetural forte.

### comportamento-esperado
- tratado como invariante por todos os agentes e ias
- qualquer proposta de mudanca deve justificar impacto sistemico
- mudancas sao raras e sempre documentadas com impacto total
- nenhuma ia pode sugerir alteracao em stable sem declarar impacto completo

### riscos-do-status
- permanecer stable quando o sistema evolui e o artefato fica obsoleto
- ser dificil de atualizar quando uma mudanca arquitetural legitima acontece
- false stability: artefato nunca foi alterado mas nao foi testado em todas as condicoes

### quando-usar
- comportamentos criticos de runtime ja estabilizados
- invariantes do ecossistema que nunca devem regredir
- regras fundamentais de governanca que definem a identidade do sistema

### o-que-impede-mudanca
- mudancas em stable exigem:
  - justificativa arquitetural documentada (nao apenas operacional)
  - avaliacao de impacto em todos os dominios que dependem do artefato
  - registro formal no historico-de-versao
  - gabriel aprova explicitamente

### regressao-de-stable
- se comportamento estabilizado regredir → artefato nao retorna para stable automaticamente
- deve passar por approved → validating → approved → stable novamente

### quem-pode-propor-mudanca
- qualquer agente ou ia pode propor
- gabriel aprova

### validacao-empirica-necessaria
ja realizada para atingir stable

### uso-operacional-real-necessario
ja realizado

---

## deprecated

### significado-operacional
nao recomendado para uso. mantido apenas por referencia historica ou compatibilidade.

### nivel-de-confiabilidade
nao confiavel para uso ativo. apenas para referencia de historico.

### objetivo
marcar artefatos que foram substituidos ou superados sem deletar historico.

### comportamento-esperado
- nao deve ser consumido por ias como contexto ativo
- pode ser referenciado para entender historico de decisao
- nao recebe manutencao ativa

### riscos-do-status
- ser consumido por ia como contexto valido por falta de sinalizacao clara
- ser mantido como deprecated indefinidamente quando deveria ser archived

### quando-usar
- artefato substituido por versao mais nova
- comportamento que foi superado por contrato mais recente
- regra que foi revogada mas cujo historico importa

### requisitos-para-deprecated
- artefato substituto identificado e referenciado
- motivo da deprecacao documentado no proprio artefato
- sistemas que dependiam do artefato notificados

### quando-arquivar
- apos confirmacao de que nenhum sistema ativo depende do artefato
- apos periodo de referencia historica suficiente

### quem-pode-deprecar
- gabriel

---

## archived

### significado-operacional
congelado. sem manutencao. sem uso ativo. historico preservado.

### nivel-de-confiabilidade
zero para uso operacional. apenas referencia historica.

### objetivo
preservar historico sem poluir o contexto ativo do sistema.

### comportamento-esperado
- nao aparece em bootstrap de contexto de ias
- nao recebe leitura ativa em sessoes operacionais
- existe apenas como registro historico

### quando-usar
- artefato deprecated que ja nao tem valor de referencia ativa
- experimentos encerrados
- outputs antigos de ia sem utilidade atual

### quem-pode-arquivar
- gabriel

---

# fluxo-oficial-de-promocao

```
draft
  → revisao por gabriel
  → validating

validating
  → ciclo de uso real sem regressao
  → gabriel valida explicitamente
  → approved

approved
  → multiplos ciclos sem necessidade de alteracao
  → gabriel avalia maturidade de invariante
  → stable

stable
  → sistema evolui e artefato fica obsoleto
  → gabriel depreca com substituto identificado
  → deprecated

deprecated
  → periodo de referencia historica encerrado
  → gabriel arquiva
  → archived
```

---

# fluxo-de-regressao-de-status

regressao acontece quando o comportamento definido pelo artefato falha em uso real.

```
stable → approved
  quando: comportamento estabilizado regride em uso real
  acao: registrar regressao em known-problems.md, revisar artefato

approved → validating
  quando: problema ativo encontrado relacionado ao artefato
  acao: registrar problema, iniciar novo ciclo de validacao

validating → draft
  quando: conteudo se mostrou inconsistente com o sistema
  acao: rever estrutura antes de qualquer uso

qualquer status → deprecated
  quando: artefato foi substituido por versao mais adequada
  acao: referenciar substituto, documentar motivo
```

regressao nao e falha — e sinal de que o sistema esta funcionando corretamente.

---

# regras-por-categoria-de-artefato

## outputs-de-ia

| regra | descricao |
|---|---|
| destino inicial obrigatorio | `02-ai/outputs/` |
| status inicial obrigatorio | draft |
| promocao automatica | proibida — exige revisao de gabriel |
| pode ser contexto oficial | apenas apos promocao para validating ou superior |
| pode ser consumido por ia como verdade | apenas se status approved ou superior |

## contratos-operacionais

| regra | descricao |
|---|---|
| status minimo para uso operacional | validating |
| status minimo para ser referenciado como invariante | approved |
| mudanca sem justificativa | proibida em approved ou superior |
| requer historico-de-versao | sim, a partir de approved |
| regressao de comportamento | deve bloquear uso ate resolucao |

## runtime-protegido

| regra | descricao |
|---|---|
| status minimo em approved-behaviors.md | approved |
| qualquer regressao de comportamento | registrada imediatamente em known-problems.md |
| mudanca de comportamento aprovado | exige contrato de impacto usando template de protected-systems-contracts |
| novo comportamento | entra como draft ou experimental, nao direto como approved |

## documentos-de-governanca

| regra | descricao |
|---|---|
| destino | `00-governance/` |
| status inicial recomendado | validating ou approved conforme maturidade |
| mudanca | documentada com motivo e impacto |
| pode ser bypassado | nunca |

---

# diferencas-entre-tipos-de-artefato

| tipo | onde vive | status inicial | pode ser referencia | exige validacao empirica |
|---|---|---|---|---|
| output bruto | `02-ai/outputs/` | draft | nao | nao |
| contexto consolidado | `01-active-context/` | validating | sim (com ressalva) | sim |
| contrato operacional | `01-active-context/` ou `00-governance/` | validating | sim (approved+) | sim |
| runtime protegido | `01-active-context/approved-behaviors.md` | approved | sim | sim |

---

# sinais-de-promotion-inflation

promotion inflation acontece quando artefatos recebem status superior ao que o comportamento real justifica.

sinais:
- artefato promovido para approved sem ciclo de uso em validating
- contrato criado e imediatamente marcado como stable sem uso real
- output de ia promovido sem revisao por gabriel
- dominio marcado como stable antes de ter comportamento consistente documentado
- historico-de-versao ausente em artefatos approved ou superior

consequencia de inflation:
- falsa seguranca arquitetural
- ias consumindo contexto incorreto como verdade
- regressoes nao detectadas

---

# sinais-de-regressao-arquitetural

regressao arquitetural acontece quando o sistema degrada sem que ninguem perceba.

sinais:
- comportamento em known-problems.md sem resolucao ha multiplos ciclos
- artefato approved sendo modificado sem registro de versao
- dominio sem owner ativo tomando decisoes sem contrato
- output bruto sendo consumido por ia como contexto confiavel
- contrato operacional sendo ignorado em proposta de mudanca
- artefato em status approved sem uso real detectavel
- multiploss artefatos em draft sem fluxo de promocao ou descarte

---

# regra-anti-acumulacao

todo artefato em draft ou experimental deve ter:
- data de criacao registrada no metadata
- revisao em no maximo 30 dias ou ser arquivado

artefatos em validating sem movimento por mais de 60 dias devem ser:
- promovidos para approved se comportamento e consistente
- regredidos para draft se conteudo perdeu relevancia
- arquivados se nao ha uso ativo

---

# historico-de-versao

| versao | data | descricao |
|---|---|---|
| v1.0 | 2026-05-15 | criacao inicial — lifecycle completo de status do ecossistema |
