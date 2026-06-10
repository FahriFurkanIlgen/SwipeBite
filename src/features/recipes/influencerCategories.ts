/**
 * Helpers for the “Fenomen Tarifler” quick action: bucket the 100+ influencer
 * recipes into kahvaltı / ana / tatlı / içecek / atıştırmalık / salata-meze
 * groups, then rank within a chosen group by pantry coverage so the user
 * gets a focused, cookable deck instead of a giant grab-bag of 123 cards.
 */
import { PantryItem, Recipe } from "@/types/domain";
import { classifyCourse, Course } from "@/features/recipes/recipeClassifier";
import { recipePantryCoverage } from "@/features/pantry/pantryMatcher";

/** Groups exposed in the Fenomen Tarifler picker. */
export type InfluencerCategory =
  | "kahvalti"
  | "ana"
  | "tatli"
  | "icecek"
  | "atistirmalik"
  | "salata-meze";

export const INFLUENCER_CATEGORY_LABEL: Record<InfluencerCategory, string> = {
  kahvalti: "Kahvaltı",
  ana: "Ana Yemek",
  tatli: "Tatlı",
  icecek: "İçecek",
  atistirmalik: "Atıştırmalık",
  "salata-meze": "Salata & Meze",
};

export const INFLUENCER_CATEGORY_EMOJI: Record<InfluencerCategory, string> = {
  kahvalti: "🍳",
  ana: "🍽",
  tatli: "🍰",
  icecek: "🥤",
  atistirmalik: "🍪",
  "salata-meze": "🥗",
};

export const INFLUENCER_CATEGORY_ORDER: InfluencerCategory[] = [
  "ana",
  "tatli",
  "icecek",
  "kahvalti",
  "atistirmalik",
  "salata-meze",
];

/** Map a `classifyCourse` result onto our coarser picker buckets. */
function courseToCategory(course: Course): InfluencerCategory {
  switch (course) {
    case "kahvalti":
      return "kahvalti";
    case "tatli":
      return "tatli";
    case "icecek":
      return "icecek";
    case "atistirmalik":
      return "atistirmalik";
    case "salata":
    case "meze":
      return "salata-meze";
    case "corba":
    case "ana":
    case "sos":
    default:
      return "ana";
  }
}

/**
 * Title keywords that strongly indicate a main dish — used to override
 * cases where OpenAI tagging mislabelled a clearly savoury recipe as
 * "içecek" / "tatlı" / etc. Title trumps tags for influencer content
 * because the OpenAI prompt has produced noisy tag arrays.
 */
const MAIN_DISH_TITLE_WORDS = [
  "tavuk",
  "köfte",
  "kofte",
  "burger",
  "pizza",
  "makarna",
  "orzo",
  "pilav",
  "biftek",
  "et ",
  "sote",
  "kavurma",
  "döner",
  "doner",
  "sandviç",
  "sandvic",
  "tost",
  "lahmacun",
  "pide",
  "börek",
  "borek",
  "mantı",
  "manti",
  "kebap",
  "musakka",
  "fırın",
  "firin",
  "balık",
  "balik",
  "somon",
  "karides",
  "yumurta",
  "menemen",
  "omlet",
  "schnitzel",
];

const DRINK_TITLE_WORDS = [
  "limonata",
  "kahve",
  "smoothie",
  "milkshake",
  "frappe",
  "shake",
  "kokteyl",
  "espresso",
  "latte",
  "matcha",
  "ayran",
  "şalgam",
  "salgam",
  "boza",
  "sahlep",
  "salep",
  "şerbet",
  "serbet",
  "sıkma",
  "sikma",
  "soğuk çay",
  "soguk cay",
  "sıcak çikolata",
  "sicak cikolata",
];

const DESSERT_TITLE_WORDS = [
  "tatlı",
  "tatli",
  "kek",
  "brownie",
  "cookie",
  "cheesecake",
  "tiramisu",
  "magnolia",
  "muhallebi",
  "dondurma",
  "puding",
  "pudding",
  "sufle",
  "soufflé",
  "baklava",
  "kadayıf",
  "kadayif",
  "trileçe",
  "trilece",
  "profiterol",
  "waffle",
  "donut",
  "krokan",
  "sütlaç",
  "sutlac",
];

const BREAKFAST_TITLE_WORDS = [
  "kahvaltı",
  "kahvalti",
  "pankek",
  "pancake",
  "menemen",
  "omlet",
  "yumurta",
];

const SALAD_MEZE_TITLE_WORDS = [
  "salata",
  "salatası",
  "salatasi",
  "meze",
  "mezesi",
  "humus",
  "haydari",
  "muhammara",
  "babagannuş",
  "babaganus",
  "cacık",
  "cacik",
  "ezme",
];

const SNACK_TITLE_WORDS = [
  "atıştırmalık",
  "atistirmalik",
  "cips",
  "chips",
  "popcorn",
  "patlamış mısır",
  "patlamis misir",
  "kraker",
  "bun",
  "muffin",
  "çıtır kabak",
  "citir kabak",
];

function normalizeTitle(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u");
}

// Pre-normalize the keyword lists once at module load. Previously every
// `titleMatches` call re-normalized each keyword for every recipe — across
// 120+ recipes × 6 word-lists that was thousands of redundant regex passes
// and the main reason the Fenomen "Ana Yemek" picker stalled.
const N_DESSERT_WORDS = DESSERT_TITLE_WORDS.map(normalizeTitle);
const N_DRINK_WORDS = DRINK_TITLE_WORDS.map(normalizeTitle);
const N_SALAD_MEZE_WORDS = SALAD_MEZE_TITLE_WORDS.map(normalizeTitle);
const N_BREAKFAST_WORDS = BREAKFAST_TITLE_WORDS.map(normalizeTitle);
const N_SNACK_WORDS = SNACK_TITLE_WORDS.map(normalizeTitle);
const N_MAIN_DISH_WORDS = MAIN_DISH_TITLE_WORDS.map(normalizeTitle);

function normalizedTextIncludes(
  normalizedHaystack: string,
  normalizedWords: string[],
): boolean {
  return normalizedWords.some((w) => normalizedHaystack.includes(w));
}

/**
 * Per-recipe categorization cache. Recipe objects are stable module
 * constants, so a WeakMap lets `countByCategory` and `pickInfluencerRecipes`
 * share work and makes repeated category selections effectively free.
 */
const CATEGORY_CACHE = new WeakMap<Recipe, InfluencerCategory>();

export function categorizeInfluencerRecipe(recipe: Recipe): InfluencerCategory {
  const cached = CATEGORY_CACHE.get(recipe);
  if (cached) return cached;
  const result = computeInfluencerCategory(recipe);
  CATEGORY_CACHE.set(recipe, result);
  return result;
}

function computeInfluencerCategory(recipe: Recipe): InfluencerCategory {
  // Title-first overrides — OpenAI's `tags` array is noisy, but titles are
  // copy-pasted from the original captions and are reliable.
  // Order matters: dessert is checked before drink so e.g. "Japon
  // Cheesecake" (description happens to mention espresso) lands in tatlı,
  // not içecek; salata before main-dish so "Çıtır Makarna Salatası" lands
  // in salata-meze.
  const haystack = normalizeTitle(
    `${recipe.title} ${recipe.description.slice(0, 160)}`,
  );
  if (normalizedTextIncludes(haystack, N_DESSERT_WORDS)) return "tatli";
  if (normalizedTextIncludes(haystack, N_DRINK_WORDS)) return "icecek";
  if (normalizedTextIncludes(haystack, N_SALAD_MEZE_WORDS))
    return "salata-meze";
  if (normalizedTextIncludes(haystack, N_BREAKFAST_WORDS)) return "kahvalti";
  if (normalizedTextIncludes(haystack, N_SNACK_WORDS)) return "atistirmalik";
  if (normalizedTextIncludes(haystack, N_MAIN_DISH_WORDS)) return "ana";

  const fallback = courseToCategory(classifyCourse(recipe));
  // Final sanity-check: if `classifyCourse` lands on "icecek" purely from a
  // misleading tag but the recipe actually has 4+ ingredients (real drinks
  // are short), promote it to "ana" so it doesn't pollute the drinks deck.
  if (fallback === "icecek" && recipe.ingredients.length >= 4) return "ana";
  return fallback;
}

/** How many recipes per category exist in the pool, after deduping. */
export function countByCategory(
  recipes: Recipe[],
): Record<InfluencerCategory, number> {
  const counts: Record<InfluencerCategory, number> = {
    kahvalti: 0,
    ana: 0,
    tatli: 0,
    icecek: 0,
    atistirmalik: 0,
    "salata-meze": 0,
  };
  for (const r of recipes) counts[categorizeInfluencerRecipe(r)] += 1;
  return counts;
}

export interface PickInfluencerOptions {
  /** Cap on number of recipes returned for the swipe deck. */
  limit?: number;
  /** Min pantry coverage % to keep a recipe when pantry is non-trivial. */
  minCoverage?: number;
}

/**
 * Filter `recipes` to the requested category, then order by:
 *   1. weighted pantry coverage (recipes you can mostly cook now go first),
 *   2. fewer missing ingredients,
 *   3. shorter prep time as a tie-breaker.
 *
 * If the pantry is empty/sparse we fall back to a deterministic shuffle so
 * users still get a varied deck without the same 12 recipes every time.
 */
export function pickInfluencerRecipes(
  recipes: Recipe[],
  pantry: PantryItem[],
  category: InfluencerCategory,
  options: PickInfluencerOptions = {},
): Recipe[] {
  const { limit = 12, minCoverage = 0 } = options;
  const pool = recipes.filter(
    (r) => categorizeInfluencerRecipe(r) === category,
  );
  if (pool.length === 0) return [];

  // Sparse pantry → no point ranking, just rotate.
  if (pantry.length < 3) {
    return rotatedSlice(pool, limit);
  }

  const scored = pool.map((recipe) => {
    const { percent, missing } = recipePantryCoverage(recipe, pantry);
    return {
      recipe,
      percent,
      missingCount: missing.length,
    };
  });

  const usable = scored.filter((s) => s.percent >= minCoverage);
  // If almost nothing matches the pantry, don't dead-end the user — fall back
  // to the rotated full pool so they still get *some* deck.
  if (usable.length < Math.min(6, limit)) {
    return rotatedSlice(pool, limit);
  }

  usable.sort((a, b) => {
    if (b.percent !== a.percent) return b.percent - a.percent;
    if (a.missingCount !== b.missingCount)
      return a.missingCount - b.missingCount;
    return a.recipe.prepTimeMinutes - b.recipe.prepTimeMinutes;
  });

  return usable.slice(0, limit).map((s) => s.recipe);
}

/**
 * Rotate the pool by today's day-of-year so the same user sees a different
 * subset each day without us having to track per-user history. Cheaper than
 * a real shuffle and keeps the order stable within a single day.
 */
function rotatedSlice<T>(arr: T[], limit: number): T[] {
  if (arr.length <= limit) return arr.slice();
  const today = new Date();
  const day =
    Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86_400_000,
    ) % arr.length;
  const rotated = arr.slice(day).concat(arr.slice(0, day));
  return rotated.slice(0, limit);
}
