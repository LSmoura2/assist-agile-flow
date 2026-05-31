import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { FEATURE_IDS, SYSTEM_PROMPTS, type FeatureId } from "@/lib/prompts";

const RequestSchema = z.object({
  feature: z.enum(FEATURE_IDS as [FeatureId, ...FeatureId[]]),
  input: z.string().trim().min(1, "Input is required").max(20000, "Input is too long"),
});

const MODEL = "deepseek-chat";

function validateOutput(
  feature: FeatureId,
  text: string,
): { ok: true } | { ok: false; reason: string } {
  if (feature === "incident") {
    const required = [
      "## Severidade",
      "## Problema",
      "## Impacto",
      "## Causa Raiz",
      "## Solução",
    ];
    const missing = required.filter((h) => !text.includes(h));
    if (missing.length > 0) {
      return { ok: false, reason: `Faltam secções: ${missing.join(", ")}` };
    }
    const words = text.trim().split(/\s+/).length;
    if (words > 180) {
      return { ok: false, reason: `Resposta excede 150 palavras (tem ${words}).` };
    }
    return { ok: true };
  }
  if (feature === "pipeline") {
    const required = [
      "## Gargalos Identificados",
      "## Práticas Desaconselhadas",
      "## Sugestões de Melhoria",
      "## Ferramentas Recomendadas",
    ];
    const missing = required.filter((h) => !text.includes(h));
    if (missing.length > 0) {
      return { ok: false, reason: `Faltam secções: ${missing.join(", ")}` };
    }
    const sugIdx = text.indexOf("## Sugestões de Melhoria");
    const nextIdx = text.indexOf("## Ferramentas Recomendadas", sugIdx);
    const section = text.slice(sugIdx, nextIdx > -1 ? nextIdx : undefined);
    const bullets = section.match(/^\s*[-*]\s+/gm) ?? [];
    if (bullets.length < 3) {
      return {
        ok: false,
        reason: `A secção "Sugestões de Melhoria" precisa de pelo menos 3 itens (tem ${bullets.length}).`,
      };
    }
    return { ok: true };
  }
  return { ok: true };
}

async function callModel(opts: { system: string; userInput: string }): Promise<
  { ok: true; text: string } | { ok: false; status: number; message: string }
> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    console.error("generate: DEEPSEEK_API_KEY not configured");
    return { ok: false, status: 500, message: "Serviço de IA não disponível." };
  }
  try {
    const deepseek = createOpenAICompatible({
      name: "deepseek",
      baseURL: "https://api.deepseek.com/v1",
      headers: { Authorization: `Bearer ${key}` },
    });
    const { text } = await generateText({
      model: deepseek(MODEL),
      system: opts.system,
      prompt: opts.userInput,
      temperature: 0,
    });
    return { ok: true, text };
  } catch (err) {
    const e = err as { statusCode?: number; status?: number; message?: string };
    const status = e.statusCode ?? e.status ?? 500;
    console.error("generate: AI gateway error", { status, message: e.message });
    return { ok: false, status, message: "O serviço de IA devolveu um erro inesperado." };
  }
}

function isSameOrigin(request: Request): boolean {
  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const source = origin ?? referer;
  if (!source) return true; // no origin header (e.g. server-side) — allow
  if (!host) return true;
  try {
    const sourceHost = new URL(source).host;
    if (sourceHost === host) return true;
    // Allow Lovable preview/published domains
    if (/\.(lovableproject|lovable)\.(app|dev|com)$/.test(sourceHost)) return true;
    return false;
  } catch {
    return false;
  }
}


export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSameOrigin(request)) {
          return Response.json({ error: "Pedido não autorizado." }, { status: 403 });
        }
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: "Corpo do pedido inválido." }, { status: 400 });
        }


        const parsed = RequestSchema.safeParse(payload);
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message ?? "Pedido inválido." },
            { status: 400 },
          );
        }

        const { feature, input } = parsed.data;
        const system = SYSTEM_PROMPTS[feature];

        try {
          let result = await callModel({ system, userInput: input });

          if (!result.ok) {
            if (result.status === 429) {
              return Response.json(
                { error: "Limite de pedidos atingido. Tenta novamente daqui a pouco." },
                { status: 429 },
              );
            }
            if (result.status === 402) {
              return Response.json(
                { error: "Créditos de IA esgotados. Adiciona créditos em Settings → Workspace → Usage." },
                { status: 402 },
              );
            }
            return Response.json(
              { error: result.message || "O serviço de IA devolveu um erro." },
              { status: 502 },
            );
          }

          const check = validateOutput(feature, result.text);
          if (!check.ok) {
            const retry = await callModel({
              system:
                system +
                `\n\nIMPORTANTE: A resposta anterior falhou a validação: ${check.reason}. Devolve estritamente a estrutura pedida.`,
              userInput: input,
            });
            if (retry.ok) {
              const recheck = validateOutput(feature, retry.text);
              if (recheck.ok) {
                return Response.json({ output: retry.text, feature });
              }
            }
            return Response.json(
              {
                error:
                  "Resposta não respeitou o formato esperado. Tenta novamente ou ajusta o input.",
              },
              { status: 502 },
            );
          }

          return Response.json({ output: result.text, feature });
        } catch (err) {
          console.error("generate error", err);
          return Response.json(
            { error: "O serviço de IA está indisponível de momento." },
            { status: 503 },
          );
        }
      },
    },
  },
});
