import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  GATING_ENABLED,
  quotaFor,
  type GatedFeature,
  type PlanTier,
} from "@/features/billing/entitlements";

const STORAGE_KEY = "swipebite.entitlements.v1";

/** Current month bucket, e.g. "2026-06". Usage resets when this changes. */
function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface PersistedShape {
  tier: PlanTier;
  period: string;
  usage: Partial<Record<GatedFeature, number>>;
}

export interface QuotaCheck {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

interface EntitlementsState {
  tier: PlanTier;
  period: string;
  usage: Partial<Record<GatedFeature, number>>;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setTier: (tier: PlanTier) => Promise<void>;
  /** Read-only check — does NOT consume. Honors GATING_ENABLED. */
  checkQuota: (feature: GatedFeature) => QuotaCheck;
  /**
   * Record one use of a feature. Returns whether it was allowed. When gating
   * is off (Faz 0) it always returns true but still increments the counter so
   * we can observe real demand.
   */
  consume: (feature: GatedFeature) => Promise<boolean>;
  reset: () => Promise<void>;
}

async function persist(state: PersistedShape) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // best effort
  }
}

export const useEntitlementsStore = create<EntitlementsState>((set, get) => ({
  tier: "free",
  period: currentPeriod(),
  usage: {},
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const now = currentPeriod();
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedShape;
        // Roll over usage when the month changes.
        const rolledOver = parsed.period !== now;
        set({
          tier: parsed.tier ?? "free",
          period: now,
          usage: rolledOver ? {} : (parsed.usage ?? {}),
          hydrated: true,
        });
        if (rolledOver) {
          void persist({ tier: parsed.tier ?? "free", period: now, usage: {} });
        }
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  setTier: async (tier) => {
    set({ tier });
    const { period, usage } = get();
    await persist({ tier, period, usage });
  },

  checkQuota: (feature) => {
    const { tier, usage } = get();
    const limit = quotaFor(tier, feature);
    const used = usage[feature] ?? 0;
    const remaining = Math.max(0, limit - used);
    // Faz 0: gating disabled → always allowed regardless of counter.
    const allowed = !GATING_ENABLED || used < limit;
    return { allowed, used, limit, remaining };
  },

  consume: async (feature) => {
    // Reset counters lazily if the month flipped while the app was open.
    const now = currentPeriod();
    let { usage } = get();
    if (get().period !== now) {
      usage = {};
      set({ period: now, usage });
    }
    const check = get().checkQuota(feature);
    if (!check.allowed) return false;
    const nextUsage = { ...usage, [feature]: (usage[feature] ?? 0) + 1 };
    set({ usage: nextUsage });
    await persist({ tier: get().tier, period: now, usage: nextUsage });
    return true;
  },

  reset: async () => {
    const now = currentPeriod();
    set({ tier: "free", period: now, usage: {} });
    await persist({ tier: "free", period: now, usage: {} });
  },
}));
