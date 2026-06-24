/* eslint-disable no-console */
/**
 * Applies the hand-curated merge decisions from merge_duzeltilmis_urunler.xlsx
 * to src/constants/pantryCatalog.ts.
 *
 *   npx tsx scripts/apply-pantry-merge.ts
 *
 * Decisions are read from the "Birleştir" sheet:
 *   - "Birleştir →" column: target canonical name (the sentinel "9" / empty =
 *     keep as-is). The item is removed and folded into the target.
 *   - "Sil" column: value "sil" removes the item entirely (added to
 *     PANTRY_DROPPED_NAMES).
 *
 * Merge chains (a→b, b→c) are resolved transitively. Targets that don't yet
 * exist in the catalog are added to the source item's category.
 *
 * The file is rewritten in the same format emitted by import-pantry-catalog.ts.
 */
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";
import * as XLSX from "xlsx";
import {
  PANTRY_CATEGORIES,
  PANTRY_QUICK_CATALOG,
  PANTRY_CATEGORY_INDEX,
  PANTRY_DROPPED_NAMES,
  type PantryCategory,
} from "../src/constants/pantryCatalog";

const SENTINEL = "9";
const XLSX_PATH = resolve(process.cwd(), "merge_duzeltilmis_urunler.xlsx");
const OUT = resolve(process.cwd(), "src/constants/pantryCatalog.ts");

const norm = (s: string) => s.trim().toLocaleLowerCase("tr-TR");

type Row = {
  Kategori: string;
  Ürün: string;
  "Birleştir →": string;
  Sil: string;
};

function main() {
  const wb = XLSX.readFile(XLSX_PATH);
  const rows = XLSX.utils.sheet_to_json<Row>(wb.Sheets["Birleştir"], {
    defval: "",
  });

  // Raw decisions keyed by normalised product name.
  const mergeRaw = new Map<string, string>(); // name -> target
  const delSet = new Set<string>(); // names to drop
  const rowCategory = new Map<string, PantryCategory>(); // name -> sheet category

  for (const r of rows) {
    const name = norm(String(r["Ürün"]));
    if (!name) continue;
    rowCategory.set(name, String(r["Kategori"]).trim() as PantryCategory);

    const sil = norm(String(r["Sil"]));
    if (sil === "sil") {
      delSet.add(name);
      continue; // delete wins over merge
    }

    const target = norm(String(r["Birleştir →"]));
    if (target && target !== SENTINEL && target !== name) {
      mergeRaw.set(name, target);
    }
  }

  // Resolve merge chains transitively (a→b→c ⇒ a→c).
  function resolveTarget(name: string, seen = new Set<string>()): string {
    let cur = name;
    while (mergeRaw.has(cur) && !seen.has(cur)) {
      seen.add(cur);
      cur = mergeRaw.get(cur)!;
      if (delSet.has(cur)) return cur; // points at a deleted item
    }
    return cur;
  }

  const mergeMap = new Map<string, string>();
  for (const name of mergeRaw.keys()) {
    const target = resolveTarget(name);
    if (target !== name) mergeMap.set(name, target);
  }

  // Where each surviving target should live (its own category, else source's).
  const indexLower = new Map<string, PantryCategory>();
  for (const [k, v] of Object.entries(PANTRY_CATEGORY_INDEX)) {
    indexLower.set(norm(k), v as PantryCategory);
  }
  function categoryForTarget(
    target: string,
    sourceName: string,
  ): PantryCategory {
    return (
      indexLower.get(target) ??
      rowCategory.get(target) ??
      rowCategory.get(sourceName) ??
      "Sebze"
    );
  }

  // ---------- Rebuild PANTRY_QUICK_CATALOG ----------
  const catalogByCat = new Map<PantryCategory, string[]>();
  for (const cat of PANTRY_CATEGORIES) catalogByCat.set(cat, []);

  const seenPerCat = new Map<PantryCategory, Set<string>>();
  for (const cat of PANTRY_CATEGORIES) seenPerCat.set(cat, new Set());

  const pushItem = (cat: PantryCategory, name: string) => {
    const seen = seenPerCat.get(cat)!;
    const key = norm(name);
    if (seen.has(key)) return;
    seen.add(key);
    catalogByCat.get(cat)!.push(name);
  };

  // 1. Keep surviving original items in their original order/category.
  for (const { category, items } of PANTRY_QUICK_CATALOG) {
    for (const item of items) {
      const key = norm(item);
      if (delSet.has(key)) continue;
      if (mergeMap.has(key)) continue; // folded into target
      pushItem(category as PantryCategory, item);
    }
  }

  // 2. Ensure every merge target exists somewhere.
  for (const target of new Set(mergeMap.values())) {
    if (delSet.has(target)) continue;
    const exists = [...catalogByCat.values()].some((arr) =>
      arr.some((x) => norm(x) === target),
    );
    if (!exists) {
      const cat = categoryForTarget(target, target);
      pushItem(cat, target);
    }
  }

  const quickCatalog = PANTRY_CATEGORIES.map((category) => ({
    category,
    items: catalogByCat.get(category)!,
  }));

  // ---------- Rebuild PANTRY_CATEGORY_INDEX ----------
  const newIndex = new Map<string, PantryCategory>();
  for (const [k, v] of Object.entries(PANTRY_CATEGORY_INDEX)) {
    const key = norm(k);
    if (delSet.has(key)) continue;
    if (mergeMap.has(key)) continue;
    newIndex.set(k, v as PantryCategory);
  }
  // Make sure each surviving target is indexed.
  for (const target of new Set(mergeMap.values())) {
    if (delSet.has(target)) continue;
    if (!newIndex.has(target)) {
      newIndex.set(target, categoryForTarget(target, target));
    }
  }

  // ---------- Rebuild PANTRY_DROPPED_NAMES ----------
  const dropped = new Set<string>([...PANTRY_DROPPED_NAMES]);
  for (const d of delSet) dropped.add(d);

  // ---------- Emit ----------
  const tsString = (s: string) => JSON.stringify(s);
  const sortedIndex = [...newIndex.entries()].sort(([a], [b]) =>
    a.localeCompare(b, "tr-TR"),
  );

  const out = `// AUTO-GENERATED by scripts/import-pantry-catalog.ts.
// Source of truth: güncel.xlsx (hand-curated). Do not edit by hand.

export const PANTRY_CATEGORIES = [
${PANTRY_CATEGORIES.map((c) => `  ${tsString(c)},`).join("\n")}
] as const;

export type PantryCategory = (typeof PANTRY_CATEGORIES)[number];

export const PANTRY_QUICK_CATALOG: { category: PantryCategory; items: string[] }[] = [
${quickCatalog
  .map(
    ({ category, items }) =>
      `  { category: ${tsString(category)}, items: [\n${items
        .map((i) => `    ${tsString(i)},`)
        .join("\n")}\n  ] },`,
  )
  .join("\n")}
];

/** Lower-case product/variant name → category. */
export const PANTRY_CATEGORY_INDEX: Record<string, PantryCategory> = {
${sortedIndex.map(([k, v]) => `  ${tsString(k)}: ${tsString(v)},`).join("\n")}
};

/** Lower-case names that should be hidden from quick-add (e.g. "sıcak su"). */
export const PANTRY_DROPPED_NAMES: ReadonlySet<string> = new Set([
${[...dropped]
  .sort((a, b) => a.localeCompare(b, "tr-TR"))
  .map((d) => `  ${tsString(d)},`)
  .join("\n")}
]);
`;

  writeFileSync(OUT, out, "utf8");

  const totalItems = quickCatalog.reduce((n, c) => n + c.items.length, 0);
  console.log(`✓ pantryCatalog.ts güncellendi → ${OUT}`);
  console.log(`   Birleştirilen ürün : ${mergeMap.size}`);
  console.log(`   Silinen ürün       : ${delSet.size}`);
  console.log(`   Quick katalog ürün : ${totalItems}`);
  console.log(`   Index kayıtları    : ${newIndex.size}`);
  console.log(`   Dropped isimler    : ${dropped.size}`);
}

main();
