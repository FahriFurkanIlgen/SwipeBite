import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Vibration,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Button, Card, Screen, Text } from "@/components/ui";
import { colors, radii, spacing } from "@/constants/theme";
import { findRecipe } from "@/constants/mockRecipes";
import { useStatsStore } from "@/store/statsStore";

/**
 * Full-screen step-by-step cooking mode.
 * One step at a time, with progress + optional per-step timer.
 */
export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = findRecipe(id ?? "");

  const [stepIndex, setStepIndex] = React.useState(0);
  const [timerSecondsLeft, setTimerSecondsLeft] = React.useState<number | null>(
    null,
  );
  const markCooked = useStatsStore((s) => s.markCooked);

  React.useEffect(() => {
    if (timerSecondsLeft === null) return;
    if (timerSecondsLeft <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Vibration.vibrate([0, 250, 200, 250]);
      setTimerSecondsLeft(null);
      return;
    }
    const t = setTimeout(() => setTimerSecondsLeft((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [timerSecondsLeft]);

  if (!recipe) {
    return (
      <Screen background="snow">
        <View style={styles.center}>
          <Text variant="h2" weight="700">
            Tarif bulunamadı
          </Text>
          <Button title="Geri" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const total = recipe.steps.length;
  const step = recipe.steps[stepIndex] ?? "";
  const isLast = stepIndex >= total - 1;
  const isFirst = stepIndex === 0;
  const progress = total > 0 ? (stepIndex + 1) / total : 0;
  const suggestedMinutes = extractMinutesFromText(step);

  const goNext = () => {
    if (isLast) {
      markCooked(recipe.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStepIndex((i) => Math.min(i + 1, total - 1));
    setTimerSecondsLeft(null);
  };

  const goPrev = () => {
    if (isFirst) return;
    Haptics.selectionAsync();
    setStepIndex((i) => Math.max(0, i - 1));
    setTimerSecondsLeft(null);
  };

  const startTimer = (minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimerSecondsLeft(minutes * 60);
  };

  return (
    <Screen background="canvas">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.ink} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text variant="caption" weight="700" color={colors.graphite}>
            PİŞİRME MODU
          </Text>
          <Text variant="bodyMedium" weight="700">
            {stepIndex + 1} / {total}
          </Text>
        </View>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="caption" weight="700" color={colors.graphite}>
          {recipe.title.toUpperCase()}
        </Text>
        <Text variant="display" weight="700" style={{ lineHeight: 44 }}>
          {step}
        </Text>

        {suggestedMinutes ? (
          <Card padding="lg" style={{ gap: spacing.sm }}>
            <View style={styles.timerRow}>
              <Ionicons name="alarm" size={20} color={colors.ink} />
              <Text variant="bodyMedium" weight="700">
                {timerSecondsLeft !== null
                  ? formatTimer(timerSecondsLeft)
                  : `${suggestedMinutes} dakikalık zamanlayıcı`}
              </Text>
            </View>
            {timerSecondsLeft === null ? (
              <Button
                title="Zamanlayıcıyı başlat"
                onPress={() => startTimer(suggestedMinutes)}
                leftSlot={
                  <Ionicons name="play" size={14} color={colors.snow} />
                }
              />
            ) : (
              <Button
                title="Durdur"
                variant="secondary"
                onPress={() => setTimerSecondsLeft(null)}
              />
            )}
          </Card>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={goPrev}
          disabled={isFirst}
          style={[styles.navBtn, isFirst && { opacity: 0.3 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Button
          title={isLast ? "Bitir" : "Sıradaki adım"}
          onPress={goNext}
          style={{ flex: 1 }}
          rightSlot={
            isLast ? (
              <Ionicons name="checkmark" size={18} color={colors.snow} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.snow} />
            )
          }
        />
      </View>
    </Screen>
  );
}

function extractMinutesFromText(text: string): number | null {
  // Match Turkish patterns: "10 dk", "15 dakika", "5-10 dakika"
  const m = text.match(/(\d{1,3})\s*(?:dk|dakika)/i);
  if (m && m[1]) {
    const n = parseInt(m[1], 10);
    if (n > 0 && n <= 180) return n;
  }
  return null;
}

function formatTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 3,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.ink,
    borderRadius: 3,
  },
  body: {
    padding: spacing["2xl"],
    gap: spacing.lg,
    flexGrow: 1,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing["2xl"],
  },
  navBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.snow,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
});
