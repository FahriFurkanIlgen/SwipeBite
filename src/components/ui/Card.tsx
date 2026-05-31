import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { colors, radii, shadows, spacing } from "@/constants/theme";

type Variant =
  | "card"
  | "cream"
  | "tinted-mustard"
  | "tinted-accent"
  | "tinted-forest"
  | "ink"
  // Legacy aliases kept temporarily for screens not yet migrated.
  | "snow"
  | "cloud"
  | "amber"
  | "canvas";

export interface CardProps extends ViewProps {
  variant?: Variant;
  elevated?: boolean;
  bordered?: boolean;
  padding?: keyof typeof spacing | "none";
  radius?: keyof typeof radii;
}

const BG: Record<Variant, string> = {
  card: colors.card,
  cream: colors.cream,
  "tinted-mustard": colors.primarySoft,
  "tinted-accent": colors.accentSoft,
  "tinted-forest": colors.forestSoft,
  ink: colors.ink,
  // legacy
  snow: colors.card,
  cloud: colors.cream,
  amber: colors.primarySoft,
  canvas: colors.bg,
};

export const Card: React.FC<CardProps> = ({
  variant = "card",
  elevated,
  bordered,
  padding = "lg",
  radius = "card",
  style,
  children,
  ...rest
}) => {
  const pad = padding === "none" ? 0 : spacing[padding];
  return (
    <View
      style={[
        {
          backgroundColor: BG[variant],
          padding: pad,
          borderRadius: radii[radius],
        },
        bordered && styles.bordered,
        elevated && shadows.sm,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  bordered: { borderWidth: 1, borderColor: colors.border },
});
