import { PantryItem } from "@/types/domain";

export interface GroceryItem {
  name: string;
  haveInPantry: boolean;
}

/**
 * Split a flat grocery list into two buckets based on current pantry contents.
 * The pantry match is fuzzy (substring both ways, lowercase tr).
 */
export function splitGroceryList(
  list: string[],
  pantry: PantryItem[],
): { toBuy: GroceryItem[]; alreadyHave: GroceryItem[] } {
  const have = pantry.map((p) => p.name.toLocaleLowerCase("tr-TR").trim());
  const toBuy: GroceryItem[] = [];
  const alreadyHave: GroceryItem[] = [];
  for (const raw of list) {
    const n = raw.toLocaleLowerCase("tr-TR").trim();
    const hit = have.some((h) => h && (n.includes(h) || h.includes(n)));
    (hit ? alreadyHave : toBuy).push({ name: raw, haveInPantry: hit });
  }
  return { toBuy, alreadyHave };
}

// --- Categorisation (light heuristic, Turkish) ---
const CATEGORIES: { name: string; keywords: string[] }[] = [
  {
    name: "Sebze & Meyve",
    keywords: [
      "domates",
      "soğan",
      "sarımsak",
      "biber",
      "patates",
      "salatalık",
      "marul",
      "havuç",
      "kabak",
      "patlıcan",
      "ıspanak",
      "brokoli",
      "elma",
      "muz",
      "limon",
      "portakal",
      "çilek",
      "üzüm",
      "armut",
      "maydanoz",
      "dereotu",
      "roka",
      "mantar",
    ],
  },
  {
    name: "Et & Tavuk & Balık",
    keywords: [
      "et",
      "kıyma",
      "tavuk",
      "hindi",
      "balık",
      "somon",
      "hamsi",
      "levrek",
      "but",
      "göğüs",
      "sucuk",
      "pastırma",
      "salam",
    ],
  },
  {
    name: "Süt & Kahvaltılık",
    keywords: [
      "süt",
      "yoğurt",
      "peynir",
      "tereyağı",
      "ayran",
      "krema",
      "labne",
      "kaymak",
      "yumurta",
      "zeytin",
      "bal",
      "reçel",
    ],
  },
  {
    name: "Tahıl & Bakliyat",
    keywords: [
      "makarna",
      "pirinç",
      "bulgur",
      "ekmek",
      "un",
      "yulaf",
      "kuskus",
      "mercimek",
      "nohut",
      "fasulye",
      "barbunya",
      "kuru fasulye",
    ],
  },
  {
    name: "Baharat & Sos",
    keywords: [
      "tuz",
      "karabiber",
      "pul biber",
      "kekik",
      "nane",
      "kimyon",
      "salça",
      "sirke",
      "ketçap",
      "mayonez",
      "soya",
      "zeytinyağı",
    ],
  },
];

export interface GroceryGroup {
  category: string;
  items: GroceryItem[];
}

export function groupGroceryByCategory(items: GroceryItem[]): GroceryGroup[] {
  const buckets = new Map<string, GroceryItem[]>();
  for (const it of items) {
    const lower = it.name.toLocaleLowerCase("tr-TR");
    const cat =
      CATEGORIES.find((c) => c.keywords.some((k) => lower.includes(k)))?.name ??
      "Diğer";
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)!.push(it);
  }
  // Preserve catalogue order, then Diğer last.
  const order = [...CATEGORIES.map((c) => c.name), "Diğer"];
  return order
    .map((name) => ({ category: name, items: buckets.get(name) ?? [] }))
    .filter((g) => g.items.length > 0);
}
