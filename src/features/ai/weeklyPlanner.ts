import { Recipe, WeeklyMode, WeeklyPlan } from "@/types/domain";
import { addDays, formatDayKey, startOfDay } from "@/utils/format";
import { uid } from "@/utils/id";
import { classifyCourse, Course } from "@/features/recipes/recipeClassifier";

/**
 * Weekly Planner.
 * Picks 7 days x 1 dinner (and optional lunch) from the supplied recipe pool,
 * weighted by the chosen mode.
 */

const MODE_WEIGHTS: Record<WeeklyMode, (r: Recipe) => number> = {
  busy: (r) =>
    r.prepTimeMinutes <= 25 ? 3 : r.prepTimeMinutes <= 40 ? 1 : 0.2,
  healthy: (r) =>
    r.tags.includes("zeytinyağlı") ||
    r.tags.includes("hafif") ||
    r.tags.includes("vejetaryen")
      ? 3
      : 1,
  budget: (r) =>
    r.tags.includes("klasik") || r.tags.includes("vejetaryen")
      ? 3
      : r.ingredients.length <= 5
        ? 2
        : 1,
  comfort: (r) =>
    r.tags.includes("klasik") ||
    r.tags.includes("aile") ||
    r.tags.includes("çorba")
      ? 3
      : 1,
  kids: (r) =>
    r.tags.includes("çocuk dostu") || r.tags.includes("pratik") ? 3 : 1,
};

export function generateWeeklyPlan(
  householdId: string,
  mode: WeeklyMode,
  recipes: Recipe[],
  opts: { startDate?: Date; lengthDays?: number } = {},
): WeeklyPlan {
  const weights = MODE_WEIGHTS[mode];
  const pool = [...recipes].sort((a, b) => weights(b) - weights(a));

  const weekStart = startOfDay(opts.startDate ?? new Date());
  const length = Math.max(1, Math.min(14, opts.lengthDays ?? 7));
  const used = new Set<string>();

  const days = Array.from({ length }, (_, i) => {
    const date = addDays(weekStart, i);
    const recipe = pickNext(pool, used);
    used.add(recipe.id);
    return {
      date: date.toISOString(),
      dayIndex: i,
      meals: [{ type: "dinner" as const, recipeId: recipe.id }],
    };
  });

  const groceryList = buildGroceryList(days, recipes);

  return {
    id: uid("plan"),
    householdId,
    mode,
    weekStart: formatDayKey(weekStart),
    days,
    groceryList,
    createdAt: new Date().toISOString(),
  };
}

export function regenerateDay(
  plan: WeeklyPlan,
  dayIndex: number,
  recipes: Recipe[],
  opts: { includeCourses?: Course[] } = {},
): WeeklyPlan {
  const weights = MODE_WEIGHTS[plan.mode];
  const used = new Set(
    plan.days.flatMap((d) => d.meals.map((m) => m.recipeId)),
  );
  // Desired course set: explicit opts.includeCourses wins (user's current
  // selection in the planner UI). Fall back to the courses currently on the
  // day, then to "ana".
  const dayBeingChanged = plan.days.find((d) => d.dayIndex === dayIndex);
  const dayCourses = new Set<Course>();
  if (opts.includeCourses && opts.includeCourses.length > 0) {
    for (const c of opts.includeCourses) dayCourses.add(c);
  } else if (dayBeingChanged) {
    for (const m of dayBeingChanged.meals) {
      const r = recipes.find((x) => x.id === m.recipeId);
      if (r) dayCourses.add(classifyCourse(r));
    }
  }
  if (dayCourses.size === 0) dayCourses.add("ana");

  const filtered = recipes.filter((r) => dayCourses.has(classifyCourse(r)));
  // If filtering removes everything (no candidates of that course), fall back.
  const pool = (filtered.length > 0 ? filtered : recipes)
    .slice()
    .sort((a, b) => weights(b) - weights(a));
  const next = pickNext(pool, used);

  const days = plan.days.map((d) =>
    d.dayIndex === dayIndex
      ? { ...d, meals: [{ type: "dinner" as const, recipeId: next.id }] }
      : d,
  );
  return { ...plan, days, groceryList: buildGroceryList(days, recipes) };
}

function pickNext(pool: Recipe[], used: Set<string>) {
  const next = pool.find((r) => !used.has(r.id));
  return next ?? pool[Math.floor(Math.random() * pool.length)]!;
}

function buildGroceryList(
  days: WeeklyPlan["days"],
  recipes: Recipe[],
): string[] {
  const ingredients = new Set<string>();
  for (const d of days) {
    for (const m of d.meals) {
      const r = recipes.find((x) => x.id === m.recipeId);
      r?.ingredients.forEach((i) => ingredients.add(i.name));
    }
  }
  return [...ingredients].sort((a, b) => a.localeCompare(b, "tr-TR"));
}
