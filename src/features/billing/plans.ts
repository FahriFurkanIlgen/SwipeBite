/**
 * SwipeBite Pro subscription plans (Faz 2).
 *
 * These describe what we *show* on the paywall. The actual prices, currency
 * and store products come from RevenueCat at runtime once configured; until
 * then the paywall falls back to these display values so we can build and test
 * the flow without store accounts.
 *
 * `productId` must match the product identifiers you create in App Store
 * Connect / Google Play Console and attach to the RevenueCat "pro" entitlement.
 */
export type PlanPeriod = "monthly" | "yearly";

export interface SubscriptionPlan {
  /** Stable internal id (also used in analytics). */
  id: PlanPeriod;
  /** Store product identifier (configure in RevenueCat dashboard). */
  productId: string;
  /** Short label, e.g. "Aylık". */
  label: string;
  /** Fallback price display when RevenueCat isn't configured yet. */
  fallbackPrice: string;
  /** Optional sub-line, e.g. per-month breakdown of a yearly plan. */
  fallbackSubline?: string;
  /** Marketing badge, e.g. "2 ay bedava". */
  badge?: string;
}

export const PRO_PLANS: SubscriptionPlan[] = [
  {
    id: "yearly",
    productId: "swipebite_pro_yearly",
    label: "Yıllık",
    fallbackPrice: "₺399 / yıl",
    fallbackSubline: "ayda yaklaşık ₺33",
    badge: "En avantajlı",
  },
  {
    id: "monthly",
    productId: "swipebite_pro_monthly",
    label: "Aylık",
    fallbackPrice: "₺59 / ay",
  },
];

/** RevenueCat entitlement identifier that unlocks Pro. */
export const PRO_ENTITLEMENT_ID = "SwipeBite Pro";

/** Pro feature bullets shown on the paywall. */
export const PRO_BENEFITS: string[] = [
  "Sınırsız fiş tarama ve AI ile kiler ekleme",
  "Sınırsız haftalık AI yemek planı",
  "Tarifleri diyet ve alerjilerine göre uyarla",
  "Sınırsız ev üyesi — tüm aile aynı planda",
  "Reklamsız, öncelikli yeni özellikler",
];
