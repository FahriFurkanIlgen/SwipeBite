/**
 * SwipeBite design tokens — derived from the Bumble reference system.
 * Warm, confident, premium. Yellow canvas + charcoal ink.
 */
export const colors = {
  canvas: "#FFDB5B",
  amber: "#FFF386",
  ink: "#202020",
  graphite: "#3B3B3B",
  slate: "#575656",
  stone: "#343333",
  snow: "#FFFFFF",
  cloud: "#F3F3F3",
  success: "#2BB673",
  danger: "#E5484D",
  like: "#2BB673",
  nope: "#E5484D",
  superlike: "#3B82F6",
  superdislike: "#7C3AED",
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
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  card: 24,
  pill: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#202020",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: "#202020",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  lg: {
    shadowColor: "#202020",
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
} as const;

export const typography = {
  display: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "800" as const,
    letterSpacing: -0.8,
  },
  h1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700" as const,
    letterSpacing: -0.2,
  },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontWeight: "600" as const },
  small: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.6,
  },
} as const;

export const theme = { colors, spacing, radii, shadows, typography };
export type Theme = typeof theme;
