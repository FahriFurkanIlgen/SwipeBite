import { create } from "zustand";
import { PantryItem } from "@/types/domain";

interface PantryState {
  items: PantryItem[];
  addMany: (items: PantryItem[]) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const usePantryStore = create<PantryState>((set, get) => ({
  items: [],
  addMany: (newItems) => {
    const existing = new Set(get().items.map((i) => i.name));
    const filtered = newItems.filter((i) => !existing.has(i.name));
    set({ items: [...get().items, ...filtered] });
  },
  remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  clear: () => set({ items: [] }),
}));
