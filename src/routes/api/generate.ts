import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { FEATURE_IDS, SYSTEM_PROMPTS, type FeatureId } from "@/lib/prompts";

const RequestSchema = z.object({
  feature: z.enum(FEATURE_IDS as [FeatureId, ...FeatureId[]]),
  input: z.string().trim().min(1, "Input is required").max(20000, "Input is too long"),
});

const PRIMARY_MODEL = "claude-sonnet-4-20250514";
const FALLBACK_MODEL = "claude-3-5-sonnet-20241022";

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
  error?: { type?: string; message?: string };
};

async function callAnthropic(opts: {
  apiKey: string;
  model: string;
  system: string;
  userInput: string;
}): Promise<{ ok: true; text: string } | { ok: false; status: number; body: AnthropicResponse }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 1500,
      temperature: 0,
      system: opts.system,
      messages: [{ role: "user", content: opts.userInput }],
    }),
  });

  const body = (await res.json().catch(() => ({}))) as AnthropicResponse;
  if (!res.ok) return { ok: false, status: res.status, body };
  const text = body.content?.find((c) => c.type === "text")?.text ?? "";
  return { ok: true, text };
}

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
    // Count bullets in the "Sugestões de Melhoria" section
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

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "O servidor não tem ANTHROPIC_API_KEY configurada." },
            { status: 500 },
          );
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
          let result = await callAnthropic({
            apiKey,
            model: PRIMARY_MODEL,
            system,
            userInput: input,
          });

          // Fallback if the primary model is rejected (not_found / invalid model)
          if (!result.ok && (result.status === 404 || result.status === 400)) {
            const msg = result.body.error?.message?.toLowerCase() ?? "";
            if (msg.includes("model")) {
              result = await callAnthropic({
                apiKey,
                model: FALLBACK_MODEL,
                system,
                userInput: input,
              });
            }
          }

          if (!result.ok) {
            const upstreamMsg = result.body.error?.message;
            if (result.status === 401) {
              return Response.json(
                { error: "Chave da API Anthropic inválida." },
                { status: 500 },
              );
            }
            if (result.status === 429) {
              return Response.json(
                { error: "Limite de pedidos atingido. Tenta novamente daqui a pouco." },
                { status: 429 },
              );
            }
            return Response.json(
              { error: upstreamMsg ?? "O serviço de IA devolveu um erro." },
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
