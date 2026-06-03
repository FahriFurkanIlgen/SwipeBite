import { PantryItem, Recipe } from "@/types/domain";
import {
  PantryCategory,
  PANTRY_CATEGORY_INDEX,
} from "@/constants/pantryCatalog";

/**
 * Per-category weight when ranking recipes by pantry coverage.
 * Proteins count double, baharat/kuruyemiş/yağ&sos count half.
 */
const CATEGORY_WEIGHT: Record<PantryCategory, number> = {
  Protein: 2,
  Sebze: 1,
  Meyve: 1,
  Süt: 1,
  Tahıl: 1,
  Baharat: 0.5,
  Kuruyemiş: 0.5,
  "Yağ & Sos": 0.5,
};

function categoryOf(name: string): PantryCategory | null {
  const key = name.toLocaleLowerCase("tr-TR").trim();
  if (!key) return null;
  if (PANTRY_CATEGORY_INDEX[key]) return PANTRY_CATEGORY_INDEX[key];
  // Fall back to a partial match (catalog has many variants).
  for (const k of Object.keys(PANTRY_CATEGORY_INDEX)) {
    if (k && (key.includes(k) || k.includes(key))) {
      return PANTRY_CATEGORY_INDEX[k];
    }
  }
  return null;
}

function weightOf(name: string): number {
  const cat = categoryOf(name);
  if (!cat) return 1;
  return CATEGORY_WEIGHT[cat];
}

/**
 * Compute how well a recipe is covered by current pantry items.
 * Returns a percent 0..100 and the list of matched ingredient names.
 *
 * The percent is weighted by category (proteins x2, condiments x0.5) so
 * recipes whose main protein/grain is in the pantry rank higher than ones
 * that only share spices.
 */
export function recipePantryCoverage(
  recipe: Recipe,
  pantry: PantryItem[],
): { percent: number; matched: string[]; missing: string[] } {
  const have = pantry.map((p) => p.name.toLocaleLowerCase("tr-TR").trim());
  const matched: string[] = [];
  const missing: string[] = [];
  let totalWeight = 0;
  let matchedWeight = 0;
  for (const ing of recipe.ingredients) {
    const n = ing.name.toLocaleLowerCase("tr-TR").trim();
    const w = weightOf(ing.name);
    totalWeight += w;
    const isMatch = have.some((h) => h && (n.includes(h) || h.includes(n)));
    if (isMatch) {
      matched.push(ing.name);
      matchedWeight += w;
    } else {
      missing.push(ing.name);
    }
  }
  const percent =
    totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
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
