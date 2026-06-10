import { openAIJson } from "@/lib/openai";
import {
  MatchResult,
  MealPlan,
  PantryItem,
  Profile,
  Recipe,
  Vote,
} from "@/types/domain";
import { uid } from "@/utils/id";
import {
  classifyCourse,
  COURSE_LABEL,
  Course,
} from "@/features/recipes/recipeClassifier";
import { scoreRecipes } from "./recommendationEngine";

/**
 * Match Engine.
 * Combines per-user votes with the recommendation-engine score to pick
 * the household's best meal and three contextual alternatives.
 */

const VOTE_VALUE = {
  like: 1,
  superlike: 3,
  dislike: -1,
  superdislike: -5,
} as const;

export interface MatchInputs {
  sessionId: string;
  votes: Vote[];
  candidates: Recipe[];
  participantIds: string[];
  /** Whole-household profiles for the active session. */
  profiles?: Profile[];
  /** Current pantry contents (used for ingredient diff + tie-break). */
  pantry?: PantryItem[];
  /** Last cooked recipe ids — penalised in scoring. */
  recentRecipeIds?: string[];
  /** Optional time budget in minutes. */
  timeBudgetMinutes?: number;
  /** When set, builds course companions for multi-course menus. */
  mealPlan?: MealPlan;
}

interface RecipeAggregate {
  recipe: Recipe;
  voteScore: number;
  recScore: number;
  pantryMatchPercent: number;
  likedBy: Set<string>;
  superLikedBy: Set<string>;
  rejectedBy: Set<string>;
}

export function computeMatch(inputs: MatchInputs): MatchResult | null {
  const {
    sessionId,
    votes,
    candidates,
    participantIds,
    profiles = [],
    pantry = [],
    recentRecipeIds = [],
    timeBudgetMinutes,
    mealPlan,
  } = inputs;
  if (candidates.length === 0) return null;

  const recommendations = scoreRecipes({
    recipes: candidates,
    profiles,
    pantry,
    recentRecipeIds,
    votes,
    timeBudgetMinutes,
  });
  const recByRecipe = new Map(recommendations.map((r) => [r.recipe.id, r]));

  const aggregates = new Map<string, RecipeAggregate>();
  for (const recipe of candidates) {
    const rec = recByRecipe.get(recipe.id);
    aggregates.set(recipe.id, {
      recipe,
      voteScore: 0,
      recScore: rec?.score ?? 0,
      pantryMatchPercent: rec?.pantryMatchPercent ?? 0,
      likedBy: new Set<string>(),
      superLikedBy: new Set<string>(),
      rejectedBy: new Set<string>(),
    });
  }

  for (const v of votes) {
    const agg = aggregates.get(v.recipeId);
    if (!agg) continue;
    agg.voteScore += VOTE_VALUE[v.voteType];
    if (v.voteType === "like") agg.likedBy.add(v.userId);
    if (v.voteType === "superlike") {
      agg.likedBy.add(v.userId);
      agg.superLikedBy.add(v.userId);
    }
    if (v.voteType === "superdislike") agg.rejectedBy.add(v.userId);
  }

  // Hard reject any recipe that received a superdislike — never serve it.
  let survivors = [...aggregates.values()].filter(
    (a) => a.rejectedBy.size === 0,
  );
  if (survivors.length === 0) return null;

  // Multi-user majority: when 2+ participants, a recipe must be liked by at
  // least ceil(N/2) of them. Falls back to "any positive vote" for solo runs.
  if (participantIds.length >= 2) {
    const minLikes = Math.ceil(participantIds.length / 2);
    const intersect = survivors.filter((a) => a.likedBy.size >= minLikes);
    if (intersect.length > 0) survivors = intersect;
  }

  // Total score = household votes (heavy) + recommendation score (light tie-break).
  const ranked = survivors
    .map((a) => ({ agg: a, total: a.voteScore * 2 + a.recScore }))
    .sort((a, b) => b.total - a.total);

  const top = ranked[0];
  if (!top || top.agg.voteScore <= 0) return null;
  const best = top.agg;

  const alternatives = pickAlternatives(
    ranked.slice(1).map((x) => x.agg),
    best.recipe,
  );

  const missingIngredients = diffMissingIngredients(best.recipe, pantry);

  // Multi-course companions for akşam plan: best liked çorba + tatlı.
  let courseCompanions: MatchResult["courseCompanions"];
  if (mealPlan === "aksam") {
    const primaryCourse = classifyCourse(best.recipe);
    const wanted: Course[] = ["corba", "ana", "tatli"].filter(
      (c) => c !== primaryCourse,
    ) as Course[];
    const usedIds = new Set<string>([best.recipe.id]);
    courseCompanions = [];
    for (const course of wanted) {
      const pick = ranked
        .map((x) => x.agg)
        .filter(
          (a) =>
            !usedIds.has(a.recipe.id) &&
            classifyCourse(a.recipe) === course &&
            a.voteScore > 0,
        )[0];
      if (pick) {
        courseCompanions.push({
          course,
          label: COURSE_LABEL[course],
          recipeId: pick.recipe.id,
        });
        usedIds.add(pick.recipe.id);
      }
    }
    if (courseCompanions.length === 0) courseCompanions = undefined;
  }

  const reasons = buildReasons({
    recipe: best.recipe,
    likedCount: best.likedBy.size,
    superLikedCount: best.superLikedBy.size,
    totalParticipants: participantIds.length,
    pantryMatchPercent: best.pantryMatchPercent,
  });

  return {
    id: uid("match"),
    sessionId,
    recipeId: best.recipe.id,
    score: Math.round(top.total),
    reasons,
    likedByUserIds: [...best.likedBy],
    alternatives,
    missingIngredients,
    createdAt: new Date().toISOString(),
    courseCompanions,
  };
}

function pickAlternatives(
  pool: RecipeAggregate[],
  primary: Recipe,
): { recipeId: string; label: string }[] {
  if (pool.length === 0) return [];

  const usedIds = new Set<string>();
  const chosen: { recipeId: string; label: string }[] = [];

  // 1) Daha hızlı — fastest prep time, must be strictly faster than primary
  const faster = pool
    .filter((p) => p.recipe.prepTimeMinutes < primary.prepTimeMinutes)
    .sort((a, b) => a.recipe.prepTimeMinutes - b.recipe.prepTimeMinutes)[0];
  if (faster) {
    chosen.push({ recipeId: faster.recipe.id, label: "Daha hızlı" });
    usedIds.add(faster.recipe.id);
  }

  // 2) Daha hafif — vegetarian / soup / vegetable tag
  const LIGHT_TAGS = new Set([
    "vejetaryen",
    "hafif",
    "çorba",
    "sebze",
    "zeytinyağlı",
  ]);
  const lighter = pool
    .filter(
      (p) =>
        !usedIds.has(p.recipe.id) &&
        p.recipe.tags.some((t) => LIGHT_TAGS.has(t)),
    )
    .sort((a, b) => b.voteScore + b.recScore - (a.voteScore + a.recScore))[0];
  if (lighter) {
    chosen.push({ recipeId: lighter.recipe.id, label: "Daha hafif" });
    usedIds.add(lighter.recipe.id);
  }

  // 3) Daha ekonomik — fewest ingredients (proxy for cheapest)
  const cheaper = pool
    .filter((p) => !usedIds.has(p.recipe.id))
    .sort(
      (a, b) => a.recipe.ingredients.length - b.recipe.ingredients.length,
    )[0];
  if (cheaper) {
    chosen.push({ recipeId: cheaper.recipe.id, label: "Daha ekonomik" });
    usedIds.add(cheaper.recipe.id);
  }

  // Backfill with highest-scoring remaining if we have <3 alternatives.
  for (const p of pool) {
    if (chosen.length >= 3) break;
    if (usedIds.has(p.recipe.id)) continue;
    chosen.push({ recipeId: p.recipe.id, label: "Alternatif" });
    usedIds.add(p.recipe.id);
  }

  return chosen.slice(0, 3);
}

function diffMissingIngredients(
  recipe: Recipe,
  pantry: PantryItem[],
): string[] {
  const have = pantry.map((p) => p.name.toLocaleLowerCase("tr-TR").trim());
  return recipe.ingredients
    .filter((ing) => {
      const n = ing.name.toLocaleLowerCase("tr-TR").trim();
      for (const h of have) {
        if (!h) continue;
        if (n.includes(h) || h.includes(n)) return false;
      }
      return true;
    })
    .map((i) => i.name)
    .slice(0, 8);
}

function buildReasons(args: {
  recipe: Recipe;
  likedCount: number;
  superLikedCount: number;
  totalParticipants: number;
  pantryMatchPercent: number;
}): string[] {
  const {
    recipe,
    likedCount,
    superLikedCount,
    totalParticipants,
    pantryMatchPercent,
  } = args;
  const reasons: string[] = [];
  if (totalParticipants > 1)
    reasons.push(`${likedCount}/${totalParticipants} ev üyesi beğendi.`);
  if (superLikedCount > 0)
    reasons.push(
      superLikedCount === 1
        ? "Bir ev üyesi süper beğendi."
        : `${superLikedCount} ev üyesi süper beğendi.`,
    );
  if (pantryMatchPercent >= 60)
    reasons.push(`Evdeki malzemelerin %${pantryMatchPercent}'i hazır.`);
  if (recipe.prepTimeMinutes <= 25)
    reasons.push(`${recipe.prepTimeMinutes} dakikada hazırlanabiliyor.`);
  if (recipe.tags.includes("klasik"))
    reasons.push("Ev halkının sevdiği bir klasik.");
  if (recipe.tags.includes("pratik")) reasons.push("Pratik bir akşam yemeği.");
  return reasons.length ? reasons : ["Ev halkına en uygun seçenek."];
}

/**
 * Generate a friendlier explanation via AI (optional augmentation).
 */
export async function explainMatch(
  recipe: Recipe,
  baseReasons: string[],
): Promise<string> {
  const ai = await openAIJson<{ explanation: string }>({
    system:
      "Sen samimi, sıcak, kısa konuşan bir Türk mutfak asistanısın. " +
      'JSON döndür: {"explanation":"..."}',
    user:
      `Tarif: ${recipe.title}. Sebepler: ${baseReasons.join(" ")}. ` +
      "Tek cümle, 18 kelimeyi geçmeyen, samimi bir açıklama yaz.",
    temperature: 0.6,
    feature: "match_explain",
  });
  return ai?.explanation ?? baseReasons.join(" ");
}
