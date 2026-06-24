import type { Cocktail } from "@/types/bar";

import { COCKTAIL_CONTENT_EN } from "./cocktailContentEn";

/**
 * Cocktail pool. Imported as-is from the English content workbook
 * (`cocktail_app_content_english_500.xlsx`) via
 * `scripts/import-cocktail-content-en.ts`.
 */
export const ALL_COCKTAILS: Cocktail[] = COCKTAIL_CONTENT_EN;

export const ALL_COCKTAIL_INDEX: Record<string, Cocktail> = Object.fromEntries(
  ALL_COCKTAILS.map((c) => [c.id, c]),
);
