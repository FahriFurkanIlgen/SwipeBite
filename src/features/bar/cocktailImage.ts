import type { ImageSourcePropType } from "react-native";

import { COCKTAILDB_IMAGES } from "@/constants/cocktailDbImages";

/**
 * Bir kokteyl için görsel kaynağını (require ile bundle edilmiş veya remote URL)
 * çözümler. `cocktaildb:slug` ön ekiyle başlayan id'ler offline bundle'dan gelir.
 *
 * Kullanım:
 *   const src = resolveCocktailImage(cocktail.imageUrl, cocktail.id);
 *   {src && <Image source={src} ... />}
 */
export function resolveCocktailImage(
  imageUrl: string | undefined,
  cocktailId: string,
): ImageSourcePropType | null {
  if (!imageUrl) {
    // imageUrl set edilmemişse ama id `cdb-` ile başlıyorsa map'ten dene
    if (cocktailId.startsWith("cdb-") && COCKTAILDB_IMAGES[cocktailId]) {
      return COCKTAILDB_IMAGES[cocktailId];
    }
    return null;
  }
  if (imageUrl.startsWith("cocktaildb:")) {
    const id = `cdb-${imageUrl.slice("cocktaildb:".length)}`;
    return COCKTAILDB_IMAGES[id] ?? null;
  }
  if (/^https?:\/\//.test(imageUrl)) {
    return { uri: imageUrl };
  }
  return null;
}
