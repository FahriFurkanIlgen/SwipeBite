/* eslint-disable no-console */
/**
 * Exports the catalogue of products that the pantry tab can quick-add, with
 * each product's currently auto-assigned category, so they can be reviewed
 * and corrected by hand.
 *
 *   npx tsx scripts/export-pantry-catalog-xlsx.ts
 *
 * Pipeline mirrors app/(tabs)/pantry.tsx:
 *   1. SEED_QUICK_CATALOG (hardcoded seed)
 *   2. Recipe ingredients → normalizeIngredient → canonicalKey → categorize
 *      (entries falling into "Diğer" are dropped, matching the UI)
 *
 * Output: ./pantry-catalog.xlsx with two sheets:
 *   - "Hızlı Ekle"   : items the UI actually surfaces (sorted by frequency)
 *   - "Diğer (atılan)": items that classified as Diğer and the UI hides
 */
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import * as XLSX from "xlsx";

loadEnv();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const key = serviceKey ?? anonKey;

if (!url || !key) {
  console.error(
    "✗ EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY) must be set in .env",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Logic mirrored from app/(tabs)/pantry.tsx — keep these blocks in sync.
// ---------------------------------------------------------------------------

const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  {
    category: "Sebze",
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
      "karnıbahar",
      "pırasa",
      "bezelye",
      "mantar",
      "taze fasulye",
      "barbunya",
      "tere",
      "ruğula",
      "maydanoz",
      "dereotu",
      "nane yaprağı",
      "taze soğan",
      "köür",
      "pancar",
      "turp",
      "bamya",
      "enginar",
      "lâhana",
      "lahana",
      "mısır",
      "zeytin",
      "avokado",
    ],
  },
  {
    category: "Meyve",
    keywords: [
      "elma",
      "muz",
      "limon",
      "portakal",
      "çilek",
      "üzüm",
      "armut",
      "karpuz",
      "kavun",
      "şef tali",
      "şeftali",
      "kayısı",
      "kiraz",
      "vişne",
      "erik",
      "nar",
      "incir",
      "ananas",
      "mango",
      "ahududu",
      "yaban mersini",
      "hurma",
    ],
  },
  {
    category: "Protein",
    keywords: [
      "tavuk",
      "kıyma",
      "balık",
      "yumurta",
      "kuru fasulye",
      "mercimek",
      "nohut",
      "hindi",
      "sucuk",
      "sosis",
      "pastirma",
      "pastırma",
      "dana",
      "kuzu",
      "köfte",
      "jambon",
      "salam",
      "ton balığı",
      "somon",
      "hamsi",
      "karides",
      "levrek",
      "çipura",
      "barbun",
      "kalkan",
      "tofu",
      "seitan",
    ],
  },
  {
    category: "Süt",
    keywords: [
      "süt",
      "yoğurt",
      "peynir",
      "tereyağı",
      "ayran",
      "krema",
      "labne",
      "kaymak",
      "lör",
      "çökelek",
      "mozzarella",
      "parmesan",
      "çedar",
      "beyaz peynir",
      "kaşar",
      "feta",
      "ricotta",
    ],
  },
  {
    category: "Tahıl",
    keywords: [
      "makarna",
      "pirinç",
      "bulgur",
      "ekmek",
      "un",
      "yulaf",
      "kuskus",
      "şehriye",
      "erista",
      "erışte",
      "yufka",
      "baz lama",
      "bazlama",
      "lavaş",
      "pide",
      "simit",
      "kınik buğday",
      "karabuğday",
      "kinoa",
      "galeta unu",
      "nişasta",
      "irmik",
      "mısır unu",
      "tortilla",
    ],
  },
  {
    category: "Baharat",
    keywords: [
      "tuz",
      "karabiber",
      "pul biber",
      "kekik",
      "nane",
      "kimyon",
      "kırmızı biber",
      "kırmızı toz biber",
      "sumak",
      "tarcin",
      "tarçın",
      "karanfil",
      "hindistan cevizi",
      "zerdeçal",
      "köri",
      "defne",
      "reyhan",
      "fısık",
      "fısık yaprağı",
      "safran",
      "vanilya",
      "toz şeker",
      "şeker",
      "karbonat",
      "kabartma tozu",
      "maya",
    ],
  },
  {
    category: "Yağ & Sos",
    keywords: [
      "zeytinyağı",
      "salça",
      "sirke",
      "ketçap",
      "mayonez",
      "soya sosu",
      "ayçiçek yağı",
      "tereyağ",
      "susam yağı",
      "fındık yağı",
      "hardal",
      "nar ekşisi",
      "bal",
      "pekmez",
      "tahin",
      "reyhan sos",
    ],
  },
  {
    category: "Kuruyemiş",
    keywords: [
      "ceviz",
      "badem",
      "fındık",
      "fıstık",
      "antep fıstığı",
      "susam",
      "çam fıstığı",
      "chia",
      "ay çekirdeği",
      "kabak çekirdeği",
    ],
  },
];

const SEED_QUICK_CATALOG: { category: string; items: string[] }[] = [
  {
    category: "Sebze",
    items: [
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
    ],
  },
  {
    category: "Meyve",
    items: ["elma", "muz", "limon", "portakal", "çilek", "üzüm", "armut"],
  },
  {
    category: "Protein",
    items: [
      "tavuk",
      "kıyma",
      "balık",
      "yumurta",
      "kuru fasulye",
      "mercimek",
      "nohut",
      "hindi",
      "sucuk",
    ],
  },
  {
    category: "Süt",
    items: ["süt", "yoğurt", "peynir", "tereyağı", "ayran", "krema", "labne"],
  },
  {
    category: "Tahıl",
    items: ["makarna", "pirinç", "bulgur", "ekmek", "un", "yulaf", "kuskus"],
  },
  {
    category: "Baharat",
    items: [
      "tuz",
      "karabiber",
      "pul biber",
      "kekik",
      "nane",
      "kimyon",
      "kırmızı biber",
    ],
  },
  {
    category: "Yağ & Sos",
    items: ["zeytinyağı", "salça", "sirke", "ketçap", "mayonez", "soya sosu"],
  },
];

const CATEGORY_INDEX: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const { category, items } of SEED_QUICK_CATALOG) {
    for (const it of items) m[it] = category;
  }
  for (const { category, keywords } of CATEGORY_RULES) {
    for (const k of keywords) if (!m[k]) m[k] = category;
  }
  return m;
})();

function categorize(name: string): string {
  const lower = name.toLocaleLowerCase("tr-TR");
  if (CATEGORY_INDEX[lower]) return CATEGORY_INDEX[lower];
  for (const { category, keywords } of CATEGORY_RULES) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return "Diğer";
}

function normalizeIngredient(raw: string): string {
  const UNITS =
    "(?:gram|kg|mg|gr|g|ml|lt|l|adet|tane|" +
    "su\\s*bardağı|çay\\s*bardağı|çay\\s*kaşığı|tatlı\\s*kaşığı|yemek\\s*kaşığı|" +
    "bardağı|bardak|kaşığı|kaşık|fincan|paket|kutu|şişe|kavanoz|kâse|kase|" +
    "diş|dilim|demet|dal|tutam|baş|avuç|yk|tk|çk|sb)";

  let s = raw
    .toLocaleLowerCase("tr-TR")
    .replace(/\([^)]*\)/g, " ")
    .replace(
      new RegExp(
        `(?:\\d+(?:[.,/]\\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])\\s*(?:${UNITS}(?![\\p{L}]))?`,
        "giu",
      ),
      " ",
    )
    .replace(new RegExp(`(?<![\\p{L}])${UNITS}(?![\\p{L}])`, "giu"), " ")
    .replace(
      /(?<![\p{L}])(?:taze|kuru|az|biraz|opsiyonel|tadında|tatında|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|yarım|çeyrek|tam yağlı|yağsız|ince|iri|büyük|küçük|orta|boy|doğranmış|rendelenmiş|kıyılmış|haşlanmış|kavrulmuş|kabuğu soyulmuş|file|toz|tane)(?![\p{L}])/giu,
      " ",
    )
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (s.length < 2) return "";
  if (
    /^(kaşığı|kaşık|bardağı|bardak|fincan|paket|kutu|şişe|kavanoz|diş|dilim|demet|dal|tutam|baş|avuç|adet|tane|gram|kg|gr|ml|lt|am)$/iu.test(
      s,
    )
  )
    return "";
  return s;
}

function canonicalKey(name: string): string {
  return name
    .replace(
      /(lar|ler|ları|leri|sı|si|su|sü|nın|nin|nun|nün|ın|in|un|ün)$/u,
      "",
    )
    .trim();
}

const JUNK_UNIT_RE =
  /^(am|ml|gr|kg|adet|tane|paket|kutu|dilim|demet|tutam|baş|diş)$/i;

// ---------------------------------------------------------------------------
// Fetch recipes and run them through the same pipeline.
// ---------------------------------------------------------------------------

type RecipeRow = {
  ingredients: { name: string; quantity?: string | null }[] | null;
};

async function fetchAll<T>(path: string, select: string): Promise<T[]> {
  const pageSize = 1000;
  let from = 0;
  const all: T[] = [];

  for (;;) {
    const to = from + pageSize - 1;
    const res = await fetch(`${url}${path}?select=${select}`, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key!}`,
        Range: `${from}-${to}`,
        "Range-Unit": "items",
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.error("✗ Supabase error:", res.status, await res.text());
      process.exit(1);
    }
    const data = (await res.json()) as T[];
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function main() {
  const recipes = await fetchAll<RecipeRow>("/rest/v1/recipes", "ingredients");

  type Bucket = { display: string; count: number };
  const agg = new Map<string, Bucket>();

  for (const r of recipes) {
    if (!r.ingredients) continue;
    for (const ing of r.ingredients) {
      if (!ing || typeof ing.name !== "string") continue;
      const n = normalizeIngredient(ing.name);
      if (!n || n.length < 2 || n.length > 28) continue;
      if (JUNK_UNIT_RE.test(n)) continue;

      const key = canonicalKey(n);
      const cur = agg.get(key);
      if (cur) {
        cur.count += 1;
        if (n.length < cur.display.length) cur.display = n;
      } else {
        agg.set(key, { display: n, count: 1 });
      }
    }
  }

  // Build the visible quick-pick list, seed first.
  const seenKey = new Set<string>();
  const visible: {
    category: string;
    name: string;
    count: number;
    source: "seed" | "tarif";
  }[] = [];

  for (const { category, items } of SEED_QUICK_CATALOG) {
    for (const it of items) {
      const k = canonicalKey(it);
      if (seenKey.has(k)) continue;
      seenKey.add(k);
      const fromRecipe = agg.get(k);
      visible.push({
        category,
        name: it,
        count: fromRecipe?.count ?? 0,
        source: "seed",
      });
    }
  }

  const dropped: { name: string; count: number }[] = [];

  const sorted = [...agg.values()].sort((a, b) => b.count - a.count);
  for (const { display, count } of sorted) {
    const k = canonicalKey(display);
    if (seenKey.has(k)) continue;
    const cat = categorize(display);
    if (cat === "Diğer") {
      dropped.push({ name: display, count });
      continue;
    }
    seenKey.add(k);
    visible.push({ category: cat, name: display, count, source: "tarif" });
  }

  // Sort visible: by category (seed order first), then by count desc.
  const catOrder = new Map<string, number>();
  SEED_QUICK_CATALOG.forEach((c, i) => catOrder.set(c.category, i));
  visible.sort((a, b) => {
    const ca = catOrder.get(a.category) ?? 99;
    const cb = catOrder.get(b.category) ?? 99;
    if (ca !== cb) return ca - cb;
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name, "tr-TR");
  });

  const visibleRows = visible.map((v, i) => ({
    "#": i + 1,
    Ürün: v.name,
    "Mevcut Kategori": v.category,
    Kaynak: v.source,
    "Tarifteki Kullanım": v.count,
    "Düzeltilmiş Kategori": "",
    Not: "",
  }));

  const droppedRows = dropped
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr-TR"))
    .map((d, i) => ({
      "#": i + 1,
      Ürün: d.name,
      "Tarifteki Kullanım": d.count,
      "Önerilen Kategori": "",
    }));

  const wb = XLSX.utils.book_new();

  const wsVisible = XLSX.utils.json_to_sheet(visibleRows);
  wsVisible["!cols"] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 18 },
    { wch: 10 },
    { wch: 18 },
    { wch: 22 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsVisible, "Hızlı Ekle");

  const wsDropped = XLSX.utils.json_to_sheet(droppedRows);
  wsDropped["!cols"] = [{ wch: 6 }, { wch: 32 }, { wch: 18 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsDropped, "Diğer (atılan)");

  const outPath = resolve(process.cwd(), "pantry-catalog.xlsx");
  XLSX.writeFile(wb, outPath);

  console.log(
    `✓ Hızlı Ekle: ${visibleRows.length} ürün, Diğer: ${droppedRows.length} ürün → ${outPath}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
