import type { ImageSourcePropType } from "react-native";
import { EXCEL_INFLUENCER_IMAGES } from "./influencerImages.excel";
import { SCRAPED_INFLUENCER_IMAGES } from "./influencerImages.scraped";

/**
 * Combined local image map for influencer recipes. Hand-written merger of
 * the two auto-generated source maps.
 */
export const INFLUENCER_IMAGES: Record<string, ImageSourcePropType> = {
  ...EXCEL_INFLUENCER_IMAGES,
  ...SCRAPED_INFLUENCER_IMAGES,
};
