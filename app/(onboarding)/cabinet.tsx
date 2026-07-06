import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Check, ChevronRight, Package } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { colors, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { onboardingStepCount } from "@/constants/appVariant";
import {
  BAR_CATEGORY_LABEL,
  BAR_CATEGORY_ORDER,
  BAR_INGREDIENTS,
} from "@/constants/barCatalog";
import { useBarCabinetStore } from "@/store/barCabinetStore";
import { ALL_COCKTAILS } from "@/constants/allCocktails";
import { rankCocktails } from "@/features/bar/cocktailMatcher";
import type { BarIngredient, BarIngredientCategory } from "@/types/bar";

const INGREDIENTS_BY_CATEGORY: Record<BarIngredientCategory, BarIngredient[]> =
  BAR_INGREDIENTS.reduce(
    (acc, ing) => {
      const list = acc[ing.category] ?? [];
      list.push(ing);
      acc[ing.category] = list;
      return acc;
    },
    {} as Record<BarIngredientCategory, BarIngredient[]>,
  );

export default function CabinetOnboardingScreen() {
  const ingredientIds = useBarCabinetStore((s) => s.ingredientIds);
  const hydrated = useBarCabinetStore((s) => s.hydrated);
  const hydrate = useBarCabinetStore((s) => s.hydrate);
  const toggle = useBarCabinetStore((s) => s.toggle);

  React.useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const ownedSet = React.useMemo(() => new Set(ingredientIds), [ingredientIds]);
  const cookableCount = React.useMemo(
    () =>
      rankCocktails(ownedSet, ALL_COCKTAILS).filter((m) => m.cookable).length,
    [ownedSet],
  );

  const hasSelection = ingredientIds.length > 0;

  return (
    <Screen background="bg" padded={false}>
      <View style={styles.header}>
        <ProgressDots total={onboardingStepCount} index={4} />
        <Text variant="caption" color={colors.dim}>
          {t.onboarding.step(5, onboardingStepCount)}
        </Text>
      </View>

      <Animated.View
        entering={FadeInDown.delay(80).duration(500)}
        style={styles.intro}
      >
        <View style={styles.iconWrap}>
          <Package size={28} strokeWidth={1.8} color={colors.ink} />
        </View>
        <Text variant="h1">Stock your bar cabinet</Text>
        <Text
          variant="body"
          color={colors.slate}
          style={{ marginTop: spacing.sm }}
        >
          Tap the spirits and mixers you keep at home. We'll instantly show the
          cocktails you can make right now. You can always change this later.
        </Text>
      </Animated.View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{ingredientIds.length}</Text>
          <Text variant="caption" color={colors.dim}>
            selected ingredients
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: colors.primaryDeep }]}>
            {cookableCount}
          </Text>
          <Text variant="caption" color={colors.dim}>
            cocktails you can make
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {BAR_CATEGORY_ORDER.map((cat, idx) => {
          const items = INGREDIENTS_BY_CATEGORY[cat] ?? [];
          if (items.length === 0) return null;
          return (
            <Animated.View
              key={cat}
              entering={FadeInDown.delay(40 * idx).duration(360)}
              style={{ gap: spacing.sm }}
            >
              <Text variant="overline" color={colors.dim}>
                {BAR_CATEGORY_LABEL[cat]}
              </Text>
              <View style={styles.chipRow}>
                {items.map((ing) => {
                  const active = ownedSet.has(ing.id);
                  return (
                    <Pressable
                      key={ing.id}
                      onPress={() => void toggle(ing.id)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={styles.chipEmoji}>{ing.emoji}</Text>
                      <Text
                        variant="smallMedium"
                        weight={active ? "600" : "500"}
                        color={active ? colors.ink : colors.slate}
                      >
                        {ing.name}
                      </Text>
                      {active ? (
                        <View style={styles.checkBadge}>
                          <Check size={10} strokeWidth={3} color={colors.ink} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          );
        })}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push("/(onboarding)/finish")}
          style={styles.cta}
        >
          <Text variant="bodyMedium" weight="700" color={colors.onPrimary}>
            {hasSelection
              ? `Continue with ${ingredientIds.length}`
              : "Continue"}
          </Text>
          <ChevronRight size={18} strokeWidth={2.5} color={colors.onPrimary} />
        </Pressable>
        <Pressable
          onPress={() => router.push("/(onboarding)/finish")}
          style={styles.skipBtn}
          hitSlop={8}
        >
          <Text variant="smallMedium" weight="600" color={colors.slate}>
            Skip for now
          </Text>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  intro: {
    paddingHorizontal: spacing.xl,
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
  summary: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  summaryNum: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.ink,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accentSoft,
  },
  chipEmoji: {
    fontSize: 16,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: spacing.xl,
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
    gap: 6,
  },
  skipBtn: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
