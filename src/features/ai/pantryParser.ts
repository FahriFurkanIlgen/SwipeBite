import { openAIJson } from "@/lib/openai";
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
