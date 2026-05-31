import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Check, ChevronRight } from "lucide-react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { Confetti } from "@/components/ui/Confetti";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";

export default function FinishScreen() {
  const setOnboarded = useAuthStore((s) => s.setOnboarded);

  const handleStart = () => {
    setOnboarded(true);
    router.replace("/(tabs)");
  };

  return (
    <Screen background="bg">
      <View style={styles.header}>
        <ProgressDots total={4} index={3} />
        <Text variant="caption" color={colors.dim}>
          {t.onboarding.step(4, 4)}
        </Text>
      </View>

      <View style={styles.body}>
        <Confetti count={40} />

        <Animated.View
          entering={ZoomIn.duration(400)}
          style={styles.checkCircle}
        >
          <Check size={36} strokeWidth={2.5} color={colors.ink} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Text variant="h1" align="center">
            Her şey hazır!
          </Text>
          <Text
            variant="body"
            color={colors.slate}
            align="center"
            style={{ marginTop: spacing.sm, maxWidth: 300 }}
          >
            {t.onboarding.firstSessionSubtitle}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.quoteCard}
        >
          <Text variant="overline" color={colors.dim}>
            Bugün ne yesek?
          </Text>
          <Text style={styles.quote}>
            "Ailecek kaydırın, AI sizin için en iyi eşleşmeyi bulsun."
          </Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={handleStart} style={styles.cta}>
          <Text variant="bodyMedium" weight="700" color={colors.ink}>
            {t.onboarding.startSwiping}
          </Text>
          <ChevronRight size={18} strokeWidth={2.5} color={colors.ink} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing["2xl"],
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quoteCard: {
    alignSelf: "stretch",
    padding: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.cream,
    gap: spacing.md,
  },
  quote: {
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  footer: { paddingTop: spacing.md, paddingBottom: spacing.lg },
  cta: {
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
});
