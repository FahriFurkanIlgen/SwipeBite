/**
 * Feature flags for staged rollout.
 *
 * Set a flag to `false` to fully hide a feature from the launch build while
 * keeping its code in the repository. This lets us ship a simplified first
 * release and re-enable (or extract) features later without deleting code.
 */
export const featureFlags = {
  /**
   * "Bar modu" — cocktail swiping, bar cabinet, age gate, and the bar tab.
   * Disabled for the initial food-only launch. The bar code is being moved
   * to a separate project; keep this `false` here.
   */
  bar: false,
  /**
   * "Cici Boğaz" — group fast-food voting game (home CTA + cici routes).
   * Hidden for launch but stays in this project.
   */
  cici: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;
