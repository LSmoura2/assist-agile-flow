# AGILEAI-12 - Priorizar lista de backlog items por valor, risco e esforço

**Épico:** EP-2 - Gestão e Priorização de Backlog
**Sprint:** Sprint 1 (15 Mar – 29 Mar 2026)
**Story Points:** 5
**Estado:** ✅ DONE

## User Story

Como Product Owner, quero colar uma lista de backlog items e obter uma sugestão de priorização, para focar o sprint nos itens de maior impacto e menor risco.

## Critérios de Aceitação

1. Aceita lista de 3-30 items
2. Classifica por valor/risco/esforço (H/M/L)
3. Lista ordenada com justificação
4. Ajuste de pesos dos critérios
5. Exportação como texto formatado

## Notas de Implementação

- Utiliza endpoint POST /api/generate com feature: "prioritize-backlog"
- Modelo de priorização WSJF (Weighted Shortest Job First) simplificado
- Output inclui tabela markdown com colunas: Item | Valor | Risco | Esforço | Score
