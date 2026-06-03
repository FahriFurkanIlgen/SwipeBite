/* eslint-disable no-console */
/**
 * Builds a lookup of every distinct product name found across the catalogue
 * (pantry_items + recipe ingredients) so they can be categorised by hand.
 *
 *   npx tsx scripts/export-product-lookup-xlsx.ts
 *
 * Required env (from .env):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (preferred; bypasses RLS)
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY (fallback)
 *
 * Output: ./product-lookup.xlsx in the workspace root with three sheets:
 *   - "Tüm Ürünler"     : unique products (pantry ∪ tarif malzemeleri)
 *   - "Kiler"           : unique pantry_items.name
 *   - "Tarif Malzemeleri": unique recipe ingredient names
 */
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import * as XLSX from "xlsx";

loadEnv();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const key = serviceKey ?? anonKey;

if (!url || !key) {
  console.error(
    "✗ EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY) must be set in .env",
  );
  process.exit(1);
}

if (!serviceKey) {
  console.warn(
    "⚠ SUPABASE_SERVICE_ROLE_KEY not set — using anon key. RLS will likely return 0 rows.",
  );
}

type PantryRow = {
  name: string;
  category: string | null;
};

type RecipeRow = {
  ingredients: { name: string; quantity?: string | null }[] | null;
};

async function fetchAll<T>(path: string, select: string): Promise<T[]> {
  const pageSize = 1000;
  let from = 0;
  const all: T[] = [];

  for (;;) {
    const to = from + pageSize - 1;
    const res = await fetch(`${url}${path}?select=${select}`, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key!}`,
        Range: `${from}-${to}`,
        "Range-Unit": "items",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error("✗ Supabase error:", res.status, await res.text());
      process.exit(1);
    }
    const data = (await res.json()) as T[];
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

/** Lower-case, trim, collapse whitespace, strip leading quantity tokens. */
function normalize(raw: string): string {
  return raw
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ")
    .replace(/[.,;:()]+/g, " ")
    .trim();
}

type Bucket = {
  display: string; // most common original spelling
  count: number;
  variants: Map<string, number>;
  categories: Map<string, number>;
};

function bump(map: Map<string, Bucket>, raw: string, category: string | null) {
  const name = raw.trim();
  if (!name) return;
  const norm = normalize(name);
  if (!norm) return;
  let b = map.get(norm);
  if (!b) {
    b = {
      display: name,
      count: 0,
      variants: new Map(),
      categories: new Map(),
    };
    map.set(norm, b);
  }
  b.count += 1;
  b.variants.set(name, (b.variants.get(name) ?? 0) + 1);
  if (category && category.trim()) {
    const c = category.trim();
    b.categories.set(c, (b.categories.get(c) ?? 0) + 1);
  }
  // Pick the variant with the highest count as display.
  let bestName = b.display;
  let bestCount = b.variants.get(bestName) ?? 0;
  for (const [v, n] of b.variants) {
    if (n > bestCount) {
      bestName = v;
      bestCount = n;
    }
  }
  b.display = bestName;
}

function topKey(m: Map<string, number>): string {
  let best = "";
  let bestN = 0;
  for (const [k, n] of m) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

function bucketsToRows(map: Map<string, Bucket>) {
  return [...map.entries()]
    .sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count;
      return a[0].localeCompare(b[0], "tr-TR");
    })
    .map(([norm, b], i) => ({
      "#": i + 1,
      Ürün: b.display,
      Normalize: norm,
      Kullanım: b.count,
      "Mevcut Kategori": topKey(b.categories),
      "Tüm Varyantlar": [...b.variants.keys()].join(" | "),
      Kategori: "",
    }));
}

async function main() {
  const [pantry, recipes] = await Promise.all([
    fetchAll<PantryRow>("/rest/v1/pantry_items", "name,category"),
    fetchAll<RecipeRow>("/rest/v1/recipes", "ingredients"),
  ]);

  const pantryMap = new Map<string, Bucket>();
  for (const r of pantry) bump(pantryMap, r.name, r.category);

  const recipeMap = new Map<string, Bucket>();
  for (const r of recipes) {
    if (!r.ingredients) continue;
    for (const ing of r.ingredients) {
      if (ing && typeof ing.name === "string") {
        bump(recipeMap, ing.name, null);
      }
    }
  }

  // Union of both, keeping summed counts.
  const allMap = new Map<string, Bucket>();
  for (const [, b] of pantryMap) {
    for (const [variant, n] of b.variants) {
      for (let i = 0; i < n; i++) {
        bump(allMap, variant, [...b.categories.keys()][0] ?? null);
      }
    }
  }
  for (const [, b] of recipeMap) {
    for (const [variant, n] of b.variants) {
      for (let i = 0; i < n; i++) bump(allMap, variant, null);
    }
  }

  const wb = XLSX.utils.book_new();

  const cols = [
    { wch: 6 }, // #
    { wch: 36 }, // Ürün
    { wch: 36 }, // Normalize
    { wch: 10 }, // Kullanım
    { wch: 18 }, // Mevcut Kategori
    { wch: 60 }, // Varyantlar
    { wch: 18 }, // Kategori (boş — elle doldurulacak)
  ];

  const allRows = bucketsToRows(allMap);
  const pantryRows = bucketsToRows(pantryMap);
  const recipeRows = bucketsToRows(recipeMap);

  for (const [name, rows] of [
    ["Tüm Ürünler", allRows],
    ["Kiler", pantryRows],
    ["Tarif Malzemeleri", recipeRows],
  ] as const) {
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = cols;
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  const outPath = resolve(process.cwd(), "product-lookup.xlsx");
  XLSX.writeFile(wb, outPath);

  console.log(
    `✓ ${allRows.length} benzersiz ürün (kiler ${pantryRows.length}, tarif ${recipeRows.length}) → ${outPath}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
