# AgileAI Assistant

AI-powered assistant for Agile and DevOps teams - **Mestrado em Informática e Gestão · ISCTE-IUL · 2025/2026**

## O que faz

O AgileAI Assistant ajuda equipas de software com funcionalidades de IA para:

- Gerar e reformular User Stories
- Priorizar e classificar itens de backlog
- Resumir reuniões e extrair action items
- Apoiar Sprint Planning, Review e Retrospetiva
- Avaliar readiness de releases e identificar riscos

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TanStack Start + TypeScript |
| Bundler | Vite + @cloudflare/vite-plugin |
| UI | Radix UI + shadcn/ui + Tailwind CSS |
| Backend | Cloudflare Workers (src/server.ts) |
| IA | Anthropic Claude via AI SDK |
| Package Manager | Bun |
| Deploy | Wrangler CLI → Cloudflare Workers |

---

## Pré-requisitos

- [Bun](https://bun.sh) >= 1.1 — `curl -fsSL https://bun.sh/install | bash`
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — `bun install -g wrangler`
- Conta [Cloudflare](https://dash.cloudflare.com) (gratuita)
- Chave API da [Anthropic](https://console.anthropic.com)

---

## Instalação local

```bash
# 1. Clonar o repositório
git clone https://github.com/LSmoura2/assist-agile-flow.git
cd assist-agile-flow

# 2. Instalar dependências
bun install

# 3. Criar ficheiro de variáveis de ambiente locais
cp .dev.vars.example .dev.vars
# Editar .dev.vars e preencher a chave da API
```

### Ficheiro `.dev.vars` (segredos locais — nunca fazer commit)

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxx
```

---

## Desenvolvimento local

```bash
bun run dev
```

A aplicação fica disponível em **http://localhost:5173**

O servidor Cloudflare Worker corre localmente via `wrangler dev` integrado no Vite.

---

## Build de produção

```bash
bun run build
```

Os artefactos são gerados em `.output/` (TanStack Start + Cloudflare adapter).

---

## Deploy para Cloudflare Workers

### 1. Autenticar no Cloudflare

```bash
wrangler login
```

### 2. Configurar o segredo da API no Cloudflare

```bash
wrangler secret put ANTHROPIC_API_KEY
# Introduzir a chave quando pedido
```

### 3. Fazer deploy

```bash
bun run build
wrangler deploy
```

A aplicação fica publicada em `https://tanstack-start-app.<subdomain>.workers.dev`

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `ANTHROPIC_API_KEY` | Sim | Chave da API Anthropic (Console → API Keys) |

---

## Estrutura do Projeto

```
assist-agile-flow/
├── src/
│   ├── routes/          # Páginas (TanStack Start file-based routing)
│   ├── components/      # Componentes React reutilizáveis
│   └── server.ts        # Entry point Cloudflare Worker
├── docs/
│   └── sprint1/         # Documentação das User Stories do Sprint 1
├── .github/
│   └── workflows/       # Pipelines CI/CD (GitHub Actions)
├── wrangler.jsonc        # Configuração Cloudflare Workers
├── vite.config.ts        # Configuração Vite + Cloudflare plugin
└── .dev.vars             # Segredos locais (não versionado)
```

---

## CI/CD

O pipeline GitHub Actions (`.github/workflows/ci.yml`) executa automaticamente em cada push:

1. `bun install` — instalar dependências
2. `bun run lint` — verificar qualidade do código
3. `bun run build` — validar build de produção

---

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Estado do serviço |
| POST | `/api/generate` | Gerar resposta IA |

### Exemplo POST /api/generate

```json
{
  "feature": "user-story",
  "input": "Sistema de notificações por email para encomendas"
}
```

Valores de `feature`: `user-story` · `refine-story` · `acceptance-criteria` · `prioritize-backlog` · `classify-ticket` · `meeting-summary`

---

## Projeto académico

- **Unidade Curricular:** Gestão de Projetos de Aplicações (GPA)
- **Instituição:** ISCTE-IUL
- **Ano letivo:** 2025/2026
- **Jira:** [AGILEAI @ Atlassian](https://iscte-iul-team-lpv3q19q.atlassian.net/jira/software/projects/AGILEAI/boards/34)
