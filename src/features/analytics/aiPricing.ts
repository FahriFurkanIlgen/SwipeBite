/**
 * AI model pricing — used to estimate the USD cost of each OpenAI call from
 * the `usage` object returned by the API. Numbers are USD per single token
 * (provider lists them per 1M tokens, so we divide by 1e6).
 *
 * Keep this in sync with https://openai.com/api/pricing/ — it only drives
 * internal cost analytics, not billing, so approximate is fine.
 */
export interface ModelRate {
  /** USD per input (prompt) token. */
  input: number;
  /** USD per output (completion) token. */
  output: number;
}

const PER_M = 1 / 1_000_000;

export const MODEL_RATES: Record<string, ModelRate> = {
  "gpt-4o-mini": { input: 0.15 * PER_M, output: 0.6 * PER_M },
  "gpt-4o": { input: 2.5 * PER_M, output: 10 * PER_M },
};

/** Fallback when the model isn't in the table (use the cheapest known rate). */
const DEFAULT_RATE: ModelRate = MODEL_RATES["gpt-4o-mini"];

export function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const rate = MODEL_RATES[model] ?? DEFAULT_RATE;
  return promptTokens * rate.input + completionTokens * rate.output;
}
