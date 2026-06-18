/**
 * SwipeBite design tokens — Cream Canvas system.
 * Warm, editorial, sophisticated. Cream backdrop + mustard accent + terracotta highlight.
 * SwipeBar variant overrides the brand palette with deep blue (#41639C).
 * Serif (Fraunces) for display/headings, sans (Inter) for body/UI.
 */
import { isBar } from "./appVariant";

// Variant-aware brand palette. SwipeBite = mustard/terracotta; SwipeBar = blue.
const brand = isBar
  ? {
      primary: "#41639C",
      primaryDeep: "#33507D",
      primarySoft: "#EAF0F8",
      accent: "#41639C",
      accentSoft: "#DDE6F3",
    }
  : {
      primary: "#F0B429",
      primaryDeep: "#D4A017",
      primarySoft: "#FFF8E7",
      accent: "#E07A5F",
      accentSoft: "#FBE6DE",
    };

export const colors = {
  // Surfaces
  bg: "#FAF7F2",
  card: "#FFFFFF",
  cream: "#F0EBE3",
  muted: "#EDE8E1",
  border: "#E8E3DC",

  // Ink scale
  ink: "#1A1714",
  graphite: "#3D3530",
  slate: "#6B6560",
  dim: "#9E9890",
  hairline: "#C8C0B8",

  // Brand & accents (variant-aware)
  ...brand,
  // Foreground (text/icon) color to sit on a brand-colored background.
  // SwipeBar = white on blue; SwipeBite = dark ink on mustard.
  onPrimary: isBar ? "#FFFFFF" : "#1A1714",
  forest: "#4A7A50",
  forestSoft: "#EEF4EE",

  // Semantic / swipe
  success: "#4A7A50",
  danger: "#DC2626",
  like: "#4A7A50",
  nope: "#DC2626",
  superlike: "#3B82F6",
  superdislike: "#7C3AED",

  // Aliases kept for legacy code paths
  snow: "#FFFFFF",
  cloud: "#F0EBE3",
  canvas: "#FAF7F2",
  amber: brand.primary,
  stone: "#3D3530",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 18,
  "2xl": 20,
  card: 22,
  hero: 24,
  pill: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#1A1714",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: "#1A1714",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  lg: {
    shadowColor: "#1A1714",
    shadowOpacity: 0.2,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 16 },
    elevation: 14,
  },
} as const;

export const fonts = {
  serif: "Fraunces_700Bold",
  serifItalic: "Fraunces_300Light_Italic",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemibold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
} as const;

export const typography = {
  display: {
    fontFamily: fonts.serif,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.5,
  },
  h1: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.7,
  },
  h2: {
    fontFamily: fonts.serif,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h3: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  serifItalic: {
    fontFamily: fonts.serifItalic,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
    fontStyle: "italic" as const,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fonts.sansSemibold,
    fontSize: 15,
    lineHeight: 22,
  },
  small: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  smallMedium: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fonts.sansSemibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
  overline: {
    fontFamily: fonts.sansSemibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  },
} as const;

export const theme = { colors, spacing, radii, shadows, typography, fonts };
export type Theme = typeof theme;
