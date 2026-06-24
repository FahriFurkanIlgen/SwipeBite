import type { ImageSourcePropType } from "react-native";

import { COCKTAILDB_IMAGES } from "@/constants/cocktailDbImages";
import { CONTENT_COCKTAIL_IMAGES } from "@/constants/contentCocktailImages";
import { getStyleImage } from "@/constants/cocktailStyleImages";
import { FAMOUS_COCKTAIL_IMAGES } from "@/constants/famousCocktailImages";

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
  // El ile küratörlü klasikler (FAMOUS_COCKTAILS) id üzerinden eşlenir.
  if (FAMOUS_COCKTAIL_IMAGES[cocktailId]) {
    return FAMOUS_COCKTAIL_IMAGES[cocktailId];
  }
  // İçerik havuzu (COCKTAIL_CONTENT_EN) için TheCocktailDB'den indirilen görseller.
  if (CONTENT_COCKTAIL_IMAGES[cocktailId]) {
    return CONTENT_COCKTAIL_IMAGES[cocktailId];
  }
  if (!imageUrl) {
    // imageUrl set edilmemişse ama id `cdb-` ile başlıyorsa map'ten dene
    if (cocktailId.startsWith("cdb-") && COCKTAILDB_IMAGES[cocktailId]) {
      return COCKTAILDB_IMAGES[cocktailId];
    }
    // Kendi fotoğrafı olmayan craft kokteyller için stile göre temsili görsel.
    return getStyleImage(cocktailId);
  }
  if (imageUrl.startsWith("cocktaildb:")) {
    const id = `cdb-${imageUrl.slice("cocktaildb:".length)}`;
    return COCKTAILDB_IMAGES[id] ?? getStyleImage(cocktailId);
  }
  if (/^https?:\/\//.test(imageUrl)) {
    return { uri: imageUrl };
  }
  return getStyleImage(cocktailId);
}
