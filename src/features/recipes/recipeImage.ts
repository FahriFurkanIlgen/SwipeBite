/**
 * Resolve the correct image source for a Recipe.
 *
 * Influencer recipes (kept in `INFLUENCER_RECIPES`) store images locally under
 * `assets/influencer/` because Instagram CDN URLs expire within hours. For
 * those recipes the `imageUrl` field uses a `local:<id>` sentinel and the real
 * module is in the `INFLUENCER_IMAGES` map. Everything else just uses the
 * remote URL as-is.
 */
import type { ImageSourcePropType } from "react-native";
import { INFLUENCER_IMAGES } from "@/constants/influencerImages";

export function getRecipeImageSource(recipe: {
  id: string;
  imageUrl: string;
}): ImageSourcePropType {
  const local = INFLUENCER_IMAGES[recipe.id];
  if (local) return local;
  return { uri: recipe.imageUrl };
}
