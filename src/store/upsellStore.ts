import { create } from "zustand";

import type { GatedFeature } from "@/features/billing/entitlements";

/**
 * Tiny global controller for the "Pro yakında" upsell sheet (Faz 1).
 *
 * Any AI call site can pop the sheet with a single line when a quota is hit:
 *
 *   const ok = await useEntitlementsStore.getState().consume("receipt_scan");
 *   if (!ok) { useUpsellStore.getState().show("receipt_scan"); return; }
 *
 * The sheet itself is mounted once in the root layout, so screens don't need
 * to own any modal state.
 */
interface UpsellState {
  /** Feature that triggered the sheet, or null when hidden. */
  feature: GatedFeature | null;
  show: (feature: GatedFeature) => void;
  hide: () => void;
}

export const useUpsellStore = create<UpsellState>((set) => ({
  feature: null,
  show: (feature) => set({ feature }),
  hide: () => set({ feature: null }),
}));
