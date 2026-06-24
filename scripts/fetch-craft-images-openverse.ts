/* eslint-disable no-console */
/**
 * Fills the remaining cocktail images for the COCKTAIL_CONTENT_EN pool from
 * Openverse (https://openverse.org) — free, no API key. Used for craft/modern
 * cocktails that are NOT on TheCocktailDB.
 *
 *   npx tsx scripts/fetch-craft-images-openverse.ts
 *   npx tsx scripts/fetch-craft-images-openverse.ts --dry
 *   npx tsx scripts/fetch-craft-images-openverse.ts --limit 20
 *
 * For each content cocktail that still has NO image, queries Openverse by name,
 * prefers permissive licenses (cc0/pdm → by → by-sa), downloads the thumbnail to
 *   assets/cocktails/content/<slug>.jpg
 * and records attribution to
 *   scripts/data/openverse-attribution.json
 *
 * Afterwards it REGENERATES src/constants/contentCocktailImages.ts by scanning
 * the content/ folder, so both CDB- and Openverse-sourced images are included.
 *
 * NOTE on licensing: CC-BY / CC-BY-SA images REQUIRE attribution in the app
 * (e.g. a credits screen). The attribution JSON has everything needed.
 */
import * as fs from "node:fs";
import * as path from "node:path";

const DRY = process.argv.includes("--dry");
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i >= 0 ? Number(process.argv[i + 1]) || Infinity : Infinity;
})();

const ROOT = path.resolve(__dirname, "..");
const CONTENT_TS = path.join(ROOT, "src/constants/cocktailContentEn.ts");
const FAMOUS_TS = path.join(ROOT, "src/constants/famousCocktailImages.ts");
const OUT_DIR = path.join(ROOT, "assets/cocktails/content");
const OUT_MAP = path.join(ROOT, "src/constants/contentCocktailImages.ts");
const ATTR_JSON = path.join(ROOT, "scripts/data/openverse-attribution.json");

const OPENVERSE = "https://api.openverse.org/v1/images/";
const UA = "SwipeBite/1.0 (cocktail app; image attribution preserved)";
// Preference order — earliest = least attribution burden.
const LICENSE_PREF = ["cc0", "pdm", "by", "by-sa", "by-nc", "by-nd"];

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

interface OVResult {
  id: string;
  title: string | null;
  creator: string | null;
  license: string | null;
  url: string | null;
  thumbnail: string | null;
  foreign_landing_url: string | null;
  source: string | null;
}

interface Attribution {
  slug: string;
  name: string;
  title: string | null;
  creator: string | null;
  license: string | null;
  source: string | null;
  landing: string | null;
}

async function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function fetchJson<T>(url: string, attempt = 0): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await sleep(1500 * Math.pow(2, attempt) + Math.random() * 500);
      return fetchJson<T>(url, attempt + 1);
    }
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function parseContentPool(): { id: string; name: string; slug: string }[] {
  const text = fs.readFileSync(CONTENT_TS, "utf8");
  const re = /"id":\s*"(cocktail-[^"]+)"[\s\S]*?"name":\s*"([^"]+)"/g;
  const out: { id: string; name: string; slug: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)))
    out.push({ id: m[1], name: m[2], slug: m[1].replace(/^cocktail-/, "") });
  return out;
}

function existingSlugs(): Set<string> {
  const set = new Set<string>();
  if (fs.existsSync(OUT_DIR)) {
    for (const f of fs.readdirSync(OUT_DIR)) {
      if (f.endsWith(".jpg")) set.add(f.replace(/\.jpg$/, ""));
    }
  }
  return set;
}

function famousIds(): Set<string> {
  if (!fs.existsSync(FAMOUS_TS)) return new Set();
  const t = fs.readFileSync(FAMOUS_TS, "utf8");
  return new Set([...t.matchAll(/"(cocktail-[^"]+)":\s*require/g)].map((m) => m[1]));
}

function pickBest(results: OVResult[]): OVResult | null {
  for (const lic of LICENSE_PREF) {
    const hit = results.find(
      (r) => (r.license ?? "").toLowerCase() === lic && (r.thumbnail || r.url),
    );
    if (hit) return hit;
  }
  return results.find((r) => r.thumbnail || r.url) ?? null;
}

async function queryOpenverse(name: string): Promise<OVResult | null> {
  const q = encodeURIComponent(`${name} cocktail`);
  const url = `${OPENVERSE}?q=${q}&license_type=all-cc,commercial&page_size=8&mature=false`;
  const data = await fetchJson<{ results: OVResult[] }>(url);
  if (!data?.results?.length) return null;
  // Prefer results whose title vaguely matches; else best license.
  const want = norm(name);
  const relevant = data.results.filter((r) =>
    norm(r.title ?? "").includes(want.slice(0, Math.min(want.length, 8))),
  );
  return pickBest(relevant.length ? relevant : data.results);
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) return false; // skip tiny/broken
    fs.writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

function regenerateMap() {
  const slugs = [...existingSlugs()].sort();
  const lines = [
    "// AUTO-GENERATED by scripts/fetch-content-cocktail-images.ts +",
    "// scripts/fetch-craft-images-openverse.ts — do not edit by hand.",
    'import type { ImageSourcePropType } from "react-native";',
    "",
    "/** Cocktail images for the COCKTAIL_CONTENT_EN pool, keyed by Cocktail.id. */",
    "export const CONTENT_COCKTAIL_IMAGES: Record<string, ImageSourcePropType> = {",
    ...slugs.map(
      (s) => `  "cocktail-${s}": require("../../assets/cocktails/content/${s}.jpg"),`,
    ),
    "};",
    "",
  ];
  fs.writeFileSync(OUT_MAP, lines.join("\n"));
  console.log(`regenerated map: ${slugs.length} entries`);
}

async function main() {
  const pool = parseContentPool();
  const have = existingSlugs();
  const famous = famousIds();
  const missing = pool
    .filter((c) => !have.has(c.slug) && !famous.has(c.id))
    .slice(0, LIMIT === Infinity ? undefined : LIMIT);

  console.log(
    `pool ${pool.length}, already imaged ${pool.length - missing.length}, fetching ${missing.length} from Openverse`,
  );

  if (!DRY) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(ATTR_JSON), { recursive: true });

  const attribution: Attribution[] = fs.existsSync(ATTR_JSON)
    ? JSON.parse(fs.readFileSync(ATTR_JSON, "utf8"))
    : [];

  let ok = 0;
  const failed: string[] = [];
  for (let i = 0; i < missing.length; i++) {
    const c = missing[i];
    const r = await queryOpenverse(c.name);
    if (!r) {
      failed.push(c.name);
    } else if (DRY) {
      ok++;
    } else {
      const dest = path.join(OUT_DIR, `${c.slug}.jpg`);
      const got = await download(r.thumbnail || r.url || "", dest);
      if (got) {
        ok++;
        attribution.push({
          slug: c.slug,
          name: c.name,
          title: r.title,
          creator: r.creator,
          license: r.license,
          source: r.source,
          landing: r.foreign_landing_url,
        });
      } else {
        failed.push(c.name);
      }
    }
    if ((i + 1) % 25 === 0) console.log(`  …${i + 1}/${missing.length} (ok ${ok})`);
    await sleep(350); // be gentle with the anonymous Openverse rate limit
  }

  console.log(`\nOpenverse downloaded: ${ok}/${missing.length}`);
  if (failed.length)
    console.log(`failed (${failed.length}): ${failed.slice(0, 30).join(", ")}`);

  if (DRY) {
    console.log("(dry run — no files written)");
    return;
  }
  fs.writeFileSync(ATTR_JSON, JSON.stringify(attribution, null, 2));
  console.log(`attribution → ${ATTR_JSON} (${attribution.length} entries)`);
  regenerateMap();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
