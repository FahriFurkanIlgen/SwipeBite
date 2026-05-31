import { supabase } from "@/lib/supabase";
import { WeeklyPlan, WeeklyDayPlan, WeeklyMode } from "@/types/domain";

interface PlanRow {
  id: string;
  household_id: string;
  mode: WeeklyMode;
  week_start: string;
  days: WeeklyDayPlan[];
  grocery_list: string[];
  created_at: string;
}

function rowToPlan(r: PlanRow): WeeklyPlan {
  return {
    id: r.id,
    householdId: r.household_id,
    mode: r.mode,
    weekStart: r.week_start,
    days: r.days ?? [],
    groceryList: r.grocery_list ?? [],
    createdAt: r.created_at,
  };
}

function planToUpsert(plan: WeeklyPlan) {
  return {
    household_id: plan.householdId,
    mode: plan.mode,
    week_start: plan.weekStart,
    days: plan.days,
    grocery_list: plan.groceryList,
  };
}

export const plannerService = {
  isLive: () => !!supabase,

  /** Latest plan for a household (most recent week_start). */
  async getCurrent(householdId: string): Promise<WeeklyPlan | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("weekly_plans")
      .select("*")
      .eq("household_id", householdId)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToPlan(data as PlanRow) : null;
  },

  /** Last N plans for repeat-avoidance. Returns recipe ids from all weeks. */
  async recentRecipeIds(householdId: string, weeks = 2): Promise<string[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("weekly_plans")
      .select("days")
      .eq("household_id", householdId)
      .order("week_start", { ascending: false })
      .limit(weeks);
    if (error || !data) return [];
    const ids = new Set<string>();
    for (const row of data as { days: WeeklyDayPlan[] }[]) {
      for (const d of row.days ?? []) {
        for (const m of d.meals ?? []) ids.add(m.recipeId);
      }
    }
    return [...ids];
  },

  /** Upsert by (household_id, week_start) — schema has a UNIQUE on that pair. */
  async save(plan: WeeklyPlan): Promise<WeeklyPlan | null> {
    if (!supabase) return plan;
    const { data, error } = await supabase
      .from("weekly_plans")
      .upsert(planToUpsert(plan), { onConflict: "household_id,week_start" })
      .select()
      .single();
    if (error) throw error;
    return data ? rowToPlan(data as PlanRow) : plan;
  },

  async clear(householdId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from("weekly_plans")
      .delete()
      .eq("household_id", householdId);
    if (error) throw error;
  },
};
