import { create } from "zustand";
import { WeeklyPlan, WeeklyMode } from "@/types/domain";
import { generateWeeklyPlan, regenerateDay } from "@/features/ai/weeklyPlanner";
import { useRecipesStore } from "@/store/recipesStore";

interface PlannerState {
  plan: WeeklyPlan | null;
  mode: WeeklyMode;
  setMode: (m: WeeklyMode) => void;
  generate: (householdId: string) => void;
  regenerate: (dayIndex: number) => void;
  clear: () => void;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  plan: null,
  mode: "busy",
  setMode: (mode) => set({ mode }),
  generate: (householdId) => {
    const recipes = useRecipesStore.getState().getOrFallback();
    const plan = generateWeeklyPlan(householdId, get().mode, recipes);
    set({ plan });
  },
  regenerate: (dayIndex) => {
    const plan = get().plan;
    if (!plan) return;
    const recipes = useRecipesStore.getState().getOrFallback();
    set({ plan: regenerateDay(plan, dayIndex, recipes) });
  },
  clear: () => set({ plan: null }),
}));
