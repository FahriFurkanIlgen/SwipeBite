import { create } from "zustand";
import { PantryItem } from "@/types/domain";
import { pantryService } from "@/features/pantry/pantryService";

interface PantryState {
  items: PantryItem[];
  loading: boolean;
  loadedFor: string | null;
  hydrate: (householdId: string) => Promise<void>;
  addMany: (items: PantryItem[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const usePantryStore = create<PantryState>((set, get) => ({
  items: [],
  loading: false,
  loadedFor: null,

  hydrate: async (householdId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      if (pantryService.isLive()) {
        const list = await pantryService.list(householdId);
        set({ items: list, loadedFor: householdId, loading: false });
      } else {
        set({ loadedFor: householdId, loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  addMany: async (newItems) => {
    const existing = new Set(get().items.map((i) => i.name.toLowerCase()));
    const filtered = newItems.filter(
      (i) => !existing.has(i.name.toLowerCase()),
    );
    if (filtered.length === 0) return;
    if (pantryService.isLive()) {
      try {
        const saved = await pantryService.addMany(filtered);
        set({ items: [...saved, ...get().items] });
      } catch {
        throw new Error("Kiler kaydedilemedi");
      }
    } else {
      set({ items: [...filtered, ...get().items] });
    }
  },

  remove: async (id) => {
    const prev = get().items;
    set({ items: prev.filter((i) => i.id !== id) });
    try {
      if (pantryService.isLive()) await pantryService.remove(id);
    } catch {
      set({ items: prev });
      throw new Error("Silinemedi");
    }
  },

  clear: async () => {
    const prev = get().items;
    const householdId = prev[0]?.householdId ?? get().loadedFor;
    set({ items: [] });
    try {
      if (pantryService.isLive() && householdId) {
        await pantryService.clear(householdId);
      }
    } catch {
      set({ items: prev });
      throw new Error("Temizlenemedi");
    }
  },
}));
