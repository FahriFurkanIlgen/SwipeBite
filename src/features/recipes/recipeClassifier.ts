import { MealPlan, Recipe } from "@/types/domain";

/**
 * High-level course classification for a recipe.
 * Used to filter swipe-session decks by meal plan and to compose dinner menus.
 */
export type Course =
  | "kahvalti"
  | "corba"
  | "ana"
  | "tatli"
  | "salata"
  | "meze"
  | "atistirmalik"
  | "sos"
  | "icecek";

const COURSE_KEYWORDS: { course: Course; keywords: string[] }[] = [
  {
    course: "kahvalti",
    keywords: [
      "kahvaltı",
      "kahvalti",
      "menemen",
      "omlet",
      "sahanda",
      "börek",
      "borek",
      "poğaça",
      "pogaca",
      "açma",
      "simit",
      "müsli",
      "musli",
      "granola",
      "krep",
      "pancake",
      "yulaf ezmesi",
      // Bakery & breakfast bread items
      "çörek",
      "corek",
      "katmer",
      "bagel",
      "baget",
      "gözleme",
      "gozleme",
      "ay çöreği",
      "hamburger ekmeği",
      // Tost / sandviç — in Türk evi mostly breakfast / hafif
      "tost",
      "sandviç",
      "sandvic",
      "sandwich",
      // Jams / spreads
      "reçel",
      "recel",
      "marmelat",
      "reli",
    ],
  },
  {
    course: "corba",
    keywords: [
      "çorba",
      "corba",
      "tarhana",
      "yayla",
      "ezogelin",
      "düğün çorbası",
      "işkembe",
      "iskembe",
    ],
  },
  {
    course: "tatli",
    keywords: [
      "tatlı",
      "tatli",
      "baklava",
      "sütlaç",
      "sutlac",
      "kazandibi",
      "revani",
      "şekerpare",
      "sekerpare",
      "kek",
      "pasta",
      "kurabiye",
      "tiramisu",
      "dondurma",
      "muhallebi",
      "lokma",
      "şerbet",
      "serbet",
      "helva",
      "irmik tatlısı",
      "aşure",
      "asure",
      "trileçe",
      "trilece",
      "profiterol",
      "brownie",
      "cheesecake",
      // Western & extended desserts
      "turta",
      "crumble",
      "sufle",
      "souffle",
      "mousse",
      "panna cotta",
      "tart",
      "tartolet",
      "galet",
      "galette",
      "çikolata sosu",
      "cikolata sosu",
      "şerbeti",
      "serbeti",
      "reli kek",
      "ağzı açık",
      "agzi acik",
    ],
  },
  {
    course: "salata",
    keywords: ["salata", "salad", "çoban salatası", "coban salatasi"],
  },
  {
    course: "meze",
    keywords: [
      "meze",
      "humus",
      "haydari",
      "babagannuş",
      "babagannus",
      "ezme",
      "fava",
      "piyaz",
      "zeytinyağlı",
      "zeytinyagli",
      "cacık",
      "cacik",
      "ajvar",
      "atom",
      "muhammara",
      "tarama",
      "dip sos",
      "dip-sos",
      "acuka",
    ],
  },
  {
    course: "atistirmalik",
    keywords: [
      "atıştırmalık",
      "atistirmalik",
      "snack",
      "cips",
      "kraker",
      "topları",
      "topu",
      "köfteleri",
      // Burgers & wraps — hafif / casual, not proper akşam yemeği
      "burger",
      "hamburger",
      "cheeseburger",
      "wrap",
      "dürüm",
      "durum",
    ],
  },
  {
    course: "sos",
    keywords: [
      // Standalone sauces / dressings / marinades — not main dishes.
      "sos",
      "sosu",
      "sos tarifi",
      "salça",
      "salca",
      "salçası",
      "salcasi",
      "mayonez",
      "ketçap",
      "ketcap",
      "hardal sosu",
      "tahin sosu",
      "yoğurt sosu",
      "yogurt sosu",
      "sarımsaklı sos",
      "sarimsakli sos",
      "bechamel",
      "beşamel",
      "besamel",
      "pesto",
      "alfredo",
      "barbekü",
      "barbeku",
      "bbq sos",
      "chimichurri",
      "hollandaise",
      "holland sos",
      "teşkilat sos",
      "ranch sos",
      "tartar sos",
      "çemen",
      "cemen",
      "marine",
      "marinasyon",
      "sirke sos",
      "vinegret",
      "vinaigrette",
      "dressing",
      "chutney",
      "sumak sos",
      "nar ekşili sos",
      "nar eksili sos",
      "çikolata sosu",
      "cikolata sosu",
      "karamel sosu",
      "karamel",
      "çileği sosu",
      "karamelize sos",
      "karam sos",
      "karamlı sos",
    ],
  },
  {
    course: "icecek",
    keywords: [
      "içecek",
      "icecek",
      "kahve",
      "smoothie",
      "limonata",
      "lemonata",
      "şalgam",
      "salgam",
      "ayran",
      "frappe",
      "frappuccino",
      "latte",
      "milkshake",
      "shake",
      "kokteyl",
      "cocktail",
      "kompostosu",
      "kompostu",
      "şerbeti",
      "serbeti",
      "şurubu",
      "surubu",
      "çayı",
      "cayi",
      "sıcak çikolata",
      "sicak cikolata",
      "soğuk kahve",
      "soguk kahve",
      "ice coffee",
      "iced coffee",
      "mocha",
      "cappuccino",
      "espresso",
      "matcha",
      "boza",
      "sahlep",
      "salep",
      "salebi",
      "sangria",
      "punç",
      "punc",
      "punch",
      "çay",
      "cay",
      "buzlu çay",
      "buzlu cay",
      "bitki çayı",
      "bitki cayi",
      "yeşil çay",
      "yesil cay",
      "badem sütü",
      "badem sutu",
      "soya sütü",
      "soya sutu",
      "yulaf sütü",
      "yulaf sutu",
      "hindistan cevizi sütü",
      "fındık sütü",
      "findik sutu",
    ],
  },
];

function normalize(s: string): string {
  return s.toLocaleLowerCase("tr-TR");
}

/**
 * Detect "standalone sauce" recipes: titles like "Tahin Sosu",
 * "Domates Salçası", "Pesto" (single word), or "BBQ Sos".
 * Skipped when the title clearly describes a dish using the sauce
 * (e.g. "Domates Soslu Makarna").
 */
function isStandaloneSauce(recipe: Recipe): boolean {
  const title = normalize(recipe.title)
    .trim()
    .replace(/\s*tarifi\s*$/, "");
  if (!title) return false;
  // "X soslu Y", "X salçalı Y" etc. — sauce is just a modifier.
  if (/\b(soslu|salçalı|salcali|mayonezli|ketçaplı|ketcapli)\b/.test(title)) {
    return false;
  }
  // Title ends with a sauce noun.
  if (
    /(^|\s)(sos|sosu|sosları|salça|salca|salçası|salcasi|mayonez|ketçap|ketcap|pesto|chimichurri|bechamel|beşamel|besamel|hollandaise|chutney|dressing|vinaigrette|vinegret|marine|marinasyon|çemen|cemen)$/.test(
      title,
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Detect "standalone drink" recipes whose titles end with a beverage word
 * (suyu, suları, soda, sodası, kokteyli, shot, detoks, sıkması, püresi-içeceği).
 * Won't match dishes that USE a juice (e.g. "Portakal Suyu Soslu Tavuk"),
 * because such titles continue past the drink noun.
 */
function isStandaloneDrink(recipe: Recipe): boolean {
  const title = normalize(recipe.title)
    .trim()
    .replace(/\s*tarifi\s*$/, "");
  if (!title) return false;
  // Plain "X suyu" / "X soda" / "X kokteyli" at end of title.
  if (
    /(^|\s)(suyu|suları|sulari|soda|sodası|sodasi|kokteyli|kokteyl|shot|shotu|detoks|detox|sıkması|sikmasi|tonik|tonic|spritz|mojito|margarita|sangria)$/.test(
      title,
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Best-effort course classifier. Falls back to "ana" when nothing matches.
 * Order of COURSE_KEYWORDS matters — kahvaltı checked before çorba, etc.
 */
export function classifyCourse(recipe: Recipe): Course {
  if (isStandaloneSauce(recipe)) return "sos";
  if (isStandaloneDrink(recipe)) return "icecek";
  const haystack = [
    normalize(recipe.title),
    ...recipe.tags.map(normalize),
  ].join(" | ");
  for (const { course, keywords } of COURSE_KEYWORDS) {
    if (course === "sos") continue; // handled separately above
    if (keywords.some((k) => haystack.includes(normalize(k)))) return course;
  }
  return "ana";
}

export const COURSE_LABEL: Record<Course, string> = {
  kahvalti: "Kahvaltı",
  corba: "Çorba",
  ana: "Ana Yemek",
  tatli: "Tatlı",
  salata: "Salata",
  meze: "Meze",
  atistirmalik: "Atıştırmalık",
  sos: "Sos",
  icecek: "İçecek",
};

export const MEAL_PLAN_LABEL: Record<MealPlan, string> = {
  kahvalti: "Kahvaltı",
  ogle: "Öğle Yemeği",
  aksam: "Akşam Yemeği",
  tatli: "Tatlı",
  atistirma: "Atıştırmalık",
  icecek: "İçecek",
};

export const MEAL_PLAN_SUB: Record<MealPlan, string> = {
  kahvalti: "Sabah için uygun seçenekler",
  ogle: "Ana + salata kombinasyonu",
  aksam: "Çorba + meze + ana yemek + tatlı",
  tatli: "Sadece tatlı seçenekleri",
  atistirma: "Hafif & pratik atıştırmalıklar",
  icecek: "Kahve, smoothie, çay & soğuk içecekler",
};

export const MEAL_PLAN_EMOJI: Record<MealPlan, string> = {
  kahvalti: "🍳",
  ogle: "🥗",
  aksam: "🍽",
  tatli: "🍰",
  atistirma: "🥨",
  icecek: "🥤",
};

/**
 * Course allocation per meal plan. Total count == swipe deck size.
 * Order in the array is the order cards will be shown in the deck.
 */
export const MEAL_PLAN_COMPOSITION: Record<
  MealPlan,
  { course: Course; count: number }[]
> = {
  kahvalti: [{ course: "kahvalti", count: 16 }],
  ogle: [
    { course: "ana", count: 12 },
    { course: "salata", count: 4 },
  ],
  aksam: [
    { course: "corba", count: 6 },
    { course: "meze", count: 4 },
    { course: "ana", count: 10 },
    { course: "tatli", count: 4 },
  ],
  tatli: [{ course: "tatli", count: 16 }],
  atistirma: [
    { course: "atistirmalik", count: 8 },
    { course: "meze", count: 8 },
  ],
  icecek: [{ course: "icecek", count: 16 }],
};

/**
 * Default plan based on local hour.
 * 05–11 → kahvaltı, 11–15 → öğle, 15–17 → atıştırma, else → akşam.
 */
export function recommendMealPlanForNow(now: Date = new Date()): MealPlan {
  const h = now.getHours();
  if (h >= 5 && h < 11) return "kahvalti";
  if (h >= 11 && h < 15) return "ogle";
  if (h >= 15 && h < 17) return "atistirma";
  return "aksam";
}

/**
 * Build the swipe deck for a meal plan from the recipe pool.
 * Respects the course composition; fills shortfalls with "ana" fallbacks.
 *
 * @param includeCourses Optional whitelist — only these courses are dealt.
 *   Defaults to all courses in the plan's composition.
 */
export function buildDeckForMealPlan(
  plan: MealPlan,
  pool: Recipe[],
  includeCourses?: Course[],
): Recipe[] {
  const composition = MEAL_PLAN_COMPOSITION[plan].filter(
    (slot) => !includeCourses || includeCourses.includes(slot.course),
  );
  const grouped = new Map<Course, Recipe[]>();
  for (const r of pool) {
    const c = classifyCourse(r);
    if (!grouped.has(c)) grouped.set(c, []);
    grouped.get(c)!.push(r);
  }
  for (const arr of grouped.values()) {
    arr.sort(() => Math.random() - 0.5);
  }
  const used = new Set<string>();
  const deck: Recipe[] = [];
  // Courses we are willing to use as a fallback when a slot can't be filled.
  // Never silently inject breakfast/dessert/drinks into a dinner deck.
  const fallbackCourses: Course[] = ["ana"];
  const allowFallback = (course: Course) =>
    fallbackCourses.includes(course) &&
    (!includeCourses || includeCourses.includes(course));
  for (const slot of composition) {
    const list = grouped.get(slot.course) ?? [];
    let added = 0;
    for (const r of list) {
      if (added >= slot.count) break;
      if (used.has(r.id)) continue;
      deck.push(r);
      used.add(r.id);
      added++;
    }
    // Shortfall: only fill from "ana" (generic main-course) recipes, and only
    // if "ana" is part of the selected courses. Skip otherwise — better a
    // smaller deck than a wrong-meal-plan suggestion.
    if (added < slot.count && slot.course !== "ana") {
      for (const r of pool) {
        if (added >= slot.count) break;
        if (used.has(r.id)) continue;
        if (!allowFallback(classifyCourse(r))) continue;
        deck.push(r);
        used.add(r.id);
        added++;
      }
    }
  }
  return deck;
}
