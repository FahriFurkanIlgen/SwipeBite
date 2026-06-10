import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Check, Sparkles, X } from "lucide-react-native";

import { Text } from "@/components/ui/Text";
import { colors, radii, spacing } from "@/constants/theme";
import {
  FEATURE_LABELS,
  FREE_MONTHLY_QUOTAS,
  PRO_COMING_SOON,
} from "@/features/billing/entitlements";
import { track } from "@/features/analytics/analyticsService";
import { useUpsellStore } from "@/store/upsellStore";

/**
 * Upsell sheet shown when a free user hits an AI quota.
 *
 * When `PRO_COMING_SOON` is true it teases Pro and captures interest. Once a
 * real paywall exists (Faz 2) the primary CTA routes to `/paywall`. Mounted
 * once in the root layout; driven entirely by `useUpsellStore`.
 */
export const UpsellSheet: React.FC = () => {
  const feature = useUpsellStore((s) => s.feature);
  const hide = useUpsellStore((s) => s.hide);
  const [interested, setInterested] = React.useState(false);

  const visible = feature !== null;

  // Log impression + reset CTA state each time the sheet opens.
  React.useEffect(() => {
    if (feature) {
      setInterested(false);
      track("upsell_shown", { feature });
    }
  }, [feature]);

  const label = feature ? FEATURE_LABELS[feature] : "";
  const limit = feature ? FREE_MONTHLY_QUOTAS[feature] : 0;

  const handleInterest = () => {
    if (feature) track("upsell_interest", { feature });
    setInterested(true);
  };

  const handleGoPro = () => {
    if (feature) track("upsell_to_paywall", { feature });
    hide();
    router.push("/paywall");
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={hide}
    >
      <Animated.View entering={FadeIn.duration(220)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={hide} />
        <Animated.View
          entering={FadeInUp.delay(80).duration(280)}
          style={styles.card}
        >
          <View style={styles.headerRow}>
            <View style={styles.icon}>
              <Sparkles size={20} strokeWidth={2} color={colors.ink} />
            </View>
            <Text variant="overline" color={colors.dim} style={{ flex: 1 }}>
              SwipeBite Pro
            </Text>
            <Pressable onPress={hide} hitSlop={10}>
              <X size={18} strokeWidth={2} color={colors.slate} />
            </Pressable>
          </View>

          {interested ? (
            <>
              <View style={[styles.icon, styles.successIcon]}>
                <Check size={22} strokeWidth={2.4} color={colors.forest} />
              </View>
              <Text variant="h3" style={{ marginTop: spacing.sm }}>
                Teşekkürler!
              </Text>
              <Text
                variant="body"
                color={colors.slate}
                style={{ marginTop: spacing.xs, lineHeight: 22 }}
              >
                Pro hazır olduğunda ilk haber vereceklerimizden olacaksın. O
                zamana kadar tüm temel özellikler ücretsiz.
              </Text>
              <Pressable onPress={hide} style={styles.cta}>
                <Text variant="bodyMedium" weight="700" color={colors.ink}>
                  Tamam
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text variant="h3" style={{ marginTop: spacing.sm }}>
                Bu ayki {label} hakkın doldu
              </Text>
              <Text
                variant="body"
                color={colors.slate}
                style={{ marginTop: spacing.xs, lineHeight: 22 }}
              >
                Ücretsiz planda ayda {Number.isFinite(limit) ? limit : "∞"} kez{" "}
                {label.toLowerCase()} kullanabilirsin. Pro ile sınırsız AI: fiş
                tarama, haftalık plan ve tarif uyarlama — hepsi limitsiz.
              </Text>

              {PRO_COMING_SOON ? (
                <View style={styles.soonBadge}>
                  <Text variant="smallMedium" color={colors.ink}>
                    🚀 Pro çok yakında
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={PRO_COMING_SOON ? handleInterest : handleGoPro}
                style={styles.cta}
              >
                <Text variant="bodyMedium" weight="700" color={colors.ink}>
                  {PRO_COMING_SOON ? "Beni haberdar et" : "Pro'ya geç"}
                </Text>
              </Pressable>
              <Pressable onPress={hide} hitSlop={10} style={styles.dismiss}>
                <Text variant="small" color={colors.dim}>
                  Belki sonra
                </Text>
              </Pressable>
            </>
          )}
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
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    marginTop: spacing.sm,
    backgroundColor: colors.forestSoft,
  },
  soonBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
  },
  cta: {
    marginTop: spacing.lg,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dismiss: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
});
