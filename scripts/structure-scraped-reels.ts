/**
 * `scripts/data/scraped-reels.json`'u okur, her caption için OpenAI'a yapı
 * çıkarımı (malzeme/adım/süre/zorluk/etiket) yaptırır, sonucu
 * `src/constants/influencerRecipes.scraped.ts` ve
 * `src/constants/influencerImages.scraped.ts` dosyalarına yazar.
 *
 * .env'deki `EXPO_PUBLIC_OPENAI_API_KEY` kullanılır. Tarif olmayan caption'lar
 * (model `isRecipe:false` döner) atılır. Resim dosyası yoksa entry skip edilir.
 *
 * Resume edilebilir: zaten yazılmış kayıtları yeniden işlemez.
 *
 * Çalıştır: npx tsx scripts/structure-scraped-reels.ts
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const ASSET_DIR = resolve(ROOT, "assets", "influencer");
const SCRAPED_JSON = resolve(HERE, "data", "scraped-reels.json");
const STRUCTURED_JSON = resolve(HERE, "data", "scraped-reels.structured.json");
const RECIPES_OUT = resolve(
  ROOT,
  "src",
  "constants",
  "influencerRecipes.scraped.ts",
);
const IMAGES_OUT = resolve(
  ROOT,
  "src",
  "constants",
  "influencerImages.scraped.ts",
);

interface ScrapedReel {
  handle: string;
  reelCode: string;
  slug: string;
  sourceUrl: string;
  viewsRaw: string;
  viewCount: number;
  caption: string;
  imageFile: string;
  scrapedAt: string;
}

type Difficulty = "kolay" | "orta" | "zor";

interface StructuredRecipe {
  // Meta we keep so we can re-emit influencerRecipes.scraped.ts deterministically.
  slug: string;
  handle: string;
  sourceUrl: string;
  viewCount: number;
  // The structured payload (Recipe-shaped, no id/imageUrl yet).
  isRecipe: boolean;
  title: string;
  description: string;
  prepTimeMinutes: number;
  difficulty: Difficulty;
  servings: number;
  ingredients: { name: string; quantity?: string }[];
  steps: string[];
  tags: string[];
  cuisine: string;
}

function loadEnv(): string | null {
  const dotenv = resolve(ROOT, ".env");
  if (!existsSync(dotenv)) return null;
  const txt = readFileSync(dotenv, "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*EXPO_PUBLIC_OPENAI_API_KEY\s*=\s*(.+)\s*$/);
    if (m) return m[1].replace(/^"|"$/g, "").trim();
  }
  return null;
}

const SYSTEM = `Sen Instagram reel açıklamalarından Türkçe yemek tarifi
çıkaran bir asistansın. Sadece geçerli JSON döndür. Cevabını şu şemada ver:

{
  "isRecipe": boolean,
  "title": string,                  // kısa başlık, en fazla 60 karakter, Türkçe
  "description": string,            // 1-2 cümle, Türkçe, en fazla 240 karakter
  "prepTimeMinutes": number,        // tahmini hazırlama süresi, dakika
  "difficulty": "kolay" | "orta" | "zor",
  "servings": number,               // kaç kişilik (en az 1)
  "ingredients": [{ "name": string, "quantity": string | null }],
  "steps": string[],                // tarif adımları, sıralı, Türkçe
  "tags": string[],                 // ör. "kahvaltı", "tatlı", "çorba", "fenomen", "instagram"
  "cuisine": string                 // ör. "Türk", "İtalyan", "Asya"
}

Kurallar:
- "isRecipe": caption gerçekten malzeme + yapılış içeriyorsa true; sadece
  reklam, vlog, görüş, restorant tanıtımı gibiyse false döndür.
- Tüm metin Türkçe. İngilizce malzeme/ölçü gördüysen Türkçeye çevir
  (cup → su bardağı, tbsp → yemek kaşığı, tsp → tatlı kaşığı, oz → gram).
- "ingredients" en az 3 madde içermeli, aksi halde isRecipe=false.
- "steps" en az 2 adım içermeli, aksi halde isRecipe=false.
- "tags" listesinde her zaman "fenomen" ve "instagram" yer alsın.
- Emoji ve hashtag karakterlerini metinden çıkar.
- Bilgin yoksa difficulty="kolay", servings=2, prepTimeMinutes=30, cuisine="Türk".`;

interface OpenAIResp {
  choices?: { message?: { content?: string } }[];
}

async function callOpenAI(
  apiKey: string,
  caption: string,
  handle: string,
): Promise<Omit<
  StructuredRecipe,
  "slug" | "handle" | "sourceUrl" | "viewCount"
> | null> {
  const userPrompt = `Hesap: @${handle}\nCaption:\n"""\n${caption}\n"""`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    console.log(`  openai http ${res.status}`);
    return null;
  }
  const json = (await res.json()) as OpenAIResp;
  const content = json?.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch {
    console.log(`  openai parse error`);
    return null;
  }
}

function tagify(input: unknown): string[] {
  const arr = Array.isArray(input) ? input : [];
  const out = new Set<string>(["fenomen", "instagram"]);
  for (const t of arr) {
    if (typeof t === "string" && t.trim()) out.add(t.toLowerCase().trim());
  }
  return Array.from(out);
}

function ingredientsify(input: unknown): { name: string; quantity?: string }[] {
  if (!Array.isArray(input)) return [];
  const out: { name: string; quantity?: string }[] = [];
  for (const x of input) {
    if (!x || typeof x !== "object") continue;
    const name = String((x as { name?: unknown }).name ?? "").trim();
    if (!name) continue;
    const qRaw = (x as { quantity?: unknown }).quantity;
    const quantity =
      typeof qRaw === "string" && qRaw.trim() && qRaw.trim() !== "null"
        ? qRaw.trim()
        : undefined;
    out.push(quantity ? { name, quantity } : { name });
  }
  return out;
}

function stepsify(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0);
}

async function main(): Promise<void> {
  const apiKey = loadEnv();
  if (!apiKey) {
    console.error("EXPO_PUBLIC_OPENAI_API_KEY .env'de bulunamadı.");
    process.exit(1);
  }
  if (!existsSync(SCRAPED_JSON)) {
    console.error(`Önce scrape script'ini çalıştır: ${SCRAPED_JSON} yok.`);
    process.exit(1);
  }
  const scraped: ScrapedReel[] = JSON.parse(readFileSync(SCRAPED_JSON, "utf8"));
  console.log(`Loaded ${scraped.length} scraped reels.`);

  let cache: StructuredRecipe[] = [];
  if (existsSync(STRUCTURED_JSON)) {
    try {
      cache = JSON.parse(readFileSync(STRUCTURED_JSON, "utf8"));
    } catch {}
  }
  const cacheBySlug = new Map(cache.map((c) => [c.slug, c]));

  for (let i = 0; i < scraped.length; i++) {
    const r = scraped[i];
    if (cacheBySlug.has(r.slug)) {
      continue;
    }
    process.stdout.write(`[${i + 1}/${scraped.length}] ${r.slug} … `);
    if (!r.caption || r.caption.length < 30) {
      console.log("empty caption — skip");
      cacheBySlug.set(r.slug, {
        slug: r.slug,
        handle: r.handle,
        sourceUrl: r.sourceUrl,
        viewCount: r.viewCount,
        isRecipe: false,
        title: "",
        description: "",
        prepTimeMinutes: 0,
        difficulty: "kolay",
        servings: 2,
        ingredients: [],
        steps: [],
        tags: [],
        cuisine: "Türk",
      });
      continue;
    }

    const ai = await callOpenAI(apiKey, r.caption, r.handle);
    if (!ai) {
      console.log("ai failed");
      continue;
    }
    const ingredients = ingredientsify(ai.ingredients);
    const steps = stepsify(ai.steps);
    const isRecipe =
      Boolean(ai.isRecipe) && ingredients.length >= 3 && steps.length >= 2;

    const entry: StructuredRecipe = {
      slug: r.slug,
      handle: r.handle,
      sourceUrl: r.sourceUrl,
      viewCount: r.viewCount,
      isRecipe,
      title: String(ai.title || "").slice(0, 120) || `@${r.handle} tarifi`,
      description: String(ai.description || "").slice(0, 240),
      prepTimeMinutes:
        Number.isFinite(Number(ai.prepTimeMinutes)) &&
        Number(ai.prepTimeMinutes) > 0
          ? Math.round(Number(ai.prepTimeMinutes))
          : 30,
      difficulty:
        ai.difficulty === "orta" || ai.difficulty === "zor"
          ? ai.difficulty
          : "kolay",
      servings:
        Number.isFinite(Number(ai.servings)) && Number(ai.servings) > 0
          ? Math.round(Number(ai.servings))
          : 2,
      ingredients,
      steps,
      tags: tagify(ai.tags),
      cuisine: String(ai.cuisine || "Türk").slice(0, 40),
    };
    cacheBySlug.set(r.slug, entry);
    console.log(isRecipe ? `ok` : `not a recipe`);
    // Persist after every call so we don't lose progress on errors.
    writeFileSync(
      STRUCTURED_JSON,
      JSON.stringify(Array.from(cacheBySlug.values()), null, 2),
      "utf8",
    );
    await new Promise((res) => setTimeout(res, 600));
  }

  // Emit influencerRecipes.scraped.ts ----------------------------------------
  const final = Array.from(cacheBySlug.values()).filter((e) => {
    if (!e.isRecipe) return false;
    const imagePath = resolve(ASSET_DIR, `${e.slug}.jpg`);
    if (!existsSync(imagePath)) return false;
    return true;
  });
  // Sort: by handle (A-Z) then by viewCount desc — stable, easy to scan.
  final.sort(
    (a, b) => a.handle.localeCompare(b.handle) || b.viewCount - a.viewCount,
  );

  const recipesObjects = final.map((e) => ({
    id: e.slug,
    title: e.title,
    description: e.description,
    imageUrl: `local:${e.slug}`,
    prepTimeMinutes: e.prepTimeMinutes,
    difficulty: e.difficulty,
    servings: e.servings,
    ingredients: e.ingredients,
    steps: e.steps,
    tags: e.tags,
    cuisine: e.cuisine,
    sourceUrl: e.sourceUrl,
  }));

  const recipesTs = `import { Recipe } from "@/types/domain";

/**
 * Scraped Instagram reels — auto-generated from
 * \`scripts/data/scraped-reels.json\` via
 * \`scripts/structure-scraped-reels.ts\`. Do not edit by hand.
 *
 * \`imageUrl\` uses the \`local:<id>\` sentinel; the real image module lives
 * in \`influencerImages.scraped.ts\` and is resolved by \`getRecipeImageSource()\`.
 */
export const SCRAPED_INFLUENCER_RECIPES: Recipe[] = ${JSON.stringify(
    recipesObjects,
    null,
    2,
  )};
`;
  writeFileSync(RECIPES_OUT, recipesTs, "utf8");
  console.log(`\nWrote ${RECIPES_OUT} (${final.length} recipes)`);

  const imageLines = final
    .map(
      (e) => `  "${e.slug}": require("../../assets/influencer/${e.slug}.jpg"),`,
    )
    .join("\n");
  const imagesTs = `/**
 * Local image require() map for scraped Instagram reels.
 *
 * Auto-generated by \`scripts/structure-scraped-reels.ts\`. Do not edit by hand.
 */
import type { ImageSourcePropType } from "react-native";

export const SCRAPED_INFLUENCER_IMAGES: Record<string, ImageSourcePropType> = {
${imageLines}
};
`;
  writeFileSync(IMAGES_OUT, imagesTs, "utf8");
  console.log(`Wrote ${IMAGES_OUT}`);

  // Summary by handle.
  const byHandle: Record<string, number> = {};
  for (const e of final) {
    byHandle[e.handle] = (byHandle[e.handle] ?? 0) + 1;
  }
  console.log("\nPer handle:");
  for (const [h, n] of Object.entries(byHandle).sort((a, b) => b[1] - a[1])) {
    console.log(`  @${h.padEnd(20)} ${n}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
