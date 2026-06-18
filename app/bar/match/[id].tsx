import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  GlassWater,
  Heart,
  Sparkles,
} from "lucide-react-native";
import Animated, {
  Easing,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Confetti } from "@/components/ui/Confetti";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import {
  COCKTAIL_GLASS_LABEL,
  COCKTAIL_TECHNIQUE_LABEL,
} from "@/constants/famousCocktails";
import { ALL_COCKTAIL_INDEX } from "@/constants/allCocktails";
import { matchCocktail } from "@/features/bar/cocktailMatcher";
import { resolveCocktailImage } from "@/features/bar/cocktailImage";
import { useAuthStore } from "@/store/authStore";
import { useBarCabinetStore } from "@/store/barCabinetStore";
import { useBarSessionStore } from "@/store/barSessionStore";

export default function BarMatchScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const matchRouteId = params.id;

  const matchResult = useBarSessionStore((s) => s.match);
  const session = useBarSessionStore((s) => s.session);
  const candidates = useBarSessionStore((s) => s.candidates);
  const votes = useBarSessionStore((s) => s.votes);
  const reset = useBarSessionStore((s) => s.reset);
  const hydrated = useBarSessionStore((s) => s.hydrated);
  const hydrate = useBarSessionStore((s) => s.hydrate);

  const ingredientIds = useBarCabinetStore((s) => s.ingredientIds);
  const cabinetHydrated = useBarCabinetStore((s) => s.hydrated);
  const hydrateCabinet = useBarCabinetStore((s) => s.hydrate);

  const user = useAuthStore((s) => s.user);

  React.useEffect(() => {
    if (!hydrated) void hydrate();
    if (!cabinetHydrated) void hydrateCabinet();
  }, [hydrated, cabinetHydrated, hydrate, hydrateCabinet]);

  // Animated hero entrance
  const heroScale = useSharedValue(1.12);
  const badgeScale = useSharedValue(0.6);
  const badgeOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (!matchResult) return;
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
  }, [matchResult, heroScale, badgeOpacity, badgeScale]);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
  }));
  const badgeStyleAnim = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  const ownedSet = React.useMemo(() => new Set(ingredientIds), [ingredientIds]);

  // Runner-ups: other cocktails that received at least one like.
  const runnerUps = React.useMemo(() => {
    if (!matchResult) return [];
    const tally = new Map<string, number>();
    for (const v of votes) {
      if (
        v.cocktailId !== matchResult.cocktailId &&
        (v.voteType === "like" || v.voteType === "superlike")
      ) {
        const w = v.voteType === "superlike" ? 2 : 1;
        tally.set(v.cocktailId, (tally.get(v.cocktailId) ?? 0) + w);
      }
    }
    return Array.from(tally.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => ALL_COCKTAIL_INDEX[id])
      .filter((c): c is NonNullable<typeof c> => !!c);
  }, [votes, matchResult]);

  // Stale guard: route id mismatch (e.g. user came back to an old result).
  const isStaleRoute =
    matchResult && matchRouteId && matchResult.id !== matchRouteId;

  if (!matchResult || isStaleRoute) {
    return (
      <Screen background="bg">
        <View style={styles.empty}>
          <Text variant="h2" weight="700" align="center">
            No match found
          </Text>
          <Text variant="body" color={colors.slate} align="center">
            Looks like there was no shared pick this round.
          </Text>
          <Pressable
            onPress={() => {
              reset();
              router.replace("/(tabs)/bar");
            }}
            style={styles.emptyBtn}
          >
            <Text variant="bodyMedium" weight="700" color={colors.onPrimary}>
              Back to Bar
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const cocktail = ALL_COCKTAIL_INDEX[matchResult.cocktailId];
  if (!cocktail) return null;

  const cocktailMatch = matchCocktail(cocktail, ownedSet);

  // Liked-by avatars
  const likers = Array.from(
    new Set(
      votes
        .filter(
          (v) =>
            v.cocktailId === matchResult.cocktailId &&
            (v.voteType === "like" || v.voteType === "superlike"),
        )
        .map((v) => v.userId),
    ),
  );
  const likedAvatars = (likers.length > 0 ? likers : [user?.id ?? "S"])
    .slice(0, 4)
    .map((id) => ({
      id,
      label: (id === user?.id ? (user?.name ?? "S") : id)
        .charAt(0)
        .toUpperCase(),
      name: id === user?.id ? (user?.name ?? "Sen") : id.slice(0, 4),
    }));

  // Color the hero based on cocktail base
  const heroGradient: readonly [string, string] = (() => {
    const ids = cocktail.ingredients.map((i) => i.ingredientId);
    if (ids.includes("liqueur-campari")) return ["#FFB199", "#D14545"];
    if (ids.includes("liqueur-aperol")) return ["#FFD9A8", "#F08A3E"];
    if (ids.includes("liqueur-coffee")) return ["#C9A684", "#3F2A1B"];
    if (ids.includes("spirit-bourbon") || ids.includes("spirit-rye"))
      return ["#E6B66E", "#7A4A1F"];
    if (ids.includes("spirit-tequila")) return ["#F1E0A8", "#D38A3F"];
    if (ids.includes("spirit-gin")) return ["#D7E9DA", "#6FAE82"];
    if (ids.includes("wine-prosecco") || ids.includes("wine-champagne"))
      return ["#FFEDB7", "#E0B26E"];
    if (ids.includes("mixer-cranberry")) return ["#FFB0B0", "#B33E5C"];
    if (ids.includes("citrus-lime") || ids.includes("garnish-mint"))
      return ["#D6F0CE", "#5FA37C"];
    return [colors.cream, colors.primary];
  })();

  return (
    <Screen background="bg" padded={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing["3xl"] * 2 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Animated.View style={[StyleSheet.absoluteFillObject, heroStyle]}>
            <LinearGradient
              colors={[heroGradient[0], heroGradient[1]]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <LinearGradient
            colors={["rgba(26,23,20,0.05)", "rgba(26,23,20,0.85)"]}
            locations={[0.3, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <Confetti count={40} />

          <Pressable
            onPress={() => {
              reset();
              router.replace("/(tabs)/bar");
            }}
            hitSlop={12}
            style={styles.backBtn}
          >
            <ArrowLeft size={16} color={colors.bg} strokeWidth={2} />
          </Pressable>

          <Animated.View
            style={[styles.matchBadge, badgeStyleAnim]}
            pointerEvents="none"
          >
            <Heart size={12} color={colors.onPrimary} fill={colors.onPrimary} />
            <Text
              variant="caption"
              weight="700"
              color={colors.onPrimary}
              style={{ letterSpacing: 1.2 }}
            >
              MATCH!
            </Text>
          </Animated.View>

          {/* Hero görseli (varsa) yoksa emoji */}
          <View style={styles.heroEmojiWrap} pointerEvents="none">
            {(() => {
              const src = resolveCocktailImage(cocktail.imageUrl, cocktail.id);
              return src ? (
                <Image
                  source={src}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.heroEmoji}>{cocktail.emoji}</Text>
              );
            })()}
          </View>

          <Animated.View
            entering={FadeInDown.delay(500).duration(500)}
            style={styles.heroBody}
          >
            <Text
              variant="overline"
              color={colors.primary}
              style={{ marginBottom: 4 }}
            >
              Tonight's drink
            </Text>
            <Text style={styles.heroTitle}>{cocktail.name}</Text>
            {cocktail.altName ? (
              <Text variant="small" color="rgba(250,247,242,0.75)">
                {cocktail.altName}
              </Text>
            ) : null}
            <View style={styles.heroMeta}>
              <View style={styles.metaItem}>
                <Clock
                  size={12}
                  color="rgba(250,247,242,0.65)"
                  strokeWidth={1.5}
                />
                <Text variant="small" color="rgba(250,247,242,0.75)">
                  {cocktail.prepTimeMinutes} min
                </Text>
              </View>
              <View style={styles.metaItem}>
                <GlassWater
                  size={12}
                  color="rgba(250,247,242,0.65)"
                  strokeWidth={1.5}
                />
                <Text variant="small" color="rgba(250,247,242,0.75)">
                  {COCKTAIL_GLASS_LABEL[cocktail.glass]}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Sparkles
                  size={12}
                  color="rgba(250,247,242,0.65)"
                  strokeWidth={1.5}
                />
                <Text variant="small" color="rgba(250,247,242,0.75)">
                  {COCKTAIL_TECHNIQUE_LABEL[cocktail.technique]}
                </Text>
              </View>
              <View style={styles.matchPill}>
                <Text variant="caption" weight="700" color={colors.onPrimary}>
                  {matchResult.likeCount}/{matchResult.participantCount} liked
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
              LIKED BY
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

          {/* Cookable status */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(450)}
            style={styles.card}
          >
            <Text
              variant="overline"
              color={colors.dim}
              style={{ marginBottom: 10 }}
            >
              {cocktailMatch.cookable
                ? "READY AT YOUR BAR"
                : "YOUR MISSING ITEMS"}
            </Text>
            {cocktailMatch.cookable ? (
              <Text variant="body" color={colors.slate}>
                You have everything at your bar. Let's go!
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                <Text variant="body" color={colors.slate}>
                  Grab {cocktailMatch.missingRequired.length} more ingredient(s)
                  to make it:
                </Text>
                <View style={styles.missingRow}>
                  {cocktailMatch.missingRequired.map((ing) => (
                    <View key={ing.id} style={styles.missingChip}>
                      <Text style={{ fontSize: 16 }}>{ing.emoji}</Text>
                      <Text variant="caption" weight="600">
                        {ing.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>

          {/* Runner-ups */}
          {runnerUps.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(800).duration(450)}>
              <Text
                variant="overline"
                color={colors.dim}
                style={{ marginBottom: 10 }}
              >
                FINALISTS
              </Text>
              <View style={{ gap: 8 }}>
                {runnerUps.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => router.push(`/bar/${c.id}`)}
                    style={styles.altRow}
                  >
                    <View style={styles.altEmojiBox}>
                      {(() => {
                        const src = resolveCocktailImage(c.imageUrl, c.id);
                        return src ? (
                          <Image
                            source={src}
                            style={styles.altThumb}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={{ fontSize: 26, lineHeight: 32 }}>
                            {c.emoji}
                          </Text>
                        );
                      })()}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="smallMedium" weight="600">
                        {c.name}
                      </Text>
                      <Text
                        variant="caption"
                        color={colors.dim}
                        style={{ marginTop: 1 }}
                      >
                        {c.prepTimeMinutes} min ·{" "}
                        {COCKTAIL_TECHNIQUE_LABEL[c.technique]}
                      </Text>
                    </View>
                    <ChevronRight
                      size={14}
                      color={colors.hairline}
                      strokeWidth={1.8}
                    />
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {/* CTA row */}
          <Animated.View
            entering={ZoomIn.delay(900).duration(400)}
            style={styles.ctaRow}
          >
            <Pressable
              onPress={() => {
                reset();
                router.replace("/(tabs)/bar");
              }}
              style={styles.ctaSecondary}
            >
              <Text variant="smallMedium" weight="600" color={colors.ink}>
                New round
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/bar/${cocktail.id}`)}
              style={styles.ctaPrimary}
            >
              <Text variant="smallMedium" weight="700" color={colors.onPrimary}>
                Open recipe
              </Text>
              <ChevronRight
                size={14}
                color={colors.onPrimary}
                strokeWidth={2}
              />
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    height: 460,
    overflow: "hidden",
    backgroundColor: colors.cream,
  },
  backBtn: {
    position: "absolute",
    top: spacing["2xl"],
    left: spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(26,23,20,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  matchBadge: {
    position: "absolute",
    top: spacing["2xl"] + 4,
    right: spacing.lg,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryDeep,
  },
  heroEmojiWrap: {
    position: "absolute",
    top: 90,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  heroEmoji: {
    fontSize: 130,
    lineHeight: 150,
  },
  heroImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.cream,
  },
  heroBody: {
    position: "absolute",
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
  },
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: 36,
    color: colors.bg,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  heroMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginTop: spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  matchPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  likedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  likedItem: {
    alignItems: "center",
    gap: 4,
  },
  likedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  missingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  missingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  altRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  altEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  altThumb: {
    width: "100%",
    height: "100%",
  },
  ctaRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  ctaSecondary: {
    flex: 1,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaPrimary: {
    flex: 1.5,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
