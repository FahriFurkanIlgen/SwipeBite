import { Recipe } from "@/types/domain";
import { EXCEL_INFLUENCER_RECIPES } from "./influencerRecipes.excel";
import { SCRAPED_INFLUENCER_RECIPES } from "./influencerRecipes.scraped";

/**
 * Combined "Fenomen Tarifler" deck:
 * - `EXCEL_INFLUENCER_RECIPES` is generated from `insta_receipes.xlsx`
 *   (`scripts/import-influencer-recipes.ts`).
 * - `SCRAPED_INFLUENCER_RECIPES` is generated from live Instagram scrapes
 *   (`scripts/structure-scraped-reels.ts`), structured via OpenAI.
 *
 * Both source arrays are auto-generated; this file is hand-written and
 * just stitches them together for downstream consumers.
 */
export const INFLUENCER_RECIPES: Recipe[] = [
  ...SCRAPED_INFLUENCER_RECIPES,
  ...EXCEL_INFLUENCER_RECIPES,
];
