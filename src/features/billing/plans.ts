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
import { isBar } from "@/constants/appVariant";

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

export const PRO_PLANS: SubscriptionPlan[] = isBar
  ? [
      {
        id: "yearly",
        productId: "swipebar_pro_yearly",
        label: "Yearly",
        fallbackPrice: "$39.99 / year",
        fallbackSubline: "about $3.33 / month",
        badge: "Best value",
      },
      {
        id: "monthly",
        productId: "swipebar_pro_monthly",
        label: "Monthly",
        fallbackPrice: "$4.99 / month",
      },
    ]
  : [
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

/**
 * RevenueCat entitlement identifier that unlocks Pro. Variant-aware so each
 * app checks its own entitlement (name it exactly like this in RevenueCat).
 */
export const PRO_ENTITLEMENT_ID = isBar ? "SwipeBar Pro" : "SwipeBite Pro";

/** Pro feature bullets shown on the paywall. */
export const PRO_BENEFITS: string[] = isBar
  ? [
      "Unlimited recipe imports & AI cabinet adding",
      "Unlimited weekly AI drink plans",
      "Adapt cocktails to your taste and preferences",
      "Unlimited group members — everyone on one plan",
      "Ad-free, priority access to new features",
    ]
  : [
      "Sınırsız fiş tarama ve AI ile kiler ekleme",
      "Sınırsız haftalık AI yemek planı",
      "Tarifleri diyet ve alerjilerine göre uyarla",
      "Sınırsız ev üyesi — tüm aile aynı planda",
      "Reklamsız, öncelikli yeni özellikler",
    ];
