// Shared domain types for SwipeBite

export type UUID = string;

export type SpiceLevel = "none" | "mild" | "medium" | "hot";

export interface User {
  id: UUID;
  name: string;
  email?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Profile {
  userId: UUID;
  allergies: string[];
  hardDislikes: string[];
  favoriteCuisines: string[];
  spiceTolerance: SpiceLevel;
}

export interface Household {
  id: UUID;
  name: string;
  createdBy: UUID;
  memberIds: UUID[];
  createdAt: string;
}

export type Difficulty = "kolay" | "orta" | "zor";

export interface RecipeIngredient {
  name: string;
  quantity?: string;
}

export interface Recipe {
  id: UUID;
  title: string;
  description: string;
  imageUrl: string;
  prepTimeMinutes: number;
  difficulty: Difficulty;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[]; // e.g. "çorba", "vejetaryen", "kahvaltı"
  cuisine: string; // e.g. "Türk"
  /** Original recipe page URL (e.g. yemek.com/tarif/...). For attribution / “open in browser”. */
  sourceUrl?: string;
  /** Direct video URL (mp4 / embed). When present the recipe screen shows a Watch CTA. */
  videoUrl?: string;
}

export type VoteType = "like" | "dislike" | "superlike" | "superdislike";

export interface Vote {
  id: UUID;
  sessionId: UUID;
  userId: UUID;
  recipeId: UUID;
  voteType: VoteType;
  createdAt: string;
}

export type SessionType = "dinner" | "lunch" | "breakfast" | "snack";
export type SessionStatus = "active" | "completed" | "cancelled";

/**
 * High-level meal context for a swipe session.
 * Drives which recipes are dealt and whether companions (çorba + tatlı) are picked.
 */
export type MealPlan =
  | "kahvalti"
  | "ogle"
  | "aksam"
  | "tatli"
  | "atistirma"
  | "icecek";

export interface SwipeSession {
  id: UUID;
  householdId: UUID;
  createdBy: UUID;
  sessionType: SessionType;
  status: SessionStatus;
  participantIds: UUID[];
  recipeIds: UUID[];
  createdAt: string;
  mealPlan?: MealPlan;
  /** Course whitelist used when (re)building the deck. Not persisted server-side. */
  includeCourses?: string[];
}

export interface MatchResult {
  id: UUID;
  sessionId: UUID;
  recipeId: UUID;
  score: number;
  reasons: string[];
  likedByUserIds: UUID[];
  alternatives: { recipeId: UUID; label: string }[];
  missingIngredients: string[];
  createdAt: string;
  /**
   * Extra picks for multi-course menus (çorba + ana + tatlı).
   * Populated for the "aksam" meal plan.
   */
  courseCompanions?: { course: string; label: string; recipeId: UUID }[];
}

export interface PantryItem {
  id: UUID;
  householdId: UUID;
  name: string;
  quantity?: string;
  category?: string;
  createdAt: string;
  expiresAt?: string;
}

export type WeeklyMode = "busy" | "healthy" | "budget" | "comfort" | "kids";

export interface WeeklyDayPlan {
  date: string; // ISO
  dayIndex: number; // 0..6
  meals: { type: "lunch" | "dinner"; recipeId: UUID }[];
}

export interface WeeklyPlan {
  id: UUID;
  householdId: UUID;
  mode: WeeklyMode;
  weekStart: string;
  days: WeeklyDayPlan[];
  groceryList: string[];
  createdAt: string;
}

export interface AIRecommendation {
  recipe: Recipe;
  score: number;
  explanation: string;
  pantryMatchPercent: number;
  householdCompatibilityPercent: number;
}

// --- Detailed weekly-plan preferences (saved per household) ---
export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type Season = "ilkbahar" | "yaz" | "sonbahar" | "kis" | "yil_boyu";
export type ShoppingChannel = "market" | "online" | "ikisi";
export type Lang = "tr" | "en";

export interface ChildInfo {
  age: number;
  picky: boolean;
}

export interface FixedDayProtein {
  day: WeekDay;
  protein: string; // e.g. "balık", "tavuk"
}

export interface ForbiddenPair {
  main: string;
  side: string;
  reason?: string;
}

export interface DayCarryover {
  from: string; // e.g. "tavuk"
  to: string; // e.g. "tavuklu çorba"
}

export interface HouseholdPreferences {
  // 1) Aile
  family: {
    adults: number;
    children: ChildInfo[];
    guestsFrequency: "asla" | "nadiren" | "sik";
  };
  // 2) Alerji (KRİTİK)
  allergies: {
    allergies: string[]; // tıbbi alerjiler
    dietaryRules: string[]; // vejetaryen, vegan, helal, glutensiz vs.
    neverEat: string[]; // tercih bazında asla yenmeyenler
  };
  // 3) Kapsam
  scope: {
    days: WeekDay[]; // hangi günler planlansın
    mealsPerDay: number; // 1..3
    includeWeekend: boolean;
    weekendDifferent: boolean;
  };
  // 4) Zaman
  time: {
    maxCookMinutes: number;
    quickDays: WeekDay[];
    longDays: WeekDay[];
    mealPrep: boolean;
  };
  // 5) Protein
  protein: {
    redMeatPerWeek: number;
    fishPerWeek: number;
    fishTypes: string[];
    poultryPerWeek: number;
    legumesPerWeek: number;
    fixedDays: FixedDayProtein[];
  };
  // 6) Sevilen / Sevilmeyen
  tastes: {
    lovedDishes: string[]; // 10-15 yemek
    dislikedDishes: string[];
    newRecipesPerWeek: number;
  };
  // 7) Eşleştirme
  pairing: {
    sides: string[]; // genel yan yemekler
    forbiddenPairs: ForbiddenPair[]; // ör. balık + cacık ❌
    dayCarryover: DayCarryover[]; // ör. tavuk → tavuklu çorba
    sidesOnly: string[]; // sadece yan sayılanlar
  };
  // 8) Mevsim
  season: {
    yearRound: boolean;
    currentSeason: Season;
  };
  // 9) Alışveriş
  shopping: {
    day: WeekDay;
    channel: ShoppingChannel;
    groupByCategory: boolean;
    stocked: string[]; // dolapta sürekli var sayılanlar
  };
  // 10) Dil
  language: Lang;
}

export const DEFAULT_PREFERENCES: HouseholdPreferences = {
  family: { adults: 2, children: [], guestsFrequency: "nadiren" },
  allergies: { allergies: [], dietaryRules: [], neverEat: [] },
  scope: {
    days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    mealsPerDay: 1,
    includeWeekend: true,
    weekendDifferent: false,
  },
  time: { maxCookMinutes: 45, quickDays: [], longDays: [], mealPrep: false },
  protein: {
    redMeatPerWeek: 1,
    fishPerWeek: 1,
    fishTypes: [],
    poultryPerWeek: 2,
    legumesPerWeek: 2,
    fixedDays: [],
  },
  tastes: { lovedDishes: [], dislikedDishes: [], newRecipesPerWeek: 1 },
  pairing: {
    sides: [],
    forbiddenPairs: [],
    dayCarryover: [],
    sidesOnly: [],
  },
  season: { yearRound: true, currentSeason: "yil_boyu" },
  shopping: {
    day: "sat",
    channel: "market",
    groupByCategory: true,
    stocked: [],
  },
  language: "tr",
};
