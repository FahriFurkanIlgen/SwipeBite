import { env, hasOpenAI, hasAI } from "./env";
import { supabase } from "./supabase";
import { trackAiCall } from "@/features/analytics/analyticsService";

/**
 * OpenAI JSON client with two transports:
 *
 *  1. **Proxy** (recommended for production): when `aiProxyEnabled` is set the
 *     request goes to the Supabase `ai-proxy` Edge Function, which holds the
 *     OpenAI key server-side. No secret ships in the app bundle.
 *  2. **Direct** (prototyping only): when a public `openaiApiKey` is present we
 *     call OpenAI directly.
 *
 * When neither is configured every call resolves to `null` and feature
 * services fall back to deterministic mocks.
 */

type ChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

interface ChatRequest {
  model: string;
  temperature: number;
  messages: ChatMessage[];
}

interface ChatResult {
  content: string | null;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

/** Send a chat-completion request via proxy or direct, returning usage too. */
async function chatCompletion(req: ChatRequest): Promise<ChatResult | null> {
  const body = {
    model: req.model,
    temperature: req.temperature,
    response_format: { type: "json_object" as const },
    messages: req.messages,
  };

  try {
    let data: {
      model?: string;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      choices?: { message?: { content?: string } }[];
    } | null = null;

    if (env.aiProxyEnabled && supabase) {
      // Routed through the Edge Function — JWT is attached automatically.
      const { data: fnData, error } = await supabase.functions.invoke(
        "ai-proxy",
        { body },
      );
      if (error) return null;
      data = fnData as typeof data;
    } else if (hasOpenAI) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.openaiApiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      data = await res.json();
    } else {
      return null;
    }

    if (!data) return null;
    return {
      content: data.choices?.[0]?.message?.content ?? null,
      model: data.model ?? req.model,
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    };
  } catch {
    return null;
  }
}

export interface OpenAIJsonOptions {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  /** Logical feature for cost analytics, e.g. "ai_pantry_parse". */
  feature?: string;
}

export async function openAIJson<T>(
  opts: OpenAIJsonOptions,
): Promise<T | null> {
  const model = opts.model ?? "gpt-4o-mini";
  const feature = opts.feature ?? "unknown";
  if (!hasAI) {
    trackAiCall({
      feature,
      model,
      promptTokens: 0,
      completionTokens: 0,
      live: false,
    });
    return null;
  }
  const result = await chatCompletion({
    model,
    temperature: opts.temperature ?? 0.4,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });
  if (!result) return null;
  trackAiCall({
    feature,
    model: result.model,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    live: true,
  });
  if (typeof result.content !== "string") return null;
  try {
    return JSON.parse(result.content) as T;
  } catch {
    return null;
  }
}

export interface OpenAIVisionJsonOptions {
  system: string;
  /** Optional extra instruction sent alongside the image. */
  user?: string;
  /** Base64-encoded image data (no data: prefix). */
  imageBase64: string;
  /** Image MIME type, e.g. "image/jpeg". Defaults to jpeg. */
  mimeType?: string;
  model?: string;
  temperature?: number;
  /** Logical feature for cost analytics, e.g. "receipt_scan". */
  feature?: string;
}

/**
 * Vision variant: sends an image (base64) plus instructions and expects a JSON
 * object back. Used for OCR-style extraction from receipt / grocery photos.
 */
export async function openAIVisionJson<T>(
  opts: OpenAIVisionJsonOptions,
): Promise<T | null> {
  const model = opts.model ?? "gpt-4o-mini";
  const feature = opts.feature ?? "unknown";
  if (!hasAI) {
    trackAiCall({
      feature,
      model,
      promptTokens: 0,
      completionTokens: 0,
      live: false,
    });
    return null;
  }
  const mime = opts.mimeType ?? "image/jpeg";
  const result = await chatCompletion({
    model,
    temperature: opts.temperature ?? 0.1,
    messages: [
      { role: "system", content: opts.system },
      {
        role: "user",
        content: [
          ...(opts.user ? [{ type: "text" as const, text: opts.user }] : []),
          {
            type: "image_url" as const,
            image_url: { url: `data:${mime};base64,${opts.imageBase64}` },
          },
        ],
      },
    ],
  });
  if (!result) return null;
  trackAiCall({
    feature,
    model: result.model,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    live: true,
  });
  if (typeof result.content !== "string") return null;
  try {
    return JSON.parse(result.content) as T;
  } catch {
    return null;
  }
}
