import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "swipebite.grocery.v1";

interface GroceryCheckMap {
  // planId -> set of checked item names (lowercased)
  [planId: string]: string[];
}

interface PersistedShape {
  checked: GroceryCheckMap;
  purchased: GroceryCheckMap;
}

interface GroceryState {
  /** Persisted: which items are currently ticked for each plan id. */
  checkedByPlan: GroceryCheckMap;
  /** Persisted: which items the user has marked as bought (hidden from list). */
  purchasedByPlan: GroceryCheckMap;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isChecked: (planId: string, name: string) => boolean;
  isPurchased: (planId: string, name: string) => boolean;
  toggle: (planId: string, name: string) => Promise<void>;
  setChecked: (planId: string, name: string, checked: boolean) => Promise<void>;
  /** Move all currently checked items into the purchased bucket. Returns committed names. */
  commitChecked: (planId: string) => Promise<string[]>;
  clearForPlan: (planId: string) => Promise<void>;
}

function key(name: string): string {
  return name.toLocaleLowerCase("tr-TR").trim();
}

async function persist(state: PersistedShape) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export const useGroceryStore = create<GroceryState>((set, get) => ({
  checkedByPlan: {},
  purchasedByPlan: {},
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedShape> &
          GroceryCheckMap;
        // Back-compat: previously we stored just the check map at the root.
        if (parsed && typeof parsed === "object" && "checked" in parsed) {
          set({
            checkedByPlan: parsed.checked ?? {},
            purchasedByPlan: parsed.purchased ?? {},
            hydrated: true,
          });
        } else {
          set({
            checkedByPlan: parsed as GroceryCheckMap,
            purchasedByPlan: {},
            hydrated: true,
          });
        }
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  isChecked: (planId, name) => {
    const list = get().checkedByPlan[planId] ?? [];
    return list.includes(key(name));
  },

  isPurchased: (planId, name) => {
    const list = get().purchasedByPlan[planId] ?? [];
    return list.includes(key(name));
  },

  toggle: async (planId, name) => {
    const k = key(name);
    const checked = { ...get().checkedByPlan };
    const list = new Set(checked[planId] ?? []);
    if (list.has(k)) list.delete(k);
    else list.add(k);
    checked[planId] = Array.from(list);
    set({ checkedByPlan: checked });
    await persist({ checked, purchased: get().purchasedByPlan });
  },

  setChecked: async (planId, name, value) => {
    const k = key(name);
    const checked = { ...get().checkedByPlan };
    const list = new Set(checked[planId] ?? []);
    if (value) list.add(k);
    else list.delete(k);
    checked[planId] = Array.from(list);
    set({ checkedByPlan: checked });
    await persist({ checked, purchased: get().purchasedByPlan });
  },

  commitChecked: async (planId) => {
    const checkedList = get().checkedByPlan[planId] ?? [];
    if (checkedList.length === 0) return [];
    const checked = { ...get().checkedByPlan, [planId]: [] };
    const purchased = { ...get().purchasedByPlan };
    const merged = new Set([...(purchased[planId] ?? []), ...checkedList]);
    purchased[planId] = Array.from(merged);
    set({ checkedByPlan: checked, purchasedByPlan: purchased });
    await persist({ checked, purchased });
    return checkedList;
  },

  clearForPlan: async (planId) => {
    const checked = { ...get().checkedByPlan };
    const purchased = { ...get().purchasedByPlan };
    delete checked[planId];
    delete purchased[planId];
    set({ checkedByPlan: checked, purchasedByPlan: purchased });
    await persist({ checked, purchased });
  },
}));
