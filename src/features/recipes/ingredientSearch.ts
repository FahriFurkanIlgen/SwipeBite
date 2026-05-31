import { Recipe } from "@/types/domain";

export type SearchMode = "best" | "all" | "fewMissing";

export interface IngredientMatch {
  recipe: Recipe;
  /** How many of the user's selected ingredients appear in the recipe. */
  matchedCount: number;
  /** Total selected ingredients (denominator for the badge). */
  selectedCount: number;
  /** Recipe ingredients not covered by the selection (display as chips). */
  missing: string[];
  /** matched / total recipe ingredients (0..1) — used for ranking. */
  coverage: number;
}

/** Normalise once: lowercase + trim + strip parentheticals + split tokens. */
function norm(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split a normalised string into individual word tokens. */
function tokens(s: string): string[] {
  return s.split(" ").filter((t) => t.length >= 2);
}

/**
 * Word-aware match: at least one token of `needle` must appear as a whole
 * word inside `recipeIng`. Prevents "hindi" from matching "hindistan cevizi".
 * For multi-word needles (e.g. "kuru fasulye") we require ALL tokens to match.
 */
function ingredientHas(recipeIng: string, needle: string): boolean {
  if (!recipeIng || !needle) return false;
  const recipeTokens = new Set(tokens(recipeIng));
  const needleTokens = tokens(needle);
  if (needleTokens.length === 0) return false;
  return needleTokens.every((nt) => recipeTokens.has(nt));
}

/**
 * Search recipes by a free-form ingredient selection (e.g. fridge contents
 * picked manually). Independent of pantry — caller decides what to pass in.
 *
 * Modes:
 *  - "best": rank by (matched/selected) then coverage. Default.
 *  - "all": only return recipes that contain EVERY selected ingredient.
 *  - "fewMissing": prefer recipes where the user lacks the fewest extras.
 */
export function searchByIngredients(
  selected: string[],
  recipes: Recipe[],
  options: { mode?: SearchMode; minMatch?: number; limit?: number } = {},
): IngredientMatch[] {
  const { mode = "best", minMatch = 1, limit = 40 } = options;
  const selNorm = selected.map(norm).filter((s) => s.length >= 2);
  if (selNorm.length === 0) return [];

  const results: IngredientMatch[] = [];
  for (const recipe of recipes) {
    const recipeNames = recipe.ingredients.map((i) => norm(i.name));

    // How many of the selected ingredients are in the recipe?
    const matched = selNorm.filter((s) =>
      recipeNames.some((r) => ingredientHas(r, s)),
    );
    if (matched.length < minMatch) continue;
    if (mode === "all" && matched.length < selNorm.length) continue;

    // Recipe ingredients NOT covered by the selection.
    const missing = recipe.ingredients
      .filter((i) => {
        const n = norm(i.name);
        return !selNorm.some((s) => ingredientHas(n, s));
      })
      .map((i) => i.name);

    const coverage = recipe.ingredients.length
      ? (recipe.ingredients.length - missing.length) / recipe.ingredients.length
      : 0;

    results.push({
      recipe,
      matchedCount: matched.length,
      selectedCount: selNorm.length,
      missing,
      coverage,
    });
  }

  results.sort((a, b) => {
    if (mode === "fewMissing") {
      if (a.missing.length !== b.missing.length)
        return a.missing.length - b.missing.length;
      return b.matchedCount - a.matchedCount;
    }
    // "best" / "all": prefer recipes that use MORE of the selected ingredients
    // (absolute count) so adding a new selection visibly re-ranks. Then prefer
    // higher selected coverage ratio, then higher recipe coverage, then fewer
    // missing.
    if (a.matchedCount !== b.matchedCount)
      return b.matchedCount - a.matchedCount;
    const sa = a.matchedCount / a.selectedCount;
    const sb = b.matchedCount / b.selectedCount;
    if (sa !== sb) return sb - sa;
    if (b.coverage !== a.coverage) return b.coverage - a.coverage;
    return a.missing.length - b.missing.length;
  });

  return results.slice(0, limit);
}
