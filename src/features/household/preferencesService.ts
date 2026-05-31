import { supabase } from "@/lib/supabase";
import { DEFAULT_PREFERENCES, HouseholdPreferences } from "@/types/domain";

function merge(
  prefs: Partial<HouseholdPreferences> | null | undefined,
): HouseholdPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...prefs,
    family: { ...DEFAULT_PREFERENCES.family, ...prefs?.family },
    allergies: { ...DEFAULT_PREFERENCES.allergies, ...prefs?.allergies },
    scope: { ...DEFAULT_PREFERENCES.scope, ...prefs?.scope },
    time: { ...DEFAULT_PREFERENCES.time, ...prefs?.time },
    protein: { ...DEFAULT_PREFERENCES.protein, ...prefs?.protein },
    tastes: { ...DEFAULT_PREFERENCES.tastes, ...prefs?.tastes },
    pairing: { ...DEFAULT_PREFERENCES.pairing, ...prefs?.pairing },
    season: { ...DEFAULT_PREFERENCES.season, ...prefs?.season },
    shopping: { ...DEFAULT_PREFERENCES.shopping, ...prefs?.shopping },
  };
}

export const preferencesService = {
  isLive: () => !!supabase,

  async get(householdId: string): Promise<HouseholdPreferences> {
    if (!supabase) return DEFAULT_PREFERENCES;
    const { data, error } = await supabase
      .from("households")
      .select("preferences")
      .eq("id", householdId)
      .maybeSingle();
    if (error || !data) return DEFAULT_PREFERENCES;
    return merge(data.preferences as Partial<HouseholdPreferences> | null);
  },

  async save(
    householdId: string,
    prefs: HouseholdPreferences,
  ): Promise<HouseholdPreferences> {
    if (!supabase) return prefs;
    const { error } = await supabase
      .from("households")
      .update({ preferences: prefs })
      .eq("id", householdId);
    if (error) throw new Error(error.message);
    return prefs;
  },
};
