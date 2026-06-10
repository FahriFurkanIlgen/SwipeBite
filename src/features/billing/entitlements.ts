/**
 * Monetization — entitlements (free vs Pro boundary).
 *
 * Faz 0 (pre-launch): this file only *defines* the boundary. Nothing is gated
 * yet — `GATING_ENABLED` is false, so every feature behaves as unlimited. The
 * usage store still counts consumption so we can see real numbers before
 * deciding where to draw the paywall in Faz 1.
 *
 * To flip on soft quotas (Faz 1) set `GATING_ENABLED = true`.
 */

export type PlanTier = "free" | "pro";

/**
 * AI / premium features we can meter or gate. Keep these stable — they double
 * as analytics event names and as AsyncStorage usage keys.
 */
export type GatedFeature =
  | "receipt_scan" // pantry OCR from a receipt / shelf photo
  | "ai_pantry_parse" // free-text → structured pantry items
  | "weekly_plan" // AI weekly meal plan
  | "recipe_adapt"; // adapt a recipe to diet / allergies / pantry

/**
 * Master switch. While false (Faz 0) quotas are tracked but never enforced —
 * `checkQuota` always returns `allowed: true`.
 *
 * Faz 1 (launch): flipped to `true`. Soft quotas now enforced — when a free
 * user runs out we show the "Pro yakında" upsell sheet (see `UpsellSheet`) and
 * record their interest. There is no purchasable product yet (that's Faz 2 /
 * RevenueCat), so the sheet captures intent rather than taking payment.
 */
export const GATING_ENABLED = true;

/**
 * Faz 2: a real paywall now exists (`app/paywall.tsx` + RevenueCat-ready
 * billingService). Set to `false` so the upsell sheet routes to the paywall
 * instead of showing a "coming soon" teaser. Flip back to `true` only if you
 * need to pause sales again.
 */
export const PRO_COMING_SOON = false;

/**
 * Monthly free-tier allowances. `Infinity` = never gated even after Faz 1.
 * Swipe is intentionally absent here: it's the addictive core and stays
 * unlimited for everyone, forever.
 */
export const FREE_MONTHLY_QUOTAS: Record<GatedFeature, number> = {
  receipt_scan: 5,
  ai_pantry_parse: 20,
  weekly_plan: 1,
  recipe_adapt: 3,
};

/** Pro tier removes all limits. */
export const PRO_MONTHLY_QUOTAS: Record<GatedFeature, number> = {
  receipt_scan: Infinity,
  ai_pantry_parse: Infinity,
  weekly_plan: Infinity,
  recipe_adapt: Infinity,
};

export function quotaFor(tier: PlanTier, feature: GatedFeature): number {
  return (tier === "pro" ? PRO_MONTHLY_QUOTAS : FREE_MONTHLY_QUOTAS)[feature];
}

/** Human-readable labels for upsell copy / analytics dashboards. */
export const FEATURE_LABELS: Record<GatedFeature, string> = {
  receipt_scan: "Fişten ekle",
  ai_pantry_parse: "AI ile ayrıştır",
  weekly_plan: "Haftalık plan",
  recipe_adapt: "Tarifi uyarla",
};
