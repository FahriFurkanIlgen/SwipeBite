import { supabase } from "@/lib/supabase";
import type { HomePromo, PromoActionType } from "@/types/domain";

/** Raw row shape from the `app_promos` table. */
interface PromoRow {
  id: string;
  placement: string;
  overline: string | null;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  action_type: string | null;
  action_target: string | null;
  bg_color: string | null;
  text_color: string | null;
  priority: number | null;
}

function mapRow(row: PromoRow): HomePromo {
  const actionType: PromoActionType =
    row.action_type === "route" || row.action_type === "url"
      ? row.action_type
      : "none";
  return {
    id: row.id,
    placement: row.placement,
    overline: row.overline ?? undefined,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    imageUrl: row.image_url ?? undefined,
    ctaLabel: row.cta_label ?? undefined,
    actionType,
    actionTarget: row.action_target ?? undefined,
    bgColor: row.bg_color ?? undefined,
    textColor: row.text_color ?? undefined,
    priority: row.priority ?? 0,
  };
}

export const promoService = {
  isLive: () => !!supabase,

  /**
   * Fetch the live promos for a placement. The table's RLS already filters out
   * inactive / out-of-schedule rows, so we just order by priority. Returns an
   * empty list on any error or when no backend is configured (mock mode) —
   * promos are purely additive so a failure should never block the UI.
   */
  async list(placement = "home_banner"): Promise<HomePromo[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("app_promos")
      .select(
        "id, placement, overline, title, subtitle, image_url, cta_label, action_type, action_target, bg_color, text_color, priority",
      )
      .eq("placement", placement)
      .order("priority", { ascending: false });
    if (error || !data) return [];
    return (data as PromoRow[]).map(mapRow);
  },
};
