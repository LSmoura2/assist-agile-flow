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
  incident: 40,
  pipeline: 30,
};

const MIN_WORDS: Record<FeatureId, number> = {
  "user-story": 4,
  backlog: 4,
  meeting: 20,
  sprint: 10,
  release: 10,
  tests: 8,
  incident: 10,
  pipeline: 8,
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
      title: "Introduz algum contexto antes de gerar.",
      hints: ["O campo está vazio — adiciona uma descrição do que precisas."],
    };
  }

  if (input.length < MIN_CHARS[feature] || wordCount(input) < MIN_WORDS[feature]) {
    return {
      ok: false,
      title: "O input é demasiado curto para produzir um resultado útil.",
      hints: featureHints(feature),
    };
  }

  switch (feature) {
    case "backlog": {
      if (lineCount(input) < 2) {
        return {
          ok: false,
          title: "O backlog precisa de pelo menos 2 itens (um por linha).",
          hints: [
            "Cola cada item do backlog na sua própria linha.",
            "Exemplo:\n- Adicionar login com Google\n- Corrigir bug no checkout",
          ],
        };
      }
      break;
    }
    case "sprint": {
      const hasCapacity =
        /\b\d+\s*(sp|story\s*points?|pontos?|pts?)\b/i.test(input) ||
        /capacidade\s*[:=]?\s*\d+/i.test(input) ||
        /capacity\s*[:=]?\s*\d+/i.test(input);
      if (!hasCapacity) {
        return {
          ok: false,
          title: "Falta indicar a capacidade da equipa no contexto do sprint.",
          hints: [
            'Inclui a capacidade em story points, ex.: "Capacidade: 40 SP".',
            "Lista os itens candidatos com as respetivas estimativas.",
          ],
        };
      }
      if (lineCount(input) < 3) {
        return {
          ok: false,
          title: "O contexto do sprint precisa de mais detalhe.",
          hints: [
            "Adiciona a lista de itens candidatos com estimativas.",
            "Menciona restrições ou dependências que afetem o âmbito.",
          ],
        };
      }
      break;
    }
    case "release": {
      const mentionsFeatures = /\b(funcionalidade|feature|módulo|story|epic|ticket)s?\b/i.test(input);
      const mentionsStatus = /\b(test|teste|testes|qa|bug|defeito|cobertura|passa|falha|bloqueador|blocker)s?\b/i.test(input);
      if (!mentionsFeatures || !mentionsStatus) {
        return {
          ok: false,
          title: "Falta informação chave no contexto da release.",
          hints: [
            "Lista as funcionalidades incluídas na release.",
            "Descreve o estado dos testes (cobertura, passa/falha).",
            "Menciona bugs conhecidos ou bloqueadores.",
          ],
        };
      }
      break;
    }
    case "tests": {
      const mentionsCriteria = /(crit[ée]rio|aceita[çc][ãa]o|dado|quando|ent[ãa]o|given|when|then|como\b|quero\b|as a\b|i want\b)/i.test(input);
      if (!mentionsCriteria) {
        return {
          ok: false,
          title: "É necessária uma user story com critérios de aceitação.",
          hints: [
            'Inclui a story no formato "Como … quero … para que …".',
            "Fornece pelo menos um critério em Dado / Quando / Então.",
          ],
        };
      }
      break;
    }
    case "meeting": {
      if (lineCount(input) < 3) {
        return {
          ok: false,
          title: "As notas da reunião parecem demasiado escassas.",
          hints: [
            "Cola as notas brutas — participantes, pontos discutidos, decisões e compromissos.",
            "Mais contexto produz um resumo mais fiel.",
          ],
        };
      }
      break;
    }
    case "user-story": {
      const looksVague = /^(teste|todo|asap|algo|coisa|qualquer\s+coisa|feature\s*x?)\b/i.test(input);
      if (looksVague) {
        return {
          ok: false,
          title: "A descrição é demasiado vaga.",
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
        "Quem é o utilizador? (persona / papel)",
        "Que ação ou capacidade precisa?",
        "Que benefício ou resultado isso traz?",
      ];
    case "backlog":
      return [
        "Cola pelo menos 2 itens, um por linha.",
        "Usa títulos curtos e claros — ex.: 'Adicionar SSO', 'Corrigir total do carrinho'.",
      ];
    case "meeting":
      return [
        "Cola as notas da reunião (participantes, tópicos, decisões, ações).",
        "Inclui pelo menos algumas frases de contexto.",
      ];
    case "sprint":
      return [
        "Indica a capacidade da equipa em story points (ex.: 'Capacidade: 40 SP').",
        "Lista os itens candidatos com as estimativas.",
        "Menciona restrições, dependências ou ausências.",
      ];
    case "release":
      return [
        "Lista as funcionalidades incluídas na release.",
        "Descreve o estado dos testes e a cobertura.",
        "Menciona bugs conhecidos, bloqueadores ou requisitos de conformidade.",
      ];
    case "tests":
      return [
        "Fornece a user story no formato 'Como … quero … para que …'.",
        "Inclui pelo menos um critério em Dado / Quando / Então.",
      ];
  }
}
