import { supabase } from "@/lib/supabase";
import { PantryItem } from "@/types/domain";

interface PantryRow {
  id: string;
  household_id: string;
  name: string;
  quantity: string | null;
  category: string | null;
  created_at: string;
  expires_at: string | null;
}

function rowToItem(r: PantryRow): PantryItem {
  return {
    id: r.id,
    householdId: r.household_id,
    name: r.name,
    quantity: r.quantity ?? undefined,
    category: r.category ?? undefined,
    createdAt: r.created_at,
    expiresAt: r.expires_at ?? undefined,
  };
}

function itemToInsert(item: PantryItem) {
  return {
    household_id: item.householdId,
    name: item.name,
    quantity: item.quantity ?? null,
    category: item.category ?? null,
    expires_at: item.expiresAt ?? null,
  };
}

export const pantryService = {
  isLive: () => !!supabase,

  async list(householdId: string): Promise<PantryItem[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as PantryRow[] | null)?.map(rowToItem) ?? [];
  },

  async addMany(items: PantryItem[]): Promise<PantryItem[]> {
    if (!supabase || items.length === 0) return items;
    const { data, error } = await supabase
      .from("pantry_items")
      .insert(items.map(itemToInsert))
      .select();
    if (error) throw error;
    return (data as PantryRow[] | null)?.map(rowToItem) ?? items;
  },

  async remove(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("pantry_items").delete().eq("id", id);
    if (error) throw error;
  },

  async clear(householdId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from("pantry_items")
      .delete()
      .eq("household_id", householdId);
    if (error) throw error;
  },
};
