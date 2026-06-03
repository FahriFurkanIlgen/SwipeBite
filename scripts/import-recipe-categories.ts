/* eslint-disable no-console */
/**
 * Imports ID -> Kategori mapping from recipes_kategorize.xlsx and writes
 * src/constants/recipeCategories.ts as a typed override map.
 *
 *   npx tsx scripts/import-recipe-categories.ts
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as XLSX from "xlsx";

const VALID_COURSES = new Set([
  "kahvalti",
  "corba",
  "ana",
  "tatli",
  "salata",
  "meze",
  "atistirmalik",
  "sos",
  "icecek",
]);

const wb = XLSX.readFile(resolve(process.cwd(), "recipes_kategorize.xlsx"));
const ws = wb.Sheets["Tarifler"];
if (!ws) throw new Error('Sayfa "Tarifler" bulunamadı.');

const rows = XLSX.utils.sheet_to_json<{ ID: string; Kategori: string }>(ws, {
  defval: "",
});

const map: Record<string, string> = {};
let invalid = 0;
let dropped = 0;

for (const row of rows) {
  const id = String(row.ID ?? "").trim();
  const cat = String(row.Kategori ?? "").trim();
  if (!id) {
    dropped++;
    continue;
  }
  if (!VALID_COURSES.has(cat)) {
    invalid++;
    continue;
  }
  map[id] = cat;
}

const sortedIds = Object.keys(map).sort();
const body = sortedIds
  .map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(map[id])},`)
  .join("\n");

const out = `// AUTO-GENERATED from recipes_kategorize.xlsx. Do not edit by hand.
// Regenerate via:  npx tsx scripts/import-recipe-categories.ts
import type { Course } from "@/features/recipes/recipeClassifier";

export const RECIPE_CATEGORY_OVERRIDES: Record<string, Course> = {
${body}
};
`;

const outPath = resolve(process.cwd(), "src/constants/recipeCategories.ts");
writeFileSync(outPath, out, "utf8");

console.log(
  `✓ ${sortedIds.length} kayıt yazıldı → ${outPath}` +
    (invalid ? `  (atlanan geçersiz kategori: ${invalid})` : "") +
    (dropped ? `  (boş ID: ${dropped})` : ""),
);
