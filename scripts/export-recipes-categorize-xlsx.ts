/* eslint-disable no-console */
/**
 * Exports every recipe with its current (auto-classified) category so the
 * categorisation can be reviewed and corrected by hand — then fed back into
 * RECIPE_CATEGORY_OVERRIDES.
 *
 *   npx tsx scripts/export-recipes-categorize-xlsx.ts
 *
 * Output: ./recipes-categorize.xlsx with two sheets:
 *   - "Tarifler"   : one row per recipe. Fill "Doğru Kategori (kod)" only when
 *                    the current category is wrong; leave blank to keep it.
 *   - "Kategoriler": legend of valid category codes ↔ labels.
 *
 * After editing, apply the corrections with a follow-up script that writes the
 * filled rows into src/constants/recipeCategories.ts (RECIPE_CATEGORY_OVERRIDES).
 */
import { resolve } from "node:path";
import * as XLSX from "xlsx";
import { MOCK_RECIPES } from "../src/constants/mockRecipes";
import {
  classifyCourse,
  COURSE_LABEL,
} from "../src/features/recipes/recipeClassifier";
import { RECIPE_CATEGORY_OVERRIDES } from "../src/constants/recipeCategories";
import type { Recipe } from "../src/types/domain";

const rows = MOCK_RECIPES.map((r: Recipe, i: number) => {
  const course = classifyCourse(r);
  const hasOverride = Object.prototype.hasOwnProperty.call(
    RECIPE_CATEGORY_OVERRIDES,
    r.id,
  );
  return {
    "#": i + 1,
    ID: r.id,
    Başlık: r.title,
    "Mevcut Kategori": COURSE_LABEL[course],
    "Mevcut (kod)": course,
    "Override?": hasOverride ? "evet" : "",
    "Doğru Kategori (kod)": "", // ← fill only when current is wrong
    Mutfak: r.cuisine,
    Etiketler: r.tags.join(", "),
    Malzemeler: r.ingredients
      .map((ing: { name: string; quantity?: string }) => ing.name)
      .join(", "),
  };
});

const ws = XLSX.utils.json_to_sheet(rows);
ws["!cols"] = [
  { wch: 5 }, // #
  { wch: 28 }, // ID
  { wch: 40 }, // Başlık
  { wch: 14 }, // Mevcut Kategori
  { wch: 12 }, // Mevcut (kod)
  { wch: 10 }, // Override?
  { wch: 20 }, // Doğru Kategori (kod)
  { wch: 14 }, // Mutfak
  { wch: 36 }, // Etiketler
  { wch: 60 }, // Malzemeler
];
ws["!autofilter"] = { ref: `A1:J${rows.length + 1}` };

// Legend sheet — valid course codes ↔ Turkish labels.
const legend = (Object.keys(COURSE_LABEL) as (keyof typeof COURSE_LABEL)[]).map(
  (code) => ({ Kod: code, Etiket: COURSE_LABEL[code] }),
);
const wsLegend = XLSX.utils.json_to_sheet(legend);
wsLegend["!cols"] = [{ wch: 16 }, { wch: 16 }];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Tarifler");
XLSX.utils.book_append_sheet(wb, wsLegend, "Kategoriler");

const outPath = resolve(process.cwd(), "recipes-categorize.xlsx");
XLSX.writeFile(wb, outPath);

const byCat = new Map<string, number>();
for (const r of rows)
  byCat.set(r["Mevcut Kategori"], (byCat.get(r["Mevcut Kategori"]) ?? 0) + 1);

console.log(`✓ ${MOCK_RECIPES.length} tarif yazıldı → ${outPath}`);
for (const [cat, n] of [...byCat.entries()].sort((a, b) => b[1] - a[1]))
  console.log(`   ${cat}: ${n}`);
