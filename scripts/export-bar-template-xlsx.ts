/* eslint-disable no-console */
/**
 * Generates a BLANK template workbook for adding new Bar (cocktail) recipes.
 *
 *   npx tsx scripts/export-bar-template-xlsx.ts
 *
 * Output: ./bar-template.xlsx in the workspace root.
 *
 * Sheets:
 *  - "Talimatlar"  — how to fill in each column + accepted enum values
 *  - "Kokteyller"  — empty template with ONE filled-in example (Negroni)
 *  - "Malzemeler"  — reference list of valid ingredient ids you can use
 */
import { resolve } from "node:path";
import * as XLSX from "xlsx";
import {
  BAR_CATEGORY_LABEL,
  BAR_INGREDIENTS,
} from "../src/constants/barCatalog";

// Header row used by the template (matches the Cocktail schema).
const HEADERS = [
  "ID",
  "İsim",
  "Orijinal İsim",
  "Emoji",
  "Açıklama",
  "Teknik",
  "Bardak",
  "Zorluk",
  "Süre (dk)",
  "Porsiyon",
  "Malzemeler",
  "Adımlar",
  "Etiketler",
  "Kaynak",
  "Görsel URL",
  "Reels URL",
] as const;

// One worked example so the format is unambiguous.
const EXAMPLE = {
  ID: "cocktail-negroni",
  İsim: "Negroni",
  "Orijinal İsim": "Negroni",
  Emoji: "🟥",
  Açıklama:
    "Acımsı ve şık. Cin, Campari ve tatlı vermut'un eşit oranlı klasiği.",
  Teknik: "stir",
  Bardak: "rocks",
  Zorluk: "kolay",
  "Süre (dk)": 3,
  Porsiyon: 1,
  // Her satır bir malzeme: "ingredientId | miktar | opsiyonel?(evet boş bırak)"
  Malzemeler: [
    "spirit-gin | 30 ml",
    "liqueur-campari | 30 ml",
    "liqueur-vermouth-sweet | 30 ml",
    "garnish-orange | 1 dilim | opsiyonel",
  ].join("\n"),
  Adımlar: [
    "Rocks bardağı buzla doldur.",
    "Cin, Campari ve vermutu ekle, 20 saniye karıştır.",
    "Portakal kabuğu ile süsle.",
  ].join("\n"),
  Etiketler: "klasik, amaro",
  Kaynak: "classic",
  "Görsel URL": "",
  "Reels URL": "",
} satisfies Record<(typeof HEADERS)[number], string | number>;

// ─── Kokteyller sheet (example + blank rows) ─────────────────────────
const cocktailRows: Record<string, string | number>[] = [EXAMPLE];
// Add 20 empty rows ready to fill.
for (let i = 0; i < 20; i++) {
  const blank: Record<string, string | number> = {};
  for (const h of HEADERS) blank[h] = "";
  cocktailRows.push(blank);
}

const cocktailSheet = XLSX.utils.json_to_sheet(cocktailRows, {
  header: HEADERS as unknown as string[],
});
cocktailSheet["!cols"] = [
  { wch: 22 }, // ID
  { wch: 22 }, // İsim
  { wch: 22 }, // Orijinal İsim
  { wch: 6 }, // Emoji
  { wch: 60 }, // Açıklama
  { wch: 12 }, // Teknik
  { wch: 14 }, // Bardak
  { wch: 8 }, // Zorluk
  { wch: 9 }, // Süre
  { wch: 9 }, // Porsiyon
  { wch: 50 }, // Malzemeler
  { wch: 70 }, // Adımlar
  { wch: 24 }, // Etiketler
  { wch: 12 }, // Kaynak
  { wch: 50 }, // Görsel URL
  { wch: 50 }, // Reels URL
];

// ─── Talimatlar sheet ────────────────────────────────────────────────
const instructionRows = [
  {
    Sütun: "ID",
    Açıklama: "Benzersiz kimlik. Örn: cocktail-negroni (küçük harf, tire ile).",
  },
  { Sütun: "İsim", Açıklama: "Türkçe görünen isim." },
  { Sütun: "Orijinal İsim", Açıklama: "Opsiyonel İngilizce / orijinal isim." },
  { Sütun: "Emoji", Açıklama: "Görsel yoksa kullanılacak tek emoji." },
  { Sütun: "Açıklama", Açıklama: "Kısa Türkçe tanıtım metni." },
  {
    Sütun: "Teknik",
    Açıklama: "Şunlardan biri: shake, stir, build, blend, muddle",
  },
  {
    Sütun: "Bardak",
    Açıklama:
      "Şunlardan biri: rocks, highball, coupe, martini, flute, wine, copper-mug, hurricane",
  },
  { Sütun: "Zorluk", Açıklama: "Şunlardan biri: kolay, orta, zor" },
  { Sütun: "Süre (dk)", Açıklama: "Tahmini hazırlık süresi (dakika, sayı)." },
  { Sütun: "Porsiyon", Açıklama: "Kaç kişilik (genelde 1)." },
  {
    Sütun: "Malzemeler",
    Açıklama:
      "Her satıra bir malzeme: 'ingredientId | miktar | opsiyonel'. Opsiyonel değilse 3. kısmı boş bırak. Geçerli id'ler için 'Malzemeler' sekmesine bak.",
  },
  {
    Sütun: "Adımlar",
    Açıklama: "Her satıra bir hazırlık adımı (Alt+Enter ile yeni satır).",
  },
  {
    Sütun: "Etiketler",
    Açıklama: "Virgülle ayrılmış etiketler. Örn: klasik, yaz, amaro",
  },
  { Sütun: "Kaynak", Açıklama: "classic veya influencer" },
  { Sütun: "Görsel URL", Açıklama: "Opsiyonel görsel referansı." },
  {
    Sütun: "Reels URL",
    Açıklama: "Opsiyonel Instagram reel linki (influencer kaynaklı ise).",
  },
];
const instructionSheet = XLSX.utils.json_to_sheet(instructionRows);
instructionSheet["!cols"] = [{ wch: 16 }, { wch: 100 }];

// ─── Malzemeler reference sheet ──────────────────────────────────────
const ingredientRows = BAR_INGREDIENTS.map((ing, i) => ({
  "#": i + 1,
  ID: ing.id,
  İsim: ing.name,
  "Alt İsim": ing.altName ?? "",
  Kategori: BAR_CATEGORY_LABEL[ing.category],
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
  { wch: 6 },
  { wch: 12 },
];

// ─── Workbook ────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, instructionSheet, "Talimatlar");
XLSX.utils.book_append_sheet(wb, cocktailSheet, "Kokteyller");
XLSX.utils.book_append_sheet(wb, ingSheet, "Malzemeler");

const outPath = resolve(process.cwd(), "bar-template.xlsx");
XLSX.writeFile(wb, outPath);

console.log(`✓ Bar taslağı oluşturuldu (1 örnek + 20 boş satır) → ${outPath}`);
