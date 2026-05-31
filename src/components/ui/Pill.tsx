import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, radii, spacing } from "@/constants/theme";
import { Text } from "./Text";

type Variant = "default" | "cream" | "mustard" | "accent" | "dark" | "outline";

export interface PillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: Variant;
  leftSlot?: React.ReactNode;
  size?: "sm" | "md";
}

const VARIANTS: Record<Variant, { bg: string; fg: string; border?: string }> = {
  default: { bg: colors.cream, fg: colors.graphite },
  cream: { bg: colors.cream, fg: colors.graphite },
  mustard: { bg: colors.primary, fg: colors.ink },
  accent: { bg: colors.accentSoft, fg: colors.accent },
  dark: { bg: colors.ink, fg: colors.bg },
  outline: { bg: "transparent", fg: colors.ink, border: colors.border },
};

export const Pill: React.FC<PillProps> = ({
  label,
  selected,
  onPress,
  variant = "default",
  leftSlot,
  size = "md",
}) => {
  const v = selected ? VARIANTS.dark : VARIANTS[variant];
  const pad =
    size === "sm"
      ? { px: spacing.md, py: 6 }
      : { px: spacing.lg, py: spacing.sm };
  const content = (
    <View style={[styles.row]}>
      {leftSlot}
      <Text
        variant={size === "sm" ? "caption" : "smallMedium"}
        weight="600"
        color={v.fg}
      >
        {label}
      </Text>
    </View>
  );
  const base = [
    styles.pill,
    {
      backgroundColor: v.bg,
      paddingHorizontal: pad.px,
      paddingVertical: pad.py,
      borderWidth: v.border ? 1 : 0,
      borderColor: v.border ?? "transparent",
    },
  ];
  if (!onPress) {
    return <View style={base}>{content}</View>;
  }
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={base}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: { borderRadius: radii.pill, alignSelf: "flex-start" },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
