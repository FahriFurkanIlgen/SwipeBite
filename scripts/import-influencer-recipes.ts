/**
 * Import "Fenomen Tarifler" from `insta_receipes.xlsx` into static constants.
 *
 * Pipeline:
 *  1. Read the "Tarifler" sheet.
 *  2. Skip rows whose `Malzemeler` column is empty / too short.
 *  3. Fetch each Instagram reel page, grab `<meta property="og:image">`.
 *     - Save successful images to `assets/influencer/<slug>.jpg`.
 *     - Drop the recipe entirely if Instagram serves a login wall (no og:image).
 *  4. Light Turkish normalization on ingredients/steps:
 *     - Replace common English measurement words (cup, tbsp, with, the, ...).
 *     - Trim bullet markers and excess whitespace.
 *  5. Categorize → tag, derive prep time from "Süre", classify difficulty.
 *  6. Emit:
 *     - `src/constants/influencerRecipes.ts` (Recipe[] data)
 *     - `src/constants/influencerImages.ts` (require() map, keyed by recipe id)
 *
 * Run with:  npx tsx scripts/import-influencer-recipes.ts
 */
import * as XLSX from "xlsx";
import { resolve } from "node:path";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  createWriteStream,
} from "node:fs";
import { writeFile } from "node:fs/promises";

interface Row {
  Sıra: number | string;
  "Tarif Adı": string;
  Kategori: string;
  "Instagram Linki": string;
  "Hesap Adı": string;
  "Kullanıcı Adı": string;
  Süre: string;
  Zorluk: string;
  Malzemeler: string;
  Yapılış: string;
  Hashtagler: string;
  "Açıklama (Türkçe)": string;
}

const ROOT = process.cwd();
const SRC_XLSX = resolve(ROOT, "insta_receipes.xlsx");
const ASSET_DIR = resolve(ROOT, "assets", "influencer");
const RECIPES_OUT = resolve(
  ROOT,
  "src",
  "constants",
  "influencerRecipes.excel.ts",
);
const IMAGES_OUT = resolve(
  ROOT,
  "src",
  "constants",
  "influencerImages.excel.ts",
);

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

// ----- helpers ---------------------------------------------------------------

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ğ]/g, "g")
    .replace(/[ü]/g, "u")
    .replace(/[ş]/g, "s")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

// Minimal English → Turkish substitution for measurement / connective words
// that slip through translation. Whole-word, case-insensitive.
const EN_TR_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\btablespoons?\b/gi, "yemek kaşığı"],
  [/\btbsps?\b/gi, "yemek kaşığı"],
  [/\bteaspoons?\b/gi, "çay kaşığı"],
  [/\btsps?\b/gi, "çay kaşığı"],
  [/\bcups?\b/gi, "su bardağı"],
  [/\bounces?\b/gi, "ons"],
  [/\boz\b/gi, "ons"],
  [/\bcloves?\b/gi, "diş"],
  [/\bpinch\b/gi, "tutam"],
  [/\bsplash of\b/gi, "biraz"],
  [/\bsalt to taste\b/gi, "tadında tuz"],
  [/\bfor (the )?garnish\b/gi, "süslemek için"],
  [/\bto taste\b/gi, "tadında"],
  [/\boptional\b/gi, "opsiyonel"],
  [/\bgarnish\b/gi, "süs"],
  [/\bsugar\b/gi, "şeker"],
  [/\bwater\b/gi, "su"],
  [/\bsalt\b/gi, "tuz"],
  [/\bflour\b/gi, "un"],
  [/\bbutter\b/gi, "tereyağı"],
  [/\beggs?\b/gi, "yumurta"],
  [/\boil\b/gi, "yağ"],
  [/\bmilk\b/gi, "süt"],
  [/\bcream\b/gi, "krema"],
  [/\bcheese\b/gi, "peynir"],
  [/\bchicken\b/gi, "tavuk"],
  [/\bbeef\b/gi, "dana"],
  [/\bgarlic\b/gi, "sarımsak"],
  [/\bonion\b/gi, "soğan"],
  [/\blemon juice\b/gi, "limon suyu"],
  [/\blemon\b/gi, "limon"],
  [/\bcondensed milk\b/gi, "yoğunlaştırılmış süt"],
  [/\bblender\b/gi, "blender"],
  [/\bcombine\b/gi, "birleştir"],
  [/\bmix\b/gi, "karıştır"],
  [/\bbake\b/gi, "fırınla"],
  [/\bfry\b/gi, "kızart"],
  [/\bcook\b/gi, "pişir"],
  [/\bserve\b/gi, "servis et"],
  [/\badd\b/gi, "ekle"],
  [/\bstir\b/gi, "karıştır"],
  [/\bwith\b/gi, "ile"],
  [/\band\b/gi, "ve"],
  // NOTE: We intentionally do NOT strip "the/of/in" — JS \b treats Turkish
  // non-ASCII letters (ç, ğ, ş…) as word boundaries, so e.g. `için` would
  // be mangled into `iç`. Rows that still contain those words after this
  // table are filtered out earlier by `hasEnglishContent()`.
];

function normalizeTurkish(text: string): string {
  if (!text) return "";
  let out = text;
  for (const [re, sub] of EN_TR_REPLACEMENTS) {
    out = out.replace(re, sub);
  }
  // Collapse double spaces left behind by removed words.
  out = out
    .replace(/[ \t]+/g, " ")
    .replace(/ ,/g, ",")
    .trim();
  return out;
}

function splitBulletList(raw: string): string[] {
  if (!raw) return [];
  // Split on newlines; tolerate "- ", "• ", "* ", numbered "1." prefixes.
  return raw
    .split(/\r?\n+/)
    .map((s) => s.replace(/^[\s\-•*\u2022]+/, "").replace(/^\d+[.)]\s*/, ""))
    .map((s) => normalizeTurkish(s).trim())
    .filter((s) => s.length > 1);
}

function parseIngredients(
  raw: string,
): Array<{ name: string; quantity?: string }> {
  return splitBulletList(raw).map((line) => {
    // Try to split "1 su bardağı limon" → quantity / name.
    const m = line.match(
      /^([\d¼½¾⅓⅔]+[\d/.,\s\-]*[a-zA-ZçğıöşüÇĞİÖŞÜ]*\s+)?(.*)$/,
    );
    if (m && m[1] && m[2]) {
      return { quantity: m[1].trim(), name: m[2].trim() };
    }
    return { name: line };
  });
}

function parsePrepMinutes(raw: string): number {
  if (!raw) return 25;
  const m = String(raw).match(/(\d+)/);
  if (!m) return 25;
  const n = parseInt(m[1], 10);
  if (raw.toLowerCase().includes("saat")) return n * 60;
  return n;
}

function parseDifficulty(raw: string): "kolay" | "orta" | "zor" {
  const r = (raw || "").toLowerCase();
  if (r.startsWith("zor")) return "zor";
  if (r.startsWith("orta")) return "orta";
  return "kolay";
}

function categoryToTags(cat: string): string[] {
  const tags = new Set<string>(["fenomen", "instagram"]);
  const c = (cat || "").toLowerCase();
  if (c.includes("kahvalt")) tags.add("kahvaltı");
  if (c.includes("tatlı")) tags.add("tatlı");
  if (c.includes("içecek") || c.includes("kokteyl")) tags.add("içecek");
  if (c.includes("atıştır")) tags.add("atıştırma");
  if (c.includes("öğle")) tags.add("öğle");
  if (c.includes("akşam")) tags.add("akşam");
  if (c.includes("çorba")) tags.add("çorba");
  if (c.includes("hamur")) tags.add("hamur işi");
  if (c.includes("salata")) tags.add("salata");
  return Array.from(tags);
}

// Whole-word English markers. We test the RAW Excel text (pre-normalization)
// against this list and skip any row with too many hits — those translations
// come out garbled. Single-word matches in titles are tolerated.
const EN_MARKERS = [
  "the",
  "and",
  "with",
  "for",
  "from",
  "into",
  "that",
  "this",
  "these",
  "those",
  "cup",
  "cups",
  "tbsp",
  "tsp",
  "tablespoon",
  "teaspoon",
  "ounce",
  "ounces",
  "chicken",
  "beef",
  "garlic",
  "onion",
  "butter",
  "sugar",
  "flour",
  "salt",
  "water",
  "milk",
  "cream",
  "cheese",
  "lemon",
  "eggs",
  "combine",
  "stir",
  "mix",
  "bake",
  "fry",
  "cook",
  "serve",
  "add",
  "blend",
  "until",
  "minutes",
  "season",
  "remove",
  "drain",
  "slice",
  "chop",
  "garnish",
  "taste",
  "splash",
  "pinch",
  "cloves",
  "recipe",
  "ingredients",
  "instructions",
  "directions",
  "method",
];

function englishWordCount(text: string): number {
  if (!text) return 0;
  const tokens = text.toLowerCase().match(/[a-z']{2,}/g) ?? [];
  let hits = 0;
  for (const tok of tokens) {
    if (EN_MARKERS.includes(tok)) hits += 1;
  }
  return hits;
}

function hasEnglishContent(row: Row): boolean {
  // Combine the fields that actually feed the recipe payload.
  const blob = `${row["Malzemeler"] ?? ""}\n${row["Yapılış"] ?? ""}\n${
    row["Açıklama (Türkçe)"] ?? ""
  }`;
  // ≥4 English marker hits (case-insensitive, whole word) → almost certainly
  // un-translated. We also flag any imperial unit (tbsp/tsp/cup), which is a
  // dead giveaway even on otherwise Turkish-looking text.
  if (/\b(tbsps?|tsps?|cups?|ounces?|oz)\b/i.test(blob)) return true;
  return englishWordCount(blob) >= 4;
}

// ----- Instagram og:image scrape --------------------------------------------

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Two common shapes:
    //   <meta property="og:image" content="https://..."/>
    //   <meta content="https://..." property="og:image"/>
    const m1 = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    );
    const raw = m1
      ? m1[1]
      : (html.match(
          /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
        ) || [])[1] || null;
    if (!raw) return null;
    // HTML entity decode (Instagram serves &amp; inside the meta content).
    return raw
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#x2F;/gi, "/")
      .replace(/&#39;/g, "'");
  } catch {
    return null;
  }
}

async function downloadImage(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Referer: "https://www.instagram.com/",
      },
    });
    if (!res.ok) {
      console.log(`   ↳ http ${res.status}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1024) {
      console.log(`   ↳ image too small (${buf.length}b)`);
      return false;
    }
    await writeFile(dest, buf);
    return true;
  } catch (e) {
    console.log(`   ↳ fetch error: ${(e as Error).message}`);
    return false;
  }
}

// ----- main ------------------------------------------------------------------

async function main(): Promise<void> {
  if (!existsSync(SRC_XLSX)) {
    console.error(`Excel not found: ${SRC_XLSX}`);
    process.exit(1);
  }
  if (!existsSync(ASSET_DIR)) {
    mkdirSync(ASSET_DIR, { recursive: true });
  }

  const wb = XLSX.readFile(SRC_XLSX);
  const ws = wb.Sheets["Tarifler"];
  if (!ws) {
    console.error("Sheet 'Tarifler' not found.");
    process.exit(1);
  }
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });

  const withIngredients = rows.filter(
    (r) => String(r["Malzemeler"] ?? "").trim().length > 10,
  );
  console.log(
    `Loaded ${rows.length} rows, ${withIngredients.length} have ingredients.`,
  );

  // Pre-filter: drop rows whose body still contains substantial English.
  // The translator we used left some recipes mid-translation; rather than
  // shipping garbled "the/and/with" text we skip them entirely.
  const turkishOnly = withIngredients.filter((r) => !hasEnglishContent(r));
  const droppedEn = withIngredients.length - turkishOnly.length;
  console.log(
    `Filtered out ${droppedEn} English-mixed rows → ${turkishOnly.length} remaining.`,
  );

  type Built = {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    prepTimeMinutes: number;
    difficulty: "kolay" | "orta" | "zor";
    servings: number;
    ingredients: Array<{ name: string; quantity?: string }>;
    steps: string[];
    tags: string[];
    cuisine: string;
    caloriesPerServing?: number;
    sourceUrl?: string;
  };

  const built: Built[] = [];
  const slugSeen = new Set<string>();

  for (let i = 0; i < turkishOnly.length; i++) {
    const r = turkishOnly[i];
    const title = String(r["Tarif Adı"] || "").trim();
    if (!title) continue;
    let slug = "ig-" + slugify(title);
    if (!slug || slug === "ig-") slug = `ig-tarif-${i + 1}`;
    // Disambiguate duplicates.
    let base = slug;
    let n = 1;
    while (slugSeen.has(slug)) {
      n += 1;
      slug = `${base}-${n}`;
    }
    slugSeen.add(slug);

    const igUrl = String(r["Instagram Linki"] || "").trim();
    if (!igUrl) {
      console.log(`[skip ${i + 1}/${turkishOnly.length}] no IG url: ${title}`);
      continue;
    }

    process.stdout.write(
      `[${i + 1}/${turkishOnly.length}] ${title.slice(0, 60)} … `,
    );
    const dest = resolve(ASSET_DIR, `${slug}.jpg`);
    // If the asset already exists (e.g. the user replaced it manually via
    // scripts/save-influencer-image.ps1), keep it as-is and skip the scrape.
    if (existsSync(dest)) {
      console.log("image exists — reuse");
    } else {
      const og = await fetchOgImage(igUrl);
      if (!og) {
        console.log("no og:image (login wall) — skip");
        continue;
      }
      const ok = await downloadImage(og, dest);
      if (!ok) {
        console.log("download failed — skip");
        continue;
      }
      console.log("ok");
    }

    const ingredients = parseIngredients(String(r["Malzemeler"] || ""));
    const steps = splitBulletList(String(r["Yapılış"] || ""));
    if (ingredients.length === 0 || steps.length === 0) {
      console.log(`   ↳ parsed empty ingredients/steps — skip`);
      continue;
    }
    const description =
      normalizeTurkish(String(r["Açıklama (Türkçe)"] || "")).slice(0, 240) ||
      `@${String(r["Kullanıcı Adı"] || "").trim()} • Instagram fenomen tarifi`;

    built.push({
      id: slug,
      title,
      description,
      imageUrl: `local:${slug}`,
      prepTimeMinutes: parsePrepMinutes(String(r["Süre"] || "")),
      difficulty: parseDifficulty(String(r["Zorluk"] || "")),
      servings: 2,
      ingredients,
      steps,
      tags: categoryToTags(String(r["Kategori"] || "")),
      cuisine: "Türk",
      sourceUrl: igUrl,
    });

    // Be polite to Instagram.
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`\nBuilt ${built.length} recipes with images.`);

  // ----- emit influencerRecipes.ts ------------------------------------------

  const recipesTs = `import { Recipe } from "@/types/domain";

/**
 * "Fenomen Tarifler" — auto-generated from \`insta_receipes.xlsx\`.
 * Regenerate with:  npx tsx scripts/import-influencer-recipes.ts
 *
 * \`imageUrl\` uses the \`local:<id>\` sentinel; the real image module lives
 * in \`influencerImages.ts\` and is resolved by \`getRecipeImageSource()\`.
 */
export const EXCEL_INFLUENCER_RECIPES: Recipe[] = ${JSON.stringify(built, null, 2)};
`;
  writeFileSync(RECIPES_OUT, recipesTs, "utf8");
  console.log(`Wrote ${RECIPES_OUT}`);

  // ----- emit influencerImages.ts -------------------------------------------

  const imageLines = built
    .map((b) => `  "${b.id}": require("../../assets/influencer/${b.id}.jpg"),`)
    .join("\n");

  const imagesTs = `/**
 * Local image require() map for influencer recipes.
 *
 * Auto-generated by \`scripts/import-influencer-recipes.ts\`. Do not edit by
 * hand; rerun the script to refresh after pulling new Instagram data.
 */
import type { ImageSourcePropType } from "react-native";

export const EXCEL_INFLUENCER_IMAGES: Record<string, ImageSourcePropType> = {
${imageLines}
};
`;
  writeFileSync(IMAGES_OUT, imagesTs, "utf8");
  console.log(`Wrote ${IMAGES_OUT}`);
}

void main();
