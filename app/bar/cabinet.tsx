import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, Stack } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowLeft, Check, RotateCcw } from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
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

export default function BarCabinetScreen() {
  const ingredientIds = useBarCabinetStore((s) => s.ingredientIds);
  const hydrated = useBarCabinetStore((s) => s.hydrated);
  const hydrate = useBarCabinetStore((s) => s.hydrate);
  const toggle = useBarCabinetStore((s) => s.toggle);
  const clear = useBarCabinetStore((s) => s.clear);

  React.useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const ownedSet = React.useMemo(() => new Set(ingredientIds), [ingredientIds]);
  const cookableCount = React.useMemo(
    () =>
      rankCocktails(ownedSet, ALL_COCKTAILS).filter((m) => m.cookable).length,
    [ownedSet],
  );

  return (
    <Screen background="bg" padded={false}>
      <Stack.Screen options={{ title: "Bar Dolabı" }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={10}
        >
          <ArrowLeft size={18} strokeWidth={2} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="h2">Bar Dolabın</Text>
          <Text variant="caption" color={colors.dim}>
            Evde olan içkileri ve malzemeleri seç
          </Text>
        </View>
        {ingredientIds.length > 0 ? (
          <Pressable
            onPress={() => void clear()}
            style={styles.clearBtn}
            hitSlop={10}
          >
            <RotateCcw size={14} strokeWidth={2} color={colors.slate} />
            <Text variant="caption" color={colors.slate}>
              Sıfırla
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{ingredientIds.length}</Text>
          <Text variant="caption" color={colors.dim}>
            seçili malzeme
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: colors.primaryDeep }]}>
            {cookableCount}
          </Text>
          <Text variant="caption" color={colors.dim}>
            yapabileceğin kokteyl
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
        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={() => router.back()} style={styles.cta}>
          <Text variant="bodyMedium" weight="700" color={colors.ink}>
            Tamam
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
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.cream,
  },
  summary: {
    flexDirection: "row",
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryDivider: { width: 1, backgroundColor: colors.border },
  summaryNum: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 36,
    includeFontPadding: false,
    textAlign: "center",
    color: colors.ink,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["2xl"],
    gap: spacing["2xl"],
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
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipEmoji: { fontSize: 16, fontFamily: fonts.sans },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cta: {
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
