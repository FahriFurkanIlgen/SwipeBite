import { PantryItem } from "@/types/domain";

export interface GroceryItem {
  name: string;
  haveInPantry: boolean;
}

/**
 * Split a flat grocery list into two buckets based on current pantry contents.
 * The pantry match is fuzzy (substring both ways, lowercase tr).
 */
export function splitGroceryList(
  list: string[],
  pantry: PantryItem[],
): { toBuy: GroceryItem[]; alreadyHave: GroceryItem[] } {
  const have = pantry.map((p) => p.name.toLocaleLowerCase("tr-TR").trim());
  const toBuy: GroceryItem[] = [];
  const alreadyHave: GroceryItem[] = [];
  for (const raw of list) {
    const n = raw.toLocaleLowerCase("tr-TR").trim();
    const hit = have.some((h) => h && (n.includes(h) || h.includes(n)));
    (hit ? alreadyHave : toBuy).push({ name: raw, haveInPantry: hit });
  }
  return { toBuy, alreadyHave };
}
