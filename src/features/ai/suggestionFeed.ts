import { PantryItem, Recipe, WeeklyPlan } from "@/types/domain";
import { findCookableRecipes } from "@/features/pantry/pantryMatcher";

export interface AISuggestion {
  id: string;
  message: string;
  icon?: "sparkles" | "basket" | "calendar" | "time" | "leaf";
}

interface SuggestionInputs {
  pantry: PantryItem[];
  recipes: Recipe[];
  plan: WeeklyPlan | null;
  recentCookedRecipeIds: string[];
  /** ISO date strings, sorted desc. */
  recentSessionDates: string[];
  hourOfDay?: number;
}

/**
 * Build a list of contextual AI-style suggestion bubbles for the home screen.
 * Pure function — easy to test and replace with a real model later.
 */
export function buildHomeSuggestions(inputs: SuggestionInputs): AISuggestion[] {
  const {
    pantry,
    recipes,
    plan,
    recentCookedRecipeIds,
    recentSessionDates,
    hourOfDay = new Date().getHours(),
  } = inputs;

  const suggestions: AISuggestion[] = [];

  // 1) Pantry-based cookable count
  if (pantry.length > 0) {
    const cookable = findCookableRecipes(pantry, recipes, {
      minCoverage: 50,
      limit: 50,
    });
    if (cookable.length > 0) {
      suggestions.push({
        id: "pantry-cookable",
        icon: "basket",
        message:
          cookable.length === 1
            ? `Şu anda kilerinle ${cookable[0]?.recipe.title} yapabilirsin.`
            : `Şu anda kilerinle ${cookable.length} farklı tarif yapabilirsin.`,
      });
    } else {
      suggestions.push({
        id: "pantry-empty-match",
        icon: "basket",
        message:
          "Kilerinle birebir uyumlu tarif az — birkaç malzeme daha eklemek ister misin?",
      });
    }
  } else {
    suggestions.push({
      id: "pantry-empty",
      icon: "basket",
      message:
        "Kilerine 5 malzeme ekle, AI sana doğrudan yapabileceğin tarifleri önersin.",
    });
  }

  // 2) Cuisine / category absence — e.g., haven't had soup recently
  const cookedRecipes = recentCookedRecipeIds
    .map((id) => recipes.find((r) => r.id === id))
    .filter((r): r is Recipe => !!r);
  const hadSoupRecently = cookedRecipes.some((r) => r.tags.includes("çorba"));
  if (!hadSoupRecently && cookedRecipes.length >= 2) {
    suggestions.push({
      id: "no-soup",
      icon: "leaf",
      message: "Son günlerde çorba yapmamışsın. Mercimek çorbası nasıl olur?",
    });
  }

  // 3) Time-of-day cue
  if (hourOfDay >= 17 && hourOfDay <= 20) {
    suggestions.push({
      id: "evening",
      icon: "time",
      message:
        "Akşam yemeği zamanı yaklaşıyor. 25 dakikada hazır pratik bir tarif öneririm.",
    });
  } else if (hourOfDay >= 10 && hourOfDay <= 12) {
    suggestions.push({
      id: "lunch",
      icon: "time",
      message: "Öğle için hafif bir şey ister misin?",
    });
  }

  // 4) Weekly plan nudge
  if (!plan) {
    suggestions.push({
      id: "no-plan",
      icon: "calendar",
      message:
        "Bu hafta için henüz plan yok. 30 saniyede bir plan oluşturayım mı?",
    });
  } else if (plan.groceryList.length > 0) {
    suggestions.push({
      id: "grocery-ready",
      icon: "calendar",
      message: `Bu haftanın listesinde ${plan.groceryList.length} kalem malzeme var.`,
    });
  }

  // 5) Activity gap
  if (recentSessionDates.length === 0) {
    suggestions.push({
      id: "no-sessions",
      icon: "sparkles",
      message: "İlk eşleşme oturumunu başlat — 2 dakikada karar verirsin.",
    });
  }

  // Keep it short on the home screen.
  return suggestions.slice(0, 3);
}
