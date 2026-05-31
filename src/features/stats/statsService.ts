import { supabase } from "@/lib/supabase";

export interface StatsSnapshot {
  favorites: string[];
  cookCounts: Record<string, number>;
  cookDates: string[];
}

export const statsService = {
  isLive: () => !!supabase,

  async snapshot(userId: string): Promise<StatsSnapshot> {
    if (!supabase) return { favorites: [], cookCounts: {}, cookDates: [] };
    const [favRes, logRes] = await Promise.all([
      supabase.from("favorites").select("recipe_id").eq("user_id", userId),
      supabase
        .from("cook_log")
        .select("recipe_id, cooked_on")
        .eq("user_id", userId),
    ]);
    if (favRes.error) throw favRes.error;
    if (logRes.error) throw logRes.error;
    const favorites = (favRes.data ?? []).map(
      (r) => (r as { recipe_id: string }).recipe_id,
    );
    const cookCounts: Record<string, number> = {};
    const dateSet = new Set<string>();
    for (const row of (logRes.data ?? []) as {
      recipe_id: string;
      cooked_on: string;
    }[]) {
      cookCounts[row.recipe_id] = (cookCounts[row.recipe_id] ?? 0) + 1;
      dateSet.add(row.cooked_on);
    }
    return { favorites, cookCounts, cookDates: [...dateSet] };
  },

  async addFavorite(userId: string, recipeId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from("favorites")
      .upsert({ user_id: userId, recipe_id: recipeId });
    if (error) throw error;
  },

  async removeFavorite(userId: string, recipeId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("recipe_id", recipeId);
    if (error) throw error;
  },

  async logCook(userId: string, recipeId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from("cook_log")
      .insert({ user_id: userId, recipe_id: recipeId });
    if (error) throw error;
  },

  async clear(userId: string): Promise<void> {
    if (!supabase) return;
    await supabase.from("favorites").delete().eq("user_id", userId);
    await supabase.from("cook_log").delete().eq("user_id", userId);
  },
};
