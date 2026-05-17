import type { FeatureId } from "./prompts";

export type ValidationResult =
  | { ok: true }
  | { ok: false; title: string; hints: string[] };

const MIN_CHARS: Record<FeatureId, number> = {
  "user-story": 15,
  backlog: 20,
  meeting: 80,
  sprint: 40,
  release: 40,
  tests: 30,
};

const MIN_WORDS: Record<FeatureId, number> = {
  "user-story": 4,
  backlog: 4,
  meeting: 20,
  sprint: 10,
  release: 10,
  tests: 8,
};

function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function lineCount(text: string): number {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean).length;
}

export function validateInput(feature: FeatureId, raw: string): ValidationResult {
  const input = raw.trim();

  if (!input) {
    return {
      ok: false,
      title: "Please enter some context before generating.",
      hints: ["The input field is empty — add a description of what you need."],
    };
  }

  if (input.length < MIN_CHARS[feature] || wordCount(input) < MIN_WORDS[feature]) {
    return {
      ok: false,
      title: "This input is too short to produce a useful result.",
      hints: featureHints(feature),
    };
  }

  // Feature-specific structural checks
  switch (feature) {
    case "backlog": {
      if (lineCount(input) < 2) {
        return {
          ok: false,
          title: "Backlog needs at least 2 items (one per line).",
          hints: [
            "Paste each backlog item on its own line.",
            "Example:\n- Add login with Google\n- Fix checkout bug",
          ],
        };
      }
      break;
    }
    case "sprint": {
      const hasCapacity = /\b\d+\s*(sp|story\s*points?|points?|pts?)\b/i.test(input) ||
        /capacity\s*[:=]?\s*\d+/i.test(input);
      if (!hasCapacity) {
        return {
          ok: false,
          title: "Sprint context is missing team capacity.",
          hints: [
            'Include capacity in story points, e.g. "Capacity: 40 SP".',
            "List the candidate backlog items with their estimates.",
          ],
        };
      }
      if (lineCount(input) < 3) {
        return {
          ok: false,
          title: "Sprint context needs more detail.",
          hints: [
            "Add the list of candidate backlog items with estimates.",
            "Mention any constraints or dependencies that affect scope.",
          ],
        };
      }
      break;
    }
    case "release": {
      const mentionsFeatures = /\b(feature|module|story|epic|ticket)s?\b/i.test(input);
      const mentionsStatus = /\b(test|tested|qa|bug|defect|coverage|passing|failing|blocker)s?\b/i.test(input);
      if (!mentionsFeatures || !mentionsStatus) {
        return {
          ok: false,
          title: "Release context is missing key information.",
          hints: [
            "List the features included in the release.",
            "Describe the test status (coverage, passing/failing).",
            "Mention any known bugs or blockers.",
          ],
        };
      }
      break;
    }
    case "tests": {
      const mentionsCriteria = /(acceptance criteria|given|when|then|as a\b|i want\b)/i.test(input);
      if (!mentionsCriteria) {
        return {
          ok: false,
          title: "A user story with acceptance criteria is required.",
          hints: [
            'Include the story in "As a … I want … so that …" format.',
            'Provide at least one acceptance criterion in Given / When / Then form.',
          ],
        };
      }
      break;
    }
    case "meeting": {
      if (lineCount(input) < 3) {
        return {
          ok: false,
          title: "Meeting notes look too sparse.",
          hints: [
            "Paste the raw notes — attendees, discussion points, decisions and commitments.",
            "More context yields a more accurate summary.",
          ],
        };
      }
      break;
    }
    case "user-story": {
      // Vague single-word / placeholder inputs
      const looksVague = /^(test|todo|asap|something|stuff|thing|feature x?)\b/i.test(input);
      if (looksVague) {
        return {
          ok: false,
          title: "This description is too vague.",
          hints: featureHints("user-story"),
        };
      }
      break;
    }
  }

  return { ok: true };
}

function featureHints(feature: FeatureId): string[] {
  switch (feature) {
    case "user-story":
      return [
        "Who is the user? (persona / role)",
        "What action or capability do they need?",
        "What benefit or outcome does it deliver?",
      ];
    case "backlog":
      return [
        "Paste at least 2 backlog items, one per line.",
        "Use short, clear titles — e.g. 'Add SSO login', 'Fix cart total bug'.",
      ];
    case "meeting":
      return [
        "Paste the raw meeting notes (attendees, topics, decisions, action items).",
        "Aim for at least a few sentences of context.",
      ];
    case "sprint":
      return [
        "Include team capacity in story points (e.g. 'Capacity: 40 SP').",
        "List candidate backlog items with estimates.",
        "Mention constraints, dependencies or absences.",
      ];
    case "release":
      return [
        "List the features included in the release.",
        "Describe test status and coverage.",
        "Mention known bugs, blockers or compliance requirements.",
      ];
    case "tests":
      return [
        "Provide a user story in 'As a … I want … so that …' form.",
        "Include at least one Given / When / Then acceptance criterion.",
      ];
  }
}
