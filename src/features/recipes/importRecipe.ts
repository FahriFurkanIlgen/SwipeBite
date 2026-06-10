import { openAIJson } from "@/lib/openai";
import { hasAI } from "@/lib/env";

export interface ImportedRecipePreview {
  title: string;
  source: string;
  imageUrl: string;
  prepTimeMinutes: number;
  servings: number;
  difficulty: "Kolay" | "Orta" | "Zor";
  ingredients: string[];
  steps?: string[];
  tags?: string[];
  cuisine?: string;
  /** Original URL — surfaced as a "kaynak" link in the saved recipe. */
  sourceUrl?: string;
  /** Video URL if the page exposes one (yemek.com VideoObject, og:video). */
  videoUrl?: string;
  /** True when the result is a placeholder (no key / no usable input). */
  isFallback?: boolean;
}

export class RecipeImportError extends Error {
  code: "no-input" | "fetch-failed" | "no-data" | "no-ai-key";
  constructor(code: RecipeImportError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function inferSource(link: string): string {
  if (!link) return "Metin";
  if (link.includes("instagram")) return "Instagram";
  if (link.includes("youtube") || link.includes("youtu.be")) return "YouTube";
  if (link.includes("tiktok")) return "TikTok";
  if (link.includes("yemek.com")) return "Yemek.com";
  if (link.includes("nefisyemek")) return "NefisYemekler";
  return "Web";
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format";

interface AIResponse {
  title?: string;
  prep_time_minutes?: number;
  servings?: number;
  difficulty?: string;
  ingredients?: string[];
  steps?: string[];
  tags?: string[];
  cuisine?: string;
  image_url?: string;
}

function normalizeDifficulty(d?: string): "Kolay" | "Orta" | "Zor" {
  const v = (d ?? "").toLowerCase();
  if (v.includes("zor")) return "Zor";
  if (v.includes("orta")) return "Orta";
  return "Kolay";
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function isoDurationToMinutes(iso?: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return parseInt(m[1] ?? "0", 10) * 60 + parseInt(m[2] ?? "0", 10);
}

function flatten<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return value == null ? [] : [value as T];
  const out: T[] = [];
  for (const v of value) {
    if (Array.isArray(v)) out.push(...(v as T[]));
    else if (v != null) out.push(v as T);
  }
  return out;
}

interface SchemaRecipe {
  "@type"?: string | string[];
  name?: string;
  description?: string;
  image?: unknown;
  totalTime?: string;
  prepTime?: string;
  cookTime?: string;
  recipeYield?: string | number;
  recipeCategory?: string | string[];
  recipeCuisine?: string | string[];
  recipeIngredient?: unknown;
  recipeInstructions?: unknown;
  video?: unknown;
}

function findRecipe(node: unknown): SchemaRecipe | null {
  const stack: unknown[] = [node];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (Array.isArray(cur)) {
      stack.push(...cur);
      continue;
    }
    const o = cur as Record<string, unknown>;
    const t = o["@type"];
    if (t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"))) {
      return o as SchemaRecipe;
    }
    if (o["@graph"]) stack.push(o["@graph"]);
  }
  return null;
}

interface PageMeta {
  title?: string;
  description?: string;
  image?: string;
  video?: string;
  recipe?: SchemaRecipe;
}

async function fetchPage(url: string): Promise<PageMeta | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SwipeBite/1.0; +personal use)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const meta: PageMeta = {};

    // JSON-LD Recipe (yemek.com, nefisyemek, schema-aware blogs)
    const blocks = [
      ...html.matchAll(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      ),
    ];
    for (const b of blocks) {
      try {
        const r = findRecipe(JSON.parse(b[1]!.trim()));
        if (r) {
          meta.recipe = r;
          break;
        }
      } catch {
        // skip malformed
      }
    }

    // og:title / og:description / og:image / og:video — Instagram, blogs
    const og = (prop: string) =>
      html.match(
        new RegExp(
          `<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`,
          "i",
        ),
      )?.[1];
    meta.title = og("og:title");
    meta.description = og("og:description");
    meta.image = og("og:image");
    meta.video = og("og:video") || og("og:video:url");
    return meta;
  } catch {
    return null;
  }
}

function recipeFromSchema(
  schema: SchemaRecipe,
  link: string,
  fallbackVideo?: string,
): ImportedRecipePreview {
  let imageUrl = FALLBACK_IMAGE;
  const imgs = flatten<string | { url?: string }>(schema.image);
  const first = imgs[0];
  if (first) {
    imageUrl =
      typeof first === "string"
        ? first
        : ((first as { url?: string }).url ?? FALLBACK_IMAGE);
  }

  const rawIng = flatten<string>(schema.recipeIngredient);
  const ingredients = rawIng.map((s) => stripHtml(String(s))).filter(Boolean);

  const rawSteps = flatten<unknown>(schema.recipeInstructions);
  const steps = rawSteps
    .map((s) => {
      if (typeof s === "string") return stripHtml(s);
      if (s && typeof s === "object") {
        const o = s as Record<string, unknown>;
        if (typeof o.text === "string") return stripHtml(o.text);
        if (typeof o.name === "string") return stripHtml(o.name);
      }
      return "";
    })
    .filter((s) => s.length > 3);

  const total =
    isoDurationToMinutes(schema.totalTime) ||
    isoDurationToMinutes(schema.prepTime) +
      isoDurationToMinutes(schema.cookTime) ||
    25;

  let servings = 2;
  if (typeof schema.recipeYield === "number") servings = schema.recipeYield;
  else if (typeof schema.recipeYield === "string") {
    const n = parseInt(schema.recipeYield, 10);
    if (Number.isFinite(n) && n > 0) servings = n;
  }

  let videoUrl = fallbackVideo;
  const videos = flatten<unknown>(schema.video);
  for (const v of videos) {
    if (typeof v === "string") {
      videoUrl = v;
      break;
    }
    if (v && typeof v === "object") {
      const vo = v as Record<string, unknown>;
      const u =
        (typeof vo.contentUrl === "string" && vo.contentUrl) ||
        (typeof vo.embedUrl === "string" && vo.embedUrl) ||
        "";
      if (u) {
        videoUrl = u;
        break;
      }
    }
  }

  return {
    title: stripHtml(schema.name ?? "Tarif"),
    source: inferSource(link),
    imageUrl,
    prepTimeMinutes: total,
    servings,
    difficulty:
      ingredients.length + steps.length <= 10
        ? "Kolay"
        : ingredients.length + steps.length <= 18
          ? "Orta"
          : "Zor",
    ingredients,
    steps,
    tags: flatten<string>(schema.recipeCategory).map((s) =>
      String(s).toLowerCase(),
    ),
    cuisine: flatten<string>(schema.recipeCuisine)[0] ?? "",
    sourceUrl: link || undefined,
    ...(videoUrl ? { videoUrl } : {}),
  };
}

export async function importRecipePreview(
  link: string,
  caption: string,
): Promise<ImportedRecipePreview> {
  const linkTrim = link.trim();
  const captionTrim = caption.trim();
  if (!linkTrim && !captionTrim) {
    throw new RecipeImportError("no-input", "Bağlantı veya metin gir.");
  }

  // 1. Try to fetch the page and parse schema.org/Recipe.
  let pageMeta: PageMeta | null = null;
  if (linkTrim.startsWith("http")) {
    pageMeta = await fetchPage(linkTrim);
    if (pageMeta?.recipe) {
      return recipeFromSchema(pageMeta.recipe, linkTrim, pageMeta.video);
    }
  }

  // 2. Build a prompt for the AI from caption + (optionally) page meta.
  const aiContextParts = [
    captionTrim ? `Açıklama:\n${captionTrim}` : "",
    pageMeta?.title ? `Sayfa başlığı: ${pageMeta.title}` : "",
    pageMeta?.description ? `Sayfa özeti: ${pageMeta.description}` : "",
    linkTrim ? `Kaynak URL: ${linkTrim}` : "",
  ].filter(Boolean);
  const aiText = aiContextParts.join("\n\n");

  if (!hasAI) {
    // Without AI we can still salvage a preview from og meta.
    if (pageMeta?.title) {
      return {
        title: pageMeta.title,
        source: inferSource(linkTrim),
        imageUrl: pageMeta.image || FALLBACK_IMAGE,
        prepTimeMinutes: 30,
        servings: 2,
        difficulty: "Kolay",
        ingredients: pageMeta.description
          ? [pageMeta.description]
          : ["Malzemeleri elle düzenle"],
        steps: [],
        sourceUrl: linkTrim || undefined,
        ...(pageMeta.video ? { videoUrl: pageMeta.video } : {}),
        isFallback: true,
      };
    }
    throw new RecipeImportError(
      "no-ai-key",
      "Tarifi ayrıştırmak için OpenAI anahtarı gerekli. .env'e EXPO_PUBLIC_OPENAI_API_KEY ekle veya tarif metnini elle yapıştır.",
    );
  }

  const ai = await openAIJson<AIResponse>({
    system:
      "Sen bir Türkçe yemek asistanısın. Verilen metinden tek bir yemek tarifi çıkar ve JSON döndür. " +
      "Alanlar: title, prep_time_minutes (int), servings (int), difficulty ('kolay'|'orta'|'zor'), " +
      "ingredients (string[] — 'malzeme miktar'), steps (string[] — sıralı adımlar), tags (string[]), cuisine (string), " +
      "image_url (string — sayfada görsel varsa onu kullan). Bilgi yoksa makul tahmin yap. " +
      "Adımları kısa ve net yaz. Boş alan döndürme.",
    user: aiText,
    temperature: 0.2,
  });

  if (!ai?.title || !ai?.ingredients?.length) {
    throw new RecipeImportError(
      "no-data",
      "Tarif çıkarılamadı. Daha fazla metin yapıştır ya da farklı bir link dene.",
    );
  }

  return {
    title: ai.title.length > 60 ? ai.title.slice(0, 60).trim() + "…" : ai.title,
    source: inferSource(linkTrim),
    imageUrl: ai.image_url || pageMeta?.image || FALLBACK_IMAGE,
    prepTimeMinutes:
      typeof ai.prep_time_minutes === "number" ? ai.prep_time_minutes : 30,
    servings: typeof ai.servings === "number" ? ai.servings : 2,
    difficulty: normalizeDifficulty(ai.difficulty),
    ingredients: ai.ingredients,
    steps: Array.isArray(ai.steps) ? ai.steps : [],
    tags: Array.isArray(ai.tags) ? ai.tags : [],
    cuisine: ai.cuisine ?? undefined,
    sourceUrl: linkTrim || undefined,
    ...(pageMeta?.video ? { videoUrl: pageMeta.video } : {}),
  };
}
