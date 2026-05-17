
## AgileAI Assistant — Build Plan

A single-page tool that takes a description + selected Agile/DevOps feature, calls Claude via a server route, and renders structured markdown output.

### 1. Backend (TanStack server routes)

**`src/routes/api/health.ts`** — `GET /api/health` returning `{ status: "ok", timestamp }`.

**`src/lib/prompts.ts`** — exports a `SYSTEM_PROMPTS` map keyed by feature id (`user-story`, `backlog`, `meeting`, `sprint`, `release`, `tests`). Each prompt is feature-specific and enforces the exact structured output shape (Gherkin for stories, Decisions/Action Items/Open Points for meetings, go/no-go for release, etc.).

**`src/routes/api/generate.ts`** — `POST /api/generate`
- Validates `{ feature, input }` with Zod (feature must be one of 6 ids, input non-empty, max ~20k chars).
- Reads `process.env.ANTHROPIC_API_KEY` inside the handler. If missing → 500 with clear message.
- Calls `https://api.anthropic.com/v1/messages` directly via `fetch` (no SDK needed, avoids Node-only deps in the Worker runtime):
  - `model: "claude-sonnet-4-20250514"`, on 404/400 model error retries with `claude-3-5-sonnet-20241022`.
  - `max_tokens: 1500`, `temperature: 0`.
  - `system: SYSTEM_PROMPTS[feature]`, `messages: [{ role: "user", content: input }]`.
- Maps upstream errors: 401 → "API key invalid", 429 → "Rate limit, try again shortly", timeout/network → "AI service unavailable".
- Returns `{ output: string }` (raw markdown from Claude's first text block).

Health endpoint will be verified via the invoke-server-function tool before building the UI.

### 2. Design system (`src/styles.css`)

Update tokens to the requested palette in oklch:
- `--background` → #0D1B2A (deep navy)
- `--foreground` → #F0F4F8 (light surface)
- `--primary` → #0891B2 (teal accent)
- Plus card/muted/border tones derived from the navy. Sets dark theme as the default.

### 3. Frontend (`src/routes/index.tsx` + components)

Install `react-markdown` + `remark-gfm`.

Single page (`/`) with:
- **Header** — app title + tagline.
- **Feature selector** — 6 cards/buttons in a responsive grid (sidebar on desktop, horizontal scroll/grid on mobile). Each shows icon (lucide), name, short description. Active feature gets a teal badge + ring.
- **Input area** — large textarea, placeholder changes per selected feature (the 6 specific placeholders from the spec), live character & word count below.
- **Generate button** — disabled when input empty or loading; shows spinner during request.
- **Output area** — renders markdown via `react-markdown` with `prose` styling; Copy-to-clipboard button (with "Copied!" feedback); empty state when no output yet.
- **Error toast** — uses existing `sonner` for API errors.

State is local (useState); no persistence needed per spec. Mobile responsive via Tailwind breakpoints.

### 4. Metadata

Update `__root.tsx` head: title "AgileAI Assistant", description, og tags.

### Build order
1. Prompts file + health route + generate route.
2. Verify `/api/health` and a sample `/api/generate` call via invoke-server-function.
3. Design tokens.
4. UI + react-markdown install.
5. Final visual check.

### Notes
- `ANTHROPIC_API_KEY` stays server-side — only read inside the route handler, never exposed via `VITE_*`.
- Using raw `fetch` to the Anthropic REST API (works in the Cloudflare Worker runtime; the official SDK pulls in Node-only deps).
- No database, no auth — matches the simple scope.
