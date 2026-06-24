/* eslint-disable no-console */
/**
 * Imports cocktails from TheCocktailDB into the local catalog.
 *
 *   # Dry-run with first 5 cocktails (no OpenAI translation, no image download)
 *   npx tsx scripts/import-cocktaildb.ts --limit 5 --dry
 *
 *   # Full pipeline
 *   npx tsx scripts/import-cocktaildb.ts
 *
 *   # FULL catalog (merges a–z search + filter.php → ~460 cocktails)
 *   npx tsx scripts/import-cocktaildb.ts --full --no-translate
 *
 *   # Limited count, full pipeline
 *   npx tsx scripts/import-cocktaildb.ts --limit 30
 *
 * Pipeline:
 *  1. fetch every alcoholic cocktail name+id from /filter.php?a=Alcoholic
 *  2. for each, fetch full detail from /lookup.php?i=<id>
 *  3. parse 15 ingredient slots → map to BarIngredient.id (via mapping.ts)
 *  4. infer technique/glass/difficulty/prep time
 *  5. translate description + steps to Turkish via OpenAI (batch, parallel)
 *  6. download image to assets/cocktails/<slug>.jpg
 *  7. write src/constants/cocktailDbRecipes.ts
 *
 * Output files:
 *  - assets/cocktails/<slug>.jpg
 *  - src/constants/cocktailDbRecipes.ts
 *  - src/constants/cocktailDbImages.ts        (require map for offline images)
 *  - scripts/data/cocktaildb-unmapped.json    (report)
 */
import * as fs from "node:fs";
import * as path from "node:path";

import {
  ALWAYS_OPTIONAL_IDS,
  inferDifficulty,
  inferPrepTimeMinutes,
  inferTechnique,
  mapGlass,
  mapIngredientName,
  slugify,
} from "./cocktaildb/mapping";
import type { Cocktail, CocktailIngredientRef } from "../src/types/bar";

// Existing catalog — used to preserve already-translated descriptions/steps
// when re-importing with --no-translate so we don't regress the Turkish copy.
let EXISTING_RECIPES: Cocktail[] = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  EXISTING_RECIPES = require("../src/constants/cocktailDbRecipes")
    .COCKTAILDB_RECIPES as Cocktail[];
} catch {
  EXISTING_RECIPES = [];
}
const GENERIC_DESC_RE = /— klasik kokteyl\.$/;

// ─── CLI args ─────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const LIMIT = (() => {
  const i = argv.indexOf("--limit");
  if (i >= 0) return Number(argv[i + 1]) || Number.POSITIVE_INFINITY;
  return Number.POSITIVE_INFINITY;
})();
const DRY = argv.includes("--dry");
const SKIP_TRANSLATE = argv.includes("--no-translate") || DRY;
const SKIP_IMAGES = argv.includes("--no-images") || DRY;
const FULL = argv.includes("--full");

// ─── Env loader (minimal .env reader) ─────────────────────────────────
function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}
loadDotEnv();

const OPENAI_KEY =
  process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ─── TheCocktailDB types ──────────────────────────────────────────────

interface DBListItem {
  strDrink: string;
  strDrinkThumb: string;
  idDrink: string;
}

interface DBDetail {
  idDrink: string;
  strDrink: string;
  strDrinkAlternate: string | null;
  strTags: string | null;
  strCategory: string | null;
  strIBA: string | null;
  strAlcoholic: string | null;
  strGlass: string | null;
  strInstructions: string | null;
  strDrinkThumb: string | null;
  // 15 ingredient + 15 measure slots
  [k: `strIngredient${number}`]: string | null;
  [k: `strMeasure${number}`]: string | null;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────

const COCKTAILDB_BASE = "https://www.thecocktaildb.com/api/json/v1/1";

async function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function fetchJson<T>(url: string, attempt = 0): Promise<T> {
  const res = await fetch(url);
  if (res.status === 429 || res.status >= 500) {
    if (attempt < 5) {
      const delay = 1000 * Math.pow(2, attempt) + Math.random() * 500;
      await sleep(delay);
      return fetchJson<T>(url, attempt + 1);
    }
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as T;
}

async function fetchAlcoholicList(): Promise<DBListItem[]> {
  const data = await fetchJson<{ drinks: DBListItem[] }>(
    `${COCKTAILDB_BASE}/filter.php?a=Alcoholic`,
  );
  return data.drinks ?? [];
}

/**
 * Fetches the FULL cocktail database by iterating the a–z / 0–9 search
 * endpoint (`search.php?f=<letter>`), which returns complete detail objects
 * and is not capped at 100 like `filter.php?a=Alcoholic`. Deduped by idDrink
 * and filtered to alcoholic drinks only.
 *
 * NOTE: the public API's `search.php?f=` and `filter.php?a=Alcoholic` return
 * partially DISJOINT sets, so we also merge in the filter list (via lookups)
 * to maximise coverage and avoid dropping previously-imported cocktails.
 */
async function fetchFullAlcoholicDetails(): Promise<DBDetail[]> {
  const byId = new Map<string, DBDetail>();

  // Source A: a–z / 0–9 full-text letter search (returns full details).
  const letters = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
  await pool(letters, 2, async (letter) => {
    const data = await fetchJson<{ drinks: DBDetail[] | null }>(
      `${COCKTAILDB_BASE}/search.php?f=${letter}`,
    );
    for (const d of data.drinks ?? []) {
      if (d.strAlcoholic === "Alcoholic") byId.set(d.idDrink, d);
    }
    await sleep(150);
  });
  console.log(`  a–z search yielded: ${byId.size}`);

  // Source B: filter.php?a=Alcoholic (different limited set) → lookup details.
  const filterList = await fetchAlcoholicList();
  const missing = filterList.filter((it) => !byId.has(it.idDrink));
  await pool(missing, 2, async (item) => {
    const d = await fetchDetail(item.idDrink);
    if (d && d.strAlcoholic === "Alcoholic") byId.set(d.idDrink, d);
    await sleep(150);
  });
  console.log(`  + filter.php merged: ${byId.size} total`);

  return [...byId.values()];
}

async function fetchDetail(id: string): Promise<DBDetail | null> {
  const data = await fetchJson<{ drinks: DBDetail[] | null }>(
    `${COCKTAILDB_BASE}/lookup.php?i=${id}`,
  );
  return data.drinks?.[0] ?? null;
}

// Sequential limited concurrency
async function pool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, idx: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => run()));
  return out;
}

// ─── Build local Cocktail from API detail ─────────────────────────────

interface BuiltCocktail {
  cocktail: Cocktail;
  imageUrl: string | null;
  unmappedIngredients: { name: string; amount: string }[];
  /** True when the cocktail had at least one unmapped non-trivial ingredient. */
  skipReason: string | null;
}

const TRIVIAL_UNMAPPED = new Set([
  "ice",
  "ice cubes",
  "crushed ice",
  "water",
  "lemon zest",
  "twist of lemon",
  "twist of lime",
  "food coloring",
  "food colouring",
  "blue food coloring",
  "red food coloring",
  "green food coloring",
  "nutmeg",
  "cinnamon",
  "salt and pepper",
]);

function extractIngredients(detail: DBDetail): {
  refs: CocktailIngredientRef[];
  unmapped: { name: string; amount: string }[];
} {
  const refs: CocktailIngredientRef[] = [];
  const unmapped: { name: string; amount: string }[] = [];
  const seenIds = new Set<string>();

  for (let i = 1; i <= 15; i++) {
    const name = detail[`strIngredient${i}`]?.trim();
    if (!name) continue;
    const measure = (detail[`strMeasure${i}`] ?? "").trim() || "tatlandırıcı";

    const trivialKey = name.toLowerCase().trim();
    if (TRIVIAL_UNMAPPED.has(trivialKey)) continue;

    const m = mapIngredientName(name);
    if (!m.id) {
      unmapped.push({ name, amount: measure });
      continue;
    }
    if (seenIds.has(m.id)) continue;
    seenIds.add(m.id);

    refs.push({
      ingredientId: m.id,
      amount: measure,
      optional: ALWAYS_OPTIONAL_IDS.has(m.id) || undefined,
    });
  }

  return { refs, unmapped };
}

const COCKTAIL_EMOJI_DEFAULT = "🍹";

function pickEmoji(name: string, ingredientIds: string[]): string {
  const n = name.toLowerCase();
  if (n.includes("martini")) return "🍸";
  if (n.includes("mojito")) return "🍃";
  if (n.includes("margarita")) return "🍸";
  if (ingredientIds.includes("liqueur-campari")) return "🟥";
  if (ingredientIds.includes("liqueur-aperol")) return "🧡";
  if (ingredientIds.includes("liqueur-coffee")) return "☕";
  if (
    ingredientIds.includes("spirit-bourbon") ||
    ingredientIds.includes("spirit-rye") ||
    ingredientIds.includes("spirit-scotch")
  )
    return "🥃";
  if (ingredientIds.includes("spirit-tequila")) return "🌵";
  if (ingredientIds.includes("spirit-gin")) return "🌿";
  if (
    ingredientIds.includes("wine-prosecco") ||
    ingredientIds.includes("wine-champagne")
  )
    return "🥂";
  if (ingredientIds.includes("mixer-cranberry")) return "💗";
  return COCKTAIL_EMOJI_DEFAULT;
}

function buildCocktail(detail: DBDetail): BuiltCocktail | null {
  const slug = slugify(detail.strDrink);
  if (!slug) return null;
  const id = `cdb-${slug}`;

  const { refs, unmapped } = extractIngredients(detail);

  // Skip if recipe has too many unmapped or no mapped ingredients at all.
  if (refs.length === 0) {
    return {
      cocktail: { id, name: detail.strDrink } as unknown as Cocktail,
      imageUrl: detail.strDrinkThumb,
      unmappedIngredients: unmapped,
      skipReason: "no-mapped-ingredients",
    };
  }
  if (unmapped.length > 2) {
    return {
      cocktail: { id, name: detail.strDrink } as unknown as Cocktail,
      imageUrl: detail.strDrinkThumb,
      unmappedIngredients: unmapped,
      skipReason: `too-many-unmapped (${unmapped.length})`,
    };
  }

  const technique = inferTechnique(detail.strInstructions ?? "");
  const glass = mapGlass(detail.strGlass);
  const difficulty = inferDifficulty(refs.length);
  const prepTime = inferPrepTimeMinutes(technique, refs.length);

  // Steps: split instructions on sentence boundaries.
  const steps = (detail.strInstructions ?? "")
    .split(/\.\s+|\.\s*$/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => (s.endsWith(".") ? s : `${s}.`));

  const ingredientIds = refs.map((r) => r.ingredientId);

  const cocktail: Cocktail = {
    id,
    name: detail.strDrink,
    altName: detail.strDrinkAlternate ?? undefined,
    description: "", // Filled later by the translation step
    emoji: pickEmoji(detail.strDrink, ingredientIds),
    technique,
    glass,
    difficulty,
    prepTimeMinutes: prepTime,
    servings: 1,
    ingredients: refs,
    steps,
    tags: [
      detail.strCategory?.toLowerCase() ?? "klasik",
      detail.strIBA ? "iba" : "klasik",
    ].filter(Boolean) as string[],
    source: "classic",
    sourceUrl: undefined,
  };

  return {
    cocktail,
    imageUrl: detail.strDrinkThumb,
    unmappedIngredients: unmapped,
    skipReason: null,
  };
}

// ─── OpenAI translation ───────────────────────────────────────────────

interface TranslateBatchEntry {
  id: string;
  name: string;
  /** Original English instructions (already split into steps). */
  steps: string[];
}

interface TranslateBatchResult {
  /** id → { description, steps } */
  [id: string]: { description: string; steps: string[] };
}

async function callOpenAITranslate(
  batch: TranslateBatchEntry[],
  attempt = 0,
): Promise<TranslateBatchResult> {
  const sys = `Sen bir kokteyl uzmanı ve barmensin. Sana verilen kokteyller için Türkçe kısa bir açıklama (1 cümle, 80 karakteri geçmesin) ve adımların Türkçe çevirisini üret. Sadece JSON döndür, başka açıklama yok. Format:
{"results":[{"id":"...","description":"...","steps":["1. adım","2. adım"]}]}
Açıklamada kokteylin tat profilini ve karakterini anlat (acımsı / tatlı / ferah / yoğun gibi).`;
  const user = `Kokteyller:\n${batch
    .map(
      (b) =>
        `- id: ${b.id}\n  isim: ${b.name}\n  adımlar:\n${b.steps.map((s, i) => `    ${i + 1}. ${s}`).join("\n")}`,
    )
    .join("\n\n")}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        response_format: { type: "json_object" },
        temperature: 0.3,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });
  } catch (err) {
    clearTimeout(timer);
    if (attempt < 2) {
      await sleep(1500 * (attempt + 1));
      return callOpenAITranslate(batch, attempt + 1);
    }
    throw err;
  }
  clearTimeout(timer);

  if ((res.status === 429 || res.status >= 500) && attempt < 2) {
    await sleep(2000 * (attempt + 1));
    return callOpenAITranslate(batch, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = json.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as {
    results?: { id: string; description: string; steps: string[] }[];
  };
  const out: TranslateBatchResult = {};
  for (const r of parsed.results ?? []) {
    if (
      typeof r.id === "string" &&
      typeof r.description === "string" &&
      Array.isArray(r.steps)
    ) {
      out[r.id] = { description: r.description, steps: r.steps };
    }
  }
  return out;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─── Image downloader ─────────────────────────────────────────────────

const ASSETS_DIR = path.resolve(process.cwd(), "assets/cocktails");

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  if (fs.existsSync(destPath)) return true;
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);
    return true;
  } catch {
    return false;
  }
}

// ─── Output writers ───────────────────────────────────────────────────

function writeRecipesFile(cocktails: Cocktail[]) {
  const outPath = path.resolve(
    process.cwd(),
    "src/constants/cocktailDbRecipes.ts",
  );
  const header = `// AUTO-GENERATED by scripts/import-cocktaildb.ts
// Do not edit by hand — re-run the import to refresh.
import type { Cocktail } from "@/types/bar";

`;
  const body =
    "export const COCKTAILDB_RECIPES: Cocktail[] = " +
    JSON.stringify(cocktails, null, 2) +
    ";\n\nexport const COCKTAILDB_RECIPE_INDEX: Record<string, Cocktail> = Object.fromEntries(\n  COCKTAILDB_RECIPES.map((c) => [c.id, c]),\n);\n";
  fs.writeFileSync(outPath, header + body, "utf8");
  console.log(`✓ wrote ${cocktails.length} recipes → ${outPath}`);
}

function writeImagesFile(slugsWithImage: string[]) {
  const outPath = path.resolve(
    process.cwd(),
    "src/constants/cocktailDbImages.ts",
  );
  const lines = slugsWithImage
    .map(
      (slug) =>
        `  "cdb-${slug}": require("../../assets/cocktails/${slug}.jpg"),`,
    )
    .join("\n");
  const text = `// AUTO-GENERATED by scripts/import-cocktaildb.ts
// Maps cocktail.id → static require(...) bundle for offline images.
// Do not edit by hand.
import type { ImageSourcePropType } from "react-native";

export const COCKTAILDB_IMAGES: Record<string, ImageSourcePropType> = {
${lines}
};
`;
  fs.writeFileSync(outPath, text, "utf8");
  console.log(`✓ wrote image map (${slugsWithImage.length}) → ${outPath}`);
}

function writeUnmappedReport(
  rows: {
    drink: string;
    ingredients: { name: string; amount: string }[];
    reason: string;
  }[],
) {
  const outPath = path.resolve(
    process.cwd(),
    "scripts/data/cocktaildb-unmapped.json",
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const counts = new Map<string, number>();
  for (const r of rows) {
    for (const ing of r.ingredients) {
      counts.set(ing.name, (counts.get(ing.name) ?? 0) + 1);
    }
  }
  const sortedCounts = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const data = {
    summary: {
      skippedCocktails: rows.length,
      uniqueUnmappedIngredients: counts.size,
    },
    topUnmapped: sortedCounts.slice(0, 50),
    byDrink: rows.slice(0, 100),
  };
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✓ wrote unmapped report → ${outPath}`);
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `🍸 import-cocktaildb (limit=${LIMIT === Number.POSITIVE_INFINITY ? "all" : LIMIT}, dry=${DRY}, translate=${!SKIP_TRANSLATE}, images=${!SKIP_IMAGES})\n`,
  );

  if (!SKIP_TRANSLATE && !OPENAI_KEY) {
    console.error("⚠ EXPO_PUBLIC_OPENAI_API_KEY missing in .env");
    process.exit(1);
  }

  // 1. Fetch list + details
  let details: (DBDetail | null)[];
  if (FULL) {
    console.log("• fetching FULL catalog via a–z search…");
    const full = await fetchFullAlcoholicDetails();
    console.log(`  total alcoholic cocktails: ${full.length}`);
    details = full.slice(0, Math.min(LIMIT, full.length));
    console.log(`  importing: ${details.length}\n`);
  } else {
    console.log("• fetching alcoholic list…");
    const list = await fetchAlcoholicList();
    console.log(`  total alcoholic cocktails: ${list.length}`);

    const subset = list.slice(0, Math.min(LIMIT, list.length));
    console.log(`  importing: ${subset.length}\n`);

    // 2. Fetch detail (concurrency=2, with retry on 429)
    console.log("• fetching details…");
    details = await pool(subset, 2, async (item, i) => {
      if (i % 10 === 0) process.stdout.write(`  [${i}/${subset.length}]\r`);
      const d = await fetchDetail(item.idDrink);
      await sleep(150); // gentle pacing for the public test key
      return d;
    });
    console.log(`  fetched: ${details.filter(Boolean).length}\n`);
  }

  // 3. Build local cocktails + collect unmapped
  const built: BuiltCocktail[] = [];
  for (const d of details) {
    if (!d) continue;
    const b = buildCocktail(d);
    if (!b) continue;
    built.push(b);
  }
  const skipped = built.filter((b) => b.skipReason !== null);
  // Dedupe accepted by cocktail.id — different drink names can slugify to the
  // same id (e.g. straight vs. curly apostrophe), which would create duplicate
  // recipe entries and colliding image files. First one wins.
  const acceptedSeen = new Set<string>();
  const accepted = built
    .filter((b) => b.skipReason === null)
    .filter((b) => {
      if (acceptedSeen.has(b.cocktail.id)) return false;
      acceptedSeen.add(b.cocktail.id);
      return true;
    });
  console.log(
    `• mapped: ${accepted.length} accepted, ${skipped.length} skipped`,
  );

  // 4. Unmapped report
  writeUnmappedReport(
    skipped.map((b) => ({
      drink: b.cocktail?.name ?? "unknown",
      ingredients: b.unmappedIngredients,
      reason: b.skipReason ?? "?",
    })),
  );

  if (accepted.length === 0) {
    console.log("nothing to write");
    return;
  }

  // 5. Translation
  if (!SKIP_TRANSLATE) {
    console.log("\n• translating to Turkish…");
    const batches = chunk(accepted, 8);
    let done = 0;
    await pool(batches, 4, async (batch) => {
      try {
        const result = await callOpenAITranslate(
          batch.map((b) => ({
            id: b.cocktail.id,
            name: b.cocktail.name,
            steps: b.cocktail.steps,
          })),
        );
        for (const b of batch) {
          const tr = result[b.cocktail.id];
          if (tr) {
            b.cocktail.description = tr.description;
            if (tr.steps.length > 0) b.cocktail.steps = tr.steps;
          }
        }
      } catch (err) {
        console.warn(`\n  ! batch failed: ${(err as Error).message}`);
      }
      done++;
      process.stdout.write(`  [${done}/${batches.length}]\r`);
    });
    console.log("");
  } else {
    // English fallback description
    for (const b of accepted) {
      b.cocktail.description = `${b.cocktail.name} — klasik kokteyl.`;
    }
  }

  // Preserve already-translated Turkish copy for cocktails we imported before.
  const existingById = new Map(EXISTING_RECIPES.map((r) => [r.id, r]));
  let preserved = 0;
  for (const b of accepted) {
    const prev = existingById.get(b.cocktail.id);
    if (
      prev &&
      prev.description &&
      !GENERIC_DESC_RE.test(prev.description)
    ) {
      b.cocktail.description = prev.description;
      if (prev.steps?.length) b.cocktail.steps = prev.steps;
      preserved++;
    }
  }
  if (preserved > 0) {
    console.log(`  ↺ preserved ${preserved} existing translations`);
  }

  // 6. Image download
  const slugsWithImage: string[] = [];
  if (!SKIP_IMAGES) {
    console.log("\n• downloading images…");
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
    let imgDone = 0;
    await pool(accepted, 6, async (b) => {
      if (!b.imageUrl) return;
      const slug = b.cocktail.id.replace(/^cdb-/, "");
      const dest = path.join(ASSETS_DIR, `${slug}.jpg`);
      // medium thumbnail (175x175) keeps bundle small
      const url = `${b.imageUrl}/medium`;
      const ok = await downloadImage(url, dest);
      if (ok) {
        slugsWithImage.push(slug);
        b.cocktail.imageUrl = `cocktaildb:${slug}`;
      }
      imgDone++;
      if (imgDone % 10 === 0)
        process.stdout.write(`  [${imgDone}/${accepted.length}]\r`);
    });
    console.log(`  ✓ ${slugsWithImage.length} images saved`);
  }

  // 7. Write output files
  if (DRY) {
    console.log(
      `\n(dry-run) would write ${accepted.length} recipes; no files changed.`,
    );
    console.log(`\n✅ done (dry). ${accepted.length} cocktails mapped.`);
    return;
  }
  console.log("\n• writing output…");
  writeRecipesFile(accepted.map((b) => b.cocktail));
  if (slugsWithImage.length > 0) {
    writeImagesFile(slugsWithImage);
  }

  console.log(`\n✅ done. ${accepted.length} cocktails imported.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
