import { create } from "zustand";

interface StatsState {
  /** ISO date strings (YYYY-MM-DD) on which the user marked at least one cook done. */
  cookDates: string[];
  /** Times each recipe was cooked. */
  cookCounts: Record<string, number>;
  /** Favorite recipe ids (manually toggled). */
  favorites: string[];

  markCooked: (recipeId: string) => void;
  toggleFavorite: (recipeId: string) => void;
  isFavorite: (recipeId: string) => boolean;
  reset: () => void;
}

const today = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const useStatsStore = create<StatsState>((set, get) => ({
  cookDates: [],
  cookCounts: {},
  favorites: [],

  markCooked: (recipeId) => {
    const d = today();
    const dates = get().cookDates.includes(d)
      ? get().cookDates
      : [...get().cookDates, d];
    const counts = { ...get().cookCounts };
    counts[recipeId] = (counts[recipeId] ?? 0) + 1;
    set({ cookDates: dates, cookCounts: counts });
  },

  toggleFavorite: (recipeId) => {
    const favs = get().favorites;
    set({
      favorites: favs.includes(recipeId)
        ? favs.filter((id) => id !== recipeId)
        : [...favs, recipeId],
    });
  },

  isFavorite: (recipeId) => get().favorites.includes(recipeId),

  reset: () => set({ cookDates: [], cookCounts: {}, favorites: [] }),
}));

/**
 * Compute current consecutive-day streak ending today (or yesterday if today not yet marked).
 */
export function computeStreak(cookDates: string[]): number {
  if (cookDates.length === 0) return 0;
  const set = new Set(cookDates);
  // Walk back from today.
  let streak = 0;
  const d = new Date();
  // If today not present, allow starting from yesterday so we don't break the streak before evening.
  if (!set.has(toIso(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (set.has(toIso(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/**
 * Top recipe by cook count.
 */
export function favoriteRecipeId(
  counts: Record<string, number>,
): string | null {
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? null;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
