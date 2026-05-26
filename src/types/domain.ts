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

export interface SwipeSession {
  id: UUID;
  householdId: UUID;
  createdBy: UUID;
  sessionType: SessionType;
  status: SessionStatus;
  participantIds: UUID[];
  recipeIds: UUID[];
  createdAt: string;
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
