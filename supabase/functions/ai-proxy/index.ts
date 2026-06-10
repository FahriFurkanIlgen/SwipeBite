// Supabase Edge Function: ai-proxy
//
// Why: the app currently calls OpenAI directly with a public key
// (EXPO_PUBLIC_OPENAI_API_KEY), which would be extractable from a shipped
// build. This function moves the secret server-side. The client sends the
// normalized chat-completion body; we attach the secret OPENAI_API_KEY (set as
// a Supabase secret, never bundled) and forward the request.
//
// Security:
//   - JWT is verified by Supabase (config.toml verify_jwt = true) so only
//     authenticated app users can call it — it is NOT an open proxy.
//   - We allow-list models and cap payload size to limit abuse / cost.
//   - The raw OpenAI response (incl. `usage`) is returned so the client can
//     keep its cost analytics.
//
// Deploy:
//   supabase secrets set OPENAI_API_KEY=sk-...
//   supabase functions deploy ai-proxy

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4o"]);
const MAX_BODY_BYTES = 8 * 1024 * 1024; // 8 MB (vision/base64 images)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return json({ error: "server_misconfigured" }, 500);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: "payload_too_large" }, 413);
  }

  let payload: {
    model?: string;
    temperature?: number;
    response_format?: unknown;
    messages?: unknown;
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const model = payload.model ?? "gpt-4o-mini";
  if (!ALLOWED_MODELS.has(model)) {
    return json({ error: "model_not_allowed", model }, 400);
  }
  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    return json({ error: "messages_required" }, 400);
  }

  try {
    const upstream = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: payload.temperature ?? 0.4,
        response_format: payload.response_format ?? { type: "json_object" },
        messages: payload.messages,
      }),
    });

    const data = await upstream.json();
    return json(data, upstream.ok ? 200 : upstream.status);
  } catch {
    return json({ error: "upstream_failed" }, 502);
  }
});
