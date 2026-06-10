import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Check, Wine, X } from "lucide-react-native";

import { Text } from "@/components/ui/Text";
import { colors, radii, spacing } from "@/constants/theme";

export interface AgeGateModalProps {
  visible: boolean;
  /** Called when the user confirms they are 18+ and wants to enable Bar mode. */
  onConfirm: () => void;
  /** Called when the user declines. Bar mode should be disabled. */
  onDecline: () => void;
  /** Optional header label override. */
  title?: string;
}

/**
 * Age gate for the Bar (cocktail) feature. Shown the first time a user taps
 * the Bar tab if `profile.alcoholContentEnabled` is `undefined`.
 *
 * The modal is intentionally non-dismissible by tapping the backdrop — the
 * user must explicitly choose Confirm or Decline so we always store a
 * deliberate boolean on the profile.
 */
export const AgeGateModal: React.FC<AgeGateModalProps> = ({
  visible,
  onConfirm,
  onDecline,
  title = "Bar moduna giriyorsun",
}) => {
  const [checked, setChecked] = React.useState(false);

  // Reset checkbox each time the modal opens.
  React.useEffect(() => {
    if (visible) setChecked(false);
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <Animated.View entering={FadeIn.duration(220)} style={styles.backdrop}>
        <Animated.View
          entering={FadeInUp.delay(80).duration(280)}
          style={styles.card}
        >
          <View style={styles.headerRow}>
            <View style={styles.icon}>
              <Wine size={20} strokeWidth={2} color={colors.ink} />
            </View>
            <Text variant="overline" color={colors.dim} style={{ flex: 1 }}>
              18+ İçerik
            </Text>
            <Pressable onPress={onDecline} hitSlop={10}>
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
            Bu bölümde alkollü kokteyl tarifleri, bar dolabı önerileri ve
            alkollü içecek eşleştirmeleri bulunur. 18 yaş altı için uygun
            değildir.
          </Text>

          <Pressable
            onPress={() => setChecked((v) => !v)}
            style={styles.checkRow}
            hitSlop={8}
          >
            <View style={[styles.checkbox, checked && styles.checkboxOn]}>
              {checked ? (
                <Check size={14} strokeWidth={2.6} color={colors.ink} />
              ) : null}
            </View>
            <Text
              variant="smallMedium"
              color={colors.ink}
              style={{ flex: 1, lineHeight: 20 }}
            >
              18 yaşından büyüğüm ve alkollü içerikleri görmek istiyorum.
            </Text>
          </Pressable>

          <Pressable
            onPress={onConfirm}
            disabled={!checked}
            style={[styles.cta, !checked && styles.ctaDisabled]}
          >
            <Text
              variant="bodyMedium"
              weight="700"
              color={checked ? colors.ink : colors.dim}
            >
              Bar modunu aç
            </Text>
          </Pressable>

          <Pressable onPress={onDecline} hitSlop={10} style={styles.decline}>
            <Text variant="small" color={colors.dim}>
              Hayır, ilgilenmiyorum
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
    backgroundColor: "rgba(15, 12, 10, 0.6)",
    paddingHorizontal: spacing.lg,
    justifyContent: "flex-end",
    paddingBottom: spacing["2xl"],
  },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.xs,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  checkboxOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  cta: {
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  ctaDisabled: {
    backgroundColor: colors.muted,
  },
  decline: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
});
