/**
 * Domain types for the Bar (cocktail) feature.
 *
 * Designed to be ingestion-friendly so that future Instagram-scraped
 * bartender content can be merged with the curated classic seed list
 * using the same schema.
 */

/**
 * Logical groupings for the user's bar cabinet picker.
 *
 * Codes are stable slugs; human-readable labels live in
 * `BAR_CATEGORY_LABEL` (barCatalog.ts). Imported from the English content
 * workbook (`cocktail_app_content_english_500.xlsx`).
 */
export type BarIngredientCategory =
  | "spirits" // Spirits (vodka, gin, rum, whisky, tequila, brandy)
  | "liqueur-vermouth" // Liqueurs & Vermouth
  | "amaro-bitters" // Amaro & Bitters (amari, bitter liqueurs)
  | "wine-sparkling" // Wine & Sparkling
  | "mixer" // Mixers (tonic, soda, ginger beer, cola)
  | "citrus-juice" // Citrus & Juices
  | "sweetener-syrup" // Sweeteners & Syrups
  | "bitter" // Bitters (dashing aromatic bitters)
  | "additive" // Additives (salt rims, foamers, etc.)
  | "fruit-produce" // Fruit & Produce
  | "garnish" // Garnishes
  | "savory" // Savory Add-ins
  | "tea-infusion" // Tea & Infusions
  | "flavor-water" // Flavor Waters
  | "zero-proof-spirit" // Zero-Proof Spirits
  | "bar-tool"; // Bar Tools / Effects

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
  | "hurricane" // Hurricane bardağı
  | "tiki" // Tiki mug
  | "julep-cup" // Julep cup
  | "mug"; // Mug (hot drinks)

/**
 * Difficulty supports both the English content codes (`easy`/`medium`/`hard`)
 * and the legacy Turkish codes used by the hand-curated classics.
 */
export type CocktailDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "kolay"
  | "orta"
  | "zor";

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
   * Curated origin source. `classic`/`modern-classic`/`new-gen`/`low-abv`/
   * `zero-proof` come from the English content workbook; `influencer` is
   * reserved for scraped Instagram tarifleri.
   */
  source:
    | "classic"
    | "modern-classic"
    | "new-gen"
    | "low-abv"
    | "zero-proof"
    | "influencer";
  /** Optional reference / attribution URL (e.g. IBA page). */
  referenceUrl?: string;
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
