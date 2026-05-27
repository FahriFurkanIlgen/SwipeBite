import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
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
  if (!onPress) {
    return (
      <View style={[styles.pill, { backgroundColor: bg }]}>
        <Text variant="small" weight="600" color={fg}>
          {label}
        </Text>
      </View>
    );
  }
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: bg },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="small" weight="600" color={fg}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
