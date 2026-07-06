import React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Check, ChevronRight } from "lucide-react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { Confetti } from "@/components/ui/Confetti";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { L, onboardingStepCount } from "@/constants/appVariant";
import { useAuthStore } from "@/store/authStore";
import { useTutorialStore } from "@/store/tutorialStore";

export default function FinishScreen() {
  const setOnboarded = useAuthStore((s) => s.setOnboarded);
  const skipAllTutorials = useTutorialStore((s) => s.skipAll);

  const handleStart = () => {
    setOnboarded(true);
    Alert.alert(
      L("App tour", "App tour"),
      L(
        "Sana SwipeBite'ı tanıtan kısa bir tur yapalım mı? (4 sayfa + ekran içi ipuçları)",
        "Want a quick tour of SwipeBar? (4 pages + in-app tips)",
      ),
      [
        {
          text: L("Hayır, atla", "No, skip"),
          style: "cancel",
          onPress: () => {
            skipAllTutorials();
            router.replace("/(tabs)");
          },
        },
        {
          text: L("Evet, göster", "Yes, show me"),
          style: "default",
          onPress: () => router.replace("/(onboarding)/tutorial"),
        },
      ],
      { cancelable: false },
    );
  };

  return (
    <Screen background="bg">
      <View style={styles.header}>
        <ProgressDots
          total={onboardingStepCount}
          index={onboardingStepCount - 1}
        />
        <Text variant="caption" color={colors.dim}>
          {t.onboarding.step(onboardingStepCount, onboardingStepCount)}
        </Text>
      </View>

      <View style={styles.body}>
        <Confetti count={40} />

        <Animated.View
          entering={ZoomIn.duration(400)}
          style={styles.checkCircle}
        >
          <Check size={36} strokeWidth={2.5} color={colors.onPrimary} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Text variant="h1" align="center">
            {L("Her şey hazır!", "You're all set!")}
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
            {L("Bugün ne yesek?", "What should we drink?")}
          </Text>
          <Text style={styles.quote}>
            {L(
              '"Ailecek kaydırın, AI sizin için en iyi eşleşmeyi bulsun."',
              '"Swipe together and let AI find your perfect match."',
            )}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={handleStart} style={styles.cta}>
          <Text variant="bodyMedium" weight="700" color={colors.onPrimary}>
            {t.onboarding.startSwiping}
          </Text>
          <ChevronRight size={18} strokeWidth={2.5} color={colors.onPrimary} />
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
