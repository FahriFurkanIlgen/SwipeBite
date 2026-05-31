import {
  HouseholdPreferences,
  MealPlan,
  Recipe,
  WeekDay,
  WeeklyDayPlan,
  WeeklyPlan,
} from "@/types/domain";
import { addDays, formatDayKey, startOfDay } from "@/utils/format";
import { uid } from "@/utils/id";
import { openAIJson } from "@/lib/openai";
import {
  classifyCourse,
  Course,
  MEAL_PLAN_COMPOSITION,
} from "@/features/recipes/recipeClassifier";

const WEEKDAYS: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function dayIndexToWeekDay(i: number): WeekDay {
  return WEEKDAYS[i] ?? "mon";
}

function normalize(s: string): string {
  return s.toLocaleLowerCase("tr-TR").trim();
}

function recipeMentions(r: Recipe, keyword: string): boolean {
  const k = normalize(keyword);
  if (!k) return false;
  if (normalize(r.title).includes(k)) return true;
  if (r.tags.some((t) => normalize(t).includes(k))) return true;
  if (r.ingredients.some((i) => normalize(i.name).includes(k))) return true;
  return false;
}

/**
 * Filter the catalog down to recipes that do not violate the user's hard rules.
 * Drops anything that mentions an allergen, never-eat item, or disliked dish.
 * Caps prep time and excludes recipes seen in recent weeks.
 */
function filterCandidates(
  recipes: Recipe[],
  prefs: HouseholdPreferences,
  excludeIds: Set<string>,
): Recipe[] {
  const blockTerms = [
    ...prefs.allergies.allergies,
    ...prefs.allergies.neverEat,
    ...prefs.tastes.dislikedDishes,
  ].map(normalize);

  return recipes.filter((r) => {
    if (excludeIds.has(r.id)) return false;
    if (r.prepTimeMinutes > prefs.time.maxCookMinutes + 15) return false;
    for (const term of blockTerms) {
      if (!term) continue;
      if (recipeMentions(r, term)) return false;
    }
    // Forbidden pairs: drop recipes that mention BOTH sides of a banned combo.
    for (const p of prefs.pairing.forbiddenPairs) {
      if (recipeMentions(r, p.main) && recipeMentions(r, p.side)) return false;
    }
    // Vegan / vegetarian rules
    const rules = prefs.allergies.dietaryRules.map(normalize);
    if (rules.includes("vegan") || rules.includes("vejetaryen")) {
      const meatTerms = [
        "et",
        "tavuk",
        "hindi",
        "balık",
        "kıyma",
        "sucuk",
        "pastırma",
      ];
      if (
        meatTerms.some((m) =>
          r.ingredients.some((i) => normalize(i.name).includes(m)),
        )
      ) {
        return false;
      }
    }
    return true;
  });
}

interface ScoreContext {
  prefs: HouseholdPreferences;
  dayIndex: number;
  carryoverHint?: string | null;
}

function scoreRecipe(r: Recipe, ctx: ScoreContext): number {
  const { prefs, dayIndex, carryoverHint } = ctx;
  const wd = dayIndexToWeekDay(dayIndex);
  let s = 0;

  // Carryover from previous day (e.g. dün tavuk → bugün tavuklu çorba).
  if (carryoverHint && recipeMentions(r, carryoverHint)) s += 6;

  // Loved dishes get a big boost.
  for (const loved of prefs.tastes.lovedDishes) {
    if (recipeMentions(r, loved)) s += 5;
  }

  // Time-aware bonuses.
  if (prefs.time.quickDays.includes(wd) && r.prepTimeMinutes <= 25) s += 3;
  if (prefs.time.longDays.includes(wd) && r.prepTimeMinutes >= 45) s += 2;
  if (r.prepTimeMinutes <= prefs.time.maxCookMinutes) s += 1;

  // Fixed-day protein.
  const fixed = prefs.protein.fixedDays.find((f) => f.day === wd);
  if (fixed && recipeMentions(r, fixed.protein)) s += 8;

  // Kids friendliness.
  if (prefs.family.children.length > 0) {
    if (r.tags.includes("çocuk dostu") || r.tags.includes("pratik")) s += 1;
    if (prefs.family.children.some((c) => c.picky)) {
      // penalise spicy / unusual tags
      if (r.tags.includes("baharatlı") || r.tags.includes("egzotik")) s -= 2;
    }
  }

  // Season match.
  if (!prefs.season.yearRound && r.tags.includes(prefs.season.currentSeason)) {
    s += 1;
  }

  // Small randomness for variety.
  s += Math.random() * 0.5;
  return s;
}

function targetProteinForDay(
  dayIndex: number,
  prefs: HouseholdPreferences,
): string | null {
  const wd = dayIndexToWeekDay(dayIndex);
  const fixed = prefs.protein.fixedDays.find((f) => f.day === wd);
  if (fixed) return fixed.protein;
  return null;
}

/**
 * If today's recipe matches a carryover "from" keyword, return the matching
 * "to" hint so tomorrow's selection can be biased toward it.
 * (Ex: bugün tavuk → yarın tavuklu çorba.)
 */
function deriveCarryoverHint(
  todayRecipe: Recipe,
  prefs: HouseholdPreferences,
): string | null {
  for (const c of prefs.pairing.dayCarryover) {
    if (!c.from || !c.to) continue;
    if (recipeMentions(todayRecipe, c.from)) return c.to;
  }
  return null;
}

function buildGroceryList(days: WeeklyDayPlan[], recipes: Recipe[]): string[] {
  const ingredients = new Set<string>();
  for (const d of days) {
    for (const m of d.meals) {
      const r = recipes.find((x) => x.id === m.recipeId);
      r?.ingredients.forEach((i) => ingredients.add(i.name));
    }
  }
  return [...ingredients].sort((a, b) => a.localeCompare(b, "tr-TR"));
}

/**
 * Generate a weekly plan tailored to the household's saved preferences.
 * Uses a deterministic scoring algorithm. Skips locked days (kept as-is).
 *
 * @param current The existing plan (its days may be retained when locked).
 * @param locked  dayIndex[] to preserve unchanged.
 */
export function generatePlanFromPreferences(
  householdId: string,
  prefs: HouseholdPreferences,
  recipes: Recipe[],
  options: {
    recentRecipeIds?: string[];
    current?: WeeklyPlan | null;
    lockedDayIndexes?: number[];
    mealPlan?: MealPlan;
    includeCourses?: Course[];
    startDate?: Date;
    lengthDays?: number;
  } = {},
): WeeklyPlan {
  const {
    recentRecipeIds = [],
    current,
    lockedDayIndexes = [],
    mealPlan = "aksam",
    includeCourses,
    startDate,
    lengthDays,
  } = options;
  // Resolve final course list — default "ana" only for multi-course plans.
  const planComp = MEAL_PLAN_COMPOSITION[mealPlan];
  const planCourses = planComp.map((s) => s.course);
  const courses: Course[] = (
    includeCourses && includeCourses.length > 0
      ? includeCourses.filter((c) => planCourses.includes(c))
      : planCourses.length > 1 && planCourses.includes("ana")
        ? ["ana"]
        : planCourses
  ) as Course[];
  const excludeIds = new Set<string>(recentRecipeIds);

  // Preserve recipes from locked days.
  const lockedDays = new Map<number, WeeklyDayPlan>();
  if (current) {
    for (const idx of lockedDayIndexes) {
      const d = current.days.find((x) => x.dayIndex === idx);
      if (d) {
        lockedDays.set(idx, d);
        for (const m of d.meals) excludeIds.add(m.recipeId);
      }
    }
  }

  const usable = filterCandidates(recipes, prefs, excludeIds);
  if (usable.length === 0) {
    // No candidates after filtering — fall back to the raw catalog so plan isn't empty.
    return generatePlanFromPreferences(householdId, prefs, recipes, {
      ...options,
      recentRecipeIds: [],
    });
  }

  const weekStart = startOfDay(startDate ?? new Date());
  const length = Math.max(1, Math.min(14, lengthDays ?? 7));
  const used = new Set<string>();
  let carryoverHint: string | null = null;

  const days: WeeklyDayPlan[] = Array.from({ length }, (_, i) => {
    // Lock takes priority.
    const locked = lockedDays.get(i);
    if (locked) {
      // Even if locked, derive a hint for the next day from the main course.
      const lockedMain =
        recipes.find((x) =>
          locked.meals.some(
            (m) => m.recipeId === x.id && classifyCourse(x) === "ana",
          ),
        ) ?? recipes.find((x) => locked.meals.some((m) => m.recipeId === x.id));
      carryoverHint = lockedMain
        ? deriveCarryoverHint(lockedMain, prefs)
        : null;
      return locked;
    }

    const hint = carryoverHint;
    const meals: WeeklyDayPlan["meals"] = [];
    for (const course of courses) {
      const coursePool = usable.filter(
        (r) => !used.has(r.id) && classifyCourse(r) === course,
      );
      let pool = coursePool;
      // Protein target only applies to the main course.
      if (course === "ana") {
        const target = targetProteinForDay(i, prefs);
        if (target) {
          const narrowed = coursePool.filter((r) => recipeMentions(r, target));
          if (narrowed.length > 0) pool = narrowed;
        }
      }
      // Fall back to broader pool only when the requested course is "ana".
      // Otherwise (çorba/tatlı/...) skip the slot rather than mis-suggest.
      if (pool.length === 0) {
        if (course === "ana") {
          pool = usable.filter((r) => !used.has(r.id));
        } else {
          continue;
        }
      }
      if (pool.length === 0) continue;
      const ranked = [...pool].sort(
        (a, b) =>
          scoreRecipe(b, {
            prefs,
            dayIndex: i,
            carryoverHint: course === "ana" ? hint : null,
          }) -
          scoreRecipe(a, {
            prefs,
            dayIndex: i,
            carryoverHint: course === "ana" ? hint : null,
          }),
      );
      const chosen = ranked[0];
      if (!chosen) continue;
      used.add(chosen.id);
      meals.push({ type: "dinner" as const, recipeId: chosen.id });
      if (course === "ana") {
        carryoverHint = deriveCarryoverHint(chosen, prefs);
      }
    }
    // Safety net: never emit an empty-day plan. Prefer a recipe that matches
    // one of the selected courses; fall back to "ana", then anything.
    if (meals.length === 0) {
      const fallback =
        recipes.find(
          (r) => !used.has(r.id) && courses.includes(classifyCourse(r)),
        ) ??
        recipes.find((r) => !used.has(r.id) && classifyCourse(r) === "ana") ??
        recipes.find((r) => !used.has(r.id)) ??
        recipes[0]!;
      used.add(fallback.id);
      meals.push({ type: "dinner" as const, recipeId: fallback.id });
    }

    return {
      date: addDays(weekStart, i).toISOString(),
      dayIndex: i,
      meals,
    };
  });

  const groceryListRaw = buildGroceryList(days, recipes);
  // Strip items the household always has stocked.
  const stocked = new Set(prefs.shopping.stocked.map(normalize));
  const groceryList = groceryListRaw.filter(
    (name) => !stocked.has(normalize(name)),
  );

  return {
    id: current?.id ?? uid("plan"),
    householdId,
    mode: current?.mode ?? "busy",
    weekStart: formatDayKey(weekStart),
    days,
    groceryList,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Optional AI re-ranking: ask the model to pick the best 7 from the
 * top deterministic candidates. Falls back silently when no key.
 */
export async function generatePlanWithAI(
  householdId: string,
  prefs: HouseholdPreferences,
  recipes: Recipe[],
  options: {
    recentRecipeIds?: string[];
    current?: WeeklyPlan | null;
    lockedDayIndexes?: number[];
    mealPlan?: MealPlan;
    includeCourses?: Course[];
    startDate?: Date;
    lengthDays?: number;
  } = {},
): Promise<WeeklyPlan> {
  const base = generatePlanFromPreferences(
    householdId,
    prefs,
    recipes,
    options,
  );

  // Build a compact catalog for the model. Limit to 60 to keep prompt small.
  const catalog = recipes.slice(0, 60).map((r) => ({
    id: r.id,
    title: r.title,
    time: r.prepTimeMinutes,
    tags: r.tags,
    main_ings: r.ingredients.slice(0, 6).map((i) => i.name),
  }));

  const ai = await openAIJson<{
    days: { dayIndex: number; recipeId: string }[];
  }>({
    system:
      "Sen bir Türkçe haftalık yemek planlayıcısın. Verilen aile tercihlerine TAMAMEN uy. " +
      "Alerji, sevilmeyen, asla-yenmeyen ve yapılmayacak eşleşmeleri ASLA önerme. " +
      'Çıktı: {"days":[{"dayIndex":0,"recipeId":"..."}, ...]} — 7 gün için id\'ler verilen kataloğun id\'leri olmalı.',
    user: JSON.stringify({
      preferences: prefs,
      recentlyUsedRecipeIds: options.recentRecipeIds ?? [],
      lockedDays: options.lockedDayIndexes ?? [],
      catalog,
    }),
    temperature: 0.4,
  });

  if (!ai?.days?.length) return base;

  const lockedSet = new Set(options.lockedDayIndexes ?? []);
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const length = base.days.length;
  const days: WeeklyDayPlan[] = Array.from({ length }, (_, i) => {
    if (lockedSet.has(i)) {
      return base.days.find((d) => d.dayIndex === i)!;
    }
    const pick = ai.days.find((d) => d.dayIndex === i);
    const recipe = pick && byId.get(pick.recipeId);
    if (!recipe) return base.days.find((d) => d.dayIndex === i)!;
    return {
      date: base.days[i]!.date,
      dayIndex: i,
      meals: [{ type: "dinner" as const, recipeId: recipe.id }],
    };
  });

  const stocked = new Set(prefs.shopping.stocked.map(normalize));
  const groceryList = buildGroceryList(days, recipes).filter(
    (name) => !stocked.has(normalize(name)),
  );

  return { ...base, days, groceryList };
}
