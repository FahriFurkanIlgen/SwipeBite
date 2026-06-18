import Constants from "expo-constants";

/**
 * App variant — the same codebase ships two App Store apps:
 *   - "food" → SwipeBite (default)
 *   - "bar"  → SwipeBar (cocktail/bar experience)
 *
 * The value is injected at build time via the `APP_VARIANT` env var (see
 * eas.json) and surfaced through `extra.appVariant` in app.config.ts.
 */
export type AppVariant = "food" | "bar";

const raw = (
  (Constants.expoConfig?.extra as { appVariant?: string } | undefined)
    ?.appVariant ?? "food"
).toLowerCase();

export const appVariant: AppVariant = raw === "bar" ? "bar" : "food";

export const isBar = appVariant === "bar";
export const isFood = appVariant === "food";

/**
 * Pick a localized string by variant: SwipeBite (food) ships Turkish, SwipeBar
 * (bar) ships English. Use for inline copy in screens shared by both variants.
 */
export const L = (tr: string, en: string): string => (isBar ? en : tr);
