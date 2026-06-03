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
  source_url?: string | null;
  video_url?: string | null;
}

// Calories aren't stored in Supabase yet — look them up from the bundled
// catalogue by id so the recipe detail can still display kcal.
const CALORIES_BY_ID: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (const r of MOCK_RECIPES) {
    if (typeof r.caloriesPerServing === "number") {
      m[r.id] = r.caloriesPerServing;
    }
  }
  return m;
})();

function rowToRecipe(r: RecipeRow): Recipe {
  const cal = CALORIES_BY_ID[r.id];
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
    ...(typeof cal === "number" ? { caloriesPerServing: cal } : {}),
    ...(r.source_url ? { sourceUrl: r.source_url } : {}),
    ...(r.video_url ? { videoUrl: r.video_url } : {}),
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

  async create(
    input: Omit<Recipe, "id"> & { id?: string },
  ): Promise<Recipe | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        title: input.title,
        description: input.description || null,
        image_url: input.imageUrl || null,
        prep_time_minutes: input.prepTimeMinutes,
        difficulty: input.difficulty,
        servings: input.servings,
        ingredients: input.ingredients,
        steps: input.steps,
        tags: input.tags,
        cuisine: input.cuisine || null,
        source_url: input.sourceUrl || null,
        video_url: input.videoUrl || null,
      })
      .select()
      .single();
    if (error || !data) return null;
    this.invalidate();
    return rowToRecipe(data as RecipeRow);
  },

  invalidate() {
    cache = null;
    cacheAt = 0;
  },
};
