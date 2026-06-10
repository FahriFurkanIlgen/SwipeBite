/**
 * Mapping helpers for converting TheCocktailDB recipe data into our local
 * shape (`Cocktail` / `BarIngredient`).
 *
 * - `mapIngredientName(name)` returns the BarIngredient.id when the input
 *   matches a known canonical, or `null` when it's an unknown ingredient.
 *   We also strip common English qualifiers ("white", "fresh", "cubed").
 *
 * - `mapGlass(strGlass)` maps TheCocktailDB's free-form glass strings to
 *   our enum, defaulting to `rocks` for the long tail.
 *
 * - `inferTechnique(strInstructions)` heuristically picks a technique from
 *   instruction text keywords.
 *
 * - `inferDifficulty(ingredientCount)` is a simple band based on count.
 *
 * - `inferPrepTimeMinutes(technique, count)` rough estimate for the UI.
 */
import type {
  CocktailDifficulty,
  CocktailGlass,
  CocktailTechnique,
} from "../../src/types/bar";

/**
 * String → barCatalog id. Keys must be lowercased, normalized
 * (no diacritics, single spaces). Multiple aliases per id are common.
 */
const INGREDIENT_ALIASES: Record<string, string> = {
  // ─ Distile ─
  vodka: "spirit-vodka",
  "absolut vodka": "spirit-vodka",
  "absolut citron": "spirit-vodka",
  "smirnoff vodka": "spirit-vodka",
  "vanilla vodka": "spirit-vodka",
  "citrus vodka": "spirit-vodka",
  "lime vodka": "spirit-vodka",
  "vodka citron": "spirit-vodka",

  gin: "spirit-gin",
  "london dry gin": "spirit-gin",
  "old tom gin": "spirit-gin",
  "sloe gin": "spirit-gin",
  "plymouth gin": "spirit-gin",

  rum: "spirit-rum-white",
  "white rum": "spirit-rum-white",
  "light rum": "spirit-rum-white",
  "silver rum": "spirit-rum-white",
  "bacardi limon": "spirit-rum-white",

  "dark rum": "spirit-rum-dark",
  "aged rum": "spirit-rum-dark",
  "spiced rum": "spirit-rum-dark",
  "gold rum": "spirit-rum-dark",
  "151 proof rum": "spirit-rum-dark",
  "dark cream of coconut": "spirit-rum-dark",

  tequila: "spirit-tequila",
  "tequila blanco": "spirit-tequila",
  "tequila reposado": "spirit-tequila",
  "tequila silver": "spirit-tequila",
  "white tequila": "spirit-tequila",
  mezcal: "spirit-tequila",

  bourbon: "spirit-bourbon",
  "bourbon whiskey": "spirit-bourbon",
  "wild turkey": "spirit-bourbon",
  whiskey: "spirit-bourbon",
  whisky: "spirit-bourbon",
  "blended whiskey": "spirit-bourbon",
  "tennessee whiskey": "spirit-bourbon",
  "jack daniels": "spirit-bourbon",

  "rye whiskey": "spirit-rye",
  "canadian whisky": "spirit-rye",
  "irish whiskey": "spirit-rye",
  jameson: "spirit-rye",

  scotch: "spirit-scotch",
  "scotch whisky": "spirit-scotch",
  "blended scotch": "spirit-scotch",
  "single malt scotch": "spirit-scotch",
  drambuie: "spirit-scotch",

  cognac: "spirit-cognac",
  brandy: "spirit-cognac",
  "apricot brandy": "spirit-cognac",
  "cherry brandy": "spirit-cognac",
  "blackberry brandy": "spirit-cognac",
  pisco: "spirit-cognac",
  armagnac: "spirit-cognac",

  // ─ Likör / aperitif ─
  campari: "liqueur-campari",
  aperol: "liqueur-aperol",

  vermouth: "liqueur-vermouth-sweet",
  "sweet vermouth": "liqueur-vermouth-sweet",
  "red vermouth": "liqueur-vermouth-sweet",
  "rosso vermouth": "liqueur-vermouth-sweet",

  "dry vermouth": "liqueur-vermouth-dry",
  "white vermouth": "liqueur-vermouth-dry",

  "triple sec": "liqueur-triple-sec",
  cointreau: "liqueur-triple-sec",
  "grand marnier": "liqueur-triple-sec",
  "orange liqueur": "liqueur-triple-sec",
  curacao: "liqueur-triple-sec",
  "blue curacao": "liqueur-triple-sec",
  "orange curacao": "liqueur-triple-sec",

  "coffee liqueur": "liqueur-coffee",
  kahlua: "liqueur-coffee",
  tia: "liqueur-coffee",
  "tia maria": "liqueur-coffee",

  "elderflower liqueur": "liqueur-elderflower",
  "st-germain": "liqueur-elderflower",
  "st germain": "liqueur-elderflower",

  amaretto: "liqueur-amaretto",
  disaronno: "liqueur-amaretto",

  "coconut liqueur": "liqueur-coconut",
  "coconut rum": "liqueur-coconut",
  malibu: "liqueur-coconut",
  "malibu rum": "liqueur-coconut",
  "cream of coconut": "liqueur-coconut",
  "coco lopez": "liqueur-coconut",
  "coconut cream": "liqueur-coconut",
  "coconut milk": "liqueur-coconut",
  "coconut syrup": "liqueur-coconut",

  "melon liqueur": "liqueur-melon",
  midori: "liqueur-melon",
  "midori melon liqueur": "liqueur-melon",

  "peach schnapps": "liqueur-peach",
  "peach liqueur": "liqueur-peach",
  "peach brandy": "liqueur-peach",

  "irish cream": "liqueur-baileys",
  baileys: "liqueur-baileys",
  "baileys irish cream": "liqueur-baileys",

  "creme de cacao": "liqueur-creme-de-cacao",
  "creme de cacao white": "liqueur-creme-de-cacao",
  "white creme de cacao": "liqueur-creme-de-cacao",
  "dark creme de cacao": "liqueur-creme-de-cacao",
  "godiva liqueur": "liqueur-creme-de-cacao",
  "chocolate liqueur": "liqueur-creme-de-cacao",
  "creme de menthe": "liqueur-creme-de-cacao",
  "white creme de menthe": "liqueur-creme-de-cacao",
  "creme de cassis": "liqueur-creme-de-cacao",

  // ─ Şarap & köpüklü ─
  prosecco: "wine-prosecco",
  "sparkling wine": "wine-prosecco",
  cava: "wine-prosecco",

  champagne: "wine-champagne",

  // ─ Mikserler ─
  "soda water": "mixer-soda",
  "club soda": "mixer-soda",
  "carbonated water": "mixer-soda",
  seltzer: "mixer-soda",

  "tonic water": "mixer-tonic",
  tonic: "mixer-tonic",

  "ginger beer": "mixer-ginger-beer",
  "ginger ale": "mixer-ginger-beer",

  cola: "mixer-cola",
  "coca cola": "mixer-cola",
  "coca-cola": "mixer-cola",
  pepsi: "mixer-cola",

  espresso: "mixer-espresso",
  "fresh espresso": "mixer-espresso",
  coffee: "mixer-espresso",
  "hot coffee": "mixer-espresso",
  "cold brew": "mixer-espresso",

  "cranberry juice": "mixer-cranberry",
  cranberry: "mixer-cranberry",

  "pineapple juice": "mixer-pineapple",
  pineapple: "mixer-pineapple",
  "pineapple syrup": "mixer-pineapple",

  "orange juice": "mixer-orange-juice",
  "fresh orange juice": "mixer-orange-juice",

  "7-up": "mixer-lemon-lime-soda",
  "7 up": "mixer-lemon-lime-soda",
  sprite: "mixer-lemon-lime-soda",
  "lemon-lime soda": "mixer-lemon-lime-soda",
  "lemon lime soda": "mixer-lemon-lime-soda",
  "schweppes russchian": "mixer-lemon-lime-soda",
  lemonade: "mixer-lemon-lime-soda",

  // ─ Sitrüs ─
  lemon: "citrus-lemon",
  "lemon juice": "citrus-lemon",
  "lemon peel": "citrus-lemon",
  "fresh lemon juice": "citrus-lemon",

  lime: "citrus-lime",
  "lime juice": "citrus-lime",
  "lime peel": "citrus-lime",
  "fresh lime juice": "citrus-lime",
  "lime cordial": "citrus-lime",
  "rose's lime juice": "citrus-lime",

  orange: "citrus-orange",
  "orange peel": "citrus-orange",

  grapefruit: "citrus-grapefruit",
  "grapefruit juice": "citrus-grapefruit",

  // ─ Tatlandırıcılar ─
  "simple syrup": "sweet-simple-syrup",
  "sugar syrup": "sweet-simple-syrup",
  syrup: "sweet-simple-syrup",
  "gomme syrup": "sweet-simple-syrup",

  agave: "sweet-agave",
  "agave syrup": "sweet-agave",
  "agave nectar": "sweet-agave",

  honey: "sweet-honey",
  "honey syrup": "sweet-honey",

  grenadine: "sweet-grenadine",

  // ─ Bitter ─
  "angostura bitters": "bitter-angostura",
  bitters: "bitter-angostura",
  angostura: "bitter-angostura",

  "orange bitters": "bitter-orange",

  // ─ Garnitür ─
  mint: "garnish-mint",
  "mint leaves": "garnish-mint",
  "fresh mint": "garnish-mint",
  spearmint: "garnish-mint",

  olive: "garnish-olive",
  olives: "garnish-olive",
  "green olive": "garnish-olive",

  cherry: "garnish-cherry",
  "maraschino cherry": "garnish-cherry",
  "cocktail cherry": "garnish-cherry",
  maraschino: "garnish-cherry",

  salt: "garnish-salt",
  "kosher salt": "garnish-salt",
  "sea salt": "garnish-salt",

  sugar: "garnish-sugar",
  "white sugar": "garnish-sugar",
  "powdered sugar": "garnish-sugar",
  "caster sugar": "garnish-sugar",
  "granulated sugar": "garnish-sugar",
};

/**
 * Garnish-y or trace ingredients that should be marked optional even when
 * mapped to a real id. These don't make a recipe non-cookable.
 */
export const ALWAYS_OPTIONAL_IDS = new Set([
  "garnish-mint",
  "garnish-olive",
  "garnish-cherry",
  "garnish-salt",
  "garnish-sugar",
  "bitter-angostura",
  "bitter-orange",
  "citrus-orange", // when used as peel/garnish; treated as non-essential
]);

/**
 * Normalize an ingredient name for alias lookup.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019']/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strip common qualifiers that don't affect identity (fresh, cubed,
 * crushed, optional, ground, dried, etc.).
 */
function stripQualifiers(s: string): string {
  return s
    .replace(
      /\b(fresh|freshly|squeezed|cubed|crushed|chilled|cold|hot|warm|optional|ground|dried|whole|chopped|sliced|halved|peeled|seedless)\b/g,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

export interface IngredientMapResult {
  id: string | null;
  /** Original input (for unmapped reporting). */
  raw: string;
  /** Normalized form used for alias lookup. */
  normalized: string;
}

export function mapIngredientName(raw: string): IngredientMapResult {
  const norm = stripQualifiers(normalize(raw));
  if (!norm) return { id: null, raw, normalized: norm };

  // Direct hit
  if (INGREDIENT_ALIASES[norm]) {
    return { id: INGREDIENT_ALIASES[norm], raw, normalized: norm };
  }

  // Try removing trailing "juice" / "syrup" then re-lookup
  const stripped = norm.replace(/\b(juice|syrup|liqueur)\b$/, "").trim();
  if (stripped && INGREDIENT_ALIASES[stripped]) {
    return { id: INGREDIENT_ALIASES[stripped], raw, normalized: norm };
  }

  // Word-by-word: any token matches? (e.g. "Kahlua coffee liqueur")
  const tokens = norm.split(" ");
  for (let len = tokens.length; len > 0; len--) {
    for (let i = 0; i + len <= tokens.length; i++) {
      const slice = tokens.slice(i, i + len).join(" ");
      if (INGREDIENT_ALIASES[slice]) {
        return { id: INGREDIENT_ALIASES[slice], raw, normalized: norm };
      }
    }
  }

  return { id: null, raw, normalized: norm };
}

// ─── Glass mapping ────────────────────────────────────────────────────

const GLASS_MAP: Record<string, CocktailGlass> = {
  "old-fashioned glass": "rocks",
  "old fashioned glass": "rocks",
  "rocks glass": "rocks",
  "whiskey glass": "rocks",
  "whiskey sour glass": "rocks",
  "highball glass": "highball",
  "collins glass": "highball",
  "tall glass": "highball",
  "cocktail glass": "coupe",
  "coupe glass": "coupe",
  "coupette glass": "coupe",
  "martini glass": "martini",
  "champagne flute": "flute",
  "flute glass": "flute",
  "white wine glass": "wine",
  "wine glass": "wine",
  "red wine glass": "wine",
  "copper mug": "copper-mug",
  "hurricane glass": "hurricane",
  hurricane: "hurricane",
};

export function mapGlass(strGlass: string | null | undefined): CocktailGlass {
  if (!strGlass) return "rocks";
  const k = strGlass.toLowerCase().trim();
  if (GLASS_MAP[k]) return GLASS_MAP[k];
  for (const [key, val] of Object.entries(GLASS_MAP)) {
    if (k.includes(key)) return val;
  }
  return "rocks";
}

// ─── Technique inference ──────────────────────────────────────────────

export function inferTechnique(instructions: string): CocktailTechnique {
  const t = instructions.toLowerCase();
  if (/\bmuddle/.test(t)) return "muddle";
  if (/\bblend/.test(t)) return "blend";
  if (/\bshake|\bshaken/.test(t)) return "shake";
  if (/\bstir|\bstirred/.test(t)) return "stir";
  return "build";
}

// ─── Difficulty + prep time ───────────────────────────────────────────

export function inferDifficulty(ingredientCount: number): CocktailDifficulty {
  if (ingredientCount <= 3) return "kolay";
  if (ingredientCount <= 5) return "orta";
  return "zor";
}

export function inferPrepTimeMinutes(
  technique: CocktailTechnique,
  ingredientCount: number,
): number {
  const base =
    technique === "muddle"
      ? 5
      : technique === "blend"
        ? 5
        : technique === "shake"
          ? 4
          : technique === "stir"
            ? 4
            : 2; // build
  return base + Math.max(0, ingredientCount - 4);
}

// ─── Slug helper for filenames / ids ──────────────────────────────────

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
