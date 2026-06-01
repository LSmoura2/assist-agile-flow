import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { BacklogIssue } from "@/lib/parse-backlog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ClipboardCopy,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  Loader2,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";
import {
  FEATURES,
  PLACEHOLDERS,
  type FeatureId,
} from "@/lib/prompts";
import { validateInput } from "@/lib/validate-input";

export const Route = createFileRoute("/")({
  component: AgileAIPage,
});

const ICONS: Record<FeatureId, typeof BookOpen> = {
  "user-story": BookOpen,
  backlog: ClipboardList,
  meeting: FileText,
  sprint: Target,
  release: Rocket,
  tests: FlaskConical,
  incident: AlertTriangle,
  pipeline: GitBranch,
};

const EXAMPLES: Partial<Record<FeatureId, { input: string; output: string }>> = {
  "user-story": {
    input:
      "Os utilizadores precisam de poder redefinir a palavra-passe por email caso a tenham esquecido, sem ter de contactar o suporte.",
    output: `## User Story

**Como** utilizador registado,
**quero** redefinir a minha palavra-passe através de um email de recuperação,
**para que** consiga voltar a aceder à conta sem contactar o suporte.

---

## Critérios de Aceitação

**Dado** que estou na página de login,
**Quando** clico em "Esqueci-me da palavra-passe" e introduzo um email válido associado a uma conta,
**Então** recebo um email com uma ligação de recuperação válida por 30 minutos.

**Dado** que recebi o email de recuperação,
**Quando** abro a ligação dentro do prazo e defino uma nova palavra-passe que cumpre as regras de segurança,
**Então** a palavra-passe é atualizada e sou redirecionado para o login com mensagem de sucesso.

**Dado** que introduzo um email que não está associado a nenhuma conta,
**Quando** submeto o pedido de recuperação,
**Então** o sistema apresenta a mesma mensagem genérica de confirmação, sem revelar se o email existe.`,
  },
  backlog: {
    input:
      "- Adicionar login com Google\n- Corrigir bug crítico no checkout que impede pagamentos\n- Migrar base de dados para nova versão do Postgres\n- Melhorar performance do dashboard\n- Redesenhar página de definições",
    output: `## Backlog Priorizado

1. **Corrigir bug crítico no checkout que impede pagamentos** — Tipo: Bug | Valor: A | Risco: A | Esforço: B
   _Justificação: Bloqueia receita direta; correção urgente com esforço reduzido._

2. **Adicionar login com Google** — Tipo: Funcionalidade | Valor: A | Risco: M | Esforço: M
   _Justificação: Reduz fricção no registo e aumenta conversão de novos utilizadores._

3. **Melhorar performance do dashboard** — Tipo: Melhoria | Valor: M | Risco: B | Esforço: M
   _Justificação: Impacto positivo na retenção com risco técnico controlado._

4. **Migrar base de dados para nova versão do Postgres** — Tipo: Dívida Técnica | Valor: M | Risco: A | Esforço: A
   _Justificação: Importante para sustentabilidade mas exige janela de manutenção e plano de rollback._

5. **Redesenhar página de definições** — Tipo: Melhoria | Valor: B | Risco: B | Esforço: M
   _Justificação: Valor incremental baixo; adiar até libertar capacidade._`,
  },
  meeting: {
    input:
      "Reunião semanal 28/03 — Presentes: Ana (PO), João (SM), Rita e Pedro (devs). Discutimos o atraso da feature de notificações: a Rita explicou que falta integração com o serviço de email. Decidimos adiar a feature para o próximo sprint. O Pedro vai investigar alternativas até sexta. Ficou em aberto se vamos usar SendGrid ou Mailgun. A Ana lembrou que o cliente quer demo a 15/04.",
    output: `## Decisões Tomadas
- Adiar a feature de notificações para o próximo sprint.
- Manter a data da demo com o cliente a 15/04.

## Ações
- Pedro — Investigar alternativas de serviço de email (SendGrid vs Mailgun) — até sexta-feira
- João — Reagendar a feature de notificações no próximo sprint — Prazo: não definido
- Ana — Confirmar agenda da demo com o cliente — Prazo: não definido

## Pontos em Aberto
- Escolha entre SendGrid e Mailgun como provedor de email.
- Impacto do adiamento das notificações no âmbito da demo de 15/04.

## Ações (Numeradas)
1. Pedro investiga alternativas de serviço de email até sexta-feira.
2. João reagenda a feature de notificações no próximo sprint.
3. Ana confirma agenda da demo de 15/04 com o cliente.`,
  },
  sprint: {
    input:
      "Capacidade da equipa: 25 story points. Itens candidatos:\n- Login com Google (5 SP)\n- Página de perfil do utilizador (8 SP)\n- Corrigir bug do checkout (3 SP)\n- Dashboard de métricas (13 SP)\n- Refactor do módulo de autenticação (8 SP)\nDependência: o dashboard depende do login com Google estar entregue.",
    output: `## Âmbito do Sprint
- Corrigir bug do checkout — 3 SP (acumulado: 3)
- Login com Google — 5 SP (acumulado: 8)
- Página de perfil do utilizador — 8 SP (acumulado: 16)
- Refactor do módulo de autenticação — 8 SP (acumulado: 24)

Total: 24 / 25 SP. O dashboard de métricas fica fora por exceder capacidade e depender de itens deste sprint.

## Objetivo do Sprint
Estabilizar o fluxo de autenticação e desbloquear o checkout para preparar o lançamento do dashboard no sprint seguinte.

## Perguntas para a Retrospetiva
### O que correu bem
- Conseguimos isolar o bug do checkout rapidamente?
- A colaboração entre dev e QA melhorou em relação ao sprint anterior?

### O que melhorar
- As estimativas dos itens grandes (8+ SP) refletiram a realidade?
- Como evitar que dependências entre itens só surjam no planning?

### Ações
- Definir critério de "pronto" mais claro para tarefas de refactor.

## Sprint Review — Guião da Demo
1. **Introdução (2 min):** contexto do sprint e objetivo.
2. **Checkout estabilizado (5 min):** demonstração do fluxo de pagamento corrigido.
3. **Login com Google (5 min):** registo e login end-to-end.
4. **Perfil do utilizador (5 min):** edição de dados e avatar.
5. **Refactor de autenticação (3 min):** explicação técnica do impacto.
6. **Q&A (5 min).**
7. **Próximos passos:** dashboard de métricas no sprint seguinte.`,
  },
  release: {
    input:
      "Release v2.4 prevista para sexta. Funcionalidades: novo onboarding (testes 100% verdes), exportação CSV (testes 80%, 1 bug menor de formatação), integração Stripe (testes 95%, 1 bug crítico em webhooks de reembolso). Sem testes de carga. Conformidade GDPR validada.",
    output: `## Classificação da Release
**Não recomendada**

## Recomendação Go / No-Go
**No-Go** para a data prevista. Existe um bug crítico ativo nos webhooks de reembolso do Stripe que pode causar inconsistências financeiras em produção. A release deve ser adiada até resolução e validação, ou o âmbito reduzido removendo a integração Stripe.

## Critérios Bloqueantes
- Bug crítico nos webhooks de reembolso do Stripe não resolvido.
- Ausência de testes de carga para a nova integração de pagamentos.
- Cobertura de testes da exportação CSV abaixo do limiar interno (80%).

## Riscos
- **Risco:** Reembolsos processados de forma inconsistente em produção.
  - **Probabilidade x Impacto:** Alto x Alto
  - **Mitigação:** Corrigir o webhook, adicionar teste de regressão e validar em staging com transações reais de baixo valor.

- **Risco:** Degradação de performance sob carga real no fluxo de pagamento.
  - **Probabilidade x Impacto:** Médio x Alto
  - **Mitigação:** Executar testes de carga com k6 ou Locust antes do go-live.

- **Risco:** Formatação incorreta no CSV exportado afeta clientes enterprise.
  - **Probabilidade x Impacto:** Médio x Médio
  - **Mitigação:** Corrigir o bug menor e adicionar amostras de validação ao pipeline.`,
  },
  tests: {
    input:
      "User Story: Como utilizador quero filtrar a lista de encomendas por estado (pendente, enviada, entregue) para encontrar rapidamente o que procuro.\nCritérios:\n- O filtro mostra apenas encomendas no estado selecionado.\n- É possível combinar filtro de estado com pesquisa por número.\n- O filtro persiste durante a sessão.",
    output: `## Testes Unitários
Validam a lógica de filtragem isolada do componente, independente da UI e da API.

- **Nome:** filtra encomendas pelo estado selecionado
- **Pré-condições:** lista mock com 3 encomendas em estados distintos
- **Passos:** invocar \`filterOrders(orders, { status: "enviada" })\`
- **Resultado esperado:** devolve apenas a encomenda com estado "enviada"

## Testes de Integração
Validam a interação entre o componente de filtro, o estado partilhado e a chamada à API.

- **Nome:** combinação de filtro de estado com pesquisa por número
- **Pré-condições:** API mock devolve 10 encomendas; utilizador autenticado
- **Passos:** selecionar estado "pendente" e escrever "1234" na pesquisa
- **Resultado esperado:** a chamada à API inclui \`status=pendente&query=1234\` e a UI mostra apenas resultados correspondentes

## Testes E2E
Garantem o fluxo completo do utilizador no browser.

- **Nome:** o filtro persiste durante a sessão
- **Pré-condições:** utilizador autenticado com encomendas em vários estados
- **Passos:** aplicar filtro "entregue", navegar para outra página e voltar à lista
- **Resultado esperado:** o filtro "entregue" continua ativo e a lista mantém-se filtrada

## Critérios de Aceitação Mais Críticos a Testar
- Combinação de filtro de estado com pesquisa por número (maior risco de regressão).
- Persistência do filtro durante a sessão (envolve estado partilhado entre rotas).`,
  },
  incident: {
    input:
      "Ontem por volta das 22h o checkout começou a devolver erro 500 para cerca de 30% dos utilizadores europeus. O problema durou 45 minutos e impediu a finalização de encomendas. Após análise dos logs, descobrimos que uma migração recente à base de dados deixou um índice em falta na tabela orders, o que provocou timeouts no serviço de pagamentos. A solução foi recriar o índice e adicionar alerta de latência.",
    output: `## Severidade
Alta

## Problema
O serviço de checkout devolveu erros HTTP 500 a aproximadamente 30% dos utilizadores europeus durante 45 minutos.

## Impacto
Cerca de um terço das tentativas de compra na região EU falharam, com perda direta de receita e degradação da confiança no produto.

## Causa Raiz
Uma migração recente à base de dados removeu inadvertidamente um índice na tabela \`orders\`, causando timeouts nas chamadas ao serviço de pagamentos.

## Solução
- Recriação imediata do índice em falta na tabela \`orders\`.
- Adição de alerta de latência no serviço de pagamentos.
- Revisão do processo de migrações para incluir verificação de índices críticos.`,
  },
  pipeline: {
    input:
      "O nosso pipeline de CI/CD no GitHub Actions demora cerca de 35 minutos por build. Não temos cache de dependências npm, os testes correm em série, e o deploy para produção é feito manualmente via SSH. Não existe rollback automático nem ambiente de staging. Os testes E2E falham frequentemente de forma intermitente.",
    output: `## Gargalos Identificados
- Build total de ~35 minutos sem cache de dependências npm.
- Testes a correr em série em vez de paralelizados.
- Deploy manual via SSH, lento e sujeito a erro humano.
- Testes E2E instáveis (flaky) bloqueiam merges.

## Práticas Desaconselhadas
- Deploy direto para produção sem ambiente de staging.
- Ausência de rollback automático em caso de falha.
- Falta de isolamento entre execuções de testes E2E.

## Sugestões de Melhoria
- Adicionar \`actions/cache\` para \`node_modules\` e artefactos de build (redução estimada de 40–60% no tempo).
- Paralelizar suites de testes com matrix builds no GitHub Actions.
- Introduzir ambiente de staging com promoção automática staging → produção.
- Implementar deploy automatizado com estratégia blue-green ou canary e rollback automático em falhas de healthcheck.
- Estabilizar testes E2E com retries direcionados e isolamento de dados por execução.

## Ferramentas Recomendadas
- **GitHub Actions** (cache, matrix, environments)
- **Docker** + **Docker Compose** para ambientes reprodutíveis
- **Argo CD** ou **Flux** para GitOps em Kubernetes
- **Playwright** com \`trace\` e \`retries\` para E2E fiáveis
- **Datadog** ou **Grafana** para observabilidade de pipeline e produção`,
  },
};

function AgileAIPage() {
  const [feature, setFeature] = useState<FeatureId>("user-story");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<{ title: string; hints: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [importedBacklog, setImportedBacklog] = useState<BacklogIssue[]>([]);

  // Carrega o backlog importado (persistido pela página /importar) quando a
  // funcionalidade EP-2 "Priorizar Backlog" está ativa.
  useEffect(() => {
    if (feature !== "backlog") return;
    try {
      const raw = localStorage.getItem("imported-backlog");
      if (!raw) {
        setImportedBacklog([]);
        return;
      }
      const parsed = JSON.parse(raw) as BacklogIssue[];
      setImportedBacklog(Array.isArray(parsed) ? parsed : []);
    } catch {
      setImportedBacklog([]);
    }
  }, [feature]);

  const activeFeature = useMemo(
    () => FEATURES.find((f) => f.id === feature)!,
    [feature],
  );

  const charCount = input.length;
  const wordCount = useMemo(
    () => (input.trim() ? input.trim().split(/\s+/).length : 0),
    [input],
  );

  async function handleGenerate() {
    if (loading) return;

    let effectiveInput = input;
    if (feature === "backlog") {
      if (importedBacklog.length < 2) {
        setValidation({
          title: "Importa primeiro um backlog para priorizar.",
          hints: [
            'Vai a "Importar Excel" no menu lateral e carrega um ficheiro .xlsx (formato Jira).',
            "São necessários pelo menos 2 itens para a IA produzir uma ordenação útil.",
          ],
        });
        setError(null);
        return;
      }
      effectiveInput = importedBacklog
        .map((i) => {
          const sp = i.storyPoints != null ? ` (${i.storyPoints} SP)` : "";
          const type = i.issueType ? ` [${i.issueType}]` : "";
          const prio = i.priority ? ` — prioridade ${i.priority}` : "";
          return `- ${i.summary}${type}${prio}${sp}`;
        })
        .join("\n");
    } else {
      const check = validateInput(feature, input);
      if (!check.ok) {
        setValidation({ title: check.title, hints: check.hints });
        setError(null);
        return;
      }
    }

    setValidation(null);
    setLoading(true);
    setError(null);
    setOutput("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, input: effectiveInput }),
      });
      const data = (await res.json()) as { output?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Ocorreu um erro inesperado.");
      } else {
        setOutput(data.output ?? "");
      }
    } catch {
      setError("Erro de rede. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Falha ao copiar.");
    }
  }

  const ActiveIcon = ICONS[feature];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg"
            style={{ background: "var(--gradient-ai)" }}
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">AgileAI</p>
            <p className="text-[11px] text-sidebar-foreground/60">Assistant</p>
          </div>
        </div>

        <div className="px-3 pb-2">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Workspace
          </p>
          <Link
            to="/importar"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Importar Excel</span>
          </Link>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Funcionalidades
          </p>
          <ul className="space-y-1">
            {FEATURES.map((f) => {
              const Icon = ICONS[f.id];
              const active = f.id === feature;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setFeature(f.id);
                      setValidation(null);
                      setSidebarOpen(false);
                    }}
                    className={[
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate font-medium">{f.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border px-5 py-4">
          <p className="text-[11px] text-sidebar-foreground/50">
            Copiloto de IA para equipas Agile &amp; DevOps
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Top bar (mobile) */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium"
          >
            Menu
          </button>
          <p className="text-sm font-semibold">AgileAI</p>
          <div className="w-12" />
        </div>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
                  {activeFeature.epic}
                </span>
                <span>·</span>
                <span>Copiloto Agile &amp; DevOps</span>
              </div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
                <ActiveIcon className="h-7 w-7 text-primary" />
                {activeFeature.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {activeFeature.short}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--gradient-ai)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A gerar…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar com IA
                </>
              )}
            </button>
          </div>

          {/* AI Recommendation banner */}
          <div
            className="mb-6 rounded-xl border p-4"
            style={{
              background:
                "linear-gradient(90deg, color-mix(in oklab, var(--ai-from) 14%, white), color-mix(in oklab, var(--ai-to) 10%, white))",
              borderColor: "color-mix(in oklab, var(--ai-from) 30%, transparent)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ background: "var(--gradient-ai)" }}
              >
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--ai-to)" }}>
                  Recomendação da IA
                </p>
                <p className="mt-0.5 text-sm text-foreground/80">
                  Quanto mais contexto fornecer (objetivo, utilizador-alvo, restrições), melhor o resultado.
                  {EXAMPLES[feature] && " Experimenta o botão de exemplo abaixo para veres a estrutura esperada."}
                </p>
              </div>
            </div>
          </div>

          {/* Input card */}
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">
                {feature === "backlog" ? "Backlog importado" : "Descrição"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {feature === "backlog"
                  ? `${importedBacklog.length.toLocaleString("pt-PT")} ${importedBacklog.length === 1 ? "item" : "itens"}`
                  : `${charCount.toLocaleString("pt-PT")} caracteres · ${wordCount.toLocaleString("pt-PT")} palavras`}
              </span>
            </div>

            <div className="p-5">
              {feature === "backlog" ? (
                importedBacklog.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-background/40 p-6 text-center">
                    <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/70" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      Nenhum backlog importado.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      A IA irá priorizar os itens que importares a partir do Excel/Jira.
                    </p>
                    <Link
                      to="/importar"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Importar Excel
                    </Link>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-background/60">
                    <ul className="divide-y divide-border/60">
                      {importedBacklog.map((i, idx) => (
                        <li key={idx} className="flex items-start gap-3 px-3 py-2 text-sm">
                          <span className="mt-0.5 inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded bg-muted px-1.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">
                              {i.summary}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {[
                                i.issueType,
                                i.priority && `prioridade ${i.priority}`,
                                i.storyPoints != null && `${i.storyPoints} SP`,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "sem metadados"}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ) : (
                <>
                  <label htmlFor="ai-input" className="sr-only">
                    Descrição
                  </label>
                  <textarea
                    id="ai-input"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      if (validation) setValidation(null);
                    }}
                    placeholder={PLACEHOLDERS[feature]}
                    rows={9}
                    className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {EXAMPLES[feature] && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setInput(EXAMPLES[feature]!.input);
                          setValidation(null);
                          setError(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-secondary"
                      >
                        Exemplo de input
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOutput(EXAMPLES[feature]!.output);
                          setError(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-secondary"
                      >
                        Exemplo de output
                      </button>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      A gerar…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Gerar
                    </>
                  )}
                </button>
              </div>

              {validation && (
                <div className="mt-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2.5 text-sm">
                  <p className="font-medium text-foreground">{validation.title}</p>
                  <p className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                    O que ainda preciso
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground/90">
                    {validation.hints.map((h, i) => (
                      <li key={i} className="whitespace-pre-line">{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {error && (
                <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          </section>

          {/* Output card — destacado */}
          <section
            className="relative mt-8 overflow-hidden rounded-2xl p-[1.5px] shadow-lg"
            style={{ background: "var(--gradient-ai)" }}
          >
            <div className="rounded-[calc(1rem-1px)] bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                    style={{ background: "var(--gradient-ai)" }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <h2 className="text-sm font-semibold">Resultado da IA</h2>
                  {loading && (
                    <span
                      className="ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                      style={{ background: "var(--gradient-ai)" }}
                    >
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      A gerar
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!output}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-primary" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="h-3.5 w-3.5" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              <div className="px-6 py-6">
                {loading && !output ? (
                  <div className="space-y-3" aria-live="polite" aria-busy="true">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      A IA está a pensar…
                    </div>
                    <div className="space-y-2.5 pt-2">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-10/12 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="mt-4 h-3 w-1/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-full animate-pulse rounded bg-muted" />
                      <div className="h-3 w-9/12 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ) : output ? (
                  <article className="markdown-output">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
                  </article>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-white opacity-90"
                      style={{ background: "var(--gradient-ai)" }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Pronto para gerar
                    </p>
                    <p className="max-w-md text-xs text-muted-foreground">
                      O resultado gerado pela IA vai aparecer aqui. Escolhe uma funcionalidade,
                      cola o teu contexto e carrega em Gerar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
