import { create } from "zustand";
import { DEFAULT_PREFERENCES, HouseholdPreferences } from "@/types/domain";
import { preferencesService } from "@/features/household/preferencesService";

interface PreferencesState {
  prefs: HouseholdPreferences;
  loadedFor: string | null;
  loading: boolean;
  hydrate: (householdId: string) => Promise<void>;
  save: (householdId: string, prefs: HouseholdPreferences) => Promise<void>;
  reset: () => void;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  prefs: DEFAULT_PREFERENCES,
  loadedFor: null,
  loading: false,

  hydrate: async (householdId) => {
    if (get().loadedFor === householdId || get().loading) return;
    set({ loading: true });
    try {
      const prefs = await preferencesService.get(householdId);
      set({ prefs, loadedFor: householdId, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  save: async (householdId, prefs) => {
    set({ prefs });
    try {
      await preferencesService.save(householdId, prefs);
    } catch {
      // keep local copy even if remote save fails
    }
  },

  reset: () =>
    set({ prefs: DEFAULT_PREFERENCES, loadedFor: null, loading: false }),
}));
