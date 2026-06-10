import { openAIJson, openAIVisionJson } from "@/lib/openai";
import { PantryItem } from "@/types/domain";
import { uid } from "@/utils/id";

/**
 * Pantry Parser.
 * Input: free-form Turkish text like "tavuk yoğurt patates yumurta".
 * Output: deduped, normalized PantryItem[].
 */
export async function parsePantryText(
  raw: string,
  householdId: string,
): Promise<PantryItem[]> {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // Try AI first
  const ai = await openAIJson<{
    items: { name: string; quantity?: string; category?: string }[];
  }>({
    system:
      "Sen bir Türkçe mutfak asistanısın. Kullanıcının yazdığı serbest metni temizle, " +
      "tekil malzeme isimlerine ayır, Türkçe küçük harfle döndür. " +
      'JSON formatı: {"items":[{"name":"tavuk","quantity":null,"category":"protein"}]}',
    user: trimmed,
    temperature: 0.1,
    feature: "ai_pantry_parse",
  });

  const parsedItems: { name: string; quantity?: string; category?: string }[] =
    ai?.items?.length
      ? ai.items
      : fallbackParse(trimmed).map((n) => ({ name: n }));

  const seen = new Set<string>();
  const now = new Date().toISOString();
  return parsedItems
    .map((i) => ({ ...i, name: i.name.trim().toLocaleLowerCase("tr-TR") }))
    .filter((i) => {
      if (!i.name || seen.has(i.name)) return false;
      seen.add(i.name);
      return true;
    })
    .map<PantryItem>((i) => ({
      id: uid("pantry"),
      householdId,
      name: i.name,
      quantity: i.quantity,
      category: i.category,
      createdAt: now,
    }));
}

const SPLIT_RE = /[\n,;]+|\s{2,}|\s+ve\s+|\s+/g;

const STOPWORDS = new Set([
  "ve",
  "ile",
  "biraz",
  "bir",
  "az",
  "çok",
  "tane",
  "adet",
  "kg",
  "gr",
  "g",
]);

function fallbackParse(input: string): string[] {
  return input
    .toLocaleLowerCase("tr-TR")
    .split(SPLIT_RE)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

type ParsedItem = { name: string; quantity?: string; category?: string };

/** Shared normalization: lowercase (tr-TR), dedupe, map to PantryItem[]. */
function toPantryItems(
  parsedItems: ParsedItem[],
  householdId: string,
): PantryItem[] {
  const seen = new Set<string>();
  const now = new Date().toISOString();
  return parsedItems
    .map((i) => ({ ...i, name: i.name.trim().toLocaleLowerCase("tr-TR") }))
    .filter((i) => {
      if (!i.name || i.name.length < 2 || seen.has(i.name)) return false;
      seen.add(i.name);
      return true;
    })
    .map<PantryItem>((i) => ({
      id: uid("pantry"),
      householdId,
      name: i.name,
      quantity: i.quantity,
      category: i.category,
      createdAt: now,
    }));
}

/**
 * Receipt / grocery photo OCR.
 * Input: a base64-encoded image of a shopping receipt or fridge/pantry shelf.
 * Output: deduped, normalized PantryItem[]. Uses the vision model to read the
 * photo and keep only edible ingredients (drops totals, taxes, brand fluff).
 */
export async function parsePantryImage(
  imageBase64: string,
  householdId: string,
  mimeType = "image/jpeg",
): Promise<PantryItem[]> {
  if (!imageBase64) return [];

  const ai = await openAIVisionJson<{ items: ParsedItem[] }>({
    system:
      "Sen bir Türkçe mutfak asistanısın. Verilen market fişi veya kiler/buzdolabı " +
      "fotoğrafındaki YENİLEBİLİR gıda malzemelerini oku. Marka adlarını sadeleştir, " +
      "jenerik malzeme ismine indir (örn. 'Pınar Süt 1L' → 'süt'). " +
      "Toplam, KDV, fiş no, indirim, poşet gibi gıda olmayan satırları ATLA. " +
      "Türkçe küçük harfle döndür. " +
      'JSON: {"items":[{"name":"süt","quantity":"1L","category":"süt"}]}',
    user: "Bu görseldeki gıda malzemelerini çıkar.",
    imageBase64,
    mimeType,
    temperature: 0.1,
    feature: "receipt_scan",
  });

  if (!ai?.items?.length) return [];
  return toPantryItems(ai.items, householdId);
}
