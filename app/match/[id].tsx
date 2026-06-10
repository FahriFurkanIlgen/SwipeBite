import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { RecipeImage } from "@/components/ui/RecipeImage";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Heart,
  Scale,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Confetti } from "@/components/ui/Confetti";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useSessionStore } from "@/store/sessionStore";
import { useRecipesStore } from "@/store/recipesStore";
import { useAuthStore } from "@/store/authStore";
import { usePantryStore } from "@/store/pantryStore";
import { getRecipeImageSource } from "@/features/recipes/recipeImage";

interface ReasonRow {
  icon: LucideIcon;
  text: string;
  detail: string;
  color: string;
}

export default function MatchScreen() {
  const match = useSessionStore((s) => s.match);
  const reset = useSessionStore((s) => s.reset);
  const recipes = useRecipesStore((s) => s.items);
  const customPool = useSessionStore((s) => s.customPool);
  const candidates = useSessionStore((s) => s.candidates);
  const pantry = usePantryStore((s) => s.items);
  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);

  const heroScale = useSharedValue(1.12);
  const badgeScale = useSharedValue(0.6);
  const badgeOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (!match) return;
    heroScale.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
    badgeOpacity.value = withDelay(220, withTiming(1, { duration: 280 }));
    badgeScale.value = withDelay(
      220,
      withSequence(
        withSpring(1.08, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 14, stiffness: 220 }),
      ),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );
  }, [match, heroScale, badgeOpacity, badgeScale]);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  // Influencer / custom-pool sessions deal recipes that don't live in the
  // global recipes store. Include the session's custom pool and the dealt
  // candidates so the match (and its runner-ups) can always be resolved —
  // otherwise the screen returned null and left a blank white page.
  const recipeLookup = React.useMemo(() => {
    const map = new Map<string, (typeof recipes)[number]>();
    for (const r of recipes) map.set(r.id, r);
    if (customPool) for (const r of customPool) map.set(r.id, r);
    for (const r of candidates) map.set(r.id, r);
    return map;
  }, [recipes, customPool, candidates]);

  const findRecipe = React.useCallback(
    (id: string) => recipeLookup.get(id),
    [recipeLookup],
  );

  if (!match) {
    return (
      <Screen background="bg">
        <View style={styles.empty}>
          <Text variant="h2" weight="700">
            Eşleşme bulunamadı
          </Text>
          <Text variant="body" color={colors.slate} align="center">
            Görünüşe göre bu turda ortak bir karar çıkmadı. Tekrar deneyelim mi?
          </Text>
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            style={styles.emptyBtn}
          >
            <Text variant="bodyMedium" weight="700" color={colors.ink}>
              Ana sayfaya dön
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const recipe = findRecipe(match.recipeId);
  if (!recipe) {
    // Defensive: the matched recipe couldn't be resolved from any pool.
    // Show the empty state instead of returning null (blank white screen).
    return (
      <Screen background="bg">
        <View style={styles.empty}>
          <Text variant="h2" weight="700">
            Eşleşme yüklenemedi
          </Text>
          <Text variant="body" color={colors.slate} align="center">
            Eşleşen tarif bulunamadı. Ana sayfadan tekrar deneyebilirsin.
          </Text>
          <Pressable
            onPress={() => {
              reset();
              router.replace("/(tabs)");
            }}
            style={styles.emptyBtn}
          >
            <Text variant="bodyMedium" weight="700" color={colors.ink}>
              Ana sayfaya dön
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const pantryNames = pantry.map((p) => p.name.toLowerCase());
  const pantryHits = recipe.ingredients.filter((ing) =>
    pantryNames.some(
      (p) =>
        ing.name.toLowerCase().includes(p) ||
        p.includes(ing.name.toLowerCase()),
    ),
  ).length;
  const pantryPct = Math.round(
    (pantryHits / Math.max(1, recipe.ingredients.length)) * 100,
  );
  const totalMembers = household?.memberIds.length ?? 1;
  const likedCount = match.likedByUserIds.length || 1;

  const reasons: ReasonRow[] = [
    {
      icon: Heart,
      text: "İkiniz de beğendi",
      detail: `${likedCount}/${totalMembers} oy`,
      color: "#22C55E",
    },
    {
      icon: Scale,
      text: "Ev uyumu yüksek",
      detail: `%${match.score}`,
      color: colors.primary,
    },
    {
      icon: Zap,
      text: "Kiler eşleşmesi",
      detail: `%${pantryPct} malzeme var`,
      color: colors.accent,
    },
  ];

  // Liked-by avatars from match
  const likedAvatars = (
    match.likedByUserIds.length > 0 ? match.likedByUserIds : [user?.id ?? "S"]
  )
    .slice(0, 4)
    .map((id) => ({
      id,
      label: (id === user?.id ? (user?.name ?? "S") : id)
        .charAt(0)
        .toUpperCase(),
      name: id === user?.id ? (user?.name ?? "Sen") : id.slice(0, 4),
    }));

  const altTags = ["Hızlı", "Hafif", "Ekonomik"] as const;
  const altColors = [
    { fg: colors.primaryDeep, bg: colors.primarySoft },
    { fg: colors.forest, bg: colors.forestSoft },
    { fg: colors.accent, bg: colors.accentSoft },
  ];

  return (
    <Screen background="bg" padded={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing["4xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Animated.View style={[StyleSheet.absoluteFillObject, heroStyle]}>
            <RecipeImage
              source={getRecipeImageSource(recipe)}
              style={StyleSheet.absoluteFillObject}
              containerStyle={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          </Animated.View>
          <LinearGradient
            colors={["rgba(26,23,20,0.15)", "rgba(26,23,20,0.82)"]}
            locations={[0.3, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <Confetti count={40} />

          <Pressable
            onPress={() => router.replace("/(tabs)")}
            hitSlop={12}
            style={styles.backBtn}
          >
            <ArrowLeft size={16} color={colors.bg} strokeWidth={2} />
          </Pressable>

          <Animated.View style={[styles.matchBadge, badgeStyle]}>
            <Heart size={12} color={colors.ink} fill={colors.ink} />
            <Text
              variant="caption"
              weight="700"
              color={colors.ink}
              style={{ letterSpacing: 1.2 }}
            >
              EŞLEŞME!
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(500).duration(500)}
            style={styles.heroBody}
          >
            <Text
              variant="overline"
              color={colors.primary}
              style={{ marginBottom: 4 }}
            >
              Bugünün kazananı
            </Text>
            <Text style={styles.heroTitle}>{recipe.title}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.metaItem}>
                <Clock
                  size={12}
                  color="rgba(250,247,242,0.65)"
                  strokeWidth={1.5}
                />
                <Text variant="small" color="rgba(250,247,242,0.75)">
                  {recipe.prepTimeMinutes} dk
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Users
                  size={12}
                  color="rgba(250,247,242,0.65)"
                  strokeWidth={1.5}
                />
                <Text variant="small" color="rgba(250,247,242,0.75)">
                  {recipe.servings} kişi
                </Text>
              </View>
              <View style={styles.matchPill}>
                <Text variant="caption" weight="700" color={colors.ink}>
                  %{match.score} eşleşme
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Liked by */}
          <Animated.View
            entering={FadeInDown.delay(600).duration(450)}
            style={styles.card}
          >
            <Text
              variant="overline"
              color={colors.dim}
              style={{ marginBottom: 10 }}
            >
              {t.match.likedBy}
            </Text>
            <View style={styles.likedRow}>
              {likedAvatars.map((a) => (
                <View key={a.id} style={styles.likedItem}>
                  <View style={styles.likedAvatar}>
                    <Text
                      style={{
                        fontFamily: fonts.sansBold,
                        fontSize: 13,
                        color: colors.ink,
                      }}
                    >
                      {a.label}
                    </Text>
                  </View>
                  <Text variant="small" weight="500">
                    {a.name}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Why matched */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(450)}
            style={styles.card}
          >
            <Text
              variant="overline"
              color={colors.dim}
              style={{ marginBottom: 12 }}
            >
              {t.match.whyMatched}
            </Text>
            <View style={{ gap: 10 }}>
              {reasons.map(({ icon: Icon, text, detail, color }) => (
                <View key={text} style={styles.reasonRow}>
                  <View
                    style={[
                      styles.reasonIcon,
                      { backgroundColor: `${color}18` },
                    ]}
                  >
                    <Icon size={14} color={color} strokeWidth={2} />
                  </View>
                  <Text variant="smallMedium" style={{ flex: 1 }}>
                    {text}
                  </Text>
                  <View style={styles.detailPill}>
                    <Text variant="caption" weight="600" color={colors.slate}>
                      {detail}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {match.missingIngredients.length > 0 ? (
              <View style={styles.missingDivider}>
                <Text variant="caption" color={colors.dim}>
                  Eksik malzeme: {match.missingIngredients.join(", ")}
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Course companions — full dinner menu */}
          {match.courseCompanions && match.courseCompanions.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(720).duration(450)}>
              <Text
                variant="overline"
                color={colors.dim}
                style={{ marginBottom: 10 }}
              >
                Menüne dahil
              </Text>
              <View style={{ gap: 8 }}>
                {match.courseCompanions.map((comp) => {
                  const r = findRecipe(comp.recipeId);
                  if (!r) return null;
                  return (
                    <Pressable
                      key={comp.recipeId}
                      onPress={() => router.push(`/recipe/${r.id}`)}
                      style={styles.altRow}
                    >
                      <RecipeImage
                        source={getRecipeImageSource(r)}
                        style={styles.altImg}
                        containerStyle={styles.altImg}
                        placeholderRadius={10}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text variant="smallMedium" weight="600">
                          {r.title}
                        </Text>
                        <Text
                          variant="caption"
                          color={colors.dim}
                          style={{ marginTop: 1 }}
                        >
                          {r.prepTimeMinutes} dk · {r.cuisine}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.altTag,
                          { backgroundColor: colors.primarySoft },
                        ]}
                      >
                        <Text variant="caption" weight="700" color={colors.ink}>
                          {comp.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          ) : null}

          {/* Alternatives */}
          {match.alternatives.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(800).duration(450)}>
              <Text
                variant="overline"
                color={colors.dim}
                style={{ marginBottom: 10 }}
              >
                {t.match.alternativesTitle}
              </Text>
              <View style={{ gap: 8 }}>
                {match.alternatives.slice(0, 3).map((alt, idx) => {
                  const r = findRecipe(alt.recipeId);
                  if (!r) return null;
                  const tag = altTags[idx] ?? alt.label;
                  const c = altColors[idx] ?? altColors[0];
                  return (
                    <Pressable
                      key={alt.recipeId}
                      onPress={() => router.push(`/recipe/${r.id}`)}
                      style={styles.altRow}
                    >
                      <RecipeImage
                        source={getRecipeImageSource(r)}
                        style={styles.altImg}
                        containerStyle={styles.altImg}
                        placeholderRadius={10}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text variant="smallMedium" weight="600">
                          {r.title}
                        </Text>
                        <Text
                          variant="caption"
                          color={colors.dim}
                          style={{ marginTop: 1 }}
                        >
                          {r.prepTimeMinutes} dk · {r.cuisine}
                        </Text>
                      </View>
                      <View style={[styles.altTag, { backgroundColor: c.bg }]}>
                        <Text variant="caption" weight="700" color={c.fg}>
                          {tag}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          ) : null}

          {/* CTA row */}
          <Animated.View
            entering={ZoomIn.delay(900).duration(400)}
            style={styles.ctaRow}
          >
            <Pressable
              onPress={() => router.push(`/recipe/${recipe.id}`)}
              style={styles.ctaSecondary}
            >
              <Text variant="smallMedium" weight="600" color={colors.ink}>
                Tarifi Gör
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/cook/${recipe.id}`)}
              style={styles.ctaPrimary}
            >
              <Text variant="smallMedium" weight="700" color={colors.ink}>
                {t.match.cookCta}
              </Text>
              <ChevronRight size={16} color={colors.ink} strokeWidth={2.5} />
            </Pressable>
          </Animated.View>

          <Pressable
            onPress={() => {
              reset();
              router.replace("/(tabs)/swipe");
            }}
            style={styles.swipeAgain}
          >
            <Text variant="small" color={colors.slate}>
              {t.match.swipeAgain}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 320 },
  backBtn: {
    position: "absolute",
    top: spacing["3xl"],
    left: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(26,23,20,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  matchBadge: {
    position: "absolute",
    top: spacing["3xl"],
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  heroBody: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
  },
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: 38,
    lineHeight: 40,
    color: colors.bg,
    letterSpacing: -0.95,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  matchPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: "rgba(240,180,41,0.9)",
  },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    padding: spacing.lg,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  likedRow: { flexDirection: "row", gap: spacing.md, flexWrap: "wrap" },
  likedItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  likedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  reasonIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  detailPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
  },
  missingDivider: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  altRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  altImg: { width: 48, height: 48, borderRadius: 10 },
  altTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  ctaRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  ctaSecondary: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimary: {
    flex: 2,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  swipeAgain: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing["2xl"],
  },
  emptyBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
});
