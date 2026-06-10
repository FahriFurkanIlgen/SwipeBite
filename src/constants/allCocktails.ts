import type { Cocktail } from "@/types/bar";

import { COCKTAILDB_RECIPES } from "./cocktailDbRecipes";
import { FAMOUS_COCKTAILS } from "./famousCocktails";

/**
 * Birleşik kokteyl havuzu. Önce el yapımı 12 klasik, sonra TheCocktailDB'den
 * içeri aktarılmış ~93 kokteyl. Aynı id varsa el yapımı kazanır (öncelikli).
 */
const seen = new Set<string>();
const merged: Cocktail[] = [];
for (const c of [...FAMOUS_COCKTAILS, ...COCKTAILDB_RECIPES]) {
  if (seen.has(c.id)) continue;
  seen.add(c.id);
  merged.push(c);
}

export const ALL_COCKTAILS: Cocktail[] = merged;

export const ALL_COCKTAIL_INDEX: Record<string, Cocktail> = Object.fromEntries(
  ALL_COCKTAILS.map((c) => [c.id, c]),
);
