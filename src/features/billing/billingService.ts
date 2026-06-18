import { Platform } from "react-native";
import Constants from "expo-constants";

import { env, hasBilling, revenueCatUsableTestKey } from "@/lib/env";
import { track } from "@/features/analytics/analyticsService";
import {
  PRO_ENTITLEMENT_ID,
  PRO_PLANS,
  type PlanPeriod,
  type SubscriptionPlan,
} from "./plans";

/**
 * Billing abstraction (Faz 2) backed by RevenueCat (`react-native-purchases`).
 *
 * Two runtime modes:
 *  - **Mock mode** — no RevenueCat key set (`hasBilling` false). Used in Expo
 *    Go: the native SDK is never touched and a "purchase" just grants Pro on
 *    the device so we can test the paywall flow.
 *  - **Live / Test-Store mode** — a key is present (`test_...` Test Store key
 *    or a real platform key). Requires a dev build / TestFlight because the SDK
 *    is native and won't run in Expo Go.
 *
 * The SDK is loaded with a lazy `require` *only* when `hasBilling` is true, so
 * importing this file never crashes the JS bundle in Expo Go.
 */

export interface ResolvedPlan extends SubscriptionPlan {
  /** Localized price to render (from RevenueCat when live, else fallback). */
  price: string;
  subline?: string;
}

export interface PurchaseResult {
  /** True when the user now holds the Pro entitlement. */
  entitled: boolean;
  /** True when the user explicitly cancelled (don't show an error). */
  cancelled?: boolean;
  error?: string;
}

// Minimal shapes we rely on from react-native-purchases, kept local so this
// file type-checks even when the native module isn't installed.
interface RcProduct {
  identifier: string;
  priceString: string;
}
interface RcPackage {
  identifier: string;
  product: RcProduct;
}
interface RcCustomerInfo {
  entitlements: { active: Record<string, unknown> };
}

let initialized = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Purchases: any = null;

/**
 * Expo Go can't run the native RevenueCat SDK — it falls back to a "browser"
 * build whose `configure` rejects asynchronously (outside our try/catch) with
 * "Invalid API key". Treat Expo Go exactly like mock mode so the paywall flow
 * stays testable without crashing the app.
 */
const isExpoGo = Constants.appOwnership === "expo";

/** Lazily load the native SDK. Returns null in mock mode or if unavailable. */
function getPurchases(): typeof Purchases {
  if (!hasBilling || isExpoGo) return null;
  if (!Purchases) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Purchases = require("react-native-purchases").default;
    } catch {
      return null;
    }
  }
  return Purchases;
}

/** Pick the right API key for the platform, falling back to the Test Store key. */
function apiKey(): string {
  const platformKey =
    Platform.OS === "ios" ? env.revenueCatIosKey : env.revenueCatAndroidKey;
  return platformKey || revenueCatUsableTestKey;
}

function hasProEntitlement(info: RcCustomerInfo | null | undefined): boolean {
  return Boolean(info?.entitlements?.active?.[PRO_ENTITLEMENT_ID]);
}

async function currentPackages(rc: typeof Purchases): Promise<RcPackage[]> {
  const offerings = await rc.getOfferings();
  return (offerings.current?.availablePackages ?? []) as RcPackage[];
}

export const billingService = {
  /** True when a RevenueCat key is present (real purchases possible). */
  isConfigured(): boolean {
    return hasBilling && !isExpoGo;
  },

  /** Idempotent SDK init. No-op in mock mode. */
  async init(userId: string | null): Promise<void> {
    if (initialized) return;
    initialized = true;
    const rc = getPurchases();
    if (!rc) return;
    try {
      rc.configure({ apiKey: apiKey(), appUserID: userId ?? undefined });
    } catch {
      // If configuration fails we silently fall back to mock-like behaviour.
    }
  },

  /** Plans to render on the paywall, with prices resolved when possible. */
  async offerings(): Promise<ResolvedPlan[]> {
    const fallback = PRO_PLANS.map((p) => ({
      ...p,
      price: p.fallbackPrice,
      subline: p.fallbackSubline,
    }));

    const rc = getPurchases();
    if (!rc) return fallback;

    try {
      const packages = await currentPackages(rc);
      if (packages.length === 0) return fallback;
      // Keep our copy (label/badge/subline) but use the live store price.
      return PRO_PLANS.map((p) => {
        const pkg = packages.find((k) => k.product.identifier === p.productId);
        return {
          ...p,
          price: pkg?.product.priceString ?? p.fallbackPrice,
          subline: p.fallbackSubline,
        };
      });
    } catch {
      return fallback;
    }
  },

  /** Attempt to purchase a plan. In mock mode this always succeeds. */
  async purchase(planId: PlanPeriod): Promise<PurchaseResult> {
    track("purchase_started", { plan: planId, mock: !hasBilling });

    const rc = getPurchases();
    if (!rc) {
      // Mock: pretend the store sheet succeeded so we can test the unlock flow.
      await new Promise((r) => setTimeout(r, 600));
      track("purchase_completed", { plan: planId, mock: true });
      return { entitled: true };
    }

    const plan = PRO_PLANS.find((p) => p.id === planId);
    if (!plan) return { entitled: false, error: "Plan bulunamadı." };

    try {
      const packages = await currentPackages(rc);
      const pkg = packages.find((k) => k.product.identifier === plan.productId);
      if (!pkg) {
        return { entitled: false, error: "Bu plan mağazada bulunamadı." };
      }
      const { customerInfo } = await rc.purchasePackage(pkg);
      const entitled = hasProEntitlement(customerInfo as RcCustomerInfo);
      if (entitled) track("purchase_completed", { plan: planId, mock: false });
      return { entitled };
    } catch (e) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (err.userCancelled) return { entitled: false, cancelled: true };
      return {
        entitled: false,
        error: err.message ?? "Satın alma tamamlanamadı.",
      };
    }
  },

  /** Restore prior purchases (App Store / Play requirement). */
  async restore(): Promise<PurchaseResult> {
    track("purchase_restore", { mock: !hasBilling });

    const rc = getPurchases();
    if (!rc) return { entitled: false };

    try {
      const customerInfo = await rc.restorePurchases();
      return { entitled: hasProEntitlement(customerInfo as RcCustomerInfo) };
    } catch (e) {
      const err = e as { message?: string };
      return { entitled: false, error: err.message };
    }
  },
};
