
## Âmbito

Adicionar duas novas funcionalidades ao AgileAI:
- **EP-7 — Sumário de Incidente** (`incident`)
- **EP-8 — Melhorias ao Pipeline** (`pipeline`)

Sem mexer nas 6 funcionalidades existentes nem nos sub-modos.

## Alterações

### 1. `src/lib/prompts.ts`
- Adicionar 2 entradas a `FEATURES`:
  - `{ id: "incident", name: "Sumário de Incidente", epic: "EP-7", short: "Problema, impacto, causa raiz, solução" }`
  - `{ id: "pipeline", name: "Melhorias ao Pipeline", epic: "EP-8", short: "Análise de gargalos e sugestões DevOps" }`
- Adicionar placeholders em `PLACEHOLDERS`.
- Adicionar `SYSTEM_PROMPTS` em PT-PT, com estrutura de saída fixa para permitir validação:

  **Incident** — devolve markdown com EXATAMENTE estas secções, por esta ordem:
  ```
  ## Severidade
  ## Problema
  ## Impacto
  ## Causa Raiz
  ## Solução
  ```
  Máx. 150 palavras totais. Severidade ∈ {Crítica, Alta, Média, Baixa}.

  **Pipeline** — devolve markdown com:
  ```
  ## Gargalos Identificados
  ## Práticas Desaconselhadas
  ## Sugestões de Melhoria (≥3)
  ## Ferramentas Recomendadas
  ```
  Cada sugestão referencia ferramentas DevOps standard (GitHub Actions, GitLab CI, Jenkins, ArgoCD, etc.).

### 2. `src/lib/validate-input.ts` (validação do input)
- `incident`: min 40 chars, exige menção a impacto/sistema/erro/falha.
- `pipeline`: min 30 chars, exige menção a build/test/deploy/CI/CD/pipeline.
- Adicionar hints em `featureHints`.

### 3. `src/routes/api/generate.ts` (validação da saída)
Adicionar validação estruturada **server-side** ao output do modelo antes de devolver ao cliente:

- Para `incident`: verificar que o output contém os 5 cabeçalhos obrigatórios (`## Severidade`, `## Problema`, `## Impacto`, `## Causa Raiz`, `## Solução`) e que a contagem de palavras ≤ 180 (margem). Se falhar, **uma tentativa de retry** com instrução extra a reforçar o formato; se voltar a falhar, devolver 502 com mensagem clara.
- Para `pipeline`: verificar presença de `## Gargalos Identificados`, `## Sugestões de Melhoria` e ≥3 bullets na secção de sugestões. Mesmo retry/fallback.
- Função utilitária `validateOutput(feature, text): { ok, reason? }` para manter `POST` legível.

### 4. `src/routes/index.tsx`
- Adicionar ícones para os 2 novos modos no map `ICONS`:
  - `incident` → `AlertTriangle`
  - `pipeline` → `GitBranch`
- O dropdown/sidebar já itera `FEATURES`, portanto os novos modos aparecem automaticamente.

## Detalhes técnicos

- Modelo continua `claude-sonnet-4-20250514` com fallback existente.
- Erros de validação de saída devolvem `{ error: "Resposta não respeitou o formato esperado." }` com status 502.
- Sem alterações ao Jira, parser de Excel ou `__root.tsx`.

## Fora deste plano

- Sub-modos para as features existentes.
- Validação por JSON Schema (mantemos markdown estruturado — mais simples para o utilizador copiar).

Confirma para eu implementar.
