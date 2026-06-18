/**
 * Feature flags for staged rollout.
 *
 * Set a flag to `false` to fully hide a feature from the launch build while
 * keeping its code in the repository. This lets us ship a simplified first
 * release and re-enable (or extract) features later without deleting code.
 *
 * Flags are also variant-aware: the SwipeBar build (`APP_VARIANT=bar`) enables
 * the bar experience as its core, while the SwipeBite (food) build keeps it off.
 */
import { isBar } from "./appVariant";

export const featureFlags = {
  /**
   * "Bar modu" — cocktail swiping, bar cabinet, age gate, and the bar tab.
   * Enabled only in the SwipeBar variant. The SwipeBite (food) build keeps
   * this off for the food-only launch.
   */
  bar: isBar,
  /**
   * "Cici Boğaz" — group fast-food voting game (home CTA + cici routes).
   * Hidden for launch but stays in this project.
   */
  cici: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;
