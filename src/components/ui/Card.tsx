import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { colors, radii, shadows, spacing } from "@/constants/theme";

export interface CardProps extends ViewProps {
  variant?: "snow" | "cloud" | "amber" | "canvas";
  elevated?: boolean;
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
  variant = "snow",
  elevated,
  padding = "lg",
  style,
  children,
  ...rest
}) => {
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: BG[variant], padding: spacing[padding] },
        elevated && shadows.sm,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const BG = {
  snow: colors.snow,
  cloud: colors.cloud,
  amber: colors.amber,
  canvas: colors.canvas,
} as const;

const styles = StyleSheet.create({
  base: { borderRadius: radii.card },
});
