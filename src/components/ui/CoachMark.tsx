import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Lightbulb, X } from "lucide-react-native";

import { Text } from "@/components/ui/Text";
import { colors, radii, spacing } from "@/constants/theme";
import { useTutorialStore, type TutorialKey } from "@/store/tutorialStore";

export interface CoachMarkProps {
  /** Tutorial flag — once dismissed, this coach mark won't show again. */
  storageKey: TutorialKey;
  title: string;
  description: string;
  /** Optional CTA label, defaults to "Anladım". */
  ctaLabel?: string;
  /** Where the tooltip should sit on the screen. */
  position?: "top" | "center" | "bottom";
  /** Optional manual control. When undefined, derives from store. */
  visible?: boolean;
  onDismiss?: () => void;
}

/**
 * Lightweight coach mark — a dim full-screen overlay with a single tooltip
 * card. Designed for first-run hints. Once dismissed, persists via
 * `tutorialStore` so it never appears again unless the user resets tutorials.
 */
export const CoachMark: React.FC<CoachMarkProps> = ({
  storageKey,
  title,
  description,
  ctaLabel = "Anladım",
  position = "bottom",
  visible: visibleProp,
  onDismiss,
}) => {
  const seen = useTutorialStore((s) => s.seen[storageKey]);
  const hydrated = useTutorialStore((s) => s.hydrated);
  const markSeen = useTutorialStore((s) => s.markSeen);
  const skipAll = useTutorialStore((s) => s.skipAll);

  // Derive visibility: if explicit prop passed, honor it; otherwise show
  // automatically once hydration finishes if not yet seen.
  const visible = visibleProp !== undefined ? visibleProp : hydrated && !seen;

  const handleDismiss = () => {
    markSeen(storageKey);
    onDismiss?.();
  };

  const handleSkipAll = () => {
    skipAll();
    onDismiss?.();
  };

  if (!visible) return null;

  const justify =
    position === "top"
      ? "flex-start"
      : position === "center"
        ? "center"
        : "flex-end";

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Animated.View
        entering={FadeIn.duration(220)}
        style={[styles.backdrop, { justifyContent: justify }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />

        <Animated.View
          entering={FadeInUp.delay(80).duration(280)}
          style={styles.card}
        >
          <View style={styles.headerRow}>
            <View style={styles.bulb}>
              <Lightbulb size={18} strokeWidth={2.4} color={colors.ink} />
            </View>
            <Text variant="overline" color={colors.dim} style={{ flex: 1 }}>
              İpucu
            </Text>
            <Pressable onPress={handleDismiss} hitSlop={10}>
              <X size={18} strokeWidth={2} color={colors.slate} />
            </Pressable>
          </View>

          <Text variant="h3" style={{ marginTop: spacing.sm }}>
            {title}
          </Text>
          <Text
            variant="body"
            color={colors.slate}
            style={{ marginTop: spacing.xs, lineHeight: 22 }}
          >
            {description}
          </Text>

          <Pressable onPress={handleDismiss} style={styles.cta}>
            <Text variant="bodyMedium" weight="700" color={colors.ink}>
              {ctaLabel}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSkipAll}
            hitSlop={10}
            style={styles.skipAll}
          >
            <Text variant="small" color={colors.dim}>
              Tüm ipuçlarını geç
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 12, 10, 0.55)",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["2xl"],
    paddingTop: spacing["3xl"],
  },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.xs,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bulb: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    height: 48,
    marginTop: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  skipAll: {
    alignSelf: "center",
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
