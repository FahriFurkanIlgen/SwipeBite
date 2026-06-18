/* eslint-disable no-console */
/**
 * Imports the English content workbook into the app's TypeScript constants.
 *
 *   npx tsx scripts/import-cocktail-content-en.ts
 *
 * Source: ./cocktail_app_content_english_500.xlsx (workspace root)
 *
 * Generates (overwrites):
 *  - src/constants/barCatalog.ts        — 214 ingredients + category labels/order
 *  - src/constants/cocktailContentEn.ts — 500 cocktails
 *
 * The content is imported "as-is" (English names/descriptions/steps). Enum
 * values are validated against the app schema in src/types/bar.ts.
 */
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";
import * as XLSX from "xlsx";

const SRC = resolve(process.cwd(), "cocktail_app_content_english_500.xlsx");
const OUT_CATALOG = resolve(process.cwd(), "src/constants/barCatalog.ts");
const OUT_RECIPES = resolve(
  process.cwd(),
  "src/constants/cocktailContentEn.ts",
);

// Ingredient category display name (workbook) → stable code slug (app schema).
const CATEGORY_CODE: Record<string, string> = {
  Spirits: "spirits",
  "Liqueurs & Vermouth": "liqueur-vermouth",
  "Amaro & Bitters": "amaro-bitters",
  "Wine & Sparkling": "wine-sparkling",
  Mixers: "mixer",
  "Citrus & Juices": "citrus-juice",
  "Sweeteners & Syrups": "sweetener-syrup",
  Bitters: "bitter",
  Additives: "additive",
  "Fruit & Produce": "fruit-produce",
  Garnishes: "garnish",
  "Savory Add-ins": "savory",
  "Tea & Infusions": "tea-infusion",
  "Flavor Waters": "flavor-water",
  "Zero-Proof Spirits": "zero-proof-spirit",
  "Bar Tools / Effects": "bar-tool",
};

const VALID_TECHNIQUE = new Set(["shake", "stir", "build", "blend", "muddle"]);
const VALID_GLASS = new Set([
  "rocks",
  "highball",
  "coupe",
  "martini",
  "flute",
  "wine",
  "copper-mug",
  "hurricane",
  "tiki",
  "julep-cup",
  "mug",
]);
const VALID_DIFFICULTY = new Set(["easy", "medium", "hard"]);
const VALID_SOURCE = new Set([
  "classic",
  "modern-classic",
  "new-gen",
  "low-abv",
  "zero-proof",
]);

interface IngRow {
  ID: string;
  Name: string;
  "Alternate Name": string;
  Category: string;
  Emoji: string;
  Essential: string;
}

interface CockRow {
  ID: string;
  Name: string;
  "Original Name": string;
  Emoji: string;
  Description: string;
  Technique: string;
  Glass: string;
  Difficulty: string;
  "Time (min)": number | string;
  Servings: number | string;
  Ingredients: string;
  Steps: string;
  Tags: string;
  "Source Type": string;
  "Reference URL": string;
  "Image URL": string;
  "Reels URL": string;
}

function s(v: unknown): string {
  return String(v ?? "").trim();
}

function splitLines(v: unknown): string[] {
  return s(v)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

const wb = XLSX.readFile(SRC);
const ingRows = XLSX.utils.sheet_to_json<IngRow>(wb.Sheets["Ingredients"], {
  defval: "",
});
const cockRows = XLSX.utils.sheet_to_json<CockRow>(wb.Sheets["Cocktails"], {
  defval: "",
});
const lookups = XLSX.utils.sheet_to_json<Record<string, string>>(
  wb.Sheets["Lookups"],
  { defval: "" },
);

// ─── Category order/labels from Lookups ──────────────────────────────
const categoryOrderNames = lookups
  .map((r) => s(r["Ingredient Category"]))
  .filter(Boolean);

const orderedCodes: string[] = [];
const labelByCode: Record<string, string> = {};
for (const name of categoryOrderNames) {
  const code = CATEGORY_CODE[name];
  if (!code) throw new Error(`Unknown ingredient category in Lookups: ${name}`);
  orderedCodes.push(code);
  labelByCode[code] = name;
}

// ─── Ingredients ─────────────────────────────────────────────────────
interface OutIngredient {
  id: string;
  name: string;
  altName?: string;
  category: string;
  emoji: string;
  essential?: boolean;
}

const ingredientIds = new Set<string>();
const ingredients: OutIngredient[] = ingRows.map((r) => {
  const id = s(r.ID);
  if (!id) throw new Error("Ingredient with empty ID");
  if (ingredientIds.has(id)) throw new Error(`Duplicate ingredient id: ${id}`);
  ingredientIds.add(id);

  const catName = s(r.Category);
  const code = CATEGORY_CODE[catName];
  if (!code) throw new Error(`Unknown ingredient category: ${catName} (${id})`);

  const out: OutIngredient = {
    id,
    name: s(r.Name),
    category: code,
    emoji: s(r.Emoji) || "🍸",
  };
  const alt = s(r["Alternate Name"]);
  if (alt) out.altName = alt;
  if (s(r.Essential).toUpperCase() === "YES") out.essential = true;
  return out;
});

// ─── Cocktails ───────────────────────────────────────────────────────
interface OutIngRef {
  ingredientId: string;
  amount: string;
  optional?: boolean;
}
interface OutCocktail {
  id: string;
  name: string;
  altName?: string;
  description: string;
  emoji: string;
  technique: string;
  glass: string;
  difficulty: string;
  prepTimeMinutes: number;
  servings: number;
  ingredients: OutIngRef[];
  steps: string[];
  tags: string[];
  source: string;
  referenceUrl?: string;
  imageUrl?: string;
  sourceUrl?: string;
}

const cocktailIds = new Set<string>();
const unknownRefs = new Set<string>();
const cocktails: OutCocktail[] = cockRows.map((r) => {
  const id = s(r.ID);
  if (!id) throw new Error("Cocktail with empty ID");
  if (cocktailIds.has(id)) throw new Error(`Duplicate cocktail id: ${id}`);
  cocktailIds.add(id);

  const technique = s(r.Technique);
  const glass = s(r.Glass);
  const difficulty = s(r.Difficulty);
  const source = s(r["Source Type"]);
  if (!VALID_TECHNIQUE.has(technique))
    throw new Error(`Invalid technique '${technique}' (${id})`);
  if (!VALID_GLASS.has(glass))
    throw new Error(`Invalid glass '${glass}' (${id})`);
  if (!VALID_DIFFICULTY.has(difficulty))
    throw new Error(`Invalid difficulty '${difficulty}' (${id})`);
  if (!VALID_SOURCE.has(source))
    throw new Error(`Invalid source '${source}' (${id})`);

  const refs: OutIngRef[] = splitLines(r.Ingredients).map((line) => {
    const parts = line.split("|").map((p) => p.trim());
    const ingredientId = parts[0];
    if (!ingredientIds.has(ingredientId)) unknownRefs.add(ingredientId);
    const ref: OutIngRef = { ingredientId, amount: parts[1] ?? "" };
    if ((parts[2] ?? "").toLowerCase() === "optional") ref.optional = true;
    return ref;
  });

  const out: OutCocktail = {
    id,
    name: s(r.Name),
    description: s(r.Description),
    emoji: s(r.Emoji) || "🍸",
    technique,
    glass,
    difficulty,
    prepTimeMinutes: Number(r["Time (min)"]) || 0,
    servings: Number(r.Servings) || 1,
    ingredients: refs,
    steps: splitLines(r.Steps),
    tags: s(r.Tags)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    source,
  };
  const altName = s(r["Original Name"]);
  if (altName && altName !== out.name) out.altName = altName;
  const refUrl = s(r["Reference URL"]);
  if (refUrl) out.referenceUrl = refUrl;
  const imageUrl = s(r["Image URL"]);
  if (imageUrl) out.imageUrl = imageUrl;
  const reelsUrl = s(r["Reels URL"]);
  if (reelsUrl) out.sourceUrl = reelsUrl;
  return out;
});

if (unknownRefs.size > 0) {
  throw new Error(
    `Cocktails reference ${unknownRefs.size} unknown ingredient id(s): ${[...unknownRefs].slice(0, 20).join(", ")}`,
  );
}

// ─── Emit barCatalog.ts ──────────────────────────────────────────────
const catalogHeader = `// AUTO-GENERATED by scripts/import-cocktail-content-en.ts
// Source: cocktail_app_content_english_500.xlsx
// Do not edit by hand — re-run the import to refresh.
import type { BarIngredient, BarIngredientCategory } from "@/types/bar";

export const BAR_INGREDIENTS: BarIngredient[] = ${JSON.stringify(ingredients, null, 2)};

export const BAR_INGREDIENT_INDEX: Record<string, BarIngredient> =
  Object.fromEntries(BAR_INGREDIENTS.map((i) => [i.id, i]));

export const BAR_CATEGORY_LABEL: Record<BarIngredientCategory, string> = ${JSON.stringify(labelByCode, null, 2)};

export const BAR_CATEGORY_ORDER: BarIngredientCategory[] = ${JSON.stringify(orderedCodes, null, 2)};
`;
writeFileSync(OUT_CATALOG, catalogHeader, "utf8");

// ─── Emit cocktailContentEn.ts ───────────────────────────────────────
const recipesHeader = `// AUTO-GENERATED by scripts/import-cocktail-content-en.ts
// Source: cocktail_app_content_english_500.xlsx
// Do not edit by hand — re-run the import to refresh.
import type { Cocktail } from "@/types/bar";

export const COCKTAIL_CONTENT_EN: Cocktail[] = ${JSON.stringify(cocktails, null, 2)};
`;
writeFileSync(OUT_RECIPES, recipesHeader, "utf8");

console.log(
  `✓ ${ingredients.length} malzeme → ${OUT_CATALOG}\n✓ ${cocktails.length} kokteyl → ${OUT_RECIPES}`,
);
