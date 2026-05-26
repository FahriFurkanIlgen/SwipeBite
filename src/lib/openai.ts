import { env, hasOpenAI } from "./env";

/**
 * Minimal OpenAI JSON client. In production this MUST be proxied
 * through a backend (Supabase Edge Function) — never ship raw keys.
 * Here we keep a tiny direct client for prototyping and fall back to
 * deterministic mocks when no key is present.
 */
export interface OpenAIJsonOptions {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
}

export async function openAIJson<T>(
  opts: OpenAIJsonOptions,
): Promise<T | null> {
  if (!hasOpenAI) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: opts.model ?? "gpt-4o-mini",
        temperature: opts.temperature ?? 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}
