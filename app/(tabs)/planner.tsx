import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { RecipeImage } from "@/components/ui/RecipeImage";
import {
  ChevronDown,
  Clock,
  Lock,
  Plus,
  RefreshCw,
  Settings2,
  Share2,
  Shuffle,
  Sparkles,
  ShoppingCart,
  Unlock,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { CoachMark } from "@/components/ui/CoachMark";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { usePlannerStore } from "@/store/plannerStore";
import { usePantryStore } from "@/store/pantryStore";
import { useRecipesStore } from "@/store/recipesStore";
import { useGroceryStore } from "@/store/groceryStore";
import { useEntitlementsStore } from "@/store/entitlementsStore";
import { useUpsellStore } from "@/store/upsellStore";
import {
  groupGroceryByCategory,
  splitGroceryList,
} from "@/features/planner/groceryList";
import {
  classifyCourse,
  COURSE_LABEL,
  MEAL_PLAN_COMPOSITION,
  MEAL_PLAN_EMOJI,
  MEAL_PLAN_LABEL,
  type Course,
} from "@/features/recipes/recipeClassifier";
import { MealPlan, WeeklyMode } from "@/types/domain";
import { getRecipeImageSource } from "@/features/recipes/recipeImage";

const MEAL_PLAN_ORDER: MealPlan[] = [
  "kahvalti",
  "ogle",
  "aksam",
  "tatli",
  "atistirma",
];

const MODES: { value: WeeklyMode; label: string; emoji: string }[] = [
  { value: "busy", label: t.planner.modeBusy, emoji: "⚡" },
  { value: "healthy", label: t.planner.modeHealthy, emoji: "🥗" },
  { value: "budget", label: t.planner.modeBudget, emoji: "💰" },
  { value: "comfort", label: t.planner.modeComfort, emoji: "🍲" },
  { value: "kids", label: t.planner.modeKids, emoji: "👨‍👩‍👧" },
];

export default function PlannerScreen() {
  const household = useAuthStore((s) => s.household);
  const mode = usePlannerStore((s) => s.mode);
  const plan = usePlannerStore((s) => s.plan);
  const lockedDays = usePlannerStore((s) => s.lockedDays);
  const setMode = usePlannerStore((s) => s.setMode);
  const mealPlan = usePlannerStore((s) => s.mealPlan);
  const includeCourses = usePlannerStore((s) => s.includeCourses);
  const lengthDays = usePlannerStore((s) => s.lengthDays);
  const setLengthDays = usePlannerStore((s) => s.setLengthDays);
  const setMealPlan = usePlannerStore((s) => s.setMealPlan);
  const toggleCourse = usePlannerStore((s) => s.toggleCourse);
  const generate = usePlannerStore((s) => s.generate);
  const regenerate = usePlannerStore((s) => s.regenerate);
  const generateFromPreferences = usePlannerStore(
    (s) => s.generateFromPreferences,
  );
  const shuffleUnlocked = usePlannerStore((s) => s.shuffleUnlocked);
  const toggleLock = usePlannerStore((s) => s.toggleLock);
  const loading = usePlannerStore((s) => s.loading);
  const pantry = usePantryStore((s) => s.items);
  const addToPantry = usePantryStore((s) => s.addMany);
  const recipes = useRecipesStore((s) => s.items);
  const checkedByPlan = useGroceryStore((s) => s.checkedByPlan);
  const purchasedByPlan = useGroceryStore((s) => s.purchasedByPlan);
  const hydrateGrocery = useGroceryStore((s) => s.hydrate);
  const toggleGroceryCheck = useGroceryStore((s) => s.toggle);
  const commitGroceryChecked = useGroceryStore((s) => s.commitChecked);
  const findRecipe = React.useCallback(
    (id: string) => recipes.find((r) => r.id === id),
    [recipes],
  );

  const grocery = React.useMemo(
    () => (plan ? splitGroceryList(plan.groceryList, pantry) : null),
    [plan, pantry],
  );
  const purchasedKeys = React.useMemo(
    () => new Set(plan ? (purchasedByPlan[plan.id] ?? []) : []),
    [purchasedByPlan, plan],
  );
  const visibleToBuy = React.useMemo(
    () =>
      grocery
        ? grocery.toBuy.filter(
            (g) => !purchasedKeys.has(g.name.toLocaleLowerCase("tr-TR").trim()),
          )
        : [],
    [grocery, purchasedKeys],
  );
  const groceryGroups = React.useMemo(
    () => groupGroceryByCategory(visibleToBuy),
    [visibleToBuy],
  );
  React.useEffect(() => {
    void hydrateGrocery();
  }, [hydrateGrocery]);
  const checkedKeys = React.useMemo(
    () => new Set(plan ? (checkedByPlan[plan.id] ?? []) : []),
    [checkedByPlan, plan],
  );
  const isItemChecked = React.useCallback(
    (name: string) => checkedKeys.has(name.toLocaleLowerCase("tr-TR").trim()),
    [checkedKeys],
  );
  const checkedCount = React.useMemo(
    () =>
      visibleToBuy.filter((g) =>
        checkedKeys.has(g.name.toLocaleLowerCase("tr-TR").trim()),
      ).length,
    [visibleToBuy, checkedKeys],
  );
  const toggleChecked = React.useCallback(
    async (name: string) => {
      if (!plan) return;
      await toggleGroceryCheck(plan.id, name);
    },
    [plan, toggleGroceryCheck],
  );

  const handleConfirmShopping = React.useCallback(async () => {
    if (!plan || !household) return;
    setConfirming(true);
    try {
      const committed = await commitGroceryChecked(plan.id);
      if (committed.length === 0) return;
      const lookup = new Map(
        visibleToBuy.map((g) => [
          g.name.toLocaleLowerCase("tr-TR").trim(),
          g.name,
        ]),
      );
      const now = new Date().toISOString();
      const items = committed.map((k, idx) => ({
        id: `local-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        householdId: household.id,
        name: lookup.get(k) ?? k,
        createdAt: now,
      }));
      try {
        await addToPantry(items);
      } catch {
        // ignore
      }
    } finally {
      setConfirming(false);
    }
  }, [plan, household, commitGroceryChecked, visibleToBuy, addToPantry]);

  const handleShareGrocery = React.useCallback(async () => {
    if (!grocery) return;
    const lines: string[] = ["🛒 Market Listesi", ""];
    for (const group of groceryGroups) {
      lines.push(`— ${group.category} —`);
      for (const it of group.items) {
        const mark = isItemChecked(it.name) ? "✓" : "•";
        lines.push(`${mark} ${it.name}`);
      }
      lines.push("");
    }
    if (grocery.alreadyHave.length > 0) {
      lines.push("Kilerde mevcut:");
      for (const it of grocery.alreadyHave) lines.push(`✓ ${it.name}`);
    }
    try {
      await Share.share({ message: lines.join("\n").trim() });
    } catch {
      // user cancelled or share unavailable
    }
  }, [grocery, groceryGroups, isItemChecked]);

  const [showShopping, setShowShopping] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  const handleGenerate = () => {
    if (!household) return;
    void generate(household.id);
  };

  const handleAIGenerate = () => {
    if (!household) return;
    void (async () => {
      const ok = await useEntitlementsStore.getState().consume("weekly_plan");
      if (!ok) {
        useUpsellStore.getState().show("weekly_plan");
        return;
      }
      await generateFromPreferences(household.id);
    })();
  };

  const handleShuffle = () => {
    if (!household) return;
    void shuffleUnlocked(household.id);
  };

  return (
    <Screen background="bg" padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text variant="overline" color={colors.dim}>
            Haftalık Plan
          </Text>
          <Text variant="h1" style={{ marginTop: 4 }}>
            Bu Hafta
          </Text>
        </View>

        {/* Mode pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}
        >
          {MODES.map((m) => {
            const isActive = mode === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => setMode(m.value)}
                style={[
                  styles.modePill,
                  {
                    backgroundColor: isActive ? colors.ink : colors.cream,
                    borderColor: isActive ? colors.ink : colors.border,
                  },
                ]}
              >
                <Text style={{ fontFamily: fonts.sans, fontSize: 13 }}>
                  {m.emoji}
                </Text>
                <Text
                  variant="smallMedium"
                  weight={isActive ? "600" : "400"}
                  color={isActive ? colors.bg : colors.slate}
                  style={{ fontSize: 12 }}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Meal-plan + course selector */}
        <View style={styles.planSelector}>
          <Text
            variant="caption"
            color={colors.dim}
            style={{ marginBottom: 8 }}
          >
            Öğün türü
          </Text>
          <View style={styles.planRow}>
            {MEAL_PLAN_ORDER.map((p) => {
              const isActive = p === mealPlan;
              return (
                <Pressable
                  key={p}
                  onPress={() => setMealPlan(p)}
                  style={[
                    styles.planEmojiPill,
                    {
                      backgroundColor: isActive
                        ? colors.primarySoft
                        : colors.cream,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  hitSlop={6}
                >
                  <Text style={styles.planEmoji}>{MEAL_PLAN_EMOJI[p]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="caption" color={colors.dim} style={{ marginTop: 6 }}>
            {MEAL_PLAN_LABEL[mealPlan]}
          </Text>
          {MEAL_PLAN_COMPOSITION[mealPlan].length > 1 ? (
            <View style={styles.courseChips}>
              {MEAL_PLAN_COMPOSITION[mealPlan].map((slot) => {
                const on = includeCourses.includes(slot.course);
                return (
                  <Pressable
                    key={slot.course}
                    onPress={() => toggleCourse(slot.course)}
                    style={[
                      styles.courseChip,
                      {
                        backgroundColor: on ? colors.ink : colors.cream,
                        borderColor: on ? colors.ink : colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      weight="700"
                      color={on ? colors.bg : colors.slate}
                    >
                      {COURSE_LABEL[slot.course]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* Length picker */}
          <View style={{ marginTop: 12 }}>
            <Text
              variant="caption"
              color={colors.dim}
              style={{ marginBottom: 6 }}
            >
              Kaç günlük plan?
            </Text>
            <View style={styles.lengthRow}>
              {[3, 5, 7, 14].map((n) => {
                const on = lengthDays === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setLengthDays(n)}
                    style={[
                      styles.lengthPill,
                      {
                        backgroundColor: on ? colors.ink : colors.cream,
                        borderColor: on ? colors.ink : colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      weight="700"
                      color={on ? colors.bg : colors.slate}
                    >
                      {n} gün
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {!plan ? (
          <View style={{ gap: 8 }}>
            <Pressable onPress={handleAIGenerate} style={styles.aiGenerate}>
              <Sparkles size={16} color={colors.primary} strokeWidth={2} />
              <Text variant="bodyMedium" weight="700" color={colors.bg}>
                {loading ? "Plan hazırlanıyor…" : "Yeni hafta planı"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/settings/preferences")}
              style={styles.prefsLink}
              hitSlop={6}
            >
              <Settings2 size={13} color={colors.dim} strokeWidth={1.5} />
              <Text variant="caption" color={colors.dim}>
                Aile tercihlerini düzenle
              </Text>
            </Pressable>
            <Pressable onPress={handleGenerate} style={styles.generateAlt}>
              <Text variant="smallMedium" weight="600" color={colors.slate}>
                veya {t.planner.generate}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.planActions}>
            <Pressable onPress={handleAIGenerate} style={styles.actionPill}>
              <Sparkles size={13} color={colors.primary} strokeWidth={2} />
              <Text variant="smallMedium" weight="600" color={colors.bg}>
                Yeni plan
              </Text>
            </Pressable>
            <Pressable onPress={handleShuffle} style={styles.actionPillAlt}>
              <Shuffle size={13} color={colors.slate} strokeWidth={2} />
              <Text variant="smallMedium" weight="600" color={colors.slate}>
                Karıştır
                {lockedDays.length > 0 ? ` (${lockedDays.length} 🔒)` : ""}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/settings/preferences")}
              style={styles.actionPillAlt}
              hitSlop={6}
            >
              <Settings2 size={13} color={colors.slate} strokeWidth={1.5} />
            </Pressable>
          </View>
        )}

        {/* Days */}
        {plan ? (
          <View style={{ gap: 10 }}>
            {plan.days.map((d, idx) => {
              const dayRecipes = d.meals
                .map((m) => findRecipe(m.recipeId))
                .filter((r): r is NonNullable<typeof r> => !!r);
              const dayDate = new Date(d.date);
              const dayStart = new Date(
                dayDate.getFullYear(),
                dayDate.getMonth(),
                dayDate.getDate(),
              ).getTime();
              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);
              const isToday = dayStart === todayStart.getTime();
              const isPast = dayStart < todayStart.getTime();
              // Weekday from actual date (Mon=0 .. Sun=6) for the day label.
              const weekdayIdx = (dayDate.getDay() + 6) % 7;
              const isLocked = lockedDays.includes(d.dayIndex) || isPast;
              return (
                <Animated.View
                  key={d.date}
                  entering={FadeInDown.delay(idx * 50).duration(400)}
                  style={[
                    styles.dayCard,
                    {
                      borderColor: isToday ? colors.primary : colors.border,
                      borderWidth: 1.5,
                      opacity: isPast ? 0.5 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.dayCol,
                      {
                        backgroundColor: isToday ? colors.primary : colors.bg,
                        borderRightColor: isToday
                          ? "rgba(255,255,255,0.3)"
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="overline"
                      color={isToday ? colors.ink : colors.dim}
                    >
                      {(t.planner.dayLong[weekdayIdx] ?? "").slice(0, 3)}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.serif,
                        fontSize: 22,
                        color: isToday ? colors.ink : colors.graphite,
                        lineHeight: 24,
                      }}
                    >
                      {new Date(d.date).getDate()}
                    </Text>
                  </View>
                  <View style={styles.dayBody}>
                    <View style={{ flex: 1, gap: 6 }}>
                      {dayRecipes.length > 0 ? (
                        dayRecipes.map((recipe) => {
                          const course = classifyCourse(recipe);
                          return (
                            <Pressable
                              key={recipe.id}
                              onPress={() =>
                                router.push(`/recipe/${recipe.id}`)
                              }
                              style={styles.dayMeal}
                            >
                              <RecipeImage
                                source={getRecipeImageSource(recipe)}
                                style={styles.dayImg}
                                containerStyle={styles.dayImg}
                                placeholderRadius={10}
                                contentFit="cover"
                              />
                              <View style={{ flex: 1 }}>
                                <Text
                                  variant="smallMedium"
                                  weight="600"
                                  numberOfLines={1}
                                >
                                  {recipe.title}
                                </Text>
                                <View style={styles.dayMeta}>
                                  <View style={styles.coursePill}>
                                    <Text
                                      variant="caption"
                                      weight="700"
                                      color={colors.ink}
                                    >
                                      {COURSE_LABEL[course]}
                                    </Text>
                                  </View>
                                  <Clock
                                    size={9}
                                    color={colors.dim}
                                    strokeWidth={1.5}
                                  />
                                  <Text variant="caption" color={colors.dim}>
                                    {recipe.prepTimeMinutes} dk
                                  </Text>
                                </View>
                              </View>
                            </Pressable>
                          );
                        })
                      ) : (
                        <View style={styles.dayMeal}>
                          <Text
                            variant="smallMedium"
                            color={colors.hairline}
                            style={{ flex: 1 }}
                          >
                            Planlanmadı
                          </Text>
                          <Pressable
                            onPress={handleGenerate}
                            style={styles.dayAction}
                          >
                            <Plus
                              size={14}
                              color={colors.dim}
                              strokeWidth={2}
                            />
                          </Pressable>
                        </View>
                      )}
                    </View>
                    {dayRecipes.length > 0 ? (
                      <View style={styles.dayActions}>
                        <Pressable
                          onPress={() => !isPast && toggleLock(d.dayIndex)}
                          disabled={isPast}
                          style={[
                            styles.dayAction,
                            isLocked && {
                              backgroundColor: colors.accentSoft,
                            },
                          ]}
                          hitSlop={4}
                        >
                          {isLocked ? (
                            <Lock
                              size={11}
                              color={colors.accent}
                              strokeWidth={2}
                            />
                          ) : (
                            <Unlock
                              size={11}
                              color={colors.dim}
                              strokeWidth={1.5}
                            />
                          )}
                        </Pressable>
                        <Pressable
                          onPress={() => !isPast && void regenerate(d.dayIndex)}
                          disabled={isPast}
                          style={styles.dayAction}
                          hitSlop={4}
                        >
                          <RefreshCw
                            size={12}
                            color={colors.dim}
                            strokeWidth={1.5}
                          />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text variant="overline" color={colors.dim}>
              📅
            </Text>
            <Text variant="smallMedium" color={colors.slate} align="center">
              Bir mod seç ve plan oluştur.
            </Text>
          </View>
        )}

        {/* Shopping */}
        {plan && grocery ? (
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={() => setShowShopping(!showShopping)}
              style={styles.shoppingCard}
            >
              <View style={styles.shoppingIcon}>
                <ShoppingCart size={18} color={colors.ink} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="smallMedium" weight="600">
                  Market Listesi
                </Text>
                <Text variant="caption" color={colors.dim}>
                  {visibleToBuy.length} ürün eksik
                  {checkedCount > 0 ? ` · ${checkedCount} seçili` : ""}
                </Text>
              </View>
              {visibleToBuy.length > 0 ? (
                <Pressable
                  onPress={handleShareGrocery}
                  hitSlop={10}
                  style={styles.shareBtn}
                >
                  <Share2 size={15} color={colors.slate} strokeWidth={1.8} />
                </Pressable>
              ) : null}
              <ChevronDown
                size={16}
                color={colors.dim}
                strokeWidth={1.5}
                style={{
                  transform: [{ rotate: showShopping ? "180deg" : "0deg" }],
                }}
              />
            </Pressable>

            {showShopping ? (
              <View style={styles.shoppingList}>
                {visibleToBuy.length === 0 ? (
                  <View style={{ padding: spacing.lg }}>
                    <Text variant="small" color={colors.slate}>
                      Tüm malzemeler kilerde mevcut.
                    </Text>
                  </View>
                ) : (
                  groceryGroups.map((group, gi) => (
                    <View
                      key={group.category}
                      style={
                        gi > 0 && {
                          borderTopWidth: 1,
                          borderTopColor: colors.cream,
                        }
                      }
                    >
                      <View style={styles.shoppingGroupHeader}>
                        <Text variant="overline" color={colors.dim}>
                          {group.category} · {group.items.length}
                        </Text>
                      </View>
                      {group.items.map((g, i) => {
                        const checked = isItemChecked(g.name);
                        return (
                          <Pressable
                            key={g.name}
                            onPress={() => toggleChecked(g.name)}
                            style={[
                              styles.shoppingItem,
                              i > 0 && {
                                borderTopWidth: 1,
                                borderTopColor: colors.cream,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.shoppingCheck,
                                checked && {
                                  backgroundColor: colors.ink,
                                  borderColor: colors.ink,
                                },
                              ]}
                            >
                              {checked ? (
                                <Text
                                  variant="caption"
                                  color={colors.bg}
                                  weight="700"
                                >
                                  ✓
                                </Text>
                              ) : null}
                            </View>
                            <Text
                              variant="smallMedium"
                              style={{
                                flex: 1,
                                textDecorationLine: checked
                                  ? "line-through"
                                  : "none",
                                color: checked ? colors.dim : colors.ink,
                              }}
                            >
                              {g.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))
                )}
                {checkedCount > 0 ? (
                  <Pressable
                    onPress={handleConfirmShopping}
                    disabled={confirming}
                    style={[
                      styles.confirmBtn,
                      { opacity: confirming ? 0.7 : 1 },
                    ]}
                  >
                    {confirming ? (
                      <ActivityIndicator size="small" color={colors.bg} />
                    ) : null}
                    <Text variant="smallMedium" weight="700" color={colors.bg}>
                      {confirming
                        ? "Kilere ekleniyor…"
                        : `Tamam — ${checkedCount} ürünü kilere ekle`}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>
      <CoachMark
        storageKey="plannerCoach"
        title="Haftalık planın burada"
        description="Eşleştiğin tariflerden haftalık yemek programı oluştur. Her gün için bir tarif seç, market listesini otomatik çıkartalım."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["3xl"],
    gap: spacing.lg,
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  generate: {
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  aiGenerate: {
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  generateAlt: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  prefsLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
  },
  planActions: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
  },
  actionPillAlt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayCard: {
    flexDirection: "row",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  dayCol: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 52,
    borderRightWidth: 1,
  },
  dayBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dayActions: {
    flexDirection: "column",
    gap: 6,
    marginLeft: 8,
  },
  coursePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    marginRight: 4,
  },
  planSelector: {
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  planRow: {
    flexDirection: "row",
    gap: 8,
  },
  planEmojiPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  planEmoji: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  courseChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  courseChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  lengthRow: {
    flexDirection: "row",
    gap: 6,
  },
  lengthPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  dayMeal: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dayImg: { width: 40, height: 40, borderRadius: 10 },
  dayMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  dayAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    gap: spacing.sm,
  },
  shoppingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shoppingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  confirmBtn: {
    margin: spacing.md,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shoppingList: {
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  shoppingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  shoppingCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  shoppingGroupHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 4,
  },
});
