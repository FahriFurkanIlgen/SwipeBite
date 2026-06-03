import type { FastFoodItem } from "@/types/domain";

/**
 * Cici Boğaz — basit fast food / yemek listesi.
 * Yalnızca isim + görsel; fiyat veya kategori filtresi yok.
 */
export const FASTFOOD_ITEMS: FastFoodItem[] = [
  {
    id: "ff-mcdonalds",
    name: "McDonald's",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/Products/10770272.jpg?width=400&height=400",
  },
  {
    id: "ff-burger-king",
    name: "Burger King",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/Products/74368972.jpg?width=400&height=400",
  },
  {
    id: "ff-craft-burger",
    name: "Craft Burger",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/Products/79538454.jpg?width=400&height=400",
  },
  {
    id: "ff-popeyes",
    name: "Popeyes",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/Products/28499435.jpg?width=400&height=400",
  },
  {
    id: "ff-kfc",
    name: "KFC",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/Products/76550822.jpg?width=400&height=400",
  },
  {
    id: "ff-tavuk-dunyasi",
    name: "Tavuk Dünyası",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/Products/68170657.jpg?width=400&height=400",
  },
  {
    id: "ff-pizza",
    name: "Pizza",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/Products/32379956.jpg?width=400&height=400",
  },
  {
    id: "ff-iskender",
    name: "İskender Kebap",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/products/6820574.jpg?width=400&height=400",
  },
  {
    id: "ff-mersin-tantuni",
    name: "Mersin Tantuni",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/LH/v2gd-listing.jpg?width=400&height=400",
  },
  {
    id: "ff-tombik-doner",
    name: "Tombik Döner",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/LH/tkwg-listing.jpg?width=400&height=400",
  },
  {
    id: "ff-et-doner-durum",
    name: "Et Döner Dürüm",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/LH/yvka-listing.jpg?width=400&height=400",
  },
  {
    id: "ff-tavuk-doner-durum",
    name: "Tavuk Döner Dürüm",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/LH/q2lf-listing.jpg?width=400&height=400",
  },
  {
    id: "ff-kofte",
    name: "Köfte",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/LH/u0lj-listing.jpg?width=400&height=400",
  },
  {
    id: "ff-kebap",
    name: "Kebap",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/LH/i5mk-listing.jpg?width=400&height=400",
  },
  {
    id: "ff-uzak-dogu",
    name: "Uzak Doğu",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/LH/cw0hj-listing.jpg?width=400&height=400",
  },
  {
    id: "ff-lahmacun",
    name: "Lahmacun",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/LH/gs7m-listing.jpg?width=400&height=400",
  },
  {
    id: "ff-pidem",
    name: "Pidem",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/LH/f7of-listing.jpg?width=400&height=400",
  },
  {
    id: "ff-subway",
    name: "Subway Sandviç",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/LH/u562-listing.jpg?width=400&height=400",
  },
  {
    id: "ff-akdeniz-salatasi",
    name: "Akdeniz Salatası",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/LH/h2cz-listing.jpg?width=400&height=400",
  },
  {
    id: "ff-bowl",
    name: "Bowl",
    imageUrl:
      "https://images.deliveryhero.io/image/fd-tr/LH/uh6y-listing.jpg?width=400&height=400",
  },
];

export function findFastFoodItem(id: string): FastFoodItem {
  const found = FASTFOOD_ITEMS.find((i) => i.id === id);
  if (found) return found;
  // Fallback so the UI always has something to render even if the session
  // refers to an ID that's no longer in the catalog.
  if (typeof console !== "undefined") {
    console.warn("[fastfood] unknown item id:", id);
  }
  return {
    id,
    name: id,
    imageUrl:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
  };
}
