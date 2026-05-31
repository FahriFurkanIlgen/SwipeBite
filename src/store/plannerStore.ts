import { create } from "zustand";
import { MealPlan, WeeklyPlan, WeeklyMode } from "@/types/domain";
import { generateWeeklyPlan, regenerateDay } from "@/features/ai/weeklyPlanner";
import {
  generatePlanFromPreferences,
  generatePlanWithAI,
} from "@/features/ai/preferencePlanner";
import {
  Course,
  MEAL_PLAN_COMPOSITION,
} from "@/features/recipes/recipeClassifier";
import { useRecipesStore } from "@/store/recipesStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import { plannerService } from "@/features/planner/plannerService";
import { hasOpenAI } from "@/lib/env";

interface PlannerState {
  plan: WeeklyPlan | null;
  mode: WeeklyMode;
  loading: boolean;
  loadedFor: string | null;
  lockedDays: number[];
  mealPlan: MealPlan;
  includeCourses: Course[];
  lengthDays: number;
  setMode: (m: WeeklyMode) => void;
  setMealPlan: (m: MealPlan) => void;
  toggleCourse: (c: Course) => void;
  setLengthDays: (n: number) => void;
  hydrate: (householdId: string) => Promise<void>;
  generate: (householdId: string) => Promise<void>;
  regenerate: (dayIndex: number) => Promise<void>;
  toggleLock: (dayIndex: number) => void;
  generateFromPreferences: (
    householdId: string,
    options?: { useAI?: boolean },
  ) => Promise<void>;
  shuffleUnlocked: (householdId: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  plan: null,
  mode: "busy",
  loading: false,
  loadedFor: null,
  lockedDays: [],
  mealPlan: "aksam",
  includeCourses: ["ana"],
  lengthDays: 7,
  setMode: (mode) => set({ mode }),
  setMealPlan: (mealPlan) => {
    const composition = MEAL_PLAN_COMPOSITION[mealPlan];
    const planCourses = composition.map((s) => s.course);
    // When switching plans, default to "ana" if available, else everything in the plan.
    const next: Course[] =
      planCourses.length > 1 && planCourses.includes("ana")
        ? ["ana"]
        : planCourses;
    set({ mealPlan, includeCourses: next });
  },
  toggleCourse: (course) => {
    const current = get().includeCourses;
    const planCourses = MEAL_PLAN_COMPOSITION[get().mealPlan].map(
      (s) => s.course,
    );
    if (!planCourses.includes(course)) return;
    const has = current.includes(course);
    // Require at least one course selected.
    const next = has
      ? current.length > 1
        ? current.filter((c) => c !== course)
        : current
      : [...current, course];
    set({ includeCourses: next });
  },
  setLengthDays: (n) =>
    set({ lengthDays: Math.max(1, Math.min(14, Math.round(n))) }),

  hydrate: async (householdId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      if (plannerService.isLive()) {
        const plan = await plannerService.getCurrent(householdId);
        set({
          plan,
          mode: plan?.mode ?? get().mode,
          loadedFor: householdId,
          loading: false,
        });
      } else {
        set({ loadedFor: householdId, loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  generate: async (householdId) => {
    const recipes = useRecipesStore.getState().getOrFallback();
    const plan = generateWeeklyPlan(householdId, get().mode, recipes, {
      lengthDays: get().lengthDays,
    });
    set({ plan, lockedDays: [] });
    if (plannerService.isLive()) {
      try {
        const saved = await plannerService.save(plan);
        if (saved) set({ plan: saved });
      } catch {
        // keep local plan even if save fails
      }
    }
  },

  regenerate: async (dayIndex) => {
    const plan = get().plan;
    if (!plan) return;
    const recipes = useRecipesStore.getState().getOrFallback();
    const next = regenerateDay(plan, dayIndex, recipes, {
      includeCourses: get().includeCourses,
    });
    set({ plan: next });
    if (plannerService.isLive()) {
      try {
        const saved = await plannerService.save(next);
        if (saved) set({ plan: saved });
      } catch {
        // keep local
      }
    }
  },

  toggleLock: (dayIndex) => {
    const current = get().lockedDays;
    set({
      lockedDays: current.includes(dayIndex)
        ? current.filter((d) => d !== dayIndex)
        : [...current, dayIndex],
    });
  },

  generateFromPreferences: async (householdId, { useAI = hasOpenAI } = {}) => {
    set({ loading: true });
    try {
      const recipes = useRecipesStore.getState().getOrFallback();
      const prefs = usePreferencesStore.getState().prefs;
      const recent = plannerService.isLive()
        ? await plannerService.recentRecipeIds(householdId, 2)
        : [];
      const options = {
        recentRecipeIds: recent,
        current: get().plan,
        lockedDayIndexes: get().lockedDays,
        mealPlan: get().mealPlan,
        includeCourses: get().includeCourses,
        lengthDays: get().lengthDays,
      };
      const plan = useAI
        ? await generatePlanWithAI(householdId, prefs, recipes, options)
        : generatePlanFromPreferences(householdId, prefs, recipes, options);
      set({ plan, loading: false });
      if (plannerService.isLive()) {
        try {
          const saved = await plannerService.save(plan);
          if (saved) set({ plan: saved });
        } catch {
          // keep local plan
        }
      }
    } catch {
      set({ loading: false });
    }
  },

  shuffleUnlocked: async (householdId) => {
    // Same as generateFromPreferences — it already respects lockedDays.
    await get().generateFromPreferences(householdId);
  },

  clear: async () => {
    const householdId = get().plan?.householdId ?? get().loadedFor;
    set({ plan: null, lockedDays: [] });
    if (plannerService.isLive() && householdId) {
      try {
        await plannerService.clear(householdId);
      } catch {
        // ignore
      }
    }
  },
}));
