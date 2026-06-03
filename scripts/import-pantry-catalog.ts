/* eslint-disable no-console */
/**
 * Reads güncel.xlsx (the hand-curated catalogue) and writes
 * src/constants/pantryCatalog.ts. Run after editing the spreadsheet:
 *
 *   npx tsx scripts/import-pantry-catalog.ts
 *
 * Sheets consumed:
 *   - "Hızlı Ekle"          : canonical product → category (visible in UI)
 *   - "Diğer (atılan)"      : products to hide from quick add
 *   - "Kategori Değişiklikleri": variant → category overrides
 *   - "Hızlı Ekle".Birleştirilen / Silinen Varyantlar : variant → category
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as XLSX from "xlsx";

const SRC = resolve(process.cwd(), "güncel.xlsx");
const OUT = resolve(process.cwd(), "src/constants/pantryCatalog.ts");

const wb = XLSX.readFile(SRC);

const CATEGORY_ORDER = [
  "Sebze",
  "Meyve",
  "Protein",
  "Süt",
  "Tahıl",
  "Baharat",
  "Kuruyemiş",
  "Yağ & Sos",
] as const;

type Cat = (typeof CATEGORY_ORDER)[number];

function isCat(s: unknown): s is Cat {
  return (
    typeof s === "string" && (CATEGORY_ORDER as readonly string[]).includes(s)
  );
}

const norm = (s: string): string =>
  s.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();

// ---------- Hızlı Ekle: canonical names ----------
type QuickRow = {
  Ürün: string;
  "Mevcut Kategori": string;
  "Tarifteki Kullanım": number;
  "Birleştirilen / Silinen Varyantlar": string | undefined;
};
const quickRows = XLSX.utils.sheet_to_json<QuickRow>(wb.Sheets["Hızlı Ekle"]);

const categoryOf = new Map<string, Cat>();
const usageOf = new Map<string, number>();
const byCategory = new Map<Cat, { name: string; usage: number }[]>();
for (const c of CATEGORY_ORDER) byCategory.set(c, []);

const dropped = new Set<string>();

function setCategory(name: string, cat: Cat, usage: number) {
  const k = norm(name);
  if (!k) return;
  // Don't overwrite a higher-usage canonical with a lower-usage variant.
  const prev = usageOf.get(k) ?? -1;
  if (usage > prev) {
    categoryOf.set(k, cat);
    usageOf.set(k, usage);
  } else if (!categoryOf.has(k)) {
    categoryOf.set(k, cat);
    usageOf.set(k, usage);
  }
}

const VARIANT_RE = /(.+?)\s*\[ID:[^\]]+\]/g;
function* extractVariants(s: string | undefined): Generator<string> {
  if (!s) return;
  // The cell is a comma-separated list of "name [ID:X, Sheet, kullanım:N]".
  // Names themselves can contain commas (rare), so we use the [...] anchor.
  let m;
  VARIANT_RE.lastIndex = 0;
  while ((m = VARIANT_RE.exec(s)) !== null) {
    let v = m[1];
    // Strip leading separator from previous match.
    v = v.replace(/^[\s,;]+/, "").replace(/[\s,;]+$/, "");
    if (v) yield v;
  }
}

for (const r of quickRows) {
  const name = String(r.Ürün ?? "").trim();
  const cat = r["Mevcut Kategori"];
  const usage = Number(r["Tarifteki Kullanım"] ?? 0) || 0;
  if (!name || !isCat(cat)) continue;

  setCategory(name, cat, usage + 1_000_000); // canonicals win over variants
  byCategory.get(cat)!.push({ name: norm(name), usage });

  for (const variant of extractVariants(
    r["Birleştirilen / Silinen Varyantlar"],
  )) {
    setCategory(variant, cat, usage);
  }
}

// ---------- Diğer (atılan): hide from UI ----------
type DroppedRow = {
  Ürün: string;
  "Birleştirilen / Silinen Varyantlar": string | undefined;
};
const droppedRows = XLSX.utils.sheet_to_json<DroppedRow>(
  wb.Sheets["Diğer (atılan)"],
);
for (const r of droppedRows) {
  const name = String(r.Ürün ?? "").trim();
  if (!name) continue;
  dropped.add(norm(name));
  for (const v of extractVariants(r["Birleştirilen / Silinen Varyantlar"])) {
    dropped.add(norm(v));
  }
}

// ---------- Kategori Değişiklikleri: variant → category ----------
type ChangeRow = {
  "Orijinal Ürün": string;
  "Yeni Kategori": string;
};
const changeRows = XLSX.utils.sheet_to_json<ChangeRow>(
  wb.Sheets["Kategori Değişiklikleri"],
);
for (const r of changeRows) {
  const name = String(r["Orijinal Ürün"] ?? "").trim();
  const cat = r["Yeni Kategori"];
  if (!name || !isCat(cat)) continue;
  // These are corrections; do not bump usage or override canonical.
  if (!categoryOf.has(norm(name))) {
    categoryOf.set(norm(name), cat);
    usageOf.set(norm(name), 0);
  }
}

// Drop any "dropped" entries from the index (defence in depth).
for (const d of dropped) {
  // If something was both in dropped AND assigned a category in changes, the
  // dropped sheet wins — those are intentionally hidden.
  if (categoryOf.has(d) && (usageOf.get(d) ?? 0) < 1_000_000) {
    categoryOf.delete(d);
  }
}

// ---------- Build quick catalog (sorted by usage desc) ----------
const quickCatalog = CATEGORY_ORDER.map((cat) => {
  const items = (byCategory.get(cat) ?? [])
    .filter((x) => !dropped.has(x.name))
    .sort((a, b) => b.usage - a.usage || a.name.localeCompare(b.name, "tr-TR"))
    .map((x) => x.name);
  return { category: cat, items };
});

// ---------- Emit TS ----------
function tsString(s: string): string {
  return JSON.stringify(s);
}

const sortedIndex = [...categoryOf.entries()].sort(([a], [b]) =>
  a.localeCompare(b, "tr-TR"),
);

let out = `// AUTO-GENERATED by scripts/import-pantry-catalog.ts.
// Source of truth: güncel.xlsx (hand-curated). Do not edit by hand.

export const PANTRY_CATEGORIES = [
${CATEGORY_ORDER.map((c) => `  ${tsString(c)},`).join("\n")}
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

console.log(
  `✓ ${quickCatalog.reduce((n, c) => n + c.items.length, 0)} canonical, ` +
    `${categoryOf.size} index entries, ${dropped.size} dropped → ${OUT}`,
);
