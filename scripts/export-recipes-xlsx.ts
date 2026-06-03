/* eslint-disable no-console */
/**
 * Exports every recipe in MOCK_RECIPES to an Excel workbook.
 *
 *   npx tsx scripts/export-recipes-xlsx.ts
 *
 * Output: ./recipes.xlsx in the workspace root.
 */
import { resolve } from "node:path";
import * as XLSX from "xlsx";
import { MOCK_RECIPES } from "../src/constants/mockRecipes";
import {
  classifyCourse,
  COURSE_LABEL,
} from "../src/features/recipes/recipeClassifier";
import type { Recipe } from "../src/types/domain";

const rows = MOCK_RECIPES.map((r: Recipe, i: number) => {
  const course = classifyCourse(r);
  return {
    "#": i + 1,
    ID: r.id,
    Başlık: r.title,
    Kategori: COURSE_LABEL[course],
    "Kategori (kod)": course,
    Açıklama: r.description,
    Mutfak: r.cuisine,
    Zorluk: r.difficulty,
    "Süre (dk)": r.prepTimeMinutes,
    Porsiyon: r.servings,
    Etiketler: r.tags.join(", "),
    Malzemeler: r.ingredients
      .map((ing: { name: string; quantity?: string }) =>
        ing.quantity ? `${ing.quantity} ${ing.name}` : ing.name,
      )
      .join(" | "),
    "Malzeme Sayısı": r.ingredients.length,
    Adımlar: r.steps
      .map((s: string, idx: number) => `${idx + 1}. ${s}`)
      .join("\n"),
    "Adım Sayısı": r.steps.length,
    Görsel: r.imageUrl,
    Kaynak: r.sourceUrl ?? "",
    Video: r.videoUrl ?? "",
  };
});

const ws = XLSX.utils.json_to_sheet(rows);

// Reasonable column widths so it's actually readable in Excel.
ws["!cols"] = [
  { wch: 5 }, // #
  { wch: 14 }, // ID
  { wch: 38 }, // Başlık
  { wch: 14 }, // Kategori
  { wch: 14 }, // Kategori (kod)
  { wch: 60 }, // Açıklama
  { wch: 14 }, // Mutfak
  { wch: 10 }, // Zorluk
  { wch: 10 }, // Süre
  { wch: 10 }, // Porsiyon
  { wch: 30 }, // Etiketler
  { wch: 80 }, // Malzemeler
  { wch: 12 }, // Malzeme Sayısı
  { wch: 80 }, // Adımlar
  { wch: 12 }, // Adım Sayısı
  { wch: 50 }, // Görsel
  { wch: 50 }, // Kaynak
  { wch: 50 }, // Video
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Tarifler");

const outPath = resolve(process.cwd(), "recipes.xlsx");
XLSX.writeFile(wb, outPath);

console.log(`✓ ${MOCK_RECIPES.length} tarif yazıldı → ${outPath}`);
