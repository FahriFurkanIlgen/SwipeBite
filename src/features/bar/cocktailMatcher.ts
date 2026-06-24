import { BAR_INGREDIENT_INDEX } from "@/constants/barCatalog";
import { ALL_COCKTAILS } from "@/constants/allCocktails";
import type {
  BarIngredient,
  BarIngredientCategory,
  Cocktail,
  CocktailMatch,
} from "@/types/bar";

/**
 * Matching weight per ingredient category. Alcohol — distilled spirits,
 * liqueurs and wines — counts 3× toward a cocktail's coverage score so that
 * owning the actual alcohol of a recipe dominates ranking over having mixers,
 * citrus or garnishes. Everything else is weighted 1×.
 */
const ALCOHOL_CATEGORIES: ReadonlySet<BarIngredientCategory> = new Set([
  "spirits",
  "liqueur-vermouth",
  "amaro-bitters",
  "wine-sparkling",
]);

function matchWeight(ing: BarIngredient): number {
  return ALCOHOL_CATEGORIES.has(ing.category) ? 3 : 1;
}

/**
 * Compute how well the user's cabinet covers a single cocktail recipe.
 *
 * - A cocktail is "cookable" when every non-optional ingredient is present.
 * - `coverage` is the fraction of *required* ingredients owned, where each
 *   ingredient is weighted by category (alcohol 3×, everything else 1×).
 * - Optional ingredients (typical garnishes / bitters dashes) never block
 *   cookability but are still surfaced in `missingOptional` so the UI can
 *   show "süslemen yok" hints.
 */
export function matchCocktail(
  cocktail: Cocktail,
  ownedIds: ReadonlySet<string>,
): CocktailMatch {
  const missingRequired: BarIngredient[] = [];
  const missingOptional: BarIngredient[] = [];
  let requiredTotal = 0;
  let requiredOwned = 0;

  for (const ref of cocktail.ingredients) {
    const ing = BAR_INGREDIENT_INDEX[ref.ingredientId];
    if (!ing) continue; // unknown id — skip silently
    const owned = ownedIds.has(ref.ingredientId);
    if (ref.optional) {
      if (!owned) missingOptional.push(ing);
    } else {
      const weight = matchWeight(ing);
      requiredTotal += weight;
      if (owned) requiredOwned += weight;
      else missingRequired.push(ing);
    }
  }

  const coverage = requiredTotal === 0 ? 1 : requiredOwned / requiredTotal;
  return {
    cocktail,
    missingRequired,
    missingOptional,
    cookable: missingRequired.length === 0,
    coverage,
  };
}

/**
 * Score every known cocktail against the user's cabinet and return them
 * sorted with cookable recipes first, then by descending coverage.
 */
export function rankCocktails(
  ownedIds: ReadonlySet<string>,
  pool: Cocktail[] = ALL_COCKTAILS,
): CocktailMatch[] {
  // The full-catalogue ranking is the hot path: both the Home and Bar
  // screens request it on every cabinet change, and each `new Set(...)`
  // they pass is a fresh reference, so per-component `useMemo` can't share
  // the work. Cache the last full-pool result keyed by the cabinet's
  // *contents* so repeated calls with the same bottles reuse one pass over
  // all ~500 cocktails instead of recomputing it several times per render.
  if (pool !== ALL_COCKTAILS) return computeRanked(ownedIds, pool);

  const key = ownedSignature(ownedIds);
  if (key === rankCacheKey && rankCache) return rankCache;
  const ranked = computeRanked(ownedIds, pool);
  rankCacheKey = key;
  rankCache = ranked;
  return ranked;
}

let rankCacheKey: string | null = null;
let rankCache: CocktailMatch[] | null = null;

/** Stable signature of a cabinet's contents, order-independent. */
function ownedSignature(ownedIds: ReadonlySet<string>): string {
  return Array.from(ownedIds).sort().join("|");
}

function computeRanked(
  ownedIds: ReadonlySet<string>,
  pool: Cocktail[],
): CocktailMatch[] {
  return pool
    .map((c) => matchCocktail(c, ownedIds))
    .sort((a, b) => {
      if (a.cookable !== b.cookable) return a.cookable ? -1 : 1;
      if (b.coverage !== a.coverage) return b.coverage - a.coverage;
      return a.cocktail.name.localeCompare(b.cocktail.name, "tr");
    });
}

/** Convenience helper: return only the cockables. */
export function cookableCocktails(
  ownedIds: ReadonlySet<string>,
  pool: Cocktail[] = ALL_COCKTAILS,
): Cocktail[] {
  return rankCocktails(ownedIds, pool)
    .filter((m) => m.cookable)
    .map((m) => m.cocktail);
}

/**
 * Suggest the next ingredients to add — i.e. ingredients that, if added,
 * would unlock the most new cocktails. Useful for the cabinet's empty
 * state and the "Eksiklerini tamamla" hint card.
 */
export function suggestNextIngredients(
  ownedIds: ReadonlySet<string>,
  pool: Cocktail[] = ALL_COCKTAILS,
  limit = 5,
): { ingredient: BarIngredient; unlocks: number }[] {
  // Reuse the (cached) ranking instead of running `matchCocktail` over the
  // whole catalogue a second time.
  const matches = rankCocktails(ownedIds, pool);
  const counts = new Map<string, number>();
  for (const match of matches) {
    if (match.cookable) continue;
    // Only count cocktails that are 1 ingredient away from being cookable.
    if (match.missingRequired.length !== 1) continue;
    const id = match.missingRequired[0].id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([id, unlocks]) => ({
      ingredient: BAR_INGREDIENT_INDEX[id],
      unlocks,
    }))
    .filter((x) => !!x.ingredient)
    .sort((a, b) => b.unlocks - a.unlocks)
    .slice(0, limit);
}
