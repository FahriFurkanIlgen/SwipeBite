import { PantryItem, Recipe } from "@/types/domain";

/**
 * Compute how well a recipe is covered by current pantry items.
 * Returns a percent 0..100 and the list of matched ingredient names.
 */
export function recipePantryCoverage(
  recipe: Recipe,
  pantry: PantryItem[],
): { percent: number; matched: string[]; missing: string[] } {
  const have = pantry.map((p) => p.name.toLocaleLowerCase("tr-TR").trim());
  const matched: string[] = [];
  const missing: string[] = [];
  for (const ing of recipe.ingredients) {
    const n = ing.name.toLocaleLowerCase("tr-TR").trim();
    const isMatch = have.some((h) => h && (n.includes(h) || h.includes(n)));
    if (isMatch) matched.push(ing.name);
    else missing.push(ing.name);
  }
  const percent = recipe.ingredients.length
    ? Math.round((matched.length / recipe.ingredients.length) * 100)
    : 0;
  return { percent, matched, missing };
}

export interface CookableRecipe {
  recipe: Recipe;
  coveragePercent: number;
  matchedCount: number;
  missingCount: number;
  missing: string[];
}

/**
 * Filter and rank recipes that the household can cook now,
 * based on pantry coverage. By default returns recipes with ≥50% coverage.
 */
export function findCookableRecipes(
  pantry: PantryItem[],
  recipes: Recipe[],
  options: { minCoverage?: number; limit?: number } = {},
): CookableRecipe[] {
  const { minCoverage = 50, limit = 20 } = options;
  if (pantry.length === 0) return [];

  const results: CookableRecipe[] = [];
  for (const recipe of recipes) {
    const { percent, matched, missing } = recipePantryCoverage(recipe, pantry);
    if (percent < minCoverage) continue;
    results.push({
      recipe,
      coveragePercent: percent,
      matchedCount: matched.length,
      missingCount: missing.length,
      missing,
    });
  }
  return results
    .sort((a, b) => {
      if (b.coveragePercent !== a.coveragePercent)
        return b.coveragePercent - a.coveragePercent;
      return a.missingCount - b.missingCount;
    })
    .slice(0, limit);
}
