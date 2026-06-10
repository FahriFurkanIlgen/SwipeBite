/* eslint-disable no-console */
/**
 * Exports every cocktail in ALL_COCKTAILS to an Excel workbook.
 *
 *   npx tsx scripts/export-cocktails-xlsx.ts
 *
 * Output: ./cocktails.xlsx in the workspace root.
 *
 * Two sheets:
 *  - "Kokteyller"  — one row per cocktail, with full recipe + image status
 *  - "Malzemeler"  — bar ingredient catalog (so you can see which ids exist)
 */
import { resolve } from "node:path";
import * as XLSX from "xlsx";
import { ALL_COCKTAILS } from "../src/constants/allCocktails";
import {
  BAR_CATEGORY_LABEL,
  BAR_INGREDIENT_INDEX,
  BAR_INGREDIENTS,
} from "../src/constants/barCatalog";
import type { Cocktail } from "../src/types/bar";

const TECHNIQUE_LABEL: Record<string, string> = {
  shake: "Çalkalama",
  stir: "Karıştırma",
  build: "Direkt bardakta",
  blend: "Blender",
  muddle: "Ezme",
};

const GLASS_LABEL: Record<string, string> = {
  rocks: "Rocks (kısa)",
  highball: "Highball (uzun)",
  coupe: "Coupe",
  martini: "Martini",
  flute: "Şampanya",
  wine: "Şarap kadehi",
  "copper-mug": "Bakır kupa",
  hurricane: "Hurricane",
};

const cocktailRows = ALL_COCKTAILS.map((c: Cocktail, i: number) => {
  const ingredientLines = c.ingredients.map((ref) => {
    const ing = BAR_INGREDIENT_INDEX[ref.ingredientId];
    const name = ing ? ing.name : ref.ingredientId;
    const opt = ref.optional ? " (opsiyonel)" : "";
    return `${ref.amount} ${name}${opt}`;
  });

  const requiredCount = c.ingredients.filter((r) => !r.optional).length;
  const optionalCount = c.ingredients.length - requiredCount;

  return {
    "#": i + 1,
    ID: c.id,
    İsim: c.name,
    "Orijinal İsim": c.altName ?? "",
    Emoji: c.emoji,
    Açıklama: c.description,
    Teknik: TECHNIQUE_LABEL[c.technique] ?? c.technique,
    Bardak: GLASS_LABEL[c.glass] ?? c.glass,
    Zorluk: c.difficulty,
    "Süre (dk)": c.prepTimeMinutes,
    Porsiyon: c.servings,
    "Toplam Malzeme": c.ingredients.length,
    "Zorunlu Malzeme": requiredCount,
    "Opsiyonel Malzeme": optionalCount,
    Malzemeler: ingredientLines.join(" | "),
    Adımlar: c.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n"),
    "Adım Sayısı": c.steps.length,
    Etiketler: c.tags.join(", "),
    Kaynak: c.source,
    "Görsel URL": c.imageUrl ?? "",
    "Görsel Durumu": c.imageUrl ? "VAR" : "EKSİK",
    "Reels URL": c.sourceUrl ?? "",
  };
});

const cocktailSheet = XLSX.utils.json_to_sheet(cocktailRows);
cocktailSheet["!cols"] = [
  { wch: 4 }, // #
  { wch: 22 }, // ID
  { wch: 22 }, // İsim
  { wch: 22 }, // Orijinal İsim
  { wch: 6 }, // Emoji
  { wch: 60 }, // Açıklama
  { wch: 16 }, // Teknik
  { wch: 16 }, // Bardak
  { wch: 8 }, // Zorluk
  { wch: 9 }, // Süre
  { wch: 9 }, // Porsiyon
  { wch: 14 }, // Toplam Malzeme
  { wch: 16 }, // Zorunlu
  { wch: 18 }, // Opsiyonel
  { wch: 90 }, // Malzemeler
  { wch: 90 }, // Adımlar
  { wch: 12 }, // Adım Sayısı
  { wch: 24 }, // Etiketler
  { wch: 10 }, // Kaynak
  { wch: 50 }, // Görsel URL
  { wch: 14 }, // Görsel Durumu
  { wch: 50 }, // Reels URL
];

// ─── Ingredients sheet ───────────────────────────────────────────────
const ingredientRows = BAR_INGREDIENTS.map((ing, i) => ({
  "#": i + 1,
  ID: ing.id,
  İsim: ing.name,
  "Alt İsim": ing.altName ?? "",
  Kategori: BAR_CATEGORY_LABEL[ing.category],
  "Kategori (kod)": ing.category,
  Emoji: ing.emoji,
  Esansiyel: ing.essential ? "EVET" : "",
}));

const ingSheet = XLSX.utils.json_to_sheet(ingredientRows);
ingSheet["!cols"] = [
  { wch: 4 },
  { wch: 28 },
  { wch: 26 },
  { wch: 26 },
  { wch: 16 },
  { wch: 14 },
  { wch: 6 },
  { wch: 12 },
];

// ─── Summary sheet ───────────────────────────────────────────────────
const withImage = ALL_COCKTAILS.filter((c) => !!c.imageUrl).length;
const withoutImage = ALL_COCKTAILS.length - withImage;

const summaryRows = [
  { Metrik: "Toplam kokteyl", Değer: ALL_COCKTAILS.length },
  { Metrik: "Görseli olan", Değer: withImage },
  { Metrik: "Görseli eksik", Değer: withoutImage },
  {
    Metrik: "Klasik (curated)",
    Değer: ALL_COCKTAILS.filter((c) => c.source === "classic").length,
  },
  {
    Metrik: "Influencer (scraped)",
    Değer: ALL_COCKTAILS.filter((c) => c.source === "influencer").length,
  },
  { Metrik: "Toplam malzeme kataloğu", Değer: BAR_INGREDIENTS.length },
];
const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
summarySheet["!cols"] = [{ wch: 28 }, { wch: 12 }];

// ─── Workbook ────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, summarySheet, "Özet");
XLSX.utils.book_append_sheet(wb, cocktailSheet, "Kokteyller");
XLSX.utils.book_append_sheet(wb, ingSheet, "Malzemeler");

const outPath = resolve(process.cwd(), "cocktails.xlsx");
XLSX.writeFile(wb, outPath);

console.log(
  `✓ ${ALL_COCKTAILS.length} kokteyl yazıldı (görseli olan ${withImage}, eksik ${withoutImage}) → ${outPath}`,
);
