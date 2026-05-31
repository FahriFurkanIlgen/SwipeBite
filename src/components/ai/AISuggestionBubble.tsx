import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import { Text } from "@/components/ui/Text";

interface Props {
  message: string;
  tag?: string;
  emoji?: string;
  onPress?: () => void;
}

/**
 * Soft white suggestion card with an emoji glyph and a cream tag pill.
 * Replaces the older yellow bubble to match the editorial cream system.
 */
export const AISuggestionBubble: React.FC<Props> = ({
  message,
  tag,
  emoji = "✨",
  onPress,
}) => {
  const Container: React.ComponentType<any> = onPress ? Pressable : View;
  return (
    <Container onPress={onPress} style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={{ flex: 1, gap: 6 }}>
        {tag ? (
          <View style={styles.tag}>
            <Text variant="caption" color={colors.slate}>
              {tag}
            </Text>
          </View>
        ) : null}
        <Text variant="small" color={colors.graphite}>
          {message}
        </Text>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    alignItems: "flex-start",
  },
  emoji: { fontSize: 20, lineHeight: 24 },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: colors.cream,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
});
