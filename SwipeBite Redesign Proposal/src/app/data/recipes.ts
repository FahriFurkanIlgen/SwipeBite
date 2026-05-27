export interface Ingredient {
  name: string;
  amount: string;
  inPantry: boolean;
}

export interface RecipeStep {
  step: number;
  description: string;
  duration?: number;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  time: number;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  servings: number;
  calories: number;
  image: string;
  matchScore: number;
  pantryMatch: number;
  aiReason: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
  likedBy: string[];
}

export const RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Tavuk Şiş',
    cuisine: 'Türk Mutfağı',
    time: 35,
    difficulty: 'Orta',
    servings: 4,
    calories: 380,
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=600&fit=crop&auto=format',
    matchScore: 94,
    pantryMatch: 78,
    aiReason: 'Kilerdeki tavuk ve baharatlarınızla mükemmel uyum. Sadece limon almanız yeterli.',
    tags: ['Tavuklu', 'Izgara', 'Protein'],
    ingredients: [
      { name: 'Tavuk göğsü', amount: '500g', inPantry: true },
      { name: 'Zeytinyağı', amount: '3 yemek kaşığı', inPantry: true },
      { name: 'Kimyon', amount: '1 tatlı kaşığı', inPantry: true },
      { name: 'Kırmızı biber', amount: '1 tatlı kaşığı', inPantry: true },
      { name: 'Sarımsak', amount: '3 diş', inPantry: true },
      { name: 'Limon', amount: '1 adet', inPantry: false },
      { name: 'Tuz ve karabiber', amount: 'Damak zevkinize göre', inPantry: true },
    ],
    steps: [
      { step: 1, description: 'Tavuğu 3×3 cm küp şeklinde kesin. Zeytinyağı, sarımsak, kimyon ve kırmızı biberi karıştırarak marine sosu hazırlayın.', duration: 10 },
      { step: 2, description: 'Tavukları marine sosuyla iyice bulayın ve buzdolabında en az 30 dakika bekletin.', duration: 30 },
      { step: 3, description: 'Şişlere tavukları sıkıca delin. Aralarına biber ve kırmızı soğan ekleyebilirsiniz.', duration: 5 },
      { step: 4, description: 'Önceden ısıtılmış ızgarada veya tavada her tarafını 4–5 dakika pişirin, altın rengi almasına dikkat edin.', duration: 15 },
      { step: 5, description: 'Üzerine taze limon sıkın. Pilav, cacık ve lavaşla servis edin.', duration: 3 },
    ],
    likedBy: ['Sen', 'Deniz'],
  },
  {
    id: '2',
    name: 'Mercimek Çorbası',
    cuisine: 'Türk Mutfağı',
    time: 25,
    difficulty: 'Kolay',
    servings: 4,
    calories: 210,
    image: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=400&h=600&fit=crop&auto=format',
    matchScore: 88,
    pantryMatch: 92,
    aiReason: 'Tüm malzemeler kilerde mevcut. Soğuk hava için ideal seçim.',
    tags: ['Vegan', 'Çorba', 'Kolay'],
    ingredients: [
      { name: 'Kırmızı mercimek', amount: '1 su bardağı', inPantry: true },
      { name: 'Soğan', amount: '1 büyük boy', inPantry: true },
      { name: 'Havuç', amount: '1 adet', inPantry: true },
      { name: 'Sarımsak', amount: '2 diş', inPantry: true },
      { name: 'Zeytinyağı', amount: '2 yemek kaşığı', inPantry: true },
      { name: 'Kimyon', amount: '1 tatlı kaşığı', inPantry: true },
      { name: 'Sebze suyu', amount: '1 litre', inPantry: true },
    ],
    steps: [
      { step: 1, description: 'Soğan ve sarımsağı zeytinyağında 5 dakika soteleyin.', duration: 5 },
      { step: 2, description: 'Havuç ve mercimeği ekleyin, 2 dakika daha karıştırın.', duration: 2 },
      { step: 3, description: 'Sebze suyu ve kimyonu ekleyin. Kaynayana kadar bekleyin.', duration: 10 },
      { step: 4, description: 'Kısık ateşte 15 dakika pişirin. Blenderdan geçirin.', duration: 15 },
      { step: 5, description: 'Üzerine tereyağlı kırmızı biber sos gezdirerek servis edin.', duration: 3 },
    ],
    likedBy: ['Sen'],
  },
  {
    id: '3',
    name: 'Fettuccine Alfredo',
    cuisine: 'İtalyan',
    time: 20,
    difficulty: 'Kolay',
    servings: 2,
    calories: 520,
    image: 'https://images.unsplash.com/photo-1616299915952-04c803388e5f?w=400&h=600&fit=crop&auto=format',
    matchScore: 82,
    pantryMatch: 65,
    aiReason: 'Hızlı akşam yemeği. Sadece krema ve parmesan almanız gerek.',
    tags: ['Makarna', 'Hızlı', 'Vejeteryan'],
    ingredients: [
      { name: 'Fettuccine', amount: '200g', inPantry: true },
      { name: 'Krema', amount: '200ml', inPantry: false },
      { name: 'Parmesan', amount: '80g', inPantry: false },
      { name: 'Tereyağı', amount: '50g', inPantry: true },
      { name: 'Sarımsak', amount: '2 diş', inPantry: true },
      { name: 'Tuz ve karabiber', amount: 'Damak zevkinize göre', inPantry: true },
    ],
    steps: [
      { step: 1, description: 'Makarnayı tuzlu suda al dente haline gelene kadar haşlayın (yaklaşık 10 dakika).', duration: 10 },
      { step: 2, description: 'Ayrı bir tavada tereyağı eritin, sarımsağı soteleyin.', duration: 3 },
      { step: 3, description: 'Kremayı ekleyin ve kısık ateşte 3 dakika pişirin.', duration: 3 },
      { step: 4, description: 'Makarnayı, parmesan ve karabiberi ekleyerek karıştırın.', duration: 2 },
      { step: 5, description: 'Hemen servis edin. Üzerine taze parmesan rendeleyin.', duration: 1 },
    ],
    likedBy: ['Deniz'],
  },
  {
    id: '4',
    name: 'Izgara Somon',
    cuisine: 'Akdeniz',
    time: 25,
    difficulty: 'Orta',
    servings: 2,
    calories: 450,
    image: 'https://images.unsplash.com/photo-1611171711791-b34fa42e9fc2?w=400&h=600&fit=crop&auto=format',
    matchScore: 79,
    pantryMatch: 70,
    aiReason: 'Sağlıklı ve lezzetli. Kilerdeki limon ve zeytinyağı ile hazır.',
    tags: ['Balık', 'Sağlıklı', 'Izgara'],
    ingredients: [
      { name: 'Somon fileto', amount: '2 adet (200g)', inPantry: false },
      { name: 'Zeytinyağı', amount: '2 yemek kaşığı', inPantry: true },
      { name: 'Limon', amount: '1 adet', inPantry: true },
      { name: 'Sarımsak', amount: '2 diş', inPantry: true },
      { name: 'Dereotu', amount: '1 demet', inPantry: false },
      { name: 'Tuz ve karabiber', amount: 'Damak zevkinize göre', inPantry: true },
    ],
    steps: [
      { step: 1, description: 'Somonları kağıt havluyla kurulayın. Zeytinyağı, sarımsak ve limon suyu ile marine edin.', duration: 10 },
      { step: 2, description: 'Izgara veya tavayı yüksek ateşte ısıtın. Hafifçe yağlayın.', duration: 3 },
      { step: 3, description: 'Her tarafını 3–4 dakika pişirin. Ortası hafif pembe kalabilir.', duration: 8 },
      { step: 4, description: 'Taze dereotu ve limon dilimleriyle servis edin.', duration: 2 },
    ],
    likedBy: ['Sen'],
  },
  {
    id: '5',
    name: 'Akdeniz Salatası',
    cuisine: 'Akdeniz',
    time: 15,
    difficulty: 'Kolay',
    servings: 2,
    calories: 180,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=600&fit=crop&auto=format',
    matchScore: 76,
    pantryMatch: 88,
    aiReason: 'Tüm sebzeler kilerde mevcut. Hafif ve ferahlatıcı.',
    tags: ['Salata', 'Vegan', 'Taze'],
    ingredients: [
      { name: 'Domates', amount: '3 adet', inPantry: true },
      { name: 'Salatalık', amount: '1 adet', inPantry: true },
      { name: 'Kırmızı soğan', amount: '½ adet', inPantry: true },
      { name: 'Zeytin', amount: '100g', inPantry: true },
      { name: 'Beyaz peynir', amount: '100g', inPantry: false },
      { name: 'Zeytinyağı', amount: '3 yemek kaşığı', inPantry: true },
      { name: 'Kekik', amount: '1 tatlı kaşığı', inPantry: true },
    ],
    steps: [
      { step: 1, description: 'Tüm sebzeleri küp şeklinde doğrayın.', duration: 5 },
      { step: 2, description: 'Geniş bir kaseye alın. Zeytinleri ekleyin.', duration: 1 },
      { step: 3, description: 'Zeytinyağı, tuz ve kekikle tatlandırın.', duration: 2 },
      { step: 4, description: 'Üzerine beyaz peynir parçalayın ve servis edin.', duration: 2 },
    ],
    likedBy: ['Sen', 'Deniz'],
  },
  {
    id: '6',
    name: 'Pizza Margarita',
    cuisine: 'İtalyan',
    time: 45,
    difficulty: 'Zor',
    servings: 3,
    calories: 620,
    image: 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=400&h=600&fit=crop&auto=format',
    matchScore: 71,
    pantryMatch: 55,
    aiReason: 'Hafta sonu keyifli aktivite. Un ve domates sosu kilerde var.',
    tags: ['Pizza', 'Vejetaryen', 'Fırın'],
    ingredients: [
      { name: 'Pizza hamuru', amount: '300g', inPantry: false },
      { name: 'Domates sosu', amount: '4 yemek kaşığı', inPantry: true },
      { name: 'Mozzarella', amount: '150g', inPantry: false },
      { name: 'Taze fesleğen', amount: '10 yaprak', inPantry: false },
      { name: 'Zeytinyağı', amount: '2 yemek kaşığı', inPantry: true },
      { name: 'Tuz ve karabiber', amount: 'Damak zevkinize göre', inPantry: true },
    ],
    steps: [
      { step: 1, description: 'Fırını 250°C\'ye önceden ısıtın. Hamuru ince açın.', duration: 10 },
      { step: 2, description: 'Domates sosunu hamura yayın. Mozzarella ekleyin.', duration: 3 },
      { step: 3, description: 'Fırında 10–12 dakika, kenarlar altın rengi alana kadar pişirin.', duration: 12 },
      { step: 4, description: 'Taze fesleğen ve zeytinyağıyla servis edin.', duration: 2 },
    ],
    likedBy: ['Deniz'],
  },
  {
    id: '7',
    name: 'Sebzeli Güveç',
    cuisine: 'Türk Mutfağı',
    time: 60,
    difficulty: 'Orta',
    servings: 4,
    calories: 290,
    image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&h=600&fit=crop&auto=format',
    matchScore: 85,
    pantryMatch: 82,
    aiReason: 'Kilerdeki sebzeler tam da bu tarife uyuyor. Doyurucu ve sağlıklı.',
    tags: ['Güveç', 'Vegan', 'Fırın'],
    ingredients: [
      { name: 'Patlıcan', amount: '2 adet', inPantry: true },
      { name: 'Kabak', amount: '2 adet', inPantry: true },
      { name: 'Domates', amount: '3 adet', inPantry: true },
      { name: 'Biber', amount: '2 adet', inPantry: true },
      { name: 'Soğan', amount: '2 adet', inPantry: true },
      { name: 'Sarımsak', amount: '4 diş', inPantry: true },
      { name: 'Zeytinyağı', amount: '4 yemek kaşığı', inPantry: true },
    ],
    steps: [
      { step: 1, description: 'Tüm sebzeleri yuvarlak dilimlere kesin.', duration: 10 },
      { step: 2, description: 'Güveç kabında alt alta dizerek yerleştirin.', duration: 5 },
      { step: 3, description: 'Üzerine sarımsak, tuz, karabiber ve zeytinyağı gezdirin.', duration: 3 },
      { step: 4, description: '180°C fırında 45 dakika pişirin.', duration: 45 },
      { step: 5, description: 'Taze ekmekle servis edin.', duration: 2 },
    ],
    likedBy: ['Sen', 'Deniz'],
  },
  {
    id: '8',
    name: 'Sushi Bowl',
    cuisine: 'Japon',
    time: 30,
    difficulty: 'Orta',
    servings: 2,
    calories: 390,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=600&fit=crop&auto=format',
    matchScore: 65,
    pantryMatch: 45,
    aiReason: 'Farklı bir deneyim arıyorsanız. Pirinç ve soya sosu var.',
    tags: ['Balık', 'Japon', 'Sağlıklı'],
    ingredients: [
      { name: 'Sushi pirinci', amount: '300g', inPantry: true },
      { name: 'Somon (çiğ)', amount: '200g', inPantry: false },
      { name: 'Avokado', amount: '1 adet', inPantry: false },
      { name: 'Soya sosu', amount: '3 yemek kaşığı', inPantry: true },
      { name: 'Susam', amount: '1 yemek kaşığı', inPantry: false },
      { name: 'Pirinç sirkesi', amount: '2 yemek kaşığı', inPantry: false },
    ],
    steps: [
      { step: 1, description: 'Pirinci haşlayın. Pirinç sirkesi ve tuz ekleyerek sushi pirinci hazırlayın.', duration: 20 },
      { step: 2, description: 'Somonı ince dilimleyin. Avokadonun kabuğunu soyun ve dilimleyin.', duration: 5 },
      { step: 3, description: 'Kasede pilav üzerine somon, avokado ve susamı yerleştirin.', duration: 3 },
      { step: 4, description: 'Üzerine soya sosu gezdirin ve servis edin.', duration: 1 },
    ],
    likedBy: [],
  },
];

export const WEEKLY_PLAN = [
  { day: 'Pzt', date: '27', recipes: ['Tavuk Şiş', 'Akdeniz Salatası'] },
  { day: 'Sal', date: '28', recipes: ['Mercimek Çorbası'] },
  { day: 'Çar', date: '29', recipes: ['Fettuccine Alfredo'] },
  { day: 'Per', date: '30', recipes: ['Sebzeli Güveç'] },
  { day: 'Cum', date: '31', recipes: ['Pizza Margarita'] },
  { day: 'Cmt', date: '1', recipes: [] },
  { day: 'Paz', date: '2', recipes: ['Izgara Somon'] },
];

export const PANTRY_ITEMS = {
  'Et & Protein': ['Tavuk göğsü', 'Kıyma', 'Somon'],
  'Sebze': ['Domates', 'Patlıcan', 'Kabak', 'Biber', 'Soğan'],
  'Baklagil & Tahıl': ['Kırmızı mercimek', 'Pirinç', 'Makarna'],
  'Baharat & Sos': ['Kimyon', 'Kırmızı biber', 'Zeytinyağı', 'Sarımsak'],
  'Süt Ürünleri': ['Tereyağı', 'Yoğurt'],
];
