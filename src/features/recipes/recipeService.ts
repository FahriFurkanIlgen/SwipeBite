import { supabase } from "@/lib/supabase";
import { MOCK_RECIPES } from "@/constants/mockRecipes";
import { Recipe, Difficulty } from "@/types/domain";

interface RecipeRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number;
  difficulty: Difficulty;
  servings: number;
  ingredients: { name: string; quantity?: string }[] | null;
  steps: string[] | null;
  tags: string[] | null;
  cuisine: string | null;
}

function rowToRecipe(r: RecipeRow): Recipe {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    imageUrl: r.image_url ?? "",
    prepTimeMinutes: r.prep_time_minutes,
    difficulty: r.difficulty,
    servings: r.servings,
    ingredients: r.ingredients ?? [],
    steps: r.steps ?? [],
    tags: r.tags ?? [],
    cuisine: r.cuisine ?? "",
  };
}

let cache: Recipe[] | null = null;
let cacheAt = 0;
const TTL_MS = 5 * 60 * 1000;

/**
 * Live recipe service.
 *
 * - When Supabase is configured, fetches from `public.recipes`.
 * - Falls back to the in-app catalogue (MOCK_RECIPES) so the demo works offline.
 * - Memoised for 5 minutes within a session.
 */
export const recipeService = {
  isLive: () => !!supabase,

  async list(): Promise<Recipe[]> {
    if (cache && Date.now() - cacheAt < TTL_MS) return cache;
    if (!supabase) {
      cache = MOCK_RECIPES;
      cacheAt = Date.now();
      return cache;
    }
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) {
      cache = MOCK_RECIPES;
      cacheAt = Date.now();
      return cache;
    }
    cache = (data as RecipeRow[]).map(rowToRecipe);
    cacheAt = Date.now();
    return cache;
  },

  async get(id: string): Promise<Recipe | null> {
    const all = await this.list();
    return all.find((r) => r.id === id) ?? null;
  },

  invalidate() {
    cache = null;
    cacheAt = 0;
  },
};
