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

type Variant =
  | "primary"
  | "dark"
  | "outline"
  | "ghost"
  | "danger"
  | "secondary";
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

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
  dark: { bg: colors.ink, fg: colors.bg, border: colors.ink },
  outline: { bg: "transparent", fg: colors.ink, border: colors.border },
  ghost: { bg: "transparent", fg: colors.ink, border: "transparent" },
  danger: { bg: colors.danger, fg: colors.card, border: colors.danger },
  // Legacy alias — maps to outline visually.
  secondary: { bg: colors.card, fg: colors.ink, border: colors.border },
};

const SIZES: Record<Size, { h: number; px: number }> = {
  sm: { h: 38, px: 14 },
  md: { h: 48, px: 20 },
  lg: { h: 56, px: 24 },
};

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
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          height: s.h,
          paddingHorizontal: s.px,
        },
        fullWidth && styles.full,
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
          <Text variant="bodyMedium" color={v.fg} weight="600">
            {title}
          </Text>
          {rightSlot}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  full: { alignSelf: "stretch" },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
