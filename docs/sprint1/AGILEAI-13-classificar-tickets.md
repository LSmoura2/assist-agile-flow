# AGILEAI-13 - Classificar tickets por tipo (bug, feature, melhoria, dívida técnica)

**Épico:** EP-2 - Gestão e Priorização de Backlog
**Sprint:** Sprint 1 (15 Mar – 29 Mar 2026)
**Story Points:** 3
**Estado:** ✅ DONE

## User Story

Como Scrum Master, quero fornecer uma descrição de ticket e obter a sua classificação automática, para organizar o backlog de forma mais eficiente sem categorização manual.

## Critérios de Aceitação

1. Classifica em 4 categorias: Bug / Feature / Melhoria / Dívida Técnica
2. Inclui justificação de 1-2 frases
3. Precisão ≥ 80% em exemplos de teste
4. Utilizador pode corrigir classificação

## Notas de Implementação

- Utiliza endpoint POST /api/generate com feature: "classify-ticket"
- Prompt inclui definição de cada categoria com exemplos
- Resposta estruturada: { category, confidence, justification }
