import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { estimateCostUsd } from "./aiPricing";

/**
 * Lightweight, dependency-free usage analytics for Faz 0.
 *
 * Goal: observe *real* feature demand and AI cost before drawing the paywall.
 * Every event is fire-and-forget — analytics must never block or break a user
 * flow. Locally we keep a capped ring buffer in AsyncStorage (so a future
 * in-app debug screen can show numbers); when Supabase is configured we also
 * insert into `analytics_events`.
 *
 * No third-party SDK on purpose — we can swap in PostHog/Amplitude later by
 * changing only this file.
 */

export type AnalyticsProps = Record<string, string | number | boolean | null>;

export interface AnalyticsEvent {
  name: string;
  ts: string; // ISO timestamp
  userId: string | null;
  props?: AnalyticsProps;
}

const STORAGE_KEY = "swipebite.analytics.v1";
const MAX_LOCAL_EVENTS = 500;

let buffer: AnalyticsEvent[] = [];
let hydrated = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function loadLocal(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) buffer = JSON.parse(raw) as AnalyticsEvent[];
  } catch {
    buffer = [];
  }
}

function scheduleLocalFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    const slice = buffer.slice(-MAX_LOCAL_EVENTS);
    buffer = slice;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(slice)).catch(
      () => undefined,
    );
  }, 1000);
}

async function sendRemote(event: AnalyticsEvent): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("analytics_events").insert({
      name: event.name,
      user_id: event.userId,
      props: event.props ?? {},
      created_at: event.ts,
    });
  } catch {
    // best effort — never surface analytics failures
  }
}

/** Fire-and-forget event. Safe to call from anywhere. */
export function track(name: string, props?: AnalyticsProps): void {
  const event: AnalyticsEvent = {
    name,
    ts: new Date().toISOString(),
    userId: useAuthStore.getState().user?.id ?? null,
    props,
  };
  void loadLocal().then(() => {
    buffer.push(event);
    scheduleLocalFlush();
  });
  void sendRemote(event);
}

export interface AiCallMeta {
  /** Logical feature that triggered the call, e.g. "receipt_scan". */
  feature: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  /** Whether the call hit the network (false = mock/no-key fallback). */
  live: boolean;
}

/** Specialized event for AI calls — records token usage + estimated USD cost. */
export function trackAiCall(meta: AiCallMeta): void {
  const costUsd = meta.live
    ? estimateCostUsd(meta.model, meta.promptTokens, meta.completionTokens)
    : 0;
  track("ai_call", {
    feature: meta.feature,
    model: meta.model,
    prompt_tokens: meta.promptTokens,
    completion_tokens: meta.completionTokens,
    total_tokens: meta.promptTokens + meta.completionTokens,
    cost_usd: Number(costUsd.toFixed(6)),
    live: meta.live,
  });
}

/** Read the local event buffer (for a future in-app debug / cost screen). */
export async function recentEvents(): Promise<AnalyticsEvent[]> {
  await loadLocal();
  return [...buffer];
}

/** Aggregate local AI spend (USD) and call count — handy for a debug screen. */
export async function aiCostSummary(): Promise<{
  calls: number;
  totalUsd: number;
  byFeature: Record<string, { calls: number; usd: number }>;
}> {
  await loadLocal();
  const byFeature: Record<string, { calls: number; usd: number }> = {};
  let totalUsd = 0;
  let calls = 0;
  for (const e of buffer) {
    if (e.name !== "ai_call") continue;
    calls += 1;
    const usd = Number(e.props?.cost_usd ?? 0);
    const feature = String(e.props?.feature ?? "unknown");
    totalUsd += usd;
    const slot = byFeature[feature] ?? { calls: 0, usd: 0 };
    slot.calls += 1;
    slot.usd += usd;
    byFeature[feature] = slot;
  }
  return { calls, totalUsd, byFeature };
}

export async function clearAnalytics(): Promise<void> {
  buffer = [];
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
