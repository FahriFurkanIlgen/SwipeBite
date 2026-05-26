import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors, radii, spacing } from "@/constants/theme";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "md",
  loading,
  fullWidth,
  leftSlot,
  rightSlot,
  style,
  onPress,
  disabled,
  ...rest
}) => {
  const v = VARIANTS[variant];
  const s = SIZES[size];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={(e) => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          height: s.h,
          paddingHorizontal: s.px,
        },
        fullWidth && styles.full,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {leftSlot}
          <Text
            variant={size === "lg" ? "h3" : "bodyMedium"}
            color={v.fg}
            weight="600"
          >
            {title}
          </Text>
          {rightSlot}
        </View>
      )}
    </Pressable>
  );
};

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.ink, fg: colors.snow, border: colors.ink },
  secondary: { bg: colors.snow, fg: colors.ink, border: colors.ink },
  ghost: { bg: "transparent", fg: colors.ink, border: "transparent" },
  danger: { bg: colors.danger, fg: colors.snow, border: colors.danger },
};

const SIZES: Record<Size, { h: number; px: number }> = {
  sm: { h: 40, px: 16 },
  md: { h: 52, px: 22 },
  lg: { h: 60, px: 28 },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  full: { alignSelf: "stretch" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
