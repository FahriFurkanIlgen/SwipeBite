/* eslint-disable no-console */
/**
 * Exports PANTRY_QUICK_CATALOG to an Excel workbook designed for manually
 * merging near-duplicate / variant items (e.g. "yumurta", "yumurta sarısı",
 * "yumurta akı", "yumurta beyazı", "yumurt sarısı" → "yumurta").
 *
 *   npx tsx scripts/export-pantry-merge-xlsx.ts
 *
 * Output: ./pantry-merge.xlsx in the workspace root.
 *
 * Rows are grouped by category and by their "root" (first word), so similar
 * items land next to each other. Fill in the "Birleştir →" column with the
 * canonical name you want the item merged into; leave it blank to keep the
 * item as-is. The "Sil" column (any value) can mark items to drop entirely.
 */
import { resolve } from "node:path";
import * as XLSX from "xlsx";
import {
  PANTRY_CATEGORIES,
  PANTRY_QUICK_CATALOG,
} from "../src/constants/pantryCatalog";

// First significant word — used purely to cluster similar items together.
function rootOf(item: string): string {
  const tokens = item.trim().toLowerCase().split(/\s+/);
  return tokens[0] ?? item;
}

type Row = {
  Kategori: string;
  Kök: string;
  Ürün: string;
  "Birleştir →": string;
  Sil: string;
  Not: string;
};

function main() {
  const catOrder = new Map(PANTRY_CATEGORIES.map((c, i) => [c, i]));
  const rows: Row[] = [];

  for (const { category, items } of PANTRY_QUICK_CATALOG) {
    const sorted = [...items].sort((a, b) => {
      const ra = rootOf(a);
      const rb = rootOf(b);
      if (ra !== rb) return ra.localeCompare(rb, "tr");
      // shorter (more canonical) first within the same root
      if (a.length !== b.length) return a.length - b.length;
      return a.localeCompare(b, "tr");
    });

    for (const item of sorted) {
      rows.push({
        Kategori: category,
        Kök: rootOf(item),
        Ürün: item,
        "Birleştir →": "",
        Sil: "",
        Not: "",
      });
    }
  }

  rows.sort((a, b) => {
    const ca = catOrder.get(a.Kategori as never) ?? 999;
    const cb = catOrder.get(b.Kategori as never) ?? 999;
    if (ca !== cb) return ca - cb;
    if (a.Kök !== b.Kök) return a.Kök.localeCompare(b.Kök, "tr");
    if (a.Ürün.length !== b.Ürün.length) return a.Ürün.length - b.Ürün.length;
    return a.Ürün.localeCompare(b.Ürün, "tr");
  });

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ["Kategori", "Kök", "Ürün", "Birleştir →", "Sil", "Not"],
  });
  ws["!cols"] = [
    { wch: 12 }, // Kategori
    { wch: 18 }, // Kök
    { wch: 38 }, // Ürün
    { wch: 28 }, // Birleştir →
    { wch: 6 }, // Sil
    { wch: 30 }, // Not
  ];
  ws["!autofilter"] = { ref: `A1:F${rows.length + 1}` };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Birleştir");

  const outPath = resolve(process.cwd(), "pantry-merge.xlsx");
  XLSX.writeFile(wb, outPath);

  const byCat = new Map<string, number>();
  for (const r of rows) byCat.set(r.Kategori, (byCat.get(r.Kategori) ?? 0) + 1);

  console.log(`✓ ${rows.length} ürün yazıldı → ${outPath}`);
  for (const [cat, n] of byCat) console.log(`   ${cat}: ${n}`);
}

main();
