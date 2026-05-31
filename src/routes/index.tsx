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
