import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Text } from "@/components/ui";
import { colors, radii, spacing } from "@/constants/theme";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

/**
 * Friendly empty state used wherever there is no data to show.
 */
export const EmptyState: React.FC<Props> = ({
  icon,
  title,
  description,
  ctaLabel,
  onCtaPress,
}) => (
  <View style={styles.wrap}>
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={32} color={colors.ink} />
    </View>
    <Text variant="h2" weight="700" style={styles.title}>
      {title}
    </Text>
    {description ? (
      <Text variant="small" color={colors.graphite} style={styles.desc}>
        {description}
      </Text>
    ) : null}
    {ctaLabel && onCtaPress ? (
      <Button title={ctaLabel} onPress={onCtaPress} style={styles.cta} />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing["3xl"],
    gap: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { textAlign: "center" },
  desc: { textAlign: "center", maxWidth: 280 },
  cta: { marginTop: spacing.md },
});
