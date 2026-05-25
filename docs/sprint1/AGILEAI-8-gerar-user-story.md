# AGILEAI-8 - Gerar User Story a partir de descrição em linguagem natural

**Épico:** EP-1 - Geração e Melhoria de User Stories
**Sprint:** Sprint 1 (15 Mar – 29 Mar 2026)
**Story Points:** 5
**Estado:** ✅ DONE

## User Story

Como Product Owner, quero descrever uma funcionalidade em linguagem natural e obter uma user story formatada (Como / Quero / Para), para poupar tempo na escrita e garantir consistência no formato.

## Critérios de Aceitação

1. A IA gera user story no formato Como/Quero/Para
2. Inclui 3 critérios de aceitação Gherkin
3. Resultado em menos de 10 segundos
4. Botão copiar para clipboard
5. Pede mais detalhes se input vago

## Notas de Implementação

- Funcionalidade integrada na UI base (AGILEAI-26)
- Utiliza endpoint POST /api/generate com feature: "user-story"
- Prompt engineering para formato Como/Quero/Para com Gherkin
