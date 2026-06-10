import { openAIJson } from "@/lib/openai";
import { Profile, Recipe } from "@/types/domain";

/**
 * Recipe Adapter.
 * Adapts a recipe to dietary needs, allergies, and pantry limits.
 * Falls back to a deterministic textual hint when no AI key is present.
 */
export interface AdaptInput {
  recipe: Recipe;
  profiles: Profile[];
  pantryNames: string[];
}

export interface AdaptedRecipe {
  title: string;
  notes: string[];
  substitutions: { from: string; to: string }[];
}

export async function adaptRecipe(input: AdaptInput): Promise<AdaptedRecipe> {
  const { recipe, profiles, pantryNames } = input;

  const ai = await openAIJson<AdaptedRecipe>({
    system:
      "Sen bir Türk mutfak asistanısın. Verilen tarifi alerjilere, sevmediklere ve " +
      "evdeki malzemelere göre kısa Türkçe uyarlamalarla döndür. " +
      'JSON formatı: {"title":"...","notes":["..."],"substitutions":[{"from":"...","to":"..."}]}',
    user: JSON.stringify({
      recipe: {
        title: recipe.title,
        ingredients: recipe.ingredients.map((i) => i.name),
      },
      allergies: profiles.flatMap((p) => p.allergies),
      dislikes: profiles.flatMap((p) => p.hardDislikes),
      pantry: pantryNames,
    }),
    temperature: 0.3,
    feature: "recipe_adapt",
  });

  if (ai) return ai;

  // Fallback
  const missing = recipe.ingredients
    .map((i) => i.name)
    .filter((n) => !pantryNames.some((p) => n.includes(p) || p.includes(n)));
  return {
    title: recipe.title,
    notes: missing.length
      ? [`Şu malzemeler eksik olabilir: ${missing.slice(0, 4).join(", ")}.`]
      : ["Tüm malzemeler kilerde mevcut görünüyor."],
    substitutions: [],
  };
}
