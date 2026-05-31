import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Clock, Play, RefreshCw, Users } from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { useRecipesStore } from "@/store/recipesStore";
import {
  COURSE_LABEL,
  MEAL_PLAN_COMPOSITION,
  MEAL_PLAN_EMOJI,
  MEAL_PLAN_LABEL,
  MEAL_PLAN_SUB,
  recommendMealPlanForNow,
  type Course,
} from "@/features/recipes/recipeClassifier";
import { MealPlan } from "@/types/domain";

const MEAL_PLANS: MealPlan[] = [
  "kahvalti",
  "ogle",
  "aksam",
  "tatli",
  "atistirma",
  "icecek",
];

export default function SwipeTab() {
  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);
  const session = useSessionStore((s) => s.session);
  const votes = useSessionStore((s) => s.votes);
  const candidates = useSessionStore((s) => s.candidates);
  const startSession = useSessionStore((s) => s.startSession);
  const recipes = useRecipesStore((s) => s.items);

  const [selected, setSelected] = React.useState<MealPlan>(() =>
    recommendMealPlanForNow(),
  );
  // Per-plan whitelist of courses to deal.
  // Default: only "ana" is preselected for multi-course plans (öğle / akşam);
  // single-course plans keep their full composition.
  const [includeByPlan, setIncludeByPlan] = React.useState<
    Record<MealPlan, Course[]>
  >(() => {
    const map = {} as Record<MealPlan, Course[]>;
    (Object.keys(MEAL_PLAN_COMPOSITION) as MealPlan[]).forEach((p) => {
      const all = MEAL_PLAN_COMPOSITION[p].map((s) => s.course);
      const hasAna = all.includes("ana");
      map[p] = all.length > 1 && hasAna ? ["ana"] : all;
    });
    return map;
  });
  const planCourses = MEAL_PLAN_COMPOSITION[selected];
  const showCourseToggles = planCourses.length > 1;
  const includeCourses = includeByPlan[selected];
  const toggleCourse = (course: Course) => {
    setIncludeByPlan((prev) => {
      const current = prev[selected];
      const has = current.includes(course);
      // Don't allow zero-course selection — require at least one.
      const next = has
        ? current.length > 1
          ? current.filter((c) => c !== course)
          : current
        : [...current, course];
      return { ...prev, [selected]: next };
    });
  };

  const handleStart = () => {
    if (!user || !household) return;
    startSession(
      household.id,
      user.id,
      household.memberIds,
      undefined,
      selected,
      includeCourses,
    );
    const id = useSessionStore.getState().session?.id;
    if (id) router.push(`/session/${id}`);
  };

  const activeSession = session?.status === "active" ? session : null;
  const activeRecipe = activeSession
    ? recipes.find((r) => r.id === activeSession.recipeIds[0])
    : null;
  const totalRecipes = activeSession ? activeSession.recipeIds.length : 0;
  const myVotes = activeSession
    ? votes.filter((v) => v.userId === user?.id).length
    : 0;
  const denom = candidates.length || totalRecipes;
  const progress = denom > 0 ? Math.min(myVotes / denom, 1) : 0;

  return (
    <Screen background="bg" padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(60).duration(450)}>
          <Text variant="overline" color={colors.dim}>
            Karar Zamanı
          </Text>
          <Text variant="h1" style={{ marginTop: 6 }}>
            Ne yesek?
          </Text>
          <Text
            variant="body"
            color={colors.slate}
            style={{ marginTop: spacing.sm }}
          >
            Birlikte kaydırın, AI en iyi eşleşmeyi bulsun.
          </Text>
        </Animated.View>

        {/* Active session card */}
        {activeSession ? (
          <Animated.View
            entering={FadeInDown.delay(140).duration(500)}
            style={styles.activeCard}
          >
            <View style={styles.activeHero}>
              {activeRecipe ? (
                <Image
                  source={{ uri: activeRecipe.imageUrl }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: colors.cream },
                  ]}
                />
              )}
              <View style={styles.activeHeroScrim}>
                <LinearGradient
                  colors={["rgba(26,23,20,0.1)", "rgba(26,23,20,0.75)"]}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <View style={styles.activeHeroContent}>
                <View style={styles.liveRow}>
                  <View style={styles.livePulse} />
                  <Text
                    variant="caption"
                    color={colors.bg}
                    style={{ letterSpacing: 1.4 }}
                  >
                    AKTİF OTURUM
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 18,
                    color: colors.bg,
                    letterSpacing: -0.18,
                    marginTop: 2,
                  }}
                >
                  {activeSession.mealPlan
                    ? `${MEAL_PLAN_LABEL[activeSession.mealPlan]} Oturumu`
                    : "Oturum"}
                </Text>
              </View>
            </View>
            <View style={styles.activeBody}>
              <View style={styles.activeMetaRow}>
                <View style={styles.activeMetaItem}>
                  <Users size={12} color={colors.slate} strokeWidth={1.5} />
                  <Text variant="small" color={colors.slate}>
                    {activeSession.participantIds.length} kişi
                  </Text>
                </View>
                <View style={styles.activeMetaItem}>
                  <Clock size={12} color={colors.dim} strokeWidth={1.5} />
                  <Text variant="small" color={colors.slate}>
                    {myVotes}/{denom} oylandı
                  </Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(progress * 100)}%` },
                  ]}
                />
              </View>
              <Pressable
                onPress={() => router.push(`/session/${activeSession.id}`)}
                style={styles.resumeBtn}
              >
                <RefreshCw size={15} color={colors.ink} strokeWidth={2} />
                <Text variant="bodyMedium" weight="700" color={colors.ink}>
                  Devam Et
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        {/* New session card */}
        <Animated.View
          entering={FadeInDown.delay(220).duration(500)}
          style={styles.newCard}
        >
          <Text variant="h3">Neye karar vermek istiyorsun?</Text>
          <Text
            variant="small"
            color={colors.slate}
            style={{ marginTop: 4, marginBottom: spacing.xl }}
          >
            Öğün türüne göre uygun tarifleri karşışıtırırız.
          </Text>

          <View style={{ gap: 10, marginBottom: spacing.xl }}>
            {MEAL_PLANS.map((plan) => {
              const isActive = plan === selected;
              return (
                <Pressable
                  key={plan}
                  onPress={() => setSelected(plan)}
                  style={[
                    styles.option,
                    {
                      backgroundColor: isActive
                        ? colors.primarySoft
                        : colors.cream,
                      borderColor: isActive ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <Text style={styles.optionEmoji}>
                    {MEAL_PLAN_EMOJI[plan]}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text variant="smallMedium" weight="600">
                      {MEAL_PLAN_LABEL[plan]}
                    </Text>
                    <Text variant="caption" color={colors.dim}>
                      {MEAL_PLAN_SUB[plan]}
                    </Text>
                  </View>
                  {isActive ? (
                    <View style={styles.optionRadio}>
                      <View style={styles.optionRadioDot} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {showCourseToggles ? (
            <View style={styles.courseRow}>
              <Text
                variant="caption"
                color={colors.dim}
                style={{ marginBottom: 8 }}
              >
                Hangi çeşitleri dahil edelim?
              </Text>
              <View style={styles.courseChips}>
                {planCourses.map((slot) => {
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
            </View>
          ) : null}

          <Pressable onPress={handleStart} style={styles.startBtn}>
            <Play size={16} color={colors.primary} fill={colors.primary} />
            <Text variant="bodyMedium" weight="700" color={colors.bg}>
              Oturumu Başlat
            </Text>
          </Pressable>
        </Animated.View>

        {/* Invite partner */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Pressable
            onPress={() => router.push("/invite")}
            style={styles.invite}
          >
            <View style={styles.inviteIcon}>
              <Users size={18} color={colors.slate} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" weight="600">
                Eşini Davet Et
              </Text>
              <Text variant="small" color={colors.dim}>
                Birlikte karar verin
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        <View style={{ height: spacing["4xl"] }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["3xl"],
    gap: spacing.xl,
  },
  activeCard: {
    borderRadius: radii.hero,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  activeHero: {
    height: 144,
    position: "relative",
  },
  activeHeroScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  activeHeroContent: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: 4,
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  activeBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  activeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  activeMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.muted,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  resumeBtn: {
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  newCard: {
    borderRadius: radii.hero,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  optionEmoji: {
    fontSize: 22,
    lineHeight: 28,
    width: 28,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  optionRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.card,
  },
  courseRow: {
    marginBottom: spacing.xl,
  },
  courseChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  courseChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  startBtn: {
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  invite: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
