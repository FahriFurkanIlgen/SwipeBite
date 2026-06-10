import { create } from "zustand";
import type { HomePromo } from "@/types/domain";
import { promoService } from "@/features/promos/promoService";

interface PromoState {
  items: HomePromo[];
  loaded: boolean;
  /** Fetch promos for a placement. Safe to call repeatedly; refreshes silently. */
  hydrate: (placement?: string) => Promise<void>;
  /** Promos for a given placement, highest priority first. */
  forPlacement: (placement: string) => HomePromo[];
}

export const usePromoStore = create<PromoState>((set, get) => ({
  items: [],
  loaded: false,

  hydrate: async (placement = "home_banner") => {
    try {
      const items = await promoService.list(placement);
      set({ items, loaded: true });
    } catch {
      // Promos are additive — never block the UI on a fetch failure.
      set({ loaded: true });
    }
  },

  forPlacement: (placement) =>
    get().items.filter((p) => p.placement === placement),
}));
