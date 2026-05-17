import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  Check,
  ClipboardCopy,
  ClipboardList,
  FileText,
  FlaskConical,
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
};

function AgileAIPage() {
  const [feature, setFeature] = useState<FeatureId>("user-story");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<{ title: string; hints: string[] } | null>(null);
  const [copied, setCopied] = useState(false);

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
    const check = validateInput(feature, input);
    if (!check.ok) {
      setValidation({ title: check.title, hints: check.hints });
      setError(null);
      return;
    }
    setValidation(null);
    setLoading(true);
    setError(null);
    setOutput("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, input }),
      });
      const data = (await res.json()) as { output?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setOutput(data.output ?? "");
      }
    } catch {
      setError("Network error. Please try again.");
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">AgileAI Assistant</h1>
            <p className="text-xs text-muted-foreground">
              Copiloto de IA para equipas Agile &amp; DevOps
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:py-10">
        {/* Feature selector */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Funcionalidades
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
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
                    }}
                    className={[
                      "group flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                      active
                        ? "border-primary/60 bg-primary/10 ring-1 ring-primary/40"
                        : "border-border bg-card/40 hover:border-primary/40 hover:bg-card",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={[
                          "h-4 w-4 shrink-0",
                          active ? "text-primary" : "text-muted-foreground",
                        ].join(" ")}
                      />
                      <span className="text-sm font-medium">{f.name}</span>
                      {active && (
                        <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                          Ativo
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{f.epic}</span>
                    <span className="hidden text-xs text-muted-foreground lg:block">
                      {f.short}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Workspace */}
        <section className="space-y-6">
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">{activeFeature.name}</h2>
                <p className="text-xs text-muted-foreground">{activeFeature.short}</p>
              </div>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                {activeFeature.epic}
              </span>
            </div>

            <label htmlFor="ai-input" className="sr-only">
              Input
            </label>
            <textarea
              id="ai-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (validation) setValidation(null);
              }}
              placeholder={PLACEHOLDERS[feature]}
              rows={10}
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {charCount.toLocaleString("pt-PT")} caracteres · {wordCount.toLocaleString("pt-PT")} palavras
              </p>
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
              <div className="mt-3 rounded-md border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm">
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
              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {error}
              </div>
            )}
          </div>

          {/* Output */}
          <div className="rounded-xl border border-border bg-card/50">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
              <h3 className="text-sm font-semibold">Resultado</h3>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!output}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
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
            <div className="px-5 py-5">
              {loading && !output ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A pensar…
                </p>
              ) : output ? (
                <article className="markdown-output">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
                </article>
              ) : (
                <p className="text-sm text-muted-foreground">
                  O resultado gerado pela IA vai aparecer aqui. Escolhe uma funcionalidade,
                  cola o teu contexto e carrega em Gerar.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
