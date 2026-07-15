import { openAIVisionJson } from "@/lib/openai";
import {
  BAR_CATEGORY_LABEL,
  BAR_INGREDIENTS,
  BAR_INGREDIENT_INDEX,
} from "@/constants/barCatalog";
import { ALL_COCKTAILS } from "@/constants/allCocktails";
import { rankCocktails } from "@/features/bar/cocktailMatcher";
import type { BarIngredient, Cocktail } from "@/types/bar";

/**
 * SwipeBar — AI bar-cabinet scanner.
 *
 * The user photographs the bottles, cans and produce on their bar (or a whole
 * shelf) and the vision model maps each recognised product to an ingredient in
 * our curated 214-item catalogue. Brand names are reduced to the generic
 * ingredient the recipes reference (e.g. "Tanqueray" → gin, "Jack Daniel's" →
 * whiskey), so the returned ids drop straight into the cabinet and the
 * deterministic `cocktailMatcher` can suggest what's now makeable.
 *
 * The whole feature is Pro-gated at the call site via
 * `entitlements.bar_cabinet_scan`.
 */

/** Result of scanning a bar photo. */
export interface BarScanResult {
  /** Catalogue ingredient ids recognised in the photo (deduped, validated). */
  ingredientIds: string[];
  /** Resolved ingredient records, in catalogue order. */
  ingredients: BarIngredient[];
  /** Raw labels the model read but could not map to the catalogue. */
  unmatchedLabels: string[];
}

interface VisionItem {
  /** Catalogue id the model matched, or null when nothing fits. */
  id: string | null;
  /** What the model actually read on the bottle (for UI feedback). */
  label: string;
}

/**
 * Build a compact, category-grouped catalogue the vision model can map onto.
 * One line per ingredient: `id: Name / AltName`.
 */
function buildCatalogPrompt(): string {
  const byCat = new Map<string, string[]>();
  for (const ing of BAR_INGREDIENTS) {
    const label = ing.altName ? `${ing.name} / ${ing.altName}` : ing.name;
    const line = `${ing.id}: ${label}`;
    const list = byCat.get(ing.category) ?? [];
    list.push(line);
    byCat.set(ing.category, list);
  }
  return Array.from(byCat.entries())
    .map(([cat, lines]) => {
      const heading =
        BAR_CATEGORY_LABEL[cat as keyof typeof BAR_CATEGORY_LABEL] ?? cat;
      return `## ${heading}\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

/**
 * Scan a base64 photo of a bar / bottles and resolve the visible products to
 * catalogue ingredient ids. Returns an empty result (no throw) when AI is
 * unavailable so the caller can fall back to manual selection.
 */
export async function scanBarCabinetImage(
  imageBase64: string,
  mimeType = "image/jpeg",
): Promise<BarScanResult> {
  const empty: BarScanResult = {
    ingredientIds: [],
    ingredients: [],
    unmatchedLabels: [],
  };
  if (!imageBase64) return empty;

  const ai = await openAIVisionJson<{ items: VisionItem[] }>({
    system:
      "You identify bar ingredients from a photo of bottles, cans and produce.\n" +
      "For every distinct product you can see, pick the SINGLE best-matching id " +
      "from the catalogue below. Reduce brand names to the generic ingredient " +
      "(e.g. 'Tanqueray' → spirit-gin, 'Jack Daniel's' → the closest whiskey, " +
      "'Schweppes Tonic' → the tonic mixer). Only ever use ids that appear in " +
      "the catalogue. If a clearly-visible product has no reasonable match, " +
      'return it with "id": null so the user is told it was skipped.\n' +
      'Respond as JSON: {"items":[{"id":"spirit-gin","label":"Tanqueray Gin"}]}.\n\n' +
      "CATALOGUE:\n" +
      buildCatalogPrompt(),
    user: "Identify every bar product in this photo and map each to a catalogue id.",
    imageBase64,
    mimeType,
    temperature: 0.1,
    feature: "bar_cabinet_scan",
  });

  if (!ai?.items?.length) return empty;

  const seen = new Set<string>();
  const ingredientIds: string[] = [];
  const ingredients: BarIngredient[] = [];
  const unmatchedLabels: string[] = [];

  for (const item of ai.items) {
    const id = item.id?.trim();
    const ing = id ? BAR_INGREDIENT_INDEX[id] : undefined;
    if (ing && !seen.has(ing.id)) {
      seen.add(ing.id);
      ingredientIds.push(ing.id);
      ingredients.push(ing);
    } else if (!ing) {
      const label = item.label?.trim();
      if (label) unmatchedLabels.push(label);
    }
  }

  return { ingredientIds, ingredients, unmatchedLabels };
}

/**
 * Given the full set of owned ingredient ids, return the cocktails the user
 * can now make, best matches first. Thin wrapper around the deterministic
 * matcher so the scan flow can surface "here's what you can mix" suggestions.
 */
export function cocktailsForCabinet(
  ownedIds: Iterable<string>,
  limit = 12,
): Cocktail[] {
  const ranked = rankCocktails(new Set(ownedIds), ALL_COCKTAILS);
  return ranked
    .filter((m) => m.cookable)
    .slice(0, limit)
    .map((m) => m.cocktail);
}
