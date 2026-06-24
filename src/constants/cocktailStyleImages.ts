import type { ImageSourcePropType } from "react-native";

/**
 * Style-based fallback images for cocktails that have no exact photo of their
 * own (mostly bespoke/craft menu items like "Yuzu Gin Sour" that aren't
 * photographed anywhere by name). We classify the cocktail by keywords in its
 * id/slug and show a representative photo of that drink style, so every card
 * has a thematically appropriate image instead of an emoji.
 *
 * Reference images are reused from the already-downloaded classic photos in
 * assets/cocktails/content/.
 */
export const STYLE_IMAGES: Record<string, ImageSourcePropType> = {
  margarita: require("../../assets/cocktails/content/margarita.jpg"),
  "espresso-martini": require("../../assets/cocktails/content/espresso-martini.jpg"),
  martini: require("../../assets/cocktails/content/dry-martini.jpg"),
  negroni: require("../../assets/cocktails/content/negroni.jpg"),
  mojito: require("../../assets/cocktails/content/mojito.jpg"),
  daiquiri: require("../../assets/cocktails/content/daiquiri.jpg"),
  sour: require("../../assets/cocktails/content/whiskey-sour.jpg"),
  mule: require("../../assets/cocktails/content/moscow-mule.jpg"),
  collins: require("../../assets/cocktails/content/tom-collins.jpg"),
  highball: require("../../assets/cocktails/content/tom-collins.jpg"),
  fizz: require("../../assets/cocktails/content/gin-fizz.jpg"),
  spritz: require("../../assets/cocktails/content/aperol-spritz.jpg"),
  colada: require("../../assets/cocktails/content/pina-colada.jpg"),
  julep: require("../../assets/cocktails/content/mint-julep.jpg"),
  smash: require("../../assets/cocktails/content/mojito.jpg"),
  bramble: require("../../assets/cocktails/content/bramble.jpg"),
  stormy: require("../../assets/cocktails/content/dark-n-stormy.jpg"),
  americano: require("../../assets/cocktails/content/americano.jpg"),
  boulevardier: require("../../assets/cocktails/content/boulevardier.jpg"),
  paloma: require("../../assets/cocktails/content/paloma.jpg"),
  cosmo: require("../../assets/cocktails/content/cosmopolitan.jpg"),
  manhattan: require("../../assets/cocktails/content/manhattan.jpg"),
  "mai-tai": require("../../assets/cocktails/content/mai-tai.jpg"),
  tiki: require("../../assets/cocktails/content/zombie.jpg"),
  punch: require("../../assets/cocktails/content/mai-tai.jpg"),
  "old-fashioned": require("../../assets/cocktails/content/old-fashioned.jpg"),
};

/** Default image when no style keyword matches. */
const DEFAULT_STYLE: ImageSourcePropType = require("../../assets/cocktails/content/old-fashioned.jpg");

/**
 * Ordered keyword → style rules. The first keyword found in the cocktail slug
 * wins, so more specific styles must come before generic ones.
 */
const STYLE_RULES: { kw: string; style: string }[] = [
  { kw: "espresso-martini", style: "espresso-martini" },
  { kw: "espresso", style: "espresso-martini" },
  { kw: "margarita", style: "margarita" },
  { kw: "mezcalita", style: "margarita" },
  { kw: "negroni", style: "negroni" },
  { kw: "boulevardier", style: "boulevardier" },
  { kw: "americano", style: "americano" },
  { kw: "mojito", style: "mojito" },
  { kw: "daiquiri", style: "daiquiri" },
  { kw: "caipir", style: "mojito" },
  { kw: "mule", style: "mule" },
  { kw: "collins", style: "collins" },
  { kw: "highball", style: "highball" },
  { kw: "tonic", style: "highball" },
  { kw: "fizz", style: "fizz" },
  { kw: "spritz", style: "spritz" },
  { kw: "colada", style: "colada" },
  { kw: "julep", style: "julep" },
  { kw: "smash", style: "smash" },
  { kw: "bramble", style: "bramble" },
  { kw: "stormy", style: "stormy" },
  { kw: "paloma", style: "paloma" },
  { kw: "cosmo", style: "cosmo" },
  { kw: "manhattan", style: "manhattan" },
  { kw: "mai-tai", style: "mai-tai" },
  { kw: "zombie", style: "tiki" },
  { kw: "tiki", style: "tiki" },
  { kw: "punch", style: "punch" },
  { kw: "old-fashioned", style: "old-fashioned" },
  { kw: "sour", style: "sour" },
  { kw: "martini", style: "martini" },
];

/**
 * Returns a representative style image for a cocktail id/slug, or the default
 * classic photo if nothing matches. Always returns an image (never null).
 */
export function getStyleImage(cocktailId: string): ImageSourcePropType {
  const slug = cocktailId.replace(/^cocktail-/, "").toLowerCase();
  for (const { kw, style } of STYLE_RULES) {
    if (slug.includes(kw)) return STYLE_IMAGES[style] ?? DEFAULT_STYLE;
  }
  return DEFAULT_STYLE;
}
