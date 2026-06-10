import type { BarIngredient, BarIngredientCategory } from "@/types/bar";

/**
 * Hand-curated master list of bar ingredients used by the cabinet picker.
 *
 * Keep this list small and focused on what's needed by the seed cocktails
 * in `famousCocktails.ts`. New ingredients can be appended freely; just
 * make sure each `id` is unique and stable (it gets persisted into the
 * user's selected cabinet).
 */
export const BAR_INGREDIENTS: BarIngredient[] = [
  // --- Distile / sert içkiler ---
  {
    id: "spirit-vodka",
    name: "Vodka",
    altName: "Vodka",
    category: "distile",
    emoji: "🍶",
    essential: true,
  },
  {
    id: "spirit-gin",
    name: "Cin",
    altName: "Gin",
    category: "distile",
    emoji: "🌿",
    essential: true,
  },
  {
    id: "spirit-rum-white",
    name: "Beyaz Rom",
    altName: "White Rum",
    category: "distile",
    emoji: "🥥",
    essential: true,
  },
  {
    id: "spirit-rum-dark",
    name: "Koyu Rom",
    altName: "Dark Rum",
    category: "distile",
    emoji: "🌴",
    essential: true,
  },
  {
    id: "spirit-tequila",
    name: "Tekila",
    altName: "Tequila Blanco",
    category: "distile",
    emoji: "🌵",
    essential: true,
  },
  {
    id: "spirit-bourbon",
    name: "Bourbon",
    altName: "Bourbon Whiskey",
    category: "distile",
    emoji: "🥃",
    essential: true,
  },
  {
    id: "spirit-rye",
    name: "Rye Viski",
    altName: "Rye Whiskey",
    category: "distile",
    emoji: "🌾",
    essential: true,
  },
  {
    id: "spirit-scotch",
    name: "Scotch",
    altName: "Blended Scotch",
    category: "distile",
    emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    essential: true,
  },
  {
    id: "spirit-cognac",
    name: "Konyak",
    altName: "Cognac",
    category: "distile",
    emoji: "🍷",
    essential: true,
  },

  // --- Likörler / aperitifler / vermut ---
  {
    id: "liqueur-campari",
    name: "Campari",
    altName: "Campari",
    category: "liqueur",
    emoji: "❤️",
    essential: true,
  },
  {
    id: "liqueur-aperol",
    name: "Aperol",
    altName: "Aperol",
    category: "liqueur",
    emoji: "🧡",
    essential: true,
  },
  {
    id: "liqueur-vermouth-sweet",
    name: "Tatlı Vermut",
    altName: "Sweet Vermouth",
    category: "liqueur",
    emoji: "🍷",
    essential: true,
  },
  {
    id: "liqueur-vermouth-dry",
    name: "Sek Vermut",
    altName: "Dry Vermouth",
    category: "liqueur",
    emoji: "🥂",
    essential: true,
  },
  {
    id: "liqueur-triple-sec",
    name: "Triple Sec",
    altName: "Triple Sec / Cointreau",
    category: "liqueur",
    emoji: "🍊",
    essential: true,
  },
  {
    id: "liqueur-coffee",
    name: "Kahve Likörü",
    altName: "Coffee Liqueur",
    category: "liqueur",
    emoji: "☕",
    essential: true,
  },
  {
    id: "liqueur-elderflower",
    name: "Mürver Likörü",
    altName: "St-Germain",
    category: "liqueur",
    emoji: "🌸",
  },
  {
    id: "liqueur-amaretto",
    name: "Amaretto",
    altName: "Amaretto",
    category: "liqueur",
    emoji: "🌰",
  },
  {
    id: "liqueur-coconut",
    name: "Hindistan Cevizi Likörü",
    altName: "Coconut Liqueur (Malibu)",
    category: "liqueur",
    emoji: "🥥",
  },
  {
    id: "liqueur-melon",
    name: "Kavun Likörü",
    altName: "Melon Liqueur (Midori)",
    category: "liqueur",
    emoji: "🍈",
  },
  {
    id: "liqueur-peach",
    name: "Şeftali Likörü",
    altName: "Peach Schnapps",
    category: "liqueur",
    emoji: "🍑",
  },
  {
    id: "liqueur-baileys",
    name: "Irish Cream",
    altName: "Baileys",
    category: "liqueur",
    emoji: "🥃",
  },
  {
    id: "liqueur-creme-de-cacao",
    name: "Crème de Cacao",
    altName: "Crème de Cacao",
    category: "liqueur",
    emoji: "🍫",
  },
  // --- Şarap & köpüklü ---
  {
    id: "wine-prosecco",
    name: "Prosecco",
    altName: "Prosecco",
    category: "wine",
    emoji: "🥂",
    essential: true,
  },
  {
    id: "wine-champagne",
    name: "Şampanya",
    altName: "Champagne",
    category: "wine",
    emoji: "🍾",
  },

  // --- Mikserler ---
  {
    id: "mixer-soda",
    name: "Soda",
    altName: "Soda Water",
    category: "mixer",
    emoji: "🫧",
  },
  {
    id: "mixer-tonic",
    name: "Tonik",
    altName: "Tonic Water",
    category: "mixer",
    emoji: "💧",
  },
  {
    id: "mixer-ginger-beer",
    name: "Zencefil Birası",
    altName: "Ginger Beer",
    category: "mixer",
    emoji: "🫚",
  },
  {
    id: "mixer-cola",
    name: "Kola",
    altName: "Cola",
    category: "mixer",
    emoji: "🥤",
  },
  {
    id: "mixer-espresso",
    name: "Espresso",
    altName: "Fresh Espresso",
    category: "mixer",
    emoji: "☕",
    essential: true,
  },
  {
    id: "mixer-cranberry",
    name: "Yaban Mersini Suyu",
    altName: "Cranberry Juice",
    category: "mixer",
    emoji: "🫐",
  },
  {
    id: "mixer-pineapple",
    name: "Ananas Suyu",
    altName: "Pineapple Juice",
    category: "mixer",
    emoji: "🍍",
  },
  {
    id: "mixer-orange-juice",
    name: "Portakal Suyu",
    altName: "Orange Juice",
    category: "mixer",
    emoji: "🧃",
  },
  {
    id: "mixer-lemon-lime-soda",
    name: "Limonlu Gazoz",
    altName: "Lemon-Lime Soda (7-Up / Sprite)",
    category: "mixer",
    emoji: "🍋",
  },

  // --- Sitrüs ---
  {
    id: "citrus-lemon",
    name: "Limon",
    altName: "Lemon",
    category: "citrus",
    emoji: "🍋",
    essential: true,
  },
  {
    id: "citrus-lime",
    name: "Misket Limonu",
    altName: "Lime",
    category: "citrus",
    emoji: "🟢",
    essential: true,
  },
  {
    id: "citrus-orange",
    name: "Portakal",
    altName: "Orange",
    category: "citrus",
    emoji: "🍊",
  },
  {
    id: "citrus-grapefruit",
    name: "Greyfurt",
    altName: "Grapefruit",
    category: "citrus",
    emoji: "🍑",
  },

  // --- Tatlandırıcılar ---
  {
    id: "sweet-simple-syrup",
    name: "Basit Şurup",
    altName: "Simple Syrup",
    category: "sweetener",
    emoji: "🍯",
    essential: true,
  },
  {
    id: "sweet-agave",
    name: "Agav Şurubu",
    altName: "Agave Syrup",
    category: "sweetener",
    emoji: "🌿",
  },
  {
    id: "sweet-honey",
    name: "Bal",
    altName: "Honey",
    category: "sweetener",
    emoji: "🍯",
  },
  {
    id: "sweet-grenadine",
    name: "Nar Şurubu",
    altName: "Grenadine",
    category: "sweetener",
    emoji: "🔴",
  },

  // --- Bitter ---
  {
    id: "bitter-angostura",
    name: "Angostura",
    altName: "Angostura Bitters",
    category: "bitter",
    emoji: "🌶️",
  },
  {
    id: "bitter-orange",
    name: "Portakal Bitter",
    altName: "Orange Bitters",
    category: "bitter",
    emoji: "🍊",
  },

  // --- Garnitürler / süslemeler ---
  {
    id: "garnish-mint",
    name: "Nane",
    altName: "Mint",
    category: "garnish",
    emoji: "🌿",
  },
  {
    id: "garnish-olive",
    name: "Zeytin",
    altName: "Green Olive",
    category: "garnish",
    emoji: "🫒",
  },
  {
    id: "garnish-cherry",
    name: "Kokteyl Vişnesi",
    altName: "Maraschino Cherry",
    category: "garnish",
    emoji: "🍒",
  },
  {
    id: "garnish-salt",
    name: "Tuz",
    altName: "Salt",
    category: "garnish",
    emoji: "🧂",
  },
  {
    id: "garnish-sugar",
    name: "Şeker",
    altName: "Sugar",
    category: "garnish",
    emoji: "⬜",
  },
];

export const BAR_INGREDIENT_INDEX: Record<string, BarIngredient> =
  Object.fromEntries(BAR_INGREDIENTS.map((i) => [i.id, i]));

export const BAR_CATEGORY_LABEL: Record<BarIngredientCategory, string> = {
  distile: "Sert İçkiler",
  liqueur: "Likörler & Vermut",
  wine: "Şarap & Köpüklü",
  mixer: "Mikserler",
  citrus: "Sitrüs",
  sweetener: "Tatlandırıcılar",
  bitter: "Bitter",
  garnish: "Süslemeler",
};

export const BAR_CATEGORY_ORDER: BarIngredientCategory[] = [
  "distile",
  "liqueur",
  "wine",
  "mixer",
  "citrus",
  "sweetener",
  "bitter",
  "garnish",
];
