import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Loader2,
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

function ImportPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [issues, setIssues] = useState<BacklogIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Importar Backlog (Excel)
              </h1>
              <p className="text-xs text-muted-foreground">
                Carrega um ficheiro .xlsx no formato de import do Jira
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

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
        {/* Upload */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <label
            htmlFor="xlsx-input"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/80 bg-background/40 px-6 py-10 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
          >
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
            <span className="text-sm font-medium">
              {fileName ?? "Clica para escolher um ficheiro .xlsx"}
            </span>
            <span className="text-xs text-muted-foreground">
              Colunas esperadas: Summary, Issue Type, Priority, Story Points, Epic
              Link, Sprint, Description, Acceptance Criteria
            </span>
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
            <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Preview */}
        {issues.length > 0 && (
          <div className="rounded-xl border border-border bg-card/50">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-5 py-3">
              <div>
                <h2 className="text-sm font-semibold">
                  {issues.length.toLocaleString("pt-PT")} issues prontas a importar
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pré-visualização das primeiras linhas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar CSV para Jira
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1.5 text-xs font-medium hover:bg-background"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">#</th>
                    <th className="px-4 py-2 font-medium">Summary</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Priority</th>
                    <th className="px-4 py-2 font-medium">SP</th>
                    <th className="px-4 py-2 font-medium">Epic</th>
                    <th className="px-4 py-2 font-medium">Sprint</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((i, idx) => (
                    <tr key={idx} className="border-t border-border/40 align-top">
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2">{i.summary}</td>
                      <td className="px-4 py-2 text-xs">{i.issueType}</td>
                      <td className="px-4 py-2 text-xs">{i.priority}</td>
                      <td className="px-4 py-2 text-xs">{i.storyPoints ?? "—"}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {i.epicLink || "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {i.sprint || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
              Para importar no Jira: <strong>Settings → System → External
              system import → CSV</strong>, carrega o ficheiro exportado e
              mapeia as colunas.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
