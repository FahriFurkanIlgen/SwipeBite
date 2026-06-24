// Hand-maintained image map for the curated FAMOUS_COCKTAILS classics.
// Unlike cocktailDbImages.ts (auto-generated), this file is safe to edit by
// hand and is NOT overwritten by scripts/import-cocktaildb.ts.
//
// Keyed by Cocktail.id so resolveCocktailImage can fall back to it.
import type { ImageSourcePropType } from "react-native";

export const FAMOUS_COCKTAIL_IMAGES: Record<string, ImageSourcePropType> = {
  "cocktail-negroni": require("../../assets/cocktails/negroni.jpg"),
  "cocktail-aperol-spritz": require("../../assets/cocktails/aperol-spritz.jpg"),
  "cocktail-margarita": require("../../assets/cocktails/margarita.jpg"),
  "cocktail-mojito": require("../../assets/cocktails/mojito.jpg"),
  "cocktail-old-fashioned": require("../../assets/cocktails/old-fashioned.jpg"),
  "cocktail-espresso-martini": require("../../assets/cocktails/espresso-martini.jpg"),
  "cocktail-whiskey-sour": require("../../assets/cocktails/whiskey-sour.jpg"),
  "cocktail-cosmopolitan": require("../../assets/cocktails/cosmopolitan.jpg"),
  "cocktail-manhattan": require("../../assets/cocktails/manhattan.jpg"),
  "cocktail-moscow-mule": require("../../assets/cocktails/moscow-mule.jpg"),
  "cocktail-paloma": require("../../assets/cocktails/paloma.jpg"),
  "cocktail-french-75": require("../../assets/cocktails/french-75.jpg"),
};
