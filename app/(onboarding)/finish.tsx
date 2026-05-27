import React from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, Screen, Text } from "@/components/ui";
import { AnimatedHero } from "@/components/ui/AnimatedHero";
import { Confetti } from "@/components/ui/Confetti";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { colors, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";

export default function FinishScreen() {
  const setOnboarded = useAuthStore((s) => s.setOnboarded);

  const handleStart = () => {
    setOnboarded(true);
    router.replace("/(tabs)");
  };

  return (
    <Screen background="canvas">
      <View style={styles.header}>
        <ProgressDots total={4} index={3} />
        <Text variant="caption" color={colors.graphite}>
          {t.onboarding.step(4, 4)}
        </Text>
      </View>

      <View style={styles.body}>
        <Confetti count={40} />
        <AnimatedHero emoji="✨" />
        <Text variant="display" weight="700" align="center">
          {t.onboarding.firstSessionTitle}
        </Text>
        <Text
          variant="body"
          color={colors.graphite}
          align="center"
          style={{ maxWidth: 320 }}
        >
          {t.onboarding.firstSessionSubtitle}
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title={t.onboarding.startSwiping}
          fullWidth
          onPress={handleStart}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.snow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  footer: { paddingVertical: spacing.lg },
});
