# AGILEAI-9 - Reformular User Story existente para melhorar clareza

**Épico:** EP-1 - Geração e Melhoria de User Stories
**Sprint:** Sprint 1 (15 Mar – 29 Mar 2026)
**Story Points:** 3
**Estado:** ✅ DONE

## User Story

Como Scrum Master, quero colar uma user story mal escrita e receber uma versão melhorada, para reduzir ambiguidades antes do sprint planning.

## Critérios de Aceitação

1. Aceita texto livre como input
2. IA identifica e corrige problemas de clareza
3. Mantém intenção original
4. Apresenta resumo de alterações
5. Utilizador pode pedir nova reformulação

## Notas de Implementação

- Funcionalidade integrada na UI base (AGILEAI-26)
- Utiliza endpoint POST /api/generate com feature: "refine-story"
- Preserva o papel (Role) e o objetivo (Goal) da história original
