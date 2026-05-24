import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowRightCircle,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  Minus,
  Search,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import {
  parseBacklogFile,
  issuesToJiraCsv,
  type BacklogIssue,
} from "@/lib/parse-backlog";

export const Route = createFileRoute("/importar")({
  component: ImportPage,
});

type PriorityKey = "high" | "medium" | "low";

function normalizePriority(p: string): PriorityKey {
  const v = p.trim().toLowerCase();
  if (["highest", "high", "alta", "crítica", "critica", "critical"].includes(v))
    return "high";
  if (["low", "lowest", "baixa", "minor", "trivial"].includes(v)) return "low";
  return "medium";
}

function aiScoreFor(issue: BacklogIssue, prio: PriorityKey): number {
  // Pontuação determinística: prioridade pesa mais, story points e contexto somam.
  let score = prio === "high" ? 82 : prio === "medium" ? 70 : 58;
  if (issue.storyPoints != null) {
    if (issue.storyPoints <= 3) score += 6;
    else if (issue.storyPoints <= 8) score += 10;
    else score += 4;
  }
  if (issue.acceptanceCriteria && issue.acceptanceCriteria.length > 20) score += 6;
  if (issue.description && issue.description.length > 40) score += 4;
  return Math.min(99, Math.max(35, score));
}

function labelsFor(issue: BacklogIssue): string[] {
  const out: string[] = [];
  const t = issue.issueType?.toLowerCase() ?? "";
  if (t.includes("bug")) out.push("bug");
  else if (t.includes("task")) out.push("task");
  else if (t.includes("story")) out.push("feature");
  else if (t) out.push(t);
  const epic = issue.epicLink?.toLowerCase() ?? "";
  if (epic.includes("front")) out.push("frontend");
  else if (epic.includes("back") || epic.includes("api")) out.push("backend");
  else if (epic.includes("design") || epic.includes("ui")) out.push("design");
  else if (epic.includes("devops") || epic.includes("ci")) out.push("devops");
  else if (epic.includes("test") || epic.includes("qa")) out.push("qa");
  return out.slice(0, 2);
}

function PriorityCell({ p }: { p: PriorityKey }) {
  if (p === "high")
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400">
        <ArrowUp className="h-3.5 w-3.5" /> Alta
      </span>
    );
  if (p === "low")
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-sky-600 dark:text-sky-400">
        <ArrowDown className="h-3.5 w-3.5" /> Baixa
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Minus className="h-3.5 w-3.5" /> Média
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 85
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
      : score >= 70
        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
        : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums ${tone}`}
    >
      {score}/100
    </span>
  );
}

function LabelChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
      {name}
    </span>
  );
}

function ImportPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [issues, setIssues] = useState<BacklogIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [aiSort, setAiSort] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nextSprintLabel, setNextSprintLabel] = useState("Próximo Sprint");
  const [aiScores, setAiScores] = useState<Map<string, number>>(new Map());
  const [aiJustifications, setAiJustifications] = useState<Map<string, string>>(
    new Map(),
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  function detectNextSprint(list: BacklogIssue[]): string {
    let max = 0;
    for (const i of list) {
      const m = i.sprint?.match(/(\d+)/);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return max > 0 ? `Sprint ${max + 1}` : "Próximo Sprint";
  }

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setIssues([]);
    setFileName(file.name);
    try {
      const parsed = await parseBacklogFile(file);
      if (parsed.length === 0) {
        setError(
          "Não encontrei linhas válidas. Verifica que a primeira folha tem o cabeçalho: Summary, Issue Type, Priority, Story Points, Epic Link, Sprint, Description, Acceptance Criteria.",
        );
      }
      setIssues(parsed);
      setNextSprintLabel(detectNextSprint(parsed));
      setSelected(new Set());
      setAiScores(new Map());
      setAiJustifications(new Map());
      setAiError(null);
      setAiSort(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao ler o ficheiro.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const csv = issuesToJiraCsv(issues);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backlog_jira.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setFileName(null);
    setIssues([]);
    setError(null);
    setSelected(new Set());
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(ids: string[]) {
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function moveSelectedToNextSprint() {
    if (selected.size === 0) return;
    const target = nextSprintLabel;
    setIssues((prev) =>
      prev.map((issue, idx) => {
        const id = `DEV-${(240 + idx).toString()}`;
        return selected.has(id) ? { ...issue, sprint: target } : issue;
      }),
    );
    setSelected(new Set());
  }

  function norm(s: string) {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  async function runAiSort() {
    if (issues.length === 0 || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const input = issues.map((i) => `- ${i.summary}`).join("\n");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "backlog", input }),
      });
      const json = (await res.json()) as { output?: string; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Falha a contactar o serviço de IA.");
      }
      const output = json.output ?? "";
      // Parse "N. **Título** — ..." optionally followed by "_Justificação: ..._"
      const lineRe =
        /^\s*(\d+)\.\s+\*\*(.+?)\*\*[^\n]*(?:\n[ \t]*_Justifica[çc][aã]o:\s*([^_]+?)\._?)?/gm;
      const ranked: Array<{ rank: number; title: string; just: string }> = [];
      let m: RegExpExecArray | null;
      while ((m = lineRe.exec(output)) !== null) {
        ranked.push({
          rank: Number(m[1]),
          title: m[2].trim(),
          just: (m[3] ?? "").trim(),
        });
      }
      if (ranked.length === 0) {
        throw new Error("Não foi possível interpretar a resposta da IA.");
      }
      // Match each ranked title to an issue by normalized inclusion
      const normIssues = issues.map((i, idx) => ({
        id: `DEV-${(240 + idx).toString()}`,
        n: norm(i.summary),
      }));
      const scores = new Map<string, number>();
      const justs = new Map<string, string>();
      const used = new Set<string>();
      ranked.sort((a, b) => a.rank - b.rank);
      ranked.forEach((r, idx) => {
        const nt = norm(r.title);
        const match = normIssues.find(
          (ni) =>
            !used.has(ni.id) && (ni.n === nt || ni.n.includes(nt) || nt.includes(ni.n)),
        );
        if (!match) return;
        used.add(match.id);
        const score = Math.max(50, 99 - idx * Math.max(1, Math.floor(49 / ranked.length)));
        scores.set(match.id, score);
        if (r.just) justs.set(match.id, r.just);
      });
      if (scores.size === 0) {
        throw new Error("A IA respondeu mas não foi possível mapear os itens.");
      }
      setAiScores(scores);
      setAiJustifications(justs);
      setAiSort(true);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setAiLoading(false);
    }
  }


  const enriched = useMemo(
    () =>
      issues.map((i, idx) => {
        const prio = normalizePriority(i.priority);
        return {
          issue: i,
          id: `DEV-${(240 + idx).toString()}`,
          prio,
          score: aiScoreFor(i, prio),
          labels: labelsFor(i),
        };
      }),
    [issues],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? enriched.filter(
          (e) =>
            e.issue.summary.toLowerCase().includes(q) ||
            e.id.toLowerCase().includes(q) ||
            e.issue.description.toLowerCase().includes(q),
        )
      : enriched;
    if (aiSort) {
      return [...base].sort((a, b) => b.score - a.score);
    }
    return base;
  }, [enriched, query, aiSort]);

  const topPicks = useMemo(
    () =>
      [...enriched]
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map((e) => e.id),
    [enriched],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Backlog</h1>
              <p className="text-xs text-muted-foreground">
                Importa um .xlsx (formato Jira) e prioriza com a IA
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1.5 text-xs font-medium hover:bg-background"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        {/* Search + actions bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar itens do backlog…"
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-secondary"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
          <button
            type="button"
            onClick={() => setAiSort((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ background: "var(--gradient-ai)" }}
          >
            <Sparkles className="h-4 w-4" />
            {aiSort ? "Ordem AI ✓" : "AI Sort"}
          </button>
        </div>

        {/* Upload card (compact) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <label
            htmlFor="xlsx-input"
            className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border-2 border-dashed border-border/80 bg-background/40 px-5 py-4 text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
          >
            <div className="flex items-center gap-3">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <Upload className="h-6 w-6 text-primary" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {fileName ?? "Carregar ficheiro .xlsx"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Summary, Issue Type, Priority, Story Points, Epic Link, Sprint…
                </p>
              </div>
            </div>
            {issues.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDownload();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar CSV
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    reset();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1.5 text-xs font-medium hover:bg-background"
                >
                  Limpar
                </button>
              </div>
            )}
            <input
              id="xlsx-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </label>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* AI recommendation */}
        {enriched.length > 0 && (
          <div
            className="rounded-2xl border p-4 shadow-sm"
            style={{
              background:
                "linear-gradient(90deg, color-mix(in oklab, var(--ai-from) 12%, white), color-mix(in oklab, var(--ai-to) 8%, white))",
              borderColor: "color-mix(in oklab, var(--ai-from) 25%, transparent)",
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
                  Com base na prioridade, story points e clareza dos critérios,
                  considera priorizar{" "}
                  {topPicks.length > 0 ? (
                    <strong className="font-semibold">{topPicks.join(" e ")}</strong>
                  ) : (
                    "os itens com maior AI Score"
                  )}{" "}
                  para o próximo sprint.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {enriched.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">
                {filtered.length.toLocaleString("pt-PT")} itens
                <span className="ml-1 font-normal text-muted-foreground">
                  · {issues.length.toLocaleString("pt-PT")} no total
                </span>
                {selected.size > 0 && (
                  <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {selected.size} selecionado{selected.size === 1 ? "" : "s"}
                  </span>
                )}
              </h2>
              {selected.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1.5 text-xs font-medium hover:bg-background"
                  >
                    Limpar seleção
                  </button>
                  <button
                    type="button"
                    onClick={moveSelectedToNextSprint}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <ArrowRightCircle className="h-3.5 w-3.5" />
                    Mover para {nextSprintLabel}
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-10 px-5 py-3">
                      <input
                        type="checkbox"
                        aria-label="Selecionar todos"
                        className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                        checked={
                          filtered.length > 0 &&
                          filtered.every((e) => selected.has(e.id))
                        }
                        onChange={() => toggleAll(filtered.map((e) => e.id))}
                      />
                    </th>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Título</th>
                    <th className="px-5 py-3">Prioridade</th>
                    <th className="px-5 py-3 text-center">Pontos</th>
                    <th className="px-5 py-3">AI Score</th>
                    <th className="px-5 py-3">Labels</th>
                    <th className="px-5 py-3">Sprint</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr
                      key={e.id}
                      className={`border-t border-border/60 align-top transition-colors hover:bg-muted/30 ${selected.has(e.id) ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-5 py-4 align-middle">
                        <input
                          type="checkbox"
                          aria-label={`Selecionar ${e.id}`}
                          className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                          checked={selected.has(e.id)}
                          onChange={() => toggleRow(e.id)}
                        />
                      </td>
                      <td className="px-5 py-4 align-middle text-sm font-medium text-muted-foreground">
                        {e.id}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">
                          {e.issue.summary}
                        </p>
                        {e.issue.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {e.issue.description}
                          </p>
                        )}
                        {topPicks.includes(e.id) && (
                          <p
                            className="mt-1.5 inline-flex items-center gap-1 text-xs"
                            style={{ color: "var(--ai-to)" }}
                          >
                            <Sparkles className="h-3 w-3" />
                            Alto valor de negócio · critérios claros
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <PriorityCell p={e.prio} />
                      </td>
                      <td className="px-5 py-4 text-center align-middle">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-border bg-background px-2 text-xs font-semibold tabular-nums">
                          {e.issue.storyPoints ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <ScoreBadge score={e.score} />
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {e.labels.length > 0 ? (
                            e.labels.map((l) => <LabelChip key={l} name={l} />)
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle text-sm text-muted-foreground">
                        {e.issue.sprint ? (
                          <span className="text-foreground/80">{e.issue.sprint}</span>
                        ) : (
                          "Por atribuir"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
              Para importar no Jira: <strong>Settings → System → External
              system import → CSV</strong>, carrega o ficheiro exportado e mapeia
              as colunas.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
