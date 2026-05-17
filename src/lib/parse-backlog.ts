import * as XLSX from "xlsx";

export type BacklogIssue = {
  summary: string;
  issueType: string;
  priority: string;
  storyPoints: number | null;
  epicLink: string;
  sprint: string;
  description: string;
  acceptanceCriteria: string;
};

const HEADER_MAP: Record<string, keyof BacklogIssue> = {
  summary: "summary",
  "issue type": "issueType",
  issuetype: "issueType",
  priority: "priority",
  "story points": "storyPoints",
  storypoints: "storyPoints",
  "epic link": "epicLink",
  epiclink: "epicLink",
  epic: "epicLink",
  sprint: "sprint",
  description: "description",
  "acceptance criteria": "acceptanceCriteria",
  acceptancecriteria: "acceptanceCriteria",
};

function normalize(h: string) {
  return String(h ?? "").trim().toLowerCase();
}

export async function parseBacklogFile(file: File): Promise<BacklogIssue[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("O ficheiro não contém folhas.");
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  });

  if (rows.length === 0) return [];

  // Map keys from each row using header map
  const issues: BacklogIssue[] = rows
    .map((row) => {
      const issue: BacklogIssue = {
        summary: "",
        issueType: "Story",
        priority: "Medium",
        storyPoints: null,
        epicLink: "",
        sprint: "",
        description: "",
        acceptanceCriteria: "",
      };
      for (const [rawKey, value] of Object.entries(row)) {
        const key = HEADER_MAP[normalize(rawKey)];
        if (!key) continue;
        if (key === "storyPoints") {
          const n = Number(value);
          issue.storyPoints = Number.isFinite(n) && value !== "" ? n : null;
        } else {
          (issue as Record<string, unknown>)[key] = String(value ?? "").trim();
        }
      }
      return issue;
    })
    .filter((i) => i.summary.length > 0);

  return issues;
}

export function issuesToJiraCsv(issues: BacklogIssue[]): string {
  const headers = [
    "Summary",
    "Issue Type",
    "Priority",
    "Story Points",
    "Epic Link",
    "Sprint",
    "Description",
    "Acceptance Criteria",
  ];
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const i of issues) {
    lines.push(
      [
        i.summary,
        i.issueType,
        i.priority,
        i.storyPoints ?? "",
        i.epicLink,
        i.sprint,
        i.description,
        i.acceptanceCriteria,
      ]
        .map(escape)
        .join(","),
    );
  }
  return lines.join("\n");
}
