/* eslint-disable no-console */
/**
 * Fetches cocktail images for the active 500-cocktail content pool
 * (`src/constants/cocktailContentEn.ts`, ids `cocktail-<slug>`) from
 * TheCocktailDB, matched by normalized name.
 *
 *   npx tsx scripts/fetch-content-cocktail-images.ts
 *   npx tsx scripts/fetch-content-cocktail-images.ts --dry   # no download/write
 *
 * Output:
 *  - assets/cocktails/content/<slug>.jpg
 *  - src/constants/contentCocktailImages.ts  (require map keyed by content id)
 *
 * Craft/modern cocktails not present on TheCocktailDB stay without an image
 * (emoji fallback handled by resolveCocktailImage).
 */
import * as fs from "node:fs";
import * as path from "node:path";

const DRY = process.argv.includes("--dry");

const COCKTAILDB_BASE = "https://www.thecocktaildb.com/api/json/v1/1";
const ROOT = path.resolve(__dirname, "..");
const CONTENT_TS = path.join(ROOT, "src/constants/cocktailContentEn.ts");
const OUT_DIR = path.join(ROOT, "assets/cocktails/content");
const OUT_MAP = path.join(ROOT, "src/constants/contentCocktailImages.ts");

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

interface DBListItem {
  strDrink: string;
  strDrinkThumb: string | null;
  idDrink: string;
}

async function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function fetchJson<T>(url: string, attempt = 0): Promise<T> {
  const res = await fetch(url);
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await sleep(1000 * Math.pow(2, attempt) + Math.random() * 400);
    return fetchJson<T>(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as T;
}

async function pool<T>(
  items: T[],
  limit: number,
  worker: (item: T, idx: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const i = cursor++;
      await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => run()));
}

/** Parse content pool ids + names from the TS source (avoids module resolution). */
function parseContentPool(): { id: string; name: string; slug: string }[] {
  const text = fs.readFileSync(CONTENT_TS, "utf8");
  const re = /"id":\s*"(cocktail-[^"]+)"[\s\S]*?"name":\s*"([^"]+)"/g;
  const out: { id: string; name: string; slug: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push({ id: m[1], name: m[2], slug: m[1].replace(/^cocktail-/, "") });
  }
  return out;
}

/** Build a normalized-name -> thumbnail URL index from the whole CDB catalog. */
async function buildNameIndex(): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  const letters = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
  await pool(letters, 3, async (letter) => {
    const data = await fetchJson<{ drinks: DBListItem[] | null }>(
      `${COCKTAILDB_BASE}/search.php?f=${letter}`,
    );
    for (const d of data.drinks ?? []) {
      if (d.strDrinkThumb) {
        const k = norm(d.strDrink);
        if (!index.has(k)) index.set(k, d.strDrinkThumb);
      }
    }
    await sleep(120);
  });
  return index;
}

/** Targeted search for a single name (catches drinks missed by the bulk index). */
async function searchByName(name: string): Promise<string | null> {
  try {
    const data = await fetchJson<{ drinks: DBListItem[] | null }>(
      `${COCKTAILDB_BASE}/search.php?s=${encodeURIComponent(name)}`,
    );
    const want = norm(name);
    for (const d of data.drinks ?? []) {
      if (norm(d.strDrink) === want && d.strDrinkThumb) return d.strDrinkThumb;
    }
    // fall back to first result with a thumb
    for (const d of data.drinks ?? []) {
      if (d.strDrinkThumb) return d.strDrinkThumb;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const pool500 = parseContentPool();
  console.log(`content pool: ${pool500.length} cocktails`);

  console.log("building CDB name index…");
  const index = await buildNameIndex();
  console.log(`  indexed ${index.size} CDB drinks`);

  if (!DRY) fs.mkdirSync(OUT_DIR, { recursive: true });

  const resolved: { id: string; slug: string }[] = [];
  const missing: string[] = [];

  // First pass: bulk index match.
  const needsSearch: { id: string; name: string; slug: string }[] = [];
  for (const c of pool500) {
    const thumb = index.get(norm(c.name));
    if (thumb) {
      if (DRY) {
        resolved.push({ id: c.id, slug: c.slug });
      } else {
        const dest = path.join(OUT_DIR, `${c.slug}.jpg`);
        const ok = await download(thumb, dest);
        if (ok) resolved.push({ id: c.id, slug: c.slug });
        else needsSearch.push(c);
        await sleep(60);
      }
    } else {
      needsSearch.push(c);
    }
  }
  console.log(`  bulk-index matched: ${resolved.length}`);

  // Second pass: targeted search for the remainder.
  await pool(needsSearch, 3, async (c) => {
    const thumb = await searchByName(c.name);
    if (thumb) {
      if (DRY) {
        resolved.push({ id: c.id, slug: c.slug });
      } else {
        const dest = path.join(OUT_DIR, `${c.slug}.jpg`);
        const ok = await download(thumb, dest);
        if (ok) resolved.push({ id: c.id, slug: c.slug });
        else missing.push(c.name);
      }
    } else {
      missing.push(c.name);
    }
    await sleep(80);
  });

  resolved.sort((a, b) => a.id.localeCompare(b.id));
  console.log(`\nTOTAL with image: ${resolved.length}/${pool500.length}`);
  console.log(`without image: ${pool500.length - resolved.length}`);
  if (missing.length) {
    console.log(`sample missing: ${missing.slice(0, 30).join(", ")}`);
  }

  if (DRY) {
    console.log("\n(dry run — no files written)");
    return;
  }

  const lines = [
    "// AUTO-GENERATED by scripts/fetch-content-cocktail-images.ts",
    "// Do not edit by hand — re-run the script to refresh.",
    'import type { ImageSourcePropType } from "react-native";',
    "",
    "/** Cocktail images for the COCKTAIL_CONTENT_EN pool, keyed by Cocktail.id. */",
    "export const CONTENT_COCKTAIL_IMAGES: Record<string, ImageSourcePropType> = {",
    ...resolved.map(
      (r) => `  "${r.id}": require("../../assets/cocktails/content/${r.slug}.jpg"),`,
    ),
    "};",
    "",
  ];
  fs.writeFileSync(OUT_MAP, lines.join("\n"));
  console.log(`\nwrote ${OUT_MAP} (${resolved.length} entries)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
