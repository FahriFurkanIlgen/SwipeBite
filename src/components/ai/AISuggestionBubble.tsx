import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "@/constants/theme";
import { Text } from "@/components/ui/Text";

type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  message: string;
  icon?: IconName;
  ctaLabel?: string;
  onPress?: () => void;
}

export const AISuggestionBubble: React.FC<Props> = ({
  message,
  icon = "sparkles",
  ctaLabel,
  onPress,
}) => {
  const Container: React.ComponentType<any> = onPress ? Pressable : View;
  return (
    <Container
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean } = {}) => [
        styles.wrap,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={16} color={colors.ink} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="small" color={colors.graphite}>
          {message}
        </Text>
        {ctaLabel ? (
          <Text variant="caption" weight="700" color={colors.ink}>
            {ctaLabel} →
          </Text>
        ) : null}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.amber,
    padding: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
});
