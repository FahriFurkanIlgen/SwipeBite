import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Vibration,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { RecipeImage } from "@/components/ui/RecipeImage";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Timer,
  Volume2,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { getRecipeImageSource } from "@/features/recipes/recipeImage";
import { useRecipesStore } from "@/store/recipesStore";
import { useSessionStore } from "@/store/sessionStore";
import { useStatsStore } from "@/store/statsStore";
import { usePantryStore } from "@/store/pantryStore";
import { pantryItemsUsedByRecipe } from "@/features/pantry/pantryMatcher";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function extractMinutes(text: string): number | null {
  const m = text.match(/(\d{1,3})\s*(?:dk|dakika)/i);
  if (m && m[1]) {
    const n = parseInt(m[1], 10);
    if (n > 0 && n <= 180) return n;
  }
  return null;
}

export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const storeRecipe = useRecipesStore((s) =>
    s.items.find((r) => r.id === (id ?? "")),
  );
  // Influencer / custom-pool recipes aren't in the global recipes store, so
  // fall back to the active session's pool/candidates (same as recipe screen).
  const customPool = useSessionStore((s) => s.customPool);
  const candidates = useSessionStore((s) => s.candidates);
  const recipe = React.useMemo(() => {
    if (storeRecipe) return storeRecipe;
    const rid = id ?? "";
    return (
      customPool?.find((r) => r.id === rid) ??
      candidates.find((r) => r.id === rid)
    );
  }, [storeRecipe, customPool, candidates, id]);
  const markCooked = useStatsStore((s) => s.markCooked);
  const pantry = usePantryStore((s) => s.items);
  const removePantryItem = usePantryStore((s) => s.remove);

  const [stepIndex, setStepIndex] = React.useState(0);
  const [timerSeconds, setTimerSeconds] = React.useState(0);
  const [timerRunning, setTimerRunning] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);

  // Pantry items this recipe likely uses, offered for removal once cooked.
  const usedPantryItems = React.useMemo(
    () => (recipe ? pantryItemsUsedByRecipe(recipe, pantry) : []),
    [recipe, pantry],
  );
  // Ids selected to be removed from the pantry. Initialised (once we reach the
  // completion screen) with the non-staple items pre-checked.
  const [removeIds, setRemoveIds] = React.useState<Set<string> | null>(null);
  React.useEffect(() => {
    if (completed && removeIds === null) {
      setRemoveIds(
        new Set(usedPantryItems.filter((u) => !u.staple).map((u) => u.item.id)),
      );
    }
  }, [completed, removeIds, usedPantryItems]);

  const toggleRemove = (itemId: string) => {
    Haptics.selectionAsync();
    setRemoveIds((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const finishCooking = async () => {
    const ids = removeIds ? [...removeIds] : [];
    if (ids.length > 0) {
      setRemoving(true);
      try {
        await Promise.all(
          ids.map((rid) => removePantryItem(rid).catch(() => undefined)),
        );
      } finally {
        setRemoving(false);
      }
    }
    router.replace("/(tabs)");
  };

  const currentStep = recipe?.steps[stepIndex] ?? "";
  const stepMinutes = extractMinutes(currentStep);
  const total = recipe?.steps.length ?? 0;
  const progress = total > 0 ? (stepIndex + 1) / total : 0;

  const progressValue = useSharedValue(0);
  React.useEffect(() => {
    progressValue.value = withSpring(progress, { stiffness: 200, damping: 30 });
  }, [progress, progressValue]);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  React.useEffect(() => {
    if (stepMinutes) {
      setTimerSeconds(stepMinutes * 60);
    } else {
      setTimerSeconds(0);
    }
    setTimerRunning(false);
  }, [stepIndex, stepMinutes]);

  React.useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((s) => {
        if (s <= 1) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Vibration.vibrate([0, 250, 200, 250]);
          setTimerRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  if (!recipe) {
    return (
      <Screen background="bg">
        <View style={styles.empty}>
          <Text variant="h2">Tarif bulunamadı</Text>
          <Pressable onPress={() => router.back()} style={styles.cta}>
            <Text variant="bodyMedium" weight="700" color={colors.onPrimary}>
              Geri
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (stepIndex < total - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      markCooked(recipe.id);
      setCompleted(true);
    }
  };

  const prevStep = () => {
    if (stepIndex === 0) return;
    Haptics.selectionAsync();
    setStepIndex(stepIndex - 1);
  };

  if (completed) {
    const removeCount = removeIds?.size ?? 0;
    return (
      <Screen background="bg">
        <ScrollView
          contentContainerStyle={styles.completeBody}
          showsVerticalScrollIndicator={false}
        >
          <Animated.Text
            entering={ZoomIn.duration(400)}
            style={{ fontSize: 56, marginBottom: spacing.lg }}
          >
            🍽️
          </Animated.Text>
          <Animated.View entering={FadeIn.delay(200).duration(400)}>
            <Text variant="h1" align="center">
              Afiyet olsun!
            </Text>
            <Text
              variant="body"
              color={colors.slate}
              align="center"
              style={{ marginTop: spacing.sm }}
            >
              {recipe.title} hazır. Servis edin!
            </Text>
          </Animated.View>

          {usedPantryItems.length > 0 ? (
            <Animated.View
              entering={FadeIn.delay(350).duration(400)}
              style={styles.pantryCard}
            >
              <Text variant="bodyMedium" weight="700" color={colors.ink}>
                Kileri güncelle
              </Text>
              <Text
                variant="caption"
                color={colors.slate}
                style={{ marginTop: 2, marginBottom: spacing.md }}
              >
                Kullandığın malzemeleri kilerden düşelim.
              </Text>
              {usedPantryItems.map(({ item }) => {
                const checked = removeIds?.has(item.id) ?? false;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleRemove(item.id)}
                    style={styles.pantryRow}
                  >
                    <View
                      style={[styles.checkbox, checked && styles.checkboxOn]}
                    >
                      {checked ? (
                        <Check
                          size={13}
                          color={colors.onPrimary}
                          strokeWidth={3}
                        />
                      ) : null}
                    </View>
                    <Text
                      variant="bodyMedium"
                      color={colors.ink}
                      style={{ flex: 1 }}
                    >
                      {item.name}
                    </Text>
                    {item.quantity ? (
                      <Text variant="caption" color={colors.dim}>
                        {item.quantity}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </Animated.View>
          ) : null}

          <Pressable
            onPress={finishCooking}
            disabled={removing}
            style={[styles.completeCta, removing && { opacity: 0.6 }]}
          >
            <Text variant="bodyMedium" weight="700" color={colors.onPrimary}>
              {removing
                ? "Güncelleniyor…"
                : removeCount > 0
                  ? `Kileri güncelle ve bitir (${removeCount})`
                  : "Ana Sayfaya Dön"}
            </Text>
          </Pressable>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <RecipeImage
          source={getRecipeImageSource(recipe)}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.6 }]}
          containerStyle={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <LinearGradient
          colors={["rgba(26,23,20,0.3)", "rgba(26,23,20,0.9)"]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.heroHeader}>
          <Pressable
            onPress={() => router.back()}
            style={styles.heroIcon}
            hitSlop={12}
          >
            <ArrowLeft size={16} color={colors.bg} strokeWidth={2} />
          </Pressable>
          <Text
            style={{
              fontFamily: fonts.serifItalic,
              fontSize: 15,
              color: "rgba(250,247,242,0.8)",
            }}
            numberOfLines={1}
          >
            {recipe.title}
          </Text>
          <Pressable style={styles.heroIcon}>
            <Volume2 size={15} color={colors.bg} strokeWidth={1.5} />
          </Pressable>
        </View>

        <View style={styles.heroBottom}>
          <Text variant="caption" color="rgba(250,247,242,0.65)">
            Adım {stepIndex + 1} / {total}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </View>

      <View style={styles.body}>
        <Animated.View
          key={stepIndex}
          entering={FadeIn.duration(220)}
          style={{ flex: 1 }}
        >
          <View style={styles.stepNum}>
            <Text
              style={{
                fontFamily: fonts.serif,
                fontSize: 14,
                color: colors.onPrimary,
              }}
            >
              {stepIndex + 1}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 17,
              lineHeight: 28,
              color: colors.ink,
            }}
          >
            {currentStep}
          </Text>
        </Animated.View>

        {stepMinutes ? (
          <View style={styles.timerCard}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setTimerRunning(!timerRunning);
              }}
              style={[
                styles.timerBtn,
                {
                  backgroundColor: timerRunning
                    ? colors.accent
                    : colors.primary,
                },
              ]}
            >
              <Timer size={20} color={colors.onPrimary} strokeWidth={1.5} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 28,
                  lineHeight: 36,
                  letterSpacing: -0.5,
                  color: timerSeconds === 0 ? colors.forest : colors.ink,
                  includeFontPadding: false,
                  textAlignVertical: "center",
                }}
              >
                {timerSeconds === 0 ? "✓ Hazır" : formatTime(timerSeconds)}
              </Text>
              <Text variant="caption" color={colors.dim}>
                {timerRunning
                  ? "Sayıyor…"
                  : timerSeconds > 0
                    ? "Başlatmak için dokunun"
                    : "Süre doldu!"}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.navRow}>
          <Pressable
            onPress={prevStep}
            disabled={stepIndex === 0}
            style={[styles.navBtn, stepIndex === 0 && { opacity: 0.3 }]}
          >
            <ChevronLeft size={20} color={colors.slate} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={nextStep} style={styles.nextBtn}>
            {stepIndex < total - 1 ? (
              <>
                <Text variant="bodyMedium" weight="700" color={colors.bg}>
                  Sonraki Adım
                </Text>
                <ChevronRight size={16} color={colors.bg} strokeWidth={2} />
              </>
            ) : (
              <>
                <Check size={16} color={colors.primary} strokeWidth={2.5} />
                <Text variant="bodyMedium" weight="700" color={colors.bg}>
                  Tamamlandı
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  hero: { height: "40%", position: "relative" },
  heroHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["3xl"],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(250,247,242,0.12)",
    borderWidth: 1,
    borderColor: "rgba(250,247,242,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBottom: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.lg,
  },
  progressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: "rgba(250,247,242,0.1)",
  },
  progressFill: { height: "100%", backgroundColor: colors.primary },
  body: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.xl,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  timerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  timerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  navRow: { flexDirection: "row", gap: spacing.sm },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  completeBody: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing["2xl"],
    gap: spacing["2xl"],
  },
  pantryCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  pantryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  completeCta: {
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  cta: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
});
