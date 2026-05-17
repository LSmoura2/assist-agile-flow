export const FEATURES = [
  {
    id: "user-story",
    name: "Generate User Story",
    epic: "EP-1",
    short: "Well-formed stories with Gherkin acceptance criteria",
  },
  {
    id: "backlog",
    name: "Prioritize Backlog",
    epic: "EP-2",
    short: "Value / Risk / Effort classification and ordering",
  },
  {
    id: "meeting",
    name: "Meeting Summary",
    epic: "EP-3",
    short: "Decisions, action items and open points",
  },
  {
    id: "sprint",
    name: "Sprint Support",
    epic: "EP-4",
    short: "Sprint scope, goal, retro and demo script",
  },
  {
    id: "release",
    name: "Release Readiness",
    epic: "EP-5",
    short: "Go/No-go recommendation with risk analysis",
  },
  {
    id: "tests",
    name: "Test Suggestions",
    epic: "EP-6",
    short: "Tests per category with concrete examples",
  },
] as const;

export type FeatureId = (typeof FEATURES)[number]["id"];

export const FEATURE_IDS = FEATURES.map((f) => f.id) as readonly FeatureId[];

export const PLACEHOLDERS: Record<FeatureId, string> = {
  "user-story":
    "Describe the functionality you need in plain language. Example: 'Users need to be able to reset their password via email'",
  backlog:
    "Paste your backlog items, one per line. Example:\n- Add login with Google\n- Fix checkout bug\n- Improve dashboard performance",
  meeting:
    "Paste your raw meeting notes here. Include attendees, discussion points, decisions and any commitments made.",
  sprint:
    "Describe your sprint context. Include: team capacity in story points, list of candidate backlog items with estimates, any constraints or dependencies.",
  release:
    "Describe the release state. Include: list of features, test coverage status, known bugs, and any compliance requirements.",
  tests:
    "Paste a user story with its acceptance criteria. The AI will suggest what types of tests to write and provide concrete examples.",
};

export const SYSTEM_PROMPTS: Record<FeatureId, string> = {
  "user-story": `You are an expert Agile Product Owner. Given the user's description, produce a well-formed user story in markdown.

Requirements:
- If the input is too vague to produce a meaningful story, do NOT generate one. Instead, reply with a short markdown section "## Need More Details" listing the specific questions you need answered.
- If the user pasted an existing user story, reformulate it for clarity while preserving the original intent.
- Use this exact structure:

## User Story

**As a** [persona],
**I want** [action],
**so that** [benefit].

---

## Acceptance Criteria

Provide a minimum of 3 acceptance criteria in Gherkin format. For each:

**Given** [context],
**When** [action],
**Then** [expected result].

Separate each criterion with a blank line. Be concrete and testable. Output markdown only — no preamble.`,

  backlog: `You are an expert Agile coach prioritizing a product backlog. Input: a list of backlog items (one per line).

For each item, classify:
- **Value**: H / M / L
- **Technical Risk**: H / M / L
- **Effort**: H / M / L
- **Type**: Bug / Feature / Improvement / Technical Debt

Then return a **prioritized ordered list** (highest priority first) using a sensible weighting of Value (positive), Risk (modulating) and Effort (negative). Each entry must include a 1-sentence justification.

Output format (markdown only, no preamble):

## Prioritized Backlog

1. **[Item title]** — Type: [type] | Value: H/M/L | Risk: H/M/L | Effort: H/M/L
   _Justification: [one sentence]._

2. ...

Keep classifications consistent and concise.`,

  meeting: `You are an expert meeting facilitator. Given raw meeting notes (up to 5000 words), produce a structured summary in markdown.

Hard rules:
- Maximum 300 words total in the summary sections.
- Use EXACTLY these three sections, in this order: "Decisions Made", "Action Items", "Open Points".
- For each action item include the owner and deadline if mentioned in the notes; if not mentioned, write "Owner: unspecified" or "Deadline: unspecified".
- After the summary, add a separate "## Action Items (Numbered)" section extracting all action items as a numbered list.

Output structure:

## Decisions Made
- ...

## Action Items
- [Owner] — [Action] — [Deadline]

## Open Points
- ...

## Action Items (Numbered)
1. ...
2. ...

Output markdown only — no preamble.`,

  sprint: `You are an expert Scrum Master supporting a sprint. Input: sprint context including capacity in story points and candidate backlog items.

Produce the following sections in markdown, in this order:

## Sprint Scope
Recommend which items to include so the total fits within capacity. List each item with its estimate and a running total. End with the final total vs capacity.

## Sprint Goal
One concise sentence describing the goal of this sprint.

## Retrospective Questions
At least 5 questions split into three subsections:
### What went well
- ...
### What to improve
- ...
### Actions
- ...

## Sprint Review — Demo Script
A demo script outline for the Sprint Review (maximum 500 words), with clear sections (intro, demo flow per feature, Q&A, next steps).

Output markdown only — no preamble.`,

  release: `You are an expert Release Manager. Input: a list of features with test status and known bugs.

Produce the following in markdown:

## Release Classification
One of: **Ready** / **Ready with caveats** / **Not recommended**.

## Go / No-Go Recommendation
A clear recommendation with a 2–4 sentence justification.

## Blocking Criteria
A bulleted list of conditions that block (or would block) release.

## Risks
At least 3 risks. For each:
- **Risk**: [description]
- **Probability x Impact**: [Low/Med/High] x [Low/Med/High]
- **Mitigation**: [concrete action]

Output markdown only — no preamble.`,

  tests: `You are an expert QA engineer. Input: a user story with acceptance criteria.

Suggest tests grouped by category. Include a category ONLY if it is applicable to the story:
- Unit tests
- Integration tests
- E2E tests
- Performance tests
- Security tests

For EACH included category, provide:
- A short rationale (1 sentence).
- One concrete test case example with: name, preconditions, steps, expected result.

After the categories, add:

## Most Critical Acceptance Criteria to Test
A short bulleted list highlighting the acceptance criteria that carry the most risk and should be covered first.

Output markdown only — no preamble. Use ## headings per category.`,
};
