import { create } from "zustand";
import { Recipe } from "@/types/domain";
import { MOCK_RECIPES } from "@/constants/mockRecipes";
import { recipeService } from "@/features/recipes/recipeService";

interface RecipesState {
  items: Recipe[];
  loading: boolean;
  loaded: boolean;
  source: "mock" | "live";
  hydrate: () => Promise<void>;
  /** Synchronous accessor with mock fallback so legacy code can keep working. */
  getOrFallback: () => Recipe[];
  findById: (id: string) => Recipe | undefined;
  /** Add a locally-imported recipe to the top of the catalogue (mock mode). */
  addLocal: (recipe: Recipe) => void;
}

export const useRecipesStore = create<RecipesState>((set, get) => ({
  // Seed with the bundled catalogue so screens always have data even before
  // hydration finishes (or when Supabase env vars are absent).
  items: MOCK_RECIPES,
  loading: false,
  loaded: false,
  source: "mock",
  hydrate: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const list = await recipeService.list();
      set({
        items: list.length > 0 ? list : MOCK_RECIPES,
        loaded: true,
        loading: false,
        source: recipeService.isLive() && list.length > 0 ? "live" : "mock",
      });
    } catch {
      set({
        items: MOCK_RECIPES,
        loaded: true,
        loading: false,
        source: "mock",
      });
    }
  },
  getOrFallback: () => {
    const { items } = get();
    return items.length > 0 ? items : MOCK_RECIPES;
  },
  findById: (id) => {
    const list = get().items.length > 0 ? get().items : MOCK_RECIPES;
    return list.find((r) => r.id === id);
  },
  addLocal: (recipe) => {
    const { items } = get();
    if (items.some((r) => r.id === recipe.id)) return;
    set({ items: [recipe, ...items] });
  },
}));
