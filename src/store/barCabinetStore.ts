import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { BAR_INGREDIENT_INDEX } from "@/constants/barCatalog";
import type { BarIngredient } from "@/types/bar";

const STORAGE_KEY = "swipebite.barCabinet.v1";

interface PersistedShape {
  ingredientIds: string[];
}

interface BarCabinetState {
  /** Set-like list of `BarIngredient.id`s that the user owns. */
  ingredientIds: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
  add: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Replace the entire selection. Used when the user resets / bulk-edits. */
  setAll: (ids: string[]) => Promise<void>;
  clear: () => Promise<void>;
  /** Resolve persisted ids into their full `BarIngredient` records. */
  selected: () => BarIngredient[];
}

async function persist(ingredientIds: string[]) {
  try {
    const payload: PersistedShape = { ingredientIds };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // best effort — ignore storage failures
  }
}

export const useBarCabinetStore = create<BarCabinetState>((set, get) => ({
  ingredientIds: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedShape;
        // Drop ids that no longer exist in the catalog (e.g. after a rename).
        const filtered = (parsed.ingredientIds ?? []).filter(
          (id) => BAR_INGREDIENT_INDEX[id] !== undefined,
        );
        set({ ingredientIds: filtered, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  has: (id) => get().ingredientIds.includes(id),

  toggle: async (id) => {
    const current = get().ingredientIds;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    set({ ingredientIds: next });
    await persist(next);
  },

  add: async (id) => {
    const current = get().ingredientIds;
    if (current.includes(id)) return;
    const next = [...current, id];
    set({ ingredientIds: next });
    await persist(next);
  },

  remove: async (id) => {
    const next = get().ingredientIds.filter((x) => x !== id);
    set({ ingredientIds: next });
    await persist(next);
  },

  setAll: async (ids) => {
    const filtered = ids.filter((id) => BAR_INGREDIENT_INDEX[id] !== undefined);
    set({ ingredientIds: filtered });
    await persist(filtered);
  },

  clear: async () => {
    set({ ingredientIds: [] });
    await persist([]);
  },

  selected: () =>
    get()
      .ingredientIds.map((id) => BAR_INGREDIENT_INDEX[id])
      .filter((i): i is BarIngredient => !!i),
}));
