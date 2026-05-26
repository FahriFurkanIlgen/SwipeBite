import {
  AIRecommendation,
  PantryItem,
  Profile,
  Recipe,
  Vote,
} from "@/types/domain";
import { clamp } from "@/utils/format";

/**
 * Recommendation Engine.
 *
 * Pure-function scoring on top of mock or real recipe data.
 * Designed to be deterministic, testable, and AI-augmentable.
 */

export interface ScoringInputs {
  recipes: Recipe[];
  profiles: Profile[]; // all household members
  pantry: PantryItem[];
  recentRecipeIds: string[]; // last N cooked
  votes: Vote[]; // for behavioral learning
  timeBudgetMinutes?: number;
}

const SCORE = {
  LIKE: 1,
  SUPERLIKE: 3,
  DISLIKE: -1,
  SUPERDISLIKE: -5,
  PANTRY_MATCH: 2,
  NOT_RECENTLY_EATEN: 1,
  TIME_MATCH: 1,
  CUISINE_LOVE: 1.5,
} as const;

export function scoreRecipes(inputs: ScoringInputs): AIRecommendation[] {
  const {
    recipes,
    profiles,
    pantry,
    recentRecipeIds,
    votes,
    timeBudgetMinutes,
  } = inputs;

  const pantrySet = new Set(
    pantry.map((p) => p.name.toLocaleLowerCase("tr-TR")),
  );
  const recentSet = new Set(recentRecipeIds);

  const recipeVotes = groupVotesByRecipe(votes);

  const recommendations: AIRecommendation[] = [];

  for (const recipe of recipes) {
    // Hard reject for allergies
    const hasAllergen = profiles.some((p) =>
      p.allergies.some((a) =>
        recipe.ingredients.some((i) =>
          i.name
            .toLocaleLowerCase("tr-TR")
            .includes(a.toLocaleLowerCase("tr-TR")),
        ),
      ),
    );
    if (hasAllergen) continue;

    let score = 0;
    const reasons: string[] = [];

    // Pantry match
    const matchedIngredients = recipe.ingredients.filter((i) =>
      [...pantrySet].some((p) => i.name.includes(p) || p.includes(i.name)),
    );
    const pantryMatch =
      matchedIngredients.length / Math.max(1, recipe.ingredients.length);
    if (pantryMatch > 0.4) {
      score += SCORE.PANTRY_MATCH * pantryMatch;
      reasons.push(
        `Evdeki malzemelerle ${Math.round(pantryMatch * 100)}% uyumlu.`,
      );
    }

    // Not recently eaten
    if (!recentSet.has(recipe.id)) {
      score += SCORE.NOT_RECENTLY_EATEN;
    } else {
      score -= 1;
      reasons.push("Son günlerde yenmiş olabilir.");
    }

    // Time match
    if (timeBudgetMinutes && recipe.prepTimeMinutes <= timeBudgetMinutes) {
      score += SCORE.TIME_MATCH;
      reasons.push(`${recipe.prepTimeMinutes} dakikada hazır.`);
    }

    // Profile preferences (cuisine + dislikes)
    let dislikeHits = 0;
    let cuisineHits = 0;
    for (const profile of profiles) {
      if (profile.favoriteCuisines.includes(recipe.cuisine)) {
        score += SCORE.CUISINE_LOVE;
        cuisineHits++;
      }
      for (const d of profile.hardDislikes) {
        if (
          recipe.ingredients.some((i) =>
            i.name
              .toLocaleLowerCase("tr-TR")
              .includes(d.toLocaleLowerCase("tr-TR")),
          )
        ) {
          score += SCORE.DISLIKE;
          dislikeHits++;
        }
      }
    }
    if (cuisineHits > 0) {
      reasons.push(`Ev halkının sevdiği ${recipe.cuisine} mutfağından.`);
    }
    if (dislikeHits > 0) {
      reasons.push("Bazı sevmediğin malzemeler içerebilir.");
    }

    // Behavioral learning (recipe-level votes)
    const vs = recipeVotes.get(recipe.id) ?? [];
    for (const v of vs) {
      if (v.voteType === "like") score += SCORE.LIKE;
      if (v.voteType === "superlike") score += SCORE.SUPERLIKE;
      if (v.voteType === "dislike") score += SCORE.DISLIKE;
      if (v.voteType === "superdislike") score += SCORE.SUPERDISLIKE;
    }

    const householdCompatibility = clamp(0.6 + score * 0.04, 0, 1);

    if (reasons.length === 0) {
      reasons.push("Ev halkına uygun klasik bir öneri.");
    }

    recommendations.push({
      recipe,
      score,
      pantryMatchPercent: Math.round(pantryMatch * 100),
      householdCompatibilityPercent: Math.round(householdCompatibility * 100),
      explanation: reasons[0]!,
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

function groupVotesByRecipe(votes: Vote[]): Map<string, Vote[]> {
  const m = new Map<string, Vote[]>();
  for (const v of votes) {
    const arr = m.get(v.recipeId) ?? [];
    arr.push(v);
    m.set(v.recipeId, arr);
  }
  return m;
}
