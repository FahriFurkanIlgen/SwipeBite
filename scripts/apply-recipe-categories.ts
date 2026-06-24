/* eslint-disable no-console */
/**
 * Applies hand-reviewed category corrections from
 * kategori_duzeltilmis_tarifler.xlsx into RECIPE_CATEGORY_OVERRIDES
 * (src/constants/recipeCategories.ts).
 *
 *   npx tsx scripts/apply-recipe-categories.ts
 *
 * Reads the "Tarifler" sheet. For every row whose "Doğru Kategori (kod)"
 * differs from the recipe's current category, an override entry is written.
 * Existing overrides are preserved; only changed recipes are updated.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as XLSX from "xlsx";
import { COURSE_LABEL } from "../src/features/recipes/recipeClassifier";
import { RECIPE_CATEGORY_OVERRIDES } from "../src/constants/recipeCategories";

const VALID = new Set(Object.keys(COURSE_LABEL));
const COL = "Doğru Kategori (kod)";
const XLSX_PATH = resolve(process.cwd(), "kategori_duzeltilmis_tarifler.xlsx");
const OUT = resolve(process.cwd(), "src/constants/recipeCategories.ts");

type Row = {
  ID: string;
  "Mevcut (kod)": string;
  [COL]: string;
};

function main() {
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets["Tarifler"];
  if (!ws) throw new Error('Sayfa "Tarifler" bulunamadı.');
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });

  const map: Record<string, string> = { ...RECIPE_CATEGORY_OVERRIDES };

  let changed = 0;
  let invalid = 0;
  const changes: string[] = [];

  for (const r of rows) {
    const id = String(r.ID ?? "").trim();
    const cur = String(r["Mevcut (kod)"] ?? "").trim();
    const next = String(r[COL] ?? "").trim();
    if (!id || !next) continue;
    if (!VALID.has(next)) {
      invalid++;
      continue;
    }
    if (next !== cur) {
      if (map[id] !== next) {
        changes.push(`${id}: ${cur} -> ${next}`);
        map[id] = next;
        changed++;
      }
    }
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

  writeFileSync(OUT, out, "utf8");

  console.log(`✓ recipeCategories.ts güncellendi → ${OUT}`);
  console.log(`   Uygulanan düzeltme : ${changed}`);
  console.log(`   Toplam override    : ${sortedIds.length}`);
  if (invalid) console.log(`   Geçersiz kod (atlanan): ${invalid}`);
  console.log("   --- Değişiklikler ---");
  for (const c of changes) console.log("   " + c);
}

main();
