import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Check, ChevronRight, Wine } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { colors, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { onboardingStepCount } from "@/constants/appVariant";
import { useAuthStore } from "@/store/authStore";

export default function BarOnboardingScreen() {
  const setProfile = useAuthStore((s) => s.setProfile);
  const [checked, setChecked] = React.useState(false);

  const handleEnable = () => {
    setProfile({ alcoholContentEnabled: true });
    router.push("/(onboarding)/cabinet");
  };

  return (
    <Screen background="bg">
      <View style={styles.header}>
        <ProgressDots total={onboardingStepCount} index={3} />
        <Text variant="caption" color={colors.dim}>
          {t.onboarding.step(4, onboardingStepCount)}
        </Text>
      </View>

      <Animated.View entering={FadeInDown.delay(80).duration(500)}>
        <View style={styles.iconWrap}>
          <Wine size={32} strokeWidth={1.8} color={colors.ink} />
        </View>
        <Text variant="h1">{t.onboarding.barTitle}</Text>
        <Text
          variant="body"
          color={colors.slate}
          style={{ marginTop: spacing.sm }}
        >
          {t.onboarding.barSubtitle}
        </Text>
      </Animated.View>

      <View style={{ flex: 1, justifyContent: "center" }}>
        <Animated.View
          entering={FadeInDown.delay(160).duration(500)}
          style={styles.featureCard}
        >
          <FeatureRow
            emoji="🍸"
            title="Trending cocktail recipes"
            sub="Bartender recipes curated from Instagram"
          />
          <FeatureRow
            emoji="🥃"
            title="Bar cabinet"
            sub="Cocktails you can make with what you have at home"
          />
          <FeatureRow
            emoji="🤝"
            title="Match with friends"
            sub="Decide on tonight's drink together"
          />
        </Animated.View>

        <Pressable
          onPress={() => setChecked((v) => !v)}
          style={styles.checkRow}
          hitSlop={6}
        >
          <View style={[styles.checkbox, checked && styles.checkboxOn]}>
            {checked ? (
              <Check size={14} strokeWidth={2.6} color={colors.onPrimary} />
            ) : null}
          </View>
          <Text
            variant="smallMedium"
            color={colors.ink}
            style={{ flex: 1, lineHeight: 20 }}
          >
            {t.onboarding.barConsent}
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handleEnable}
          disabled={!checked}
          style={[styles.cta, !checked && styles.ctaDisabled]}
        >
          <Text
            variant="bodyMedium"
            weight="700"
            color={checked ? colors.onPrimary : colors.dim}
          >
            {t.onboarding.barEnable}
          </Text>
          <ChevronRight
            size={18}
            strokeWidth={2.5}
            color={checked ? colors.onPrimary : colors.dim}
          />
        </Pressable>
      </View>
    </Screen>
  );
}

const FeatureRow: React.FC<{
  emoji: string;
  title: string;
  sub: string;
}> = ({ emoji, title, sub }) => (
  <View style={styles.featureRow}>
    <Text style={styles.featureEmoji}>{emoji}</Text>
    <View style={{ flex: 1 }}>
      <Text variant="smallMedium" weight="600">
        {title}
      </Text>
      <Text variant="caption" color={colors.slate} style={{ marginTop: 2 }}>
        {sub}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  featureCard: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featureEmoji: {
    fontSize: 22,
    width: 32,
    textAlign: "center",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
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
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  cta: {
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  ctaDisabled: {
    backgroundColor: colors.muted,
  },
});
