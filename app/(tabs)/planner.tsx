import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { Button, Card, Pill, Screen, Text } from "@/components/ui";
import { colors, radii, shadows, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { usePlannerStore } from "@/store/plannerStore";
import { usePantryStore } from "@/store/pantryStore";
import { splitGroceryList } from "@/features/planner/groceryList";
import { useRecipesStore } from "@/store/recipesStore";
import { WeeklyMode } from "@/types/domain";

const MODES: {
  value: WeeklyMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "busy", label: t.planner.modeBusy, icon: "flash" },
  { value: "healthy", label: t.planner.modeHealthy, icon: "leaf" },
  { value: "budget", label: t.planner.modeBudget, icon: "wallet" },
  { value: "comfort", label: t.planner.modeComfort, icon: "heart" },
  { value: "kids", label: t.planner.modeKids, icon: "happy" },
];

export default function PlannerScreen() {
  const household = useAuthStore((s) => s.household);
  const mode = usePlannerStore((s) => s.mode);
  const plan = usePlannerStore((s) => s.plan);
  const setMode = usePlannerStore((s) => s.setMode);
  const generate = usePlannerStore((s) => s.generate);
  const regenerate = usePlannerStore((s) => s.regenerate);
  const pantry = usePantryStore((s) => s.items);
  const recipes = useRecipesStore((s) => s.items);
  const findRecipe = React.useCallback(
    (id: string) => recipes.find((r) => r.id === id),
    [recipes],
  );

  const grocery = React.useMemo(
    () => (plan ? splitGroceryList(plan.groceryList, pantry) : null),
    [plan, pantry],
  );

  const handleGenerate = () => {
    if (!household) return;
    generate(household.id);
  };

  return (
    <Screen background="snow">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text variant="h1" weight="700">
            {t.planner.title}
          </Text>
          <Text variant="small" color={colors.slate} style={{ marginTop: 4 }}>
            {t.planner.subtitle}
          </Text>
        </View>

        <View style={styles.pillRow}>
          {MODES.map((m) => (
            <Pill
              key={m.value}
              label={m.label}
              selected={mode === m.value}
              onPress={() => setMode(m.value)}
            />
          ))}
        </View>

        <Button title={t.planner.generate} fullWidth onPress={handleGenerate} />

        {plan ? (
          <View style={{ gap: spacing.md }}>
            {plan.days.map((d) => {
              const recipe = findRecipe(d.meals[0]?.recipeId ?? "");
              if (!recipe) return null;
              return (
                <Card key={d.date} padding="md" elevated style={styles.dayCard}>
                  <Image
                    source={{ uri: recipe.imageUrl }}
                    style={styles.dayImg}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="caption" weight="600" color={colors.slate}>
                      {t.planner.dayLong[d.dayIndex]?.toUpperCase()}
                    </Text>
                    <Pressable
                      onPress={() => router.push(`/recipe/${recipe.id}`)}
                    >
                      <Text variant="bodyMedium" weight="600">
                        {recipe.title}
                      </Text>
                    </Pressable>
                    <Text variant="caption" color={colors.slate}>
                      {recipe.prepTimeMinutes} dk · {recipe.difficulty}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => regenerate(d.dayIndex)}
                    style={styles.regen}
                    accessibilityLabel={t.planner.regenerateDay}
                  >
                    <Ionicons name="refresh" size={18} color={colors.ink} />
                  </Pressable>
                </Card>
              );
            })}

            {plan.groceryList.length && grocery ? (
              <View style={{ gap: spacing.sm }}>
                <Card variant="amber" padding="lg" style={{ gap: spacing.sm }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                    }}
                  >
                    <Ionicons name="cart" size={18} color={colors.ink} />
                    <Text variant="bodyMedium" weight="700">
                      Almanız gerekenler
                    </Text>
                    <View style={styles.badge}>
                      <Text variant="caption" weight="700" color={colors.ink}>
                        {grocery.toBuy.length}
                      </Text>
                    </View>
                  </View>
                  {grocery.toBuy.length === 0 ? (
                    <Text variant="small" color={colors.graphite}>
                      Tüm malzemeler kilerde mevcut.
                    </Text>
                  ) : (
                    <View style={styles.chipWrap}>
                      {grocery.toBuy.map((g) => (
                        <View key={g.name} style={styles.buyChip}>
                          <Ionicons
                            name="add-circle"
                            size={12}
                            color={colors.ink}
                          />
                          <Text
                            variant="caption"
                            weight="600"
                            color={colors.ink}
                          >
                            {g.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>

                {grocery.alreadyHave.length ? (
                  <Card padding="lg" style={{ gap: spacing.sm }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                      }}
                    >
                      <Ionicons
                        name="checkmark-done"
                        size={16}
                        color={colors.ink}
                      />
                      <Text variant="bodyMedium" weight="700">
                        Kilerde var
                      </Text>
                      <View style={styles.badge}>
                        <Text variant="caption" weight="700" color={colors.ink}>
                          {grocery.alreadyHave.length}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.chipWrap}>
                      {grocery.alreadyHave.map((g) => (
                        <View key={g.name} style={styles.haveChip}>
                          <Text
                            variant="caption"
                            weight="600"
                            color={colors.graphite}
                          >
                            {g.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : (
          <Card
            variant="cloud"
            padding="lg"
            style={{ alignItems: "center", gap: spacing.sm }}
          >
            <Ionicons name="calendar-outline" size={28} color={colors.slate} />
            <Text variant="small" color={colors.slate} align="center">
              Bir mod seç ve plan oluştur.
            </Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing["2xl"],
    gap: spacing.lg,
    paddingBottom: 120,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  dayCard: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dayImg: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.cloud,
  },
  regen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cloud,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.snow,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  buyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.snow,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  haveChip: {
    backgroundColor: colors.cloud,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
