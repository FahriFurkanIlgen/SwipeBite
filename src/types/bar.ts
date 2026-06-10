/**
 * Domain types for the Bar (cocktail) feature.
 *
 * Designed to be ingestion-friendly so that future Instagram-scraped
 * bartender content can be merged with the curated classic seed list
 * using the same schema.
 */

/** Logical groupings for the user's bar cabinet picker. */
export type BarIngredientCategory =
  | "distile" // Distile / sert içkiler (vodka, gin, rum, whisky, tequila, brandy)
  | "liqueur" // Likörler (campari, aperol, triple sec, vermouth, amaro, etc.)
  | "wine" // Şarap & köpüklü (prosecco, champagne, dry/sweet wine)
  | "mixer" // Mikserler (tonic, soda, ginger beer, cola)
  | "citrus" // Sitrüs (limon, misket limonu, portakal)
  | "sweetener" // Tatlandırıcılar (basit şurup, agave, bal)
  | "bitter" // Bitter (Angostura, orange bitters)
  | "garnish"; // Süslemeler (zeytin, tuz, biberiye, nane, vişne)

export interface BarIngredient {
  id: string;
  /** Display name in Turkish. */
  name: string;
  /** English / international name shown as a subtitle. */
  altName?: string;
  category: BarIngredientCategory;
  /** Emoji glyph for compact list rendering. */
  emoji: string;
  /**
   * Ingredients flagged as "essential" can never be substituted away
   * — used by the matcher to decide whether a recipe is truly cookable.
   * Garnishes default to non-essential.
   */
  essential?: boolean;
}

export type CocktailTechnique =
  | "shake" // Shaker'da çalkalanır
  | "stir" // Mixing glass'ta karıştırılır
  | "build" // Direkt bardakta yapılır
  | "blend" // Blender ile
  | "muddle"; // Ezilerek hazırlanır

export type CocktailGlass =
  | "rocks" // Eski tip / kısa bardak
  | "highball" // Uzun ince bardak
  | "coupe" // Klasik kokteyl bardağı
  | "martini" // V martini bardağı
  | "flute" // Şampanya kadehi
  | "wine" // Şarap kadehi
  | "copper-mug" // Bakır kupa (Moscow Mule)
  | "hurricane"; // Hurricane bardağı

export type CocktailDifficulty = "kolay" | "orta" | "zor";

export interface CocktailIngredientRef {
  /** Reference to a `BarIngredient.id` from the catalog. */
  ingredientId: string;
  /** Human-readable measurement (e.g. "60 ml", "2 dilim", "1 tatlı kaşığı"). */
  amount: string;
  /**
   * Soft requirement: a recipe stays cookable even when an `optional`
   * ingredient is missing (typically garnishes / bitters dashes).
   */
  optional?: boolean;
}

export interface Cocktail {
  id: string;
  name: string;
  /** Optional original / English name for attribution. */
  altName?: string;
  /** Short editorial description in Turkish. */
  description: string;
  imageUrl?: string;
  /** Hero emoji used when no image is available. */
  emoji: string;
  technique: CocktailTechnique;
  glass: CocktailGlass;
  difficulty: CocktailDifficulty;
  /** Estimated active prep time in minutes. */
  prepTimeMinutes: number;
  /** How many servings the recipe yields (usually 1). */
  servings: number;
  ingredients: CocktailIngredientRef[];
  /** Step-by-step instructions in Turkish. */
  steps: string[];
  /** Free-form tags used for filtering (e.g. "klasik", "yaz", "amaro"). */
  tags: string[];
  /**
   * Curated origin source. Use this to distinguish hand-curated classics
   * from scraped Instagram tarifleri once Faz 4 lands.
   */
  source: "classic" | "influencer";
  /** Optional reel URL for influencer-sourced cocktails. */
  sourceUrl?: string;
}

/**
 * Result type returned by the cocktail matcher — describes how well the
 * user's bar cabinet covers a given recipe.
 */
export interface CocktailMatch {
  cocktail: Cocktail;
  /** Required (non-optional) ingredients the user is currently missing. */
  missingRequired: BarIngredient[];
  /** Optional ingredients (garnishes, bitters) the user is missing. */
  missingOptional: BarIngredient[];
  /** True when every required ingredient is present in the cabinet. */
  cookable: boolean;
  /** 0..1 — fraction of required ingredients the user has. */
  coverage: number;
}

// ─── Bar swipe / decision session ────────────────────────────────────────

/** Vote types accepted by a Bar session. */
export type BarVoteType = "like" | "dislike" | "superlike";

export interface BarVote {
  userId: string;
  cocktailId: string;
  voteType: BarVoteType;
  createdAt: string;
}

export type BarSessionStatus = "active" | "completed";

export interface BarSession {
  id: string;
  /** Optional household id when run as a group decision. */
  householdId?: string;
  /** Initiating user id. */
  ownerId: string;
  /** All participating user ids (includes owner). */
  participantIds: string[];
  /** Frozen pool ids in deck order. */
  cocktailIds: string[];
  status: BarSessionStatus;
  createdAt: string;
  /**
   * Filter mode used to seed the deck — kept on the session for transparency
   * even though candidate building happens at start time.
   */
  filterMode: BarSessionFilterMode;
}

/**
 * How the deck was built:
 * - `cookable`  → only cocktails the cabinet can already make
 * - `close`     → cookable + 1-2 ingredients away
 * - `all`       → every cocktail in the pool, shuffled
 */
export type BarSessionFilterMode = "cookable" | "close" | "all";

export interface BarMatchResult {
  /** Stable id used for the match route. */
  id: string;
  cocktailId: string;
  /** Number of unique users who liked / superliked the winner. */
  likeCount: number;
  /** Total participants for context. */
  participantCount: number;
  createdAt: string;
}
