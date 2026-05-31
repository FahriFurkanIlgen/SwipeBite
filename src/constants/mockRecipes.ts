import { Recipe } from "@/types/domain";
import { THEMEALDB_RECIPES } from "./themealdbRecipes";
import { AI_GENERATED_RECIPES } from "./aiGeneratedRecipes";
import { YEMEKCOM_RECIPES } from "./yemekcomRecipes";

/**
 * Curated Turkish household recipes — hand-written, the meals families
 * actually cook. Used as the "base" catalogue.
 *
 * Additional recipes come from:
 *  - YEMEKCOM_RECIPES: scripts/scrape-yemekcom.ts (Türkçe, görselli, geniş)
 *  - AI_GENERATED_RECIPES: scripts/generate-recipes-ai.ts (Turkish, AI-made)
 *  - THEMEALDB_RECIPES: disabled (pork-heavy)
 *
 * `MOCK_RECIPES` is the merged catalogue exposed to the app.
 */
export const CURATED_RECIPES: Recipe[] = [
  {
    id: "r-mercimek",
    title: "Mercimek Çorbası",
    description: "Klasik, sıcacık ve ev hissi veren kırmızı mercimek çorbası.",
    imageUrl:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=1200",
    prepTimeMinutes: 30,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "kırmızı mercimek", quantity: "1 su bardağı" },
      { name: "soğan", quantity: "1 adet" },
      { name: "havuç", quantity: "1 adet" },
      { name: "patates", quantity: "1 adet" },
      { name: "tereyağı", quantity: "1 yemek kaşığı" },
      { name: "kırmızı toz biber", quantity: "1 tatlı kaşığı" },
      { name: "tuz", quantity: "tadında" },
    ],
    steps: [
      "Soğan, havuç ve patatesi küçük doğra.",
      "Tencerede tereyağında soğanı pembeleştir.",
      "Mercimek ve sebzeleri ekle, üzerine sıcak su koy.",
      "Yumuşayana kadar 25 dk kısık ateşte pişir.",
      "Blendırdan geçir, üzerine kızdırılmış toz biberli yağ gez.",
    ],
    tags: ["çorba", "vejetaryen", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-kuru-fasulye",
    title: "Kuru Fasulye",
    description: "Pilav üstü kuru fasulye — kalabalık sofraların vazgeçilmezi.",
    imageUrl:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1200",
    prepTimeMinutes: 60,
    difficulty: "orta",
    servings: 4,
    ingredients: [
      { name: "kuru fasulye", quantity: "2 su bardağı" },
      { name: "soğan", quantity: "1 adet" },
      { name: "salça", quantity: "1 yemek kaşığı" },
      { name: "sucuk", quantity: "opsiyonel" },
      { name: "zeytinyağı", quantity: "3 yemek kaşığı" },
    ],
    steps: [
      "Fasulyeleri bir gece önceden ıslat.",
      "Soğanı yağda kavur, salçayı ekle.",
      "Süzülmüş fasulyeyi ve sıcak suyu ekle.",
      "Yumuşayana kadar 45 dk pişir.",
      "Pilavla servis et.",
    ],
    tags: ["ana yemek", "aile", "klasik"],
    cuisine: "Türk",
  },
  {
    id: "r-tavuk-sote",
    title: "Tavuk Sote",
    description: "Renkli biberlerle hızlı bir akşam yemeği.",
    imageUrl:
      "https://images.unsplash.com/photo-1604908554007-b0db4cce6dba?w=1200",
    prepTimeMinutes: 25,
    difficulty: "kolay",
    servings: 3,
    ingredients: [
      { name: "tavuk göğsü", quantity: "500 g" },
      { name: "kırmızı biber", quantity: "1 adet" },
      { name: "yeşil biber", quantity: "1 adet" },
      { name: "soğan", quantity: "1 adet" },
      { name: "domates", quantity: "2 adet" },
      { name: "zeytinyağı", quantity: "2 yk" },
    ],
    steps: [
      "Tavuğu kuşbaşı doğrayıp yağda mühürle.",
      "Soğan ve biberleri ekle, 5 dk sote et.",
      "Doğranmış domatesi ekle, suyunu çekene kadar pişir.",
      "Tuz, karabiber ve maydanozla servis et.",
    ],
    tags: ["ana yemek", "tavuk", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-menemen",
    title: "Menemen",
    description: "Kahvaltının ya da geç bir akşamın kurtarıcısı.",
    imageUrl:
      "https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=1200",
    prepTimeMinutes: 15,
    difficulty: "kolay",
    servings: 2,
    ingredients: [
      { name: "yumurta", quantity: "4 adet" },
      { name: "domates", quantity: "2 adet" },
      { name: "sivri biber", quantity: "2 adet" },
      { name: "tereyağı", quantity: "1 yk" },
    ],
    steps: [
      "Biberleri tereyağında kavur.",
      "Soyulmuş domatesi ekle, suyunu çekene kadar pişir.",
      "Yumurtaları kır, yavaşça karıştır.",
      "Tuz ve karabiberle servis et.",
    ],
    tags: ["kahvaltı", "vejetaryen", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-makarna",
    title: "Tereyağlı Makarna",
    description: "Hızlı, doyurucu ve herkesin sevdiği klasik.",
    imageUrl:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200",
    prepTimeMinutes: 15,
    difficulty: "kolay",
    servings: 2,
    ingredients: [
      { name: "makarna", quantity: "250 g" },
      { name: "tereyağı", quantity: "2 yk" },
      { name: "kaşar peyniri", quantity: "rendelenmiş" },
    ],
    steps: [
      "Makarnayı tuzlu suda haşla.",
      "Süzdükten sonra tereyağıyla harmanla.",
      "Üzerine rendelenmiş kaşar serp.",
    ],
    tags: ["ana yemek", "pratik", "çocuk dostu"],
    cuisine: "İtalyan-Türk",
  },
  {
    id: "r-firinda-kofte",
    title: "Fırında Köfte Patates",
    description: "Tek tepside aile yemeği.",
    imageUrl:
      "https://images.unsplash.com/photo-1565895405138-6c3a1555da6a?w=1200",
    prepTimeMinutes: 50,
    difficulty: "orta",
    servings: 4,
    ingredients: [
      { name: "kıyma", quantity: "500 g" },
      { name: "patates", quantity: "3 adet" },
      { name: "domates", quantity: "2 adet" },
      { name: "biber", quantity: "2 adet" },
      { name: "salça", quantity: "1 yk" },
    ],
    steps: [
      "Kıymayı baharatla yoğur, köfte şekli ver.",
      "Sebzeleri ve köfteleri tepsiye diz.",
      "Salçalı sıcak suyu üzerine dök.",
      "180°C fırında 40 dk pişir.",
    ],
    tags: ["ana yemek", "aile", "fırın"],
    cuisine: "Türk",
  },
  {
    id: "r-yayla",
    title: "Yayla Çorbası",
    description: "Yoğurtlu, naneli, ferah bir çorba.",
    imageUrl:
      "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=1200",
    prepTimeMinutes: 30,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "yoğurt", quantity: "2 su bardağı" },
      { name: "pirinç", quantity: "1/2 su bardağı" },
      { name: "yumurta sarısı", quantity: "1 adet" },
      { name: "kuru nane", quantity: "1 tk" },
      { name: "tereyağı", quantity: "1 yk" },
    ],
    steps: [
      "Pirinci suda haşla.",
      "Yoğurt, un ve yumurtayı çırp, çorbaya temperle.",
      "Üzerine naneli tereyağı gez.",
    ],
    tags: ["çorba", "vejetaryen"],
    cuisine: "Türk",
  },
  {
    id: "r-kabak-mucver",
    title: "Kabak Mücver",
    description: "Yoğurtla muhteşem, hafif bir akşam yemeği.",
    imageUrl:
      "https://images.unsplash.com/photo-1604908177522-401b1c364c5b?w=1200",
    prepTimeMinutes: 25,
    difficulty: "kolay",
    servings: 3,
    ingredients: [
      { name: "kabak", quantity: "2 adet" },
      { name: "yumurta", quantity: "2 adet" },
      { name: "un", quantity: "3 yk" },
      { name: "beyaz peynir", quantity: "100 g" },
      { name: "dereotu", quantity: "bir tutam" },
    ],
    steps: [
      "Kabağı rendele, suyunu sık.",
      "Tüm malzemeleri karıştır.",
      "Kaşıkla yağa al, kızart.",
    ],
    tags: ["vejetaryen", "hafif"],
    cuisine: "Türk",
  },
  {
    id: "r-zeytinyagli-fasulye",
    title: "Zeytinyağlı Taze Fasulye",
    description: "Soğuk servis edilen, ferah bir klasik.",
    imageUrl:
      "https://images.unsplash.com/photo-1604908554007-1c1f1d7b9e7f?w=1200",
    prepTimeMinutes: 40,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "taze fasulye", quantity: "500 g" },
      { name: "soğan", quantity: "1 adet" },
      { name: "domates", quantity: "1 adet" },
      { name: "zeytinyağı", quantity: "4 yk" },
      { name: "şeker", quantity: "1 tk" },
    ],
    steps: [
      "Soğanı yağda kavur.",
      "Fasulyeyi ekle, kısaca çevir.",
      "Domates, şeker ve sıcak su ekle.",
      "Kısık ateşte yumuşayana kadar pişir, soğuk servis et.",
    ],
    tags: ["zeytinyağlı", "vejetaryen", "hafif"],
    cuisine: "Türk",
  },
  {
    id: "r-pilav",
    title: "Tereyağlı Şehriyeli Pilav",
    description: "Her yemeğin yanına yakışan klasik.",
    imageUrl:
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=1200",
    prepTimeMinutes: 25,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "pirinç", quantity: "2 su bardağı" },
      { name: "tel şehriye", quantity: "1/2 su bardağı" },
      { name: "tereyağı", quantity: "2 yk" },
      { name: "tuz", quantity: "1 tk" },
    ],
    steps: [
      "Şehriyeyi tereyağında pembeleştir.",
      "Yıkanmış pirinci ekle, kısaca kavur.",
      "Sıcak suyu ekle, tuzla, kapağı kapatıp kısık ateşte pişir.",
      "10 dk demlendir.",
    ],
    tags: ["yan yemek", "klasik"],
    cuisine: "Türk",
  },
  {
    id: "r-sucuklu-yumurta",
    title: "Sucuklu Yumurta",
    description: "Kahvaltıların kralı.",
    imageUrl:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200",
    prepTimeMinutes: 10,
    difficulty: "kolay",
    servings: 2,
    ingredients: [
      { name: "sucuk", quantity: "6 dilim" },
      { name: "yumurta", quantity: "3 adet" },
      { name: "tereyağı", quantity: "1 tk" },
    ],
    steps: [
      "Sucukları sahanda kızart.",
      "Yumurtaları kır, sarısı akışkan kalacak şekilde pişir.",
    ],
    tags: ["kahvaltı", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-imam-bayildi",
    title: "İmam Bayıldı",
    description: "Zeytinyağlı, doyurucu, ev sofrasının ışığı.",
    imageUrl:
      "https://images.unsplash.com/photo-1626078297007-1e8b3a5c79b1?w=1200",
    prepTimeMinutes: 55,
    difficulty: "orta",
    servings: 4,
    ingredients: [
      { name: "patlıcan", quantity: "4 adet" },
      { name: "soğan", quantity: "2 adet" },
      { name: "domates", quantity: "2 adet" },
      { name: "sarımsak", quantity: "4 diş" },
      { name: "zeytinyağı", quantity: "5 yk" },
    ],
    steps: [
      "Patlıcanları alaca soyup tuzlu suda beklet.",
      "İç harcı için soğan, sarımsak ve domatesi pişir.",
      "Patlıcanları hafif kızart, içini doldur.",
      "Tencerede zeytinyağı ve suyla 30 dk pişir.",
    ],
    tags: ["zeytinyağlı", "vejetaryen"],
    cuisine: "Türk",
  },
  {
    id: "r-mantarli-milfoy-tart",
    title: "Mantarlı Milföy Tart",
    description:
      "Çıtır milföy üzerinde mantarlı, aromatik ve pratik bir fırın lezzeti.",
    imageUrl:
      "https://images.unsplash.com/photo-1565299543923-37dd37887442?w=1200",
    prepTimeMinutes: 45,
    difficulty: "orta",
    servings: 4,
    ingredients: [
      { name: "milföy", quantity: "9 adet" },
      { name: "mantar", quantity: "400 gr" },
      { name: "soğan", quantity: "2 adet" },
      { name: "tereyağı", quantity: "2 yk" },
      { name: "yumurta sarısı", quantity: "1 adet" },
    ],
    steps: [
      "Mantar ve soğanı tavada sotele.",
      "Milföyleri fırın tepsisine yerleştir.",
      "Mantarlı harcı milföyün üzerine yay.",
      "Üzerini yumurta sarısıyla fırçala ve kızarana kadar pişir.",
    ],
    tags: ["hamurlu", "fırın", "vejetaryen", "mantar"],
    cuisine: "Türk",
  },
  {
    id: "r-zeytinyagli-kabak-siyirma",
    title: "Zeytinyağlı Kabak Sıyırma",
    description:
      "Hafif, ferah ve yaz sofralarına uygun zeytinyağlı kabak yemeği.",
    imageUrl:
      "https://images.unsplash.com/photo-1598511757337-fe2cafc31ba0?w=1200",
    prepTimeMinutes: 35,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "kabak", quantity: "2 adet" },
      { name: "soğan", quantity: "1 adet" },
      { name: "pirinç", quantity: "1/4 su bardağı" },
      { name: "zeytinyağı", quantity: "1 su bardağı" },
      { name: "limon", quantity: "1 adet" },
    ],
    steps: [
      "Soğanı zeytinyağında yumuşayana kadar pişir.",
      "Pirinci ekleyip kısa süre çevir.",
      "İnce doğranmış kabakları ekle.",
      "Limon suyu ve yeşilliklerle tamamlayıp soğuk servis et.",
    ],
    tags: ["zeytinyağlı", "vejetaryen", "hafif", "sebze"],
    cuisine: "Türk",
  },
  {
    id: "r-girit-ezmeli-borek",
    title: "Girit Ezmeli Börek",
    description:
      "Peynirli ve fesleğenli iç harcıyla doyurucu, özel sofralık bir börek.",
    imageUrl:
      "https://images.unsplash.com/photo-1612392061787-2d078b3e573d?w=1200",
    prepTimeMinutes: 60,
    difficulty: "orta",
    servings: 6,
    ingredients: [
      { name: "yufka", quantity: "3 adet" },
      { name: "yoğurt", quantity: "1 su bardağı" },
      { name: "zeytinyağı", quantity: "1/2 su bardağı" },
      { name: "beyaz peynir", quantity: "250 gr" },
      { name: "lor peyniri", quantity: "250 gr" },
    ],
    steps: [
      "Peynirleri ezip yeşilliklerle karıştır.",
      "Yufkaları soslayarak üst üste diz.",
      "İç harcı yayıp böreği şekillendir.",
      "Fırında üzeri kızarana kadar pişir.",
    ],
    tags: ["börek", "hamurlu", "peynirli", "kahvaltı"],
    cuisine: "Türk",
  },
  {
    id: "r-bademli-kabak-tarator",
    title: "Bademli Kabak Tarator",
    description: "Yoğurtlu, kabaklı ve bademli ferah bir meze alternatifi.",
    imageUrl:
      "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=1200",
    prepTimeMinutes: 25,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "kabak", quantity: "2 adet" },
      { name: "süzme yoğurt", quantity: "1.5 su bardağı" },
      { name: "sarımsak", quantity: "1 diş" },
      { name: "zeytinyağı", quantity: "2 yk" },
      { name: "file badem", quantity: "1 avuç" },
    ],
    steps: [
      "Kabakları rendeleyip tavada sotele.",
      "Yoğurt, sarımsak ve tuzu karıştır.",
      "Soğuyan kabağı yoğurtlu karışıma ekle.",
      "Üzerine kavrulmuş badem serpip servis et.",
    ],
    tags: ["meze", "yoğurtlu", "vejetaryen", "hafif"],
    cuisine: "Türk",
  },
  {
    id: "r-cilekli-semizotu-salatasi",
    title: "Çilekli Semizotu Salatası",
    description: "Tatlı-ekşi dengesiyle farklı, ferah ve hafif bir salata.",
    imageUrl:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200",
    prepTimeMinutes: 15,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "semizotu", quantity: "2 bağ" },
      { name: "çilek", quantity: "10 adet" },
      { name: "ceviz", quantity: "1 su bardağı" },
      { name: "zeytinyağı", quantity: "6 yk" },
      { name: "limon suyu", quantity: "1/4 limon" },
    ],
    steps: [
      "Semizotunu ayıklayıp yıka.",
      "Çilekleri dilimle, cevizi iri parçala.",
      "Sos malzemelerini karıştır.",
      "Tüm malzemeleri harmanlayıp servis et.",
    ],
    tags: ["salata", "hafif", "vejetaryen", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-beef-wellington",
    title: "Beef Wellington",
    description:
      "Milföy kaplı bonfileyle hazırlanan gösterişli ve özel günlere uygun bir ana yemek.",
    imageUrl:
      "https://images.unsplash.com/photo-1558030006-450675393462?w=1200",
    prepTimeMinutes: 90,
    difficulty: "zor",
    servings: 4,
    ingredients: [
      { name: "bonfile", quantity: "700 gr" },
      { name: "milföy", quantity: "5 adet" },
      { name: "mantar", quantity: "10 adet" },
      { name: "sarımsak", quantity: "2 diş" },
      { name: "yumurta sarısı", quantity: "1 adet" },
    ],
    steps: [
      "Bonfileyi tavada mühürle.",
      "Mantar harcını hazırlayıp soğut.",
      "Eti milföy ve mantarlı harçla sar.",
      "Üzerini yumurta sarısıyla fırçala ve fırında pişir.",
    ],
    tags: ["et", "özel gün", "fırın", "dünya mutfağı"],
    cuisine: "İngiliz",
  },
  {
    id: "r-cikolata-mus-tiramisu",
    title: "Çikolata Mus Tiramisu",
    description:
      "Kahve ve çikolata sevenler için yoğun aromalı, katmanlı bir tatlı.",
    imageUrl:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=1200",
    prepTimeMinutes: 50,
    difficulty: "orta",
    servings: 6,
    ingredients: [
      { name: "kedidili", quantity: "1 paket" },
      { name: "granül kahve", quantity: "2 yk" },
      { name: "bitter çikolata", quantity: "290 gr" },
      { name: "yumurta", quantity: "4 adet" },
      { name: "krema", quantity: "1 su bardağı" },
    ],
    steps: [
      "Kahveli karışımı hazırla.",
      "Çikolatalı mus katmanını hazırla.",
      "Kedidillerini kahveyle ıslat.",
      "Katmanları oluşturup buzdolabında dinlendir.",
    ],
    tags: ["tatlı", "çikolatalı", "kahveli", "özel gün"],
    cuisine: "İtalyan",
  },
  {
    id: "r-isvec-keki-kladdkaka",
    title: "İsveç Keki - Kladdkaka",
    description: "Dışı hafif pişmiş, içi yoğun çikolatalı pratik bir kek.",
    imageUrl:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=1200",
    prepTimeMinutes: 40,
    difficulty: "orta",
    servings: 6,
    ingredients: [
      { name: "tereyağı", quantity: "200 gr" },
      { name: "bitter çikolata", quantity: "200 gr" },
      { name: "toz şeker", quantity: "250 gr" },
      { name: "yumurta", quantity: "4 adet" },
      { name: "un", quantity: "40 gr" },
    ],
    steps: [
      "Tereyağı ve çikolatayı erit.",
      "Yumurta ve şekeri karıştır.",
      "Unu ekleyip kısa süre karıştır.",
      "Kalıba alıp içi hafif nemli kalacak şekilde pişir.",
    ],
    tags: ["tatlı", "kek", "çikolatalı", "dünya mutfağı"],
    cuisine: "İsveç",
  },
  {
    id: "r-muzlu-ters-yuz-pasta",
    title: "Muzlu Ters Yüz Pasta",
    description:
      "Karamelli muz tabanı ve yumuşak kek dokusuyla keyifli bir ev tatlısı.",
    imageUrl:
      "https://images.unsplash.com/photo-1606101273945-e9eba91c0dc4?w=1200",
    prepTimeMinutes: 65,
    difficulty: "orta",
    servings: 8,
    ingredients: [
      { name: "muz", quantity: "7 adet" },
      { name: "toz şeker", quantity: "1 su bardağı" },
      { name: "tereyağı", quantity: "125 gr" },
      { name: "yumurta", quantity: "2 adet" },
      { name: "un", quantity: "2 su bardağı" },
    ],
    steps: [
      "Karamel tabanı hazırla.",
      "Muzları kalıba diz.",
      "Kek harcını karıştır.",
      "Harcı muzların üzerine döküp fırında pişir.",
    ],
    tags: ["tatlı", "kek", "muzlu", "comfort_food"],
    cuisine: "Dünya",
  },

  // -------- Meze --------
  {
    id: "r-humus",
    title: "Humus",
    description: "Tahinli, limonlu, sarımsaklı klasik nohut mezesi.",
    imageUrl:
      "https://images.unsplash.com/photo-1571197119282-7c4e2b5b1b65?w=1200",
    prepTimeMinutes: 20,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "haşlanmış nohut", quantity: "2 su bardağı" },
      { name: "tahin", quantity: "3 yk" },
      { name: "limon suyu", quantity: "1 adet" },
      { name: "sarımsak", quantity: "2 diş" },
      { name: "zeytinyağı", quantity: "3 yk" },
      { name: "kimyon", quantity: "1 tk" },
    ],
    steps: [
      "Tüm malzemeleri robota al.",
      "Pürüzsüz olana dek çek.",
      "Tabağa yayıp zeytinyağı ve toz biber gez.",
    ],
    tags: ["meze", "vejetaryen", "vegan", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-haydari",
    title: "Haydari",
    description: "Süzme yoğurtlu, sarımsaklı, naneli klasik meyhane mezesi.",
    imageUrl:
      "https://images.unsplash.com/photo-1604908554007-b0db4cce6dba?w=1200",
    prepTimeMinutes: 10,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "süzme yoğurt", quantity: "500 gr" },
      { name: "sarımsak", quantity: "2 diş" },
      { name: "kuru nane", quantity: "1 tk" },
      { name: "zeytinyağı", quantity: "2 yk" },
      { name: "tuz", quantity: "tadında" },
    ],
    steps: [
      "Süzme yoğurdu kaba al.",
      "Ezilmiş sarımsak, nane, zeytinyağı ve tuz ekle.",
      "İyice karıştır, üzerine bir tutam nane serp.",
    ],
    tags: ["meze", "vejetaryen", "yoğurt", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-babagannus",
    title: "Babagannuş",
    description:
      "Közlenmiş patlıcanın tahin ve limonla buluştuğu Levant mezesi.",
    imageUrl:
      "https://images.unsplash.com/photo-1601000938259-9e92002320b4?w=1200",
    prepTimeMinutes: 35,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "patlıcan", quantity: "3 adet" },
      { name: "tahin", quantity: "2 yk" },
      { name: "limon suyu", quantity: "1 adet" },
      { name: "sarımsak", quantity: "1 diş" },
      { name: "zeytinyağı", quantity: "2 yk" },
    ],
    steps: [
      "Patlıcanları közle.",
      "Kabuklarını soyup içini ezip süz.",
      "Tahin, limon, sarımsak ve zeytinyağı ekle.",
      "Tabağa al, üzerine nar taneleri ile süsle.",
    ],
    tags: ["meze", "vejetaryen", "közleme", "akdeniz"],
    cuisine: "Türk",
  },
  {
    id: "r-acili-ezme",
    title: "Acılı Ezme",
    description: "Domates, biber ve nar ekşili ev usulü acılı ezme.",
    imageUrl:
      "https://images.unsplash.com/photo-1604908812984-c2bb4f73a9ae?w=1200",
    prepTimeMinutes: 15,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "domates", quantity: "3 adet" },
      { name: "sivri biber", quantity: "2 adet" },
      { name: "soğan", quantity: "1 adet" },
      { name: "maydanoz", quantity: "yarım demet" },
      { name: "nar ekşisi", quantity: "2 yk" },
      { name: "pul biber", quantity: "1 tk" },
    ],
    steps: [
      "Sebzeleri ince ince doğra.",
      "Tuz, pul biber ve nar ekşisi ile karıştır.",
      "Buzdolabında 30 dk dinlendir.",
    ],
    tags: ["meze", "vegan", "acılı", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-fava",
    title: "Fava",
    description:
      "Bakla püresi üzerine dereotu ve zeytinyağı — soğuk meze klasiği.",
    imageUrl:
      "https://images.unsplash.com/photo-1601315379744-7d6d0e8d2b46?w=1200",
    prepTimeMinutes: 45,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "kuru bakla içi", quantity: "1 su bardağı" },
      { name: "soğan", quantity: "1 adet" },
      { name: "toz şeker", quantity: "1 tk" },
      { name: "limon", quantity: "1 adet" },
      { name: "dereotu", quantity: "yarım demet" },
      { name: "zeytinyağı", quantity: "3 yk" },
    ],
    steps: [
      "Baklayı bir gece ıslat.",
      "Soğan ve şekerle pişir.",
      "Püre haline getir, kalıba al.",
      "Soğutup zeytinyağı, limon ve dereotu ile servis et.",
    ],
    tags: ["meze", "vegan", "ege", "zeytinyağlı"],
    cuisine: "Türk",
  },
  {
    id: "r-piyaz",
    title: "Piyaz",
    description:
      "Beyaz fasulye, soğan ve sirkeli sosla klasik kuru fasulye mezesi.",
    imageUrl:
      "https://images.unsplash.com/photo-1604908554007-b0db4cce6dba?w=1200",
    prepTimeMinutes: 20,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "haşlanmış beyaz fasulye", quantity: "2 su bardağı" },
      { name: "kırmızı soğan", quantity: "1 adet" },
      { name: "maydanoz", quantity: "yarım demet" },
      { name: "yumurta", quantity: "2 adet (haşlanmış)" },
      { name: "sirke", quantity: "2 yk" },
      { name: "zeytinyağı", quantity: "3 yk" },
    ],
    steps: [
      "Fasulyeyi soğuk suyla bir kez çalkala.",
      "Soğan ve maydanozu ekle.",
      "Sirke, zeytinyağı, tuz ile harmanla.",
      "Üzerine yumurta dilimleri yerleştir.",
    ],
    tags: ["meze", "vejetaryen", "antalya", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-cacik",
    title: "Cacık",
    description: "Yoğurt, salatalık ve nane ile ferahlatıcı yaz mezesi.",
    imageUrl:
      "https://images.unsplash.com/photo-1623428454614-abaf00244e52?w=1200",
    prepTimeMinutes: 10,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "yoğurt", quantity: "500 gr" },
      { name: "salatalık", quantity: "2 adet" },
      { name: "sarımsak", quantity: "1 diş" },
      { name: "kuru nane", quantity: "1 tk" },
      { name: "su", quantity: "1 su bardağı" },
    ],
    steps: [
      "Salatalığı rendele, suyunu hafif sık.",
      "Yoğurt, sarımsak ve su ile karıştır.",
      "Üzerine nane ve zeytinyağı gez.",
    ],
    tags: ["meze", "vejetaryen", "yaz", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-girit-ezmesi",
    title: "Girit Ezmesi",
    description:
      "Beyaz peynir, ceviz ve dereotuyla Ege kahvaltısının baş tacı.",
    imageUrl:
      "https://images.unsplash.com/photo-1604908554007-b0db4cce6dba?w=1200",
    prepTimeMinutes: 10,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "beyaz peynir", quantity: "200 gr" },
      { name: "ceviz içi", quantity: "yarım su bardağı" },
      { name: "dereotu", quantity: "yarım demet" },
      { name: "zeytinyağı", quantity: "3 yk" },
      { name: "limon suyu", quantity: "1 yk" },
    ],
    steps: [
      "Peyniri çatalla ez.",
      "Cevizi iri kıy.",
      "Dereotu, zeytinyağı ve limon ile karıştır.",
    ],
    tags: ["meze", "vejetaryen", "ege", "pratik"],
    cuisine: "Türk",
  },

  // -------- Tatlı --------
  {
    id: "r-sutlac",
    title: "Sütlaç",
    description: "Fırında üzeri kızarmış geleneksel pirinçli süt tatlısı.",
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200",
    prepTimeMinutes: 60,
    difficulty: "orta",
    servings: 6,
    ingredients: [
      { name: "süt", quantity: "1.5 lt" },
      { name: "pirinç", quantity: "yarım su bardağı" },
      { name: "toz şeker", quantity: "1 su bardağı" },
      { name: "nişasta", quantity: "2 yk" },
      { name: "vanilya", quantity: "1 paket" },
    ],
    steps: [
      "Pirinci az suda haşla.",
      "Sütü ekleyip pişir, şekeri kat.",
      "Nişastayı sütle açıp ekle, koyulaşana kadar karıştır.",
      "Kaselere alıp üstü kızarana dek fırınla.",
    ],
    tags: ["tatlı", "sütlü", "klasik", "vejetaryen"],
    cuisine: "Türk",
  },
  {
    id: "r-kazandibi",
    title: "Kazandibi",
    description: "Altı karamelize sütlü tatlı — kahvenin yanına birebir.",
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200",
    prepTimeMinutes: 50,
    difficulty: "orta",
    servings: 6,
    ingredients: [
      { name: "süt", quantity: "1 lt" },
      { name: "toz şeker", quantity: "1 su bardağı" },
      { name: "nişasta", quantity: "4 yk" },
      { name: "un", quantity: "2 yk" },
      { name: "vanilya", quantity: "1 paket" },
    ],
    steps: [
      "Tepsiye şeker serpip karamelize et.",
      "Süt, şeker, nişasta ve unu karıştırıp pişir.",
      "Tepsiye dök, soğut, dilimle.",
    ],
    tags: ["tatlı", "sütlü", "klasik", "vejetaryen"],
    cuisine: "Türk",
  },
  {
    id: "r-revani",
    title: "Revani",
    description:
      "İrmikli, şerbetli, hafif tatlı — bayram sofralarının vazgeçilmezi.",
    imageUrl:
      "https://images.unsplash.com/photo-1605478030918-3ed01c9b9a09?w=1200",
    prepTimeMinutes: 50,
    difficulty: "kolay",
    servings: 8,
    ingredients: [
      { name: "yumurta", quantity: "4 adet" },
      { name: "toz şeker", quantity: "1 su bardağı" },
      { name: "irmik", quantity: "1.5 su bardağı" },
      { name: "un", quantity: "1 su bardağı" },
      { name: "yoğurt", quantity: "1 su bardağı" },
      { name: "kabartma tozu", quantity: "1 paket" },
    ],
    steps: [
      "Yumurta ve şekeri çırp.",
      "Yoğurt, irmik, un ve kabartmayı ekle.",
      "Yağlı tepsiye dök, fırınla.",
      "Soğumaya yakın sıcak şerbet gez.",
    ],
    tags: ["tatlı", "şerbetli", "irmik", "vejetaryen"],
    cuisine: "Türk",
  },
  {
    id: "r-lokma",
    title: "Lokma Tatlısı",
    description: "Mayalı hamurdan kızartılıp şerbete batırılan minik lokmalar.",
    imageUrl:
      "https://images.unsplash.com/photo-1606755456206-b25206cde27e?w=1200",
    prepTimeMinutes: 90,
    difficulty: "orta",
    servings: 8,
    ingredients: [
      { name: "un", quantity: "3 su bardağı" },
      { name: "ılık su", quantity: "2 su bardağı" },
      { name: "yaş maya", quantity: "1 paket" },
      { name: "toz şeker", quantity: "2 yk" },
      { name: "tuz", quantity: "1 tk" },
      { name: "kızartma yağı", quantity: "yeteri kadar" },
    ],
    steps: [
      "Maya, şeker ve ılık suyu karıştır.",
      "Unu ve tuzu ekle, akışkan bir hamur yap.",
      "1 saat mayalandır.",
      "Kızgın yağda kaşıkla porsiyonla, kızart.",
      "Soğuk şerbete bandır.",
    ],
    tags: ["tatlı", "şerbetli", "kızartma", "vejetaryen"],
    cuisine: "Türk",
  },
  {
    id: "r-irmik-helvasi",
    title: "İrmik Helvası",
    description:
      "Tereyağında kavrulmuş irmik ve sütlü şerbetle yapılan klasik helva.",
    imageUrl:
      "https://images.unsplash.com/photo-1606755962774-31a7ff85ee9b?w=1200",
    prepTimeMinutes: 40,
    difficulty: "kolay",
    servings: 6,
    ingredients: [
      { name: "irmik", quantity: "2 su bardağı" },
      { name: "tereyağı", quantity: "100 gr" },
      { name: "süt", quantity: "2 su bardağı" },
      { name: "su", quantity: "1 su bardağı" },
      { name: "toz şeker", quantity: "1.5 su bardağı" },
      { name: "çam fıstığı", quantity: "2 yk" },
    ],
    steps: [
      "Tereyağında çam fıstığı ve irmiği kavur.",
      "Süt + su + şeker karışımını ısıt.",
      "Sıcak şerbeti kavrulmuş irmiğin üstüne ekle.",
      "Karıştırıp kapağını kapat, demlendir, kase kalıbıyla servis et.",
    ],
    tags: ["tatlı", "helva", "vejetaryen", "klasik"],
    cuisine: "Türk",
  },
  {
    id: "r-trilece",
    title: "Trileçe",
    description:
      "3 sütle ıslatılmış kek üzerine karamel — ev tipi modern klasik.",
    imageUrl:
      "https://images.unsplash.com/photo-1602253057119-44d745d9b860?w=1200",
    prepTimeMinutes: 80,
    difficulty: "orta",
    servings: 10,
    ingredients: [
      { name: "yumurta", quantity: "4 adet" },
      { name: "toz şeker", quantity: "1 su bardağı" },
      { name: "un", quantity: "1 su bardağı" },
      { name: "süt", quantity: "2 su bardağı" },
      { name: "krema", quantity: "1 su bardağı" },
      { name: "yoğunlaştırılmış süt", quantity: "1 kutu" },
    ],
    steps: [
      "Pandispanya kekini pişir.",
      "3 sütü karıştır, ılık keke gezdir.",
      "Toz şekeri tavada karamelize edip üstüne dök.",
      "Buzdolabında 4 saat dinlendir.",
    ],
    tags: ["tatlı", "sütlü", "karamel", "vejetaryen"],
    cuisine: "Türk",
  },

  // -------- Ana Yemek --------
  {
    id: "r-karniyarik",
    title: "Karnıyarık",
    description: "Kıymalı patlıcan dolması — fırında pişen klasik ev yemeği.",
    imageUrl:
      "https://images.unsplash.com/photo-1625944525533-473d1c47f9cd?w=1200",
    prepTimeMinutes: 70,
    difficulty: "orta",
    servings: 4,
    ingredients: [
      { name: "patlıcan", quantity: "6 adet" },
      { name: "kıyma", quantity: "300 gr" },
      { name: "soğan", quantity: "1 adet" },
      { name: "domates", quantity: "2 adet" },
      { name: "sivri biber", quantity: "4 adet" },
      { name: "salça", quantity: "1 yk" },
    ],
    steps: [
      "Patlıcanları soyup kızart.",
      "Soğan ve kıymayı kavur, salça ve baharatla pişir.",
      "Patlıcanların ortasını yarıp harç doldur.",
      "Domates ve biberle süsleyip fırınla.",
    ],
    tags: ["ana yemek", "kıymalı", "fırın", "klasik"],
    cuisine: "Türk",
  },
  {
    id: "r-tas-kebabi",
    title: "Tas Kebabı",
    description: "Sebzeli yavaş pişmiş et yemeği — pilavla servis edilir.",
    imageUrl:
      "https://images.unsplash.com/photo-1625944525533-473d1c47f9cd?w=1200",
    prepTimeMinutes: 90,
    difficulty: "orta",
    servings: 4,
    ingredients: [
      { name: "kuşbaşı dana eti", quantity: "600 gr" },
      { name: "soğan", quantity: "2 adet" },
      { name: "patates", quantity: "2 adet" },
      { name: "havuç", quantity: "2 adet" },
      { name: "domates", quantity: "2 adet" },
      { name: "salça", quantity: "1 yk" },
    ],
    steps: [
      "Eti yağda mühürle.",
      "Soğanı ekle, kavur.",
      "Sebzeleri ve salçayı ekle.",
      "Sıcak su ekleyip kısık ateşte 1 saat pişir.",
    ],
    tags: ["ana yemek", "etli", "yavaş pişen", "klasik"],
    cuisine: "Türk",
  },
  {
    id: "r-firin-tavuk-but",
    title: "Fırında Patatesli Tavuk But",
    description:
      "Marine edilmiş tavuk butları, patatesle birlikte tek tepside.",
    imageUrl:
      "https://images.unsplash.com/photo-1604908554007-b0db4cce6dba?w=1200",
    prepTimeMinutes: 60,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "tavuk but", quantity: "4 adet" },
      { name: "patates", quantity: "4 adet" },
      { name: "zeytinyağı", quantity: "4 yk" },
      { name: "salça", quantity: "1 yk" },
      { name: "yoğurt", quantity: "2 yk" },
      { name: "sarımsak", quantity: "3 diş" },
    ],
    steps: [
      "Tavukları yoğurt, zeytinyağı, salça ve sarımsakla marine et.",
      "Patatesleri dilimle, tepsiye yerleştir.",
      "Tavukları üzerine diz.",
      "200°C fırında 45 dk pişir.",
    ],
    tags: ["ana yemek", "tavuk", "fırın", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-mantarli-risotto",
    title: "Mantarlı Risotto",
    description: "Kremamsı, parmesanlı, mantarlı klasik İtalyan ana yemeği.",
    imageUrl:
      "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=1200",
    prepTimeMinutes: 40,
    difficulty: "orta",
    servings: 3,
    ingredients: [
      { name: "arborio pirinci", quantity: "1.5 su bardağı" },
      { name: "mantar", quantity: "250 gr" },
      { name: "soğan", quantity: "1 adet" },
      { name: "tereyağı", quantity: "60 gr" },
      { name: "parmesan", quantity: "yarım su bardağı" },
      { name: "tavuk suyu", quantity: "1 lt" },
    ],
    steps: [
      "Mantarları yağda sote et, kenara al.",
      "Soğanı tereyağında kavur, pirinci ekleyip mühürle.",
      "Sıcak suyu kepçe kepçe ekleyerek karıştırarak pişir.",
      "Mantar, parmesan ve tereyağı ekleyip karıştır.",
    ],
    tags: ["ana yemek", "vejetaryen", "italyan", "kremalı"],
    cuisine: "İtalyan",
  },

  // -------- Çorba --------
  {
    id: "r-ezogelin",
    title: "Ezogelin Çorbası",
    description:
      "Kırmızı mercimek + bulgur + pirinç — naneli baharatlı sıcacık çorba.",
    imageUrl:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=1200",
    prepTimeMinutes: 35,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "kırmızı mercimek", quantity: "1 su bardağı" },
      { name: "ince bulgur", quantity: "2 yk" },
      { name: "pirinç", quantity: "2 yk" },
      { name: "soğan", quantity: "1 adet" },
      { name: "salça", quantity: "1 yk" },
      { name: "kuru nane", quantity: "1 tk" },
    ],
    steps: [
      "Soğanı yağda kavur, salçayı ekle.",
      "Mercimek, bulgur, pirinç ve sıcak suyu ekle.",
      "30 dk pişir.",
      "Üzerine naneli yağ gez.",
    ],
    tags: ["çorba", "vejetaryen", "klasik", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-tarhana",
    title: "Tarhana Çorbası",
    description: "Ev tarhanasıyla hazırlanan ekşimsi, baharatlı kış çorbası.",
    imageUrl:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=1200",
    prepTimeMinutes: 25,
    difficulty: "kolay",
    servings: 4,
    ingredients: [
      { name: "tarhana", quantity: "yarım su bardağı" },
      { name: "salça", quantity: "1 yk" },
      { name: "tereyağı", quantity: "1 yk" },
      { name: "su", quantity: "1.2 lt" },
      { name: "pul biber", quantity: "1 tk" },
    ],
    steps: [
      "Tarhanayı 1 saat suda bekleştir.",
      "Tencerede tereyağı ve salçayı kavur.",
      "Tarhana karışımını ve suyu ekle.",
      "20 dk karıştırarak pişir.",
    ],
    tags: ["çorba", "vejetaryen", "kış", "geleneksel"],
    cuisine: "Türk",
  },

  // -------- Kahvaltı --------
  {
    id: "r-cilbir",
    title: "Çılbır",
    description:
      "Sarımsaklı yoğurt üstünde poşe yumurta + tereyağlı pul biber sosu.",
    imageUrl:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200",
    prepTimeMinutes: 15,
    difficulty: "kolay",
    servings: 2,
    ingredients: [
      { name: "yumurta", quantity: "4 adet" },
      { name: "süzme yoğurt", quantity: "300 gr" },
      { name: "sarımsak", quantity: "1 diş" },
      { name: "tereyağı", quantity: "40 gr" },
      { name: "pul biber", quantity: "1 tk" },
      { name: "sirke", quantity: "1 yk" },
    ],
    steps: [
      "Yoğurdu sarımsakla karıştır, tabağa yay.",
      "Sirkeli suda yumurtaları poşe et.",
      "Yumurtaları yoğurdun üstüne yerleştir.",
      "Tereyağını eritip pul biber ekle, üzerine gez.",
    ],
    tags: ["kahvaltı", "vejetaryen", "yoğurt", "pratik"],
    cuisine: "Türk",
  },
  {
    id: "r-pogaca",
    title: "Pofuduk Poğaça",
    description: "Yumuşacık, peynirli klasik kahvaltı poğaçası.",
    imageUrl:
      "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=1200",
    prepTimeMinutes: 90,
    difficulty: "orta",
    servings: 12,
    ingredients: [
      { name: "un", quantity: "4 su bardağı" },
      { name: "süt", quantity: "1 su bardağı" },
      { name: "sıvı yağ", quantity: "1 su bardağı" },
      { name: "yoğurt", quantity: "yarım su bardağı" },
      { name: "yaş maya", quantity: "1 paket" },
      { name: "beyaz peynir", quantity: "200 gr" },
    ],
    steps: [
      "Mayayı ılık sütle aktive et.",
      "Tüm malzemelerle yumuşak hamur yoğur.",
      "1 saat mayalandır.",
      "Bezelere ayır, peyniri yerleştirip kapat.",
      "Yumurta sarısı sür, susam serp, fırınla.",
    ],
    tags: ["kahvaltı", "hamur işi", "vejetaryen", "klasik"],
    cuisine: "Türk",
  },
];

/**
 * Merged catalogue: curated + TheMealDB import + AI-generated.
 * Deduped by id; first occurrence wins (curated takes priority).
 */
function mergeUnique(...sources: Recipe[][]): Recipe[] {
  const seen = new Set<string>();
  const out: Recipe[] = [];
  for (const src of sources) {
    for (const r of src) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      // Back-fill sourceUrl for yemek.com recipes scraped before the field
      // was added (id is `yc-${slug}` → URL is /tarif/${slug}/).
      if (!r.sourceUrl && r.id.startsWith("yc-")) {
        const slug = r.id.slice(3);
        out.push({ ...r, sourceUrl: `https://yemek.com/tarif/${slug}/` });
      } else {
        out.push(r);
      }
    }
  }
  return out;
}

export const MOCK_RECIPES: Recipe[] = mergeUnique(
  CURATED_RECIPES,
  YEMEKCOM_RECIPES,
  AI_GENERATED_RECIPES,
  THEMEALDB_RECIPES,
);

export const findRecipe = (id: string): Recipe | undefined =>
  MOCK_RECIPES.find((r) => r.id === id);
