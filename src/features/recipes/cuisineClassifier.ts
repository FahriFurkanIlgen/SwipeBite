import type { Recipe } from "@/types/domain";

/**
 * Heuristic cuisine inference. Recipes from yemek.com all arrive labelled
 * "Türk", which is wrong for ~5-10% of the catalogue (pizza, sushi,
 * cheesecake, …). This module re-labels them based on title + tag keywords.
 *
 * Rules:
 *   1. Strong Turkish dish names (lahmacun, mantı, döner, …) always win — they
 *      protect against false positives like "ev usulü pizza" hijacking when a
 *      Turkish dish merely mentions an Italian word.
 *   2. Otherwise, the first matching cuisine rule wins. Order matters; more
 *      specific cuisines (Japon, Kore, Vietnam) come before broad ones.
 *   3. If nothing matches, the original `recipe.cuisine` is preserved so
 *      manually curated entries (e.g. "İsveç", "Dünya") survive untouched.
 */

type CuisineRule = { cuisine: string; keywords: string[] };

const TURKISH_GUARDS = [
  "lahmacun",
  "pide",
  "köfte",
  "kofte",
  "menemen",
  "mantı",
  "manti",
  "iskender",
  "çiğ köfte",
  "cig kofte",
  "kuru fasulye",
  "tarhana",
  "yayla çorbası",
  "ezogelin",
  "şiş kebap",
  "sis kebap",
  "döner",
  "doner",
  "pilav",
  "zeytinyağlı",
  "zeytinyagli",
  "imam bayıldı",
  "imam bayildi",
  "kuzu tandır",
  "etli ekmek",
  "midye dolma",
  "mücver",
  "mucver",
  "su böreği",
  "su boregi",
  "yaprak sarma",
  "asure",
  "aşure",
  "kazandibi",
  "sütlaç",
  "sutlac",
  "baklava",
  "şekerpare",
  "sekerpare",
  "revani",
  "lokma",
  "kadayıf",
  "kadayif",
  "tulumba",
  "tavuk göğsü tatlısı",
  "ayran",
  "şalgam",
  "salgam",
  "boza",
  "salep",
  "sahlep",
  "menengiç",
  "tarhana çorbası",
  "ezme",
  "haydari",
  "cacık",
  "cacik",
  "muhammara",
  "babagannuş",
  "babagannus",
  "piyaz",
  "fava",
  "humus", // also Levantine; covered by Orta Doğu otherwise — keep as Türk by default
  "ali nazik",
  "hünkar beğendi",
  "hunkar begendi",
  "karnıyarık",
  "karniyarik",
  "patlıcan musakka",
  "musakka",
];

const RULES: CuisineRule[] = [
  {
    cuisine: "Japon",
    keywords: [
      "sushi",
      "ramen",
      "teriyaki",
      "tempura",
      "miso",
      "udon",
      "donburi",
      "yakitori",
      "mochi",
      "onigiri",
      "tonkatsu",
      "katsu",
      "wasabi",
      "edamame",
      "dashi",
      "sashimi",
      "okonomiyaki",
      "gyoza",
      "japon",
    ],
  },
  {
    cuisine: "Kore",
    keywords: [
      "kimchi",
      "bibimbap",
      "bulgogi",
      "gochujang",
      "tteokbokki",
      "japchae",
      "korean fried",
      "kore tavu",
      "kore eri",
    ],
  },
  {
    cuisine: "Tay",
    keywords: [
      "pad thai",
      "tom yum",
      "tom kha",
      "satay",
      "tay yemeği",
      "tay yemegi",
      "green curry",
      "yeşil köri",
      "yesil kori",
      "red curry",
      "kırmızı köri",
      "kirmizi kori",
      "thai ",
    ],
  },
  {
    cuisine: "Vietnam",
    keywords: ["pho ", "banh mi", "vietnam", "spring roll", "rice paper"],
  },
  {
    cuisine: "Çin",
    keywords: [
      "chow mein",
      "lo mein",
      "kung pao",
      "wonton",
      "dim sum",
      "ekşi tatlı",
      "eksi tatli",
      "szechuan",
      "sezuan",
      "general tso",
      "mapo tofu",
      "chop suey",
      "bao bun",
      "peking",
      "çin yemeği",
      "cin yemegi",
    ],
  },
  {
    cuisine: "Hint",
    keywords: [
      "curry",
      "köri",
      "kori",
      "biryani",
      "masala",
      "tandoor",
      "tandoori",
      "naan",
      "samosa",
      "pakora",
      "tikka",
      "vindaloo",
      "garam",
      "raita",
      "korma",
      "paneer",
      "dosa",
      "saag",
      "hint yemeği",
      "hint yemegi",
    ],
  },
  {
    cuisine: "İtalyan",
    keywords: [
      "pizza",
      "lazanya",
      "lasagna",
      "spaghetti",
      "spagetti",
      "carbonara",
      "bolognese",
      "bolonez",
      "alfredo",
      "pesto",
      "fettuccine",
      "penne",
      "ravioli",
      "tortellini",
      "gnocchi",
      "risotto",
      "rizotto",
      "tiramisu",
      "panna cotta",
      "bruschetta",
      "focaccia",
      "calzone",
      "parmigiana",
      "ciabatta",
      "cannoli",
      "arancini",
      "minestrone",
      "antipasti",
      "linguine",
      "cacio e pepe",
      "burrata",
      "prosciutto",
      "caprese",
      "italyan",
      "italian",
      "makarna",
    ],
  },
  {
    cuisine: "Meksika",
    keywords: [
      "taco",
      "burrito",
      "fajita",
      "quesadilla",
      "nachos",
      "enchilada",
      "guacamole",
      "tortilla chip",
      "chimichanga",
      "tostada",
      "carnitas",
      "pico de gallo",
      "elote",
      "meksika",
      "mexican",
    ],
  },
  {
    cuisine: "Yunan",
    keywords: [
      "moussaka değil",
      "gyros",
      "tzatziki",
      "feta peyniri",
      "spanakopita",
      "souvlaki",
      "yunan",
      "greek salad",
    ],
  },
  {
    cuisine: "Fransız",
    keywords: [
      "ratatouille",
      "quiche",
      "croissant",
      "kruvasan",
      "soufflé",
      "sufle",
      "souffle",
      "creme brulee",
      "crème brûlée",
      "krem brulee",
      "macaron",
      "makaron",
      "baguette",
      "eclair",
      "ekler",
      "mille-feuille",
      "mille feuille",
      "fransız",
      "fransiz",
      "vichyssoise",
      "bouillabaisse",
      "coq au vin",
      "cassoulet",
      "beef bourguignon",
      "tarte tatin",
      "madeleine",
      "galette",
    ],
  },
  {
    cuisine: "İspanyol",
    keywords: [
      "paella",
      "tapas",
      "sangria",
      "gazpacho",
      "tortilla espanola",
      "patatas bravas",
      "churros",
      "ispanyol",
      "spanish",
    ],
  },
  {
    cuisine: "Amerikan",
    keywords: [
      "burger",
      "hamburger",
      "cheeseburger",
      "hot dog",
      "hotdog",
      "pancake",
      "waffle",
      "donut",
      "donat",
      "brownie",
      "cheesecake",
      "mac and cheese",
      "bbq",
      "barbekü",
      "barbeku",
      "philly",
      "club sandwich",
      "buffalo wing",
      "banoffee",
      "cobbler",
      "s'mores",
      "muffin",
      "fried chicken",
      "amerikan",
      "american",
    ],
  },
  {
    cuisine: "İngiliz",
    keywords: [
      "fish and chips",
      "scones",
      "scone",
      "shepherd's pie",
      "shepherd pie",
      "yorkshire pudding",
      "trifle",
      "victoria sponge",
      "ingiliz",
      "english breakfast",
      "british",
    ],
  },
  {
    cuisine: "Alman",
    keywords: [
      "bratwurst",
      "schnitzel",
      "şnitzel",
      "snitzel",
      "pretzel",
      "sauerkraut",
      "strudel",
      "alman",
      "german",
    ],
  },
  {
    cuisine: "Orta Doğu",
    keywords: [
      "falafel",
      "shawarma",
      "şavarma",
      "savarma",
      "tabbouleh",
      "tabule",
      "fattoush",
      "ful medames",
      "mansaf",
      "lübnan",
      "lubnan",
      "lebanese",
    ],
  },
  {
    cuisine: "Rus",
    keywords: [
      "borsch",
      "borç çorbası",
      "stroganoff",
      "blini",
      "rus salata",
      "rus salatası",
    ],
  },
];

function normalize(s: string): string {
  return s.toLocaleLowerCase("tr-TR");
}

/**
 * Returns the inferred cuisine label for a recipe. Falls back to the
 * recipe's existing `cuisine` value if no rule matches.
 */
export function inferCuisine(recipe: Recipe): string {
  const haystack = [
    normalize(recipe.title),
    ...recipe.tags.map(normalize),
  ].join(" | ");

  // Strong Turkish dish guards run first.
  for (const k of TURKISH_GUARDS) {
    if (haystack.includes(k)) return "Türk";
  }

  for (const rule of RULES) {
    if (rule.keywords.some((k) => haystack.includes(k))) return rule.cuisine;
  }

  // Preserve manually curated cuisines ("İsveç", "Dünya", …).
  return recipe.cuisine || "Türk";
}

/**
 * Maps onboarding cuisine choices (broad buckets shown to the user) to the
 * concrete cuisine labels produced by `inferCuisine`. Buckets are inclusive:
 * picking "Akdeniz" surfaces İtalyan + Yunan + İspanyol + Fransız + Türk.
 */
export const CUISINE_GROUPS: Record<string, string[]> = {
  Türk: ["Türk"],
  İtalyan: ["İtalyan"],
  Akdeniz: ["İtalyan", "Yunan", "İspanyol", "Fransız", "Türk"],
  Asya: ["Japon", "Kore", "Çin", "Tay", "Vietnam"],
  Meksika: ["Meksika"],
  Hint: ["Hint"],
  "Orta Doğu": ["Orta Doğu"],
  Fransız: ["Fransız"],
};

/**
 * Expand a list of onboarding cuisine selections into the full set of
 * concrete cuisine labels that should be surfaced. Unknown selections fall
 * through verbatim so future additions still work.
 */
export function expandCuisineSelection(selected: string[]): Set<string> {
  const out = new Set<string>();
  for (const s of selected) {
    const expanded = CUISINE_GROUPS[s] ?? [s];
    for (const c of expanded) out.add(c);
  }
  return out;
}

/**
 * Filter a recipe pool by the user's onboarding cuisine preferences.
 * - Empty / nullish selection → no filtering (returns input unchanged).
 * - If the filter would empty the pool, the original pool is returned so
 *   the swipe deck never ends up blank because of an over-narrow selection.
 */
export function filterByFavoriteCuisines(
  pool: Recipe[],
  favoriteCuisines: string[] | null | undefined,
): Recipe[] {
  if (!favoriteCuisines || favoriteCuisines.length === 0) return pool;
  const allowed = expandCuisineSelection(favoriteCuisines);
  if (allowed.size === 0) return pool;
  const filtered = pool.filter((r) => allowed.has(inferCuisine(r)));
  return filtered.length > 0 ? filtered : pool;
}
