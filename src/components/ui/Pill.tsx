import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import { Text } from "./Text";

export interface PillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: "default" | "accent";
}

export const Pill: React.FC<PillProps> = ({
  label,
  selected,
  onPress,
  variant = "default",
}) => {
  const bg = selected
    ? colors.ink
    : variant === "accent"
      ? colors.canvas
      : colors.cloud;
  const fg = selected ? colors.snow : colors.ink;
  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap onPress={onPress} style={[styles.pill, { backgroundColor: bg }]}>
      <Text variant="small" weight="600" color={fg}>
        {label}
      </Text>
    </Wrap>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
});
