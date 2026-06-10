import React from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, GlassWater, Heart, Sparkles, X } from "lucide-react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import { colors, fonts, radii, shadows, spacing } from "@/constants/theme";
import { Text } from "@/components/ui/Text";
import {
  COCKTAIL_GLASS_LABEL,
  COCKTAIL_TECHNIQUE_LABEL,
} from "@/constants/famousCocktails";
import { resolveCocktailImage } from "@/features/bar/cocktailImage";
import type { BarVoteType, Cocktail, CocktailMatch } from "@/types/bar";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W - spacing.xl * 2, 380);
const CARD_H = CARD_W * 1.5;
const SWIPE_THRESHOLD = 110;
const SUPER_THRESHOLD = 140;
const HAPTIC_THRESHOLD = 80;

export interface CocktailSwipeCardProps {
  cocktail: Cocktail;
  match?: CocktailMatch;
  stackOffset?: number;
  interactive?: boolean;
  onVote?: (type: BarVoteType) => void;
}

const SPRING_SOFT = { damping: 18, stiffness: 220, mass: 0.6 } as const;
const SPRING_STACK = { damping: 20, stiffness: 180, mass: 0.7 } as const;
const EXIT_EASING = Easing.bezier(0.2, 0.6, 0.2, 1);

/**
 * Background gradient palette per cocktail base spirit.
 * Falls back to the brand cream/primary pair when nothing matches.
 */
function gradientForCocktail(c: Cocktail): readonly [string, string] {
  const ids = c.ingredients.map((i) => i.ingredientId);
  if (ids.includes("liqueur-campari")) return ["#FFB199", "#D14545"] as const;
  if (ids.includes("liqueur-aperol")) return ["#FFD9A8", "#F08A3E"] as const;
  if (ids.includes("liqueur-coffee")) return ["#C9A684", "#3F2A1B"] as const;
  if (ids.includes("spirit-bourbon") || ids.includes("spirit-rye"))
    return ["#E6B66E", "#7A4A1F"] as const;
  if (ids.includes("spirit-tequila")) return ["#F1E0A8", "#D38A3F"] as const;
  if (ids.includes("spirit-gin")) return ["#D7E9DA", "#6FAE82"] as const;
  if (ids.includes("wine-prosecco") || ids.includes("wine-champagne"))
    return ["#FFEDB7", "#E0B26E"] as const;
  if (ids.includes("mixer-cranberry")) return ["#FFB0B0", "#B33E5C"] as const;
  if (ids.includes("citrus-lime") || ids.includes("garnish-mint"))
    return ["#D6F0CE", "#5FA37C"] as const;
  return [colors.cream, colors.primary] as const;
}

export const CocktailSwipeCard: React.FC<CocktailSwipeCardProps> = ({
  cocktail,
  match,
  stackOffset = 0,
  interactive = true,
  onVote,
}) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const hapticArmed = useSharedValue(true);
  const offset = useSharedValue(stackOffset);

  React.useEffect(() => {
    offset.value = withSpring(stackOffset, SPRING_STACK);
  }, [stackOffset, offset]);

  const triggerVote = (type: BarVoteType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
    onVote?.(type);
  };

  const lightHaptic = () => {
    Haptics.selectionAsync().catch(() => undefined);
  };

  const animateOut = (type: BarVoteType, x: number, y: number) => {
    const config = { duration: 260, easing: EXIT_EASING };
    tx.value = withTiming(x, config);
    ty.value = withTiming(y, config);
    rot.value = withTiming(x / 18, config, (finished) => {
      if (finished) runOnJS(triggerVote)(type);
    });
  };

  const pan = Gesture.Pan()
    .enabled(interactive)
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      rot.value = e.translationX / 22;
      const magnitude = Math.max(
        Math.abs(e.translationX),
        Math.abs(e.translationY),
      );
      if (hapticArmed.value && magnitude > HAPTIC_THRESHOLD) {
        hapticArmed.value = false;
        runOnJS(lightHaptic)();
      } else if (!hapticArmed.value && magnitude < HAPTIC_THRESHOLD / 2) {
        hapticArmed.value = true;
      }
    })
    .onEnd((e) => {
      const {
        translationX: x,
        translationY: y,
        velocityX: vx,
        velocityY: vy,
      } = e;
      hapticArmed.value = true;
      const exitX = (sign: number) =>
        sign * Math.max(SCREEN_W * 1.4, Math.abs(vx) * 0.25 + 600);
      const exitY = (sign: number) =>
        sign * Math.max(SCREEN_W * 1.4, Math.abs(vy) * 0.25 + 600);
      if (y < -SUPER_THRESHOLD && Math.abs(x) < SUPER_THRESHOLD) {
        runOnJS(animateOut)("superlike", x, exitY(-1));
      } else if (x > SWIPE_THRESHOLD || vx > 800) {
        runOnJS(animateOut)("like", exitX(1), y + vy * 0.15);
      } else if (x < -SWIPE_THRESHOLD || vx < -800) {
        runOnJS(animateOut)("dislike", exitX(-1), y + vy * 0.15);
      } else {
        tx.value = withSpring(0, SPRING_SOFT);
        ty.value = withSpring(0, SPRING_SOFT);
        rot.value = withSpring(0, SPRING_SOFT);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const dragMagnitude = Math.min(
      1,
      Math.max(Math.abs(tx.value), Math.abs(ty.value)) / SWIPE_THRESHOLD,
    );
    const o = offset.value;
    const baseScale = 1 - o * 0.04;
    const scale = baseScale + dragMagnitude * 0.04 * Math.min(o, 1);
    const baseY = o * 14;
    const adjY = baseY + ty.value * (1 - Math.min(o, 1));
    const adjX = tx.value * (1 - Math.min(o, 1));
    const opacity = interpolate(
      o,
      [0, 1, 2],
      [1, 0.85, 0.55],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      transform: [
        { translateX: adjX },
        { translateY: adjY },
        { rotateZ: `${rot.value}deg` },
        { scale },
      ],
    };
  });

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [40, 140], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(tx.value, [40, 140], [0.7, 1], Extrapolation.CLAMP),
      },
      { rotate: "-10deg" },
    ],
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-140, -40], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(
          tx.value,
          [-140, -40],
          [1, 0.7],
          Extrapolation.CLAMP,
        ),
      },
      { rotate: "10deg" },
    ],
  }));
  const superStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ty.value, [-150, -50], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(
          ty.value,
          [-150, -50],
          [1, 0.7],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const [bgFrom, bgTo] = gradientForCocktail(cocktail);
  const cookable = match?.cookable ?? true;
  const missingCount = match?.missingRequired.length ?? 0;
  const imageSrc = resolveCocktailImage(cocktail.imageUrl, cocktail.id);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        <LinearGradient
          colors={[bgFrom, bgTo]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["rgba(26,23,20,0)", "rgba(26,23,20,0.85)"]}
          locations={[0.45, 1]}
          style={styles.scrim}
          pointerEvents="none"
        />

        {/* Hero görseli (varsa) yoksa emoji */}
        <View style={styles.emojiWrap} pointerEvents="none">
          {imageSrc ? (
            <Image
              source={imageSrc}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.emoji}>{cocktail.emoji}</Text>
          )}
        </View>

        {/* Cookability badge top-left */}
        <View style={styles.statusBadge} pointerEvents="none">
          <View
            style={[
              styles.statusDot,
              { backgroundColor: cookable ? colors.forest : colors.accent },
            ]}
          />
          <Text variant="caption" weight="700" color={colors.ink}>
            {cookable
              ? "Yapılabilir"
              : missingCount === 1
                ? "1 eksik"
                : `${missingCount} eksik`}
          </Text>
        </View>

        {/* Swipe direction overlays */}
        <Animated.View
          style={[styles.badge, styles.badgeLike, likeStyle]}
          pointerEvents="none"
        >
          <Heart size={14} color={colors.bg} strokeWidth={2.5} />
          <Text variant="caption" weight="700" color={colors.bg}>
            BEĞENDİM
          </Text>
        </Animated.View>
        <Animated.View
          style={[styles.badge, styles.badgeNope, nopeStyle]}
          pointerEvents="none"
        >
          <X size={14} color={colors.bg} strokeWidth={2.5} />
          <Text variant="caption" weight="700" color={colors.bg}>
            HAYIR
          </Text>
        </Animated.View>
        <Animated.View
          style={[styles.badge, styles.badgeSuper, superStyle]}
          pointerEvents="none"
        >
          <Sparkles size={12} color={colors.ink} strokeWidth={2} />
          <Text variant="caption" weight="700" color={colors.ink}>
            BUGÜN BU
          </Text>
        </Animated.View>

        {/* Footer content */}
        <View style={styles.content}>
          <View style={styles.tagsRow}>
            {cocktail.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text variant="caption" weight="600" color={colors.bg}>
                  {tag.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {cocktail.name}
          </Text>
          {cocktail.altName ? (
            <Text variant="small" color="rgba(250,247,242,0.7)">
              {cocktail.altName}
            </Text>
          ) : null}

          <Text
            variant="small"
            color="rgba(250,247,242,0.85)"
            numberOfLines={2}
            style={{ marginTop: spacing.xs, lineHeight: 18 }}
          >
            {cocktail.description}
          </Text>

          <View style={styles.metaRow}>
            <Meta label={`${cocktail.prepTimeMinutes} dk`} icon="clock" />
            <Meta
              label={COCKTAIL_TECHNIQUE_LABEL[cocktail.technique]}
              icon="tech"
            />
            <Meta label={COCKTAIL_GLASS_LABEL[cocktail.glass]} icon="glass" />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const Meta: React.FC<{ label: string; icon: "clock" | "tech" | "glass" }> = ({
  label,
  icon,
}) => (
  <View style={styles.meta}>
    {icon === "clock" ? (
      <Clock size={11} color={colors.bg} strokeWidth={1.8} />
    ) : icon === "glass" ? (
      <GlassWater size={11} color={colors.bg} strokeWidth={1.8} />
    ) : (
      <Sparkles size={11} color={colors.bg} strokeWidth={1.8} />
    )}
    <Text variant="caption" weight="600" color={colors.bg}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: CARD_W,
    height: CARD_H,
    borderRadius: radii.card,
    overflow: "hidden",
    backgroundColor: colors.cream,
    ...shadows.lg,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  emojiWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: CARD_H * 0.55,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 110,
    lineHeight: 130,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  statusBadge: {
    position: "absolute",
    top: spacing.lg,
    left: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(250,247,242,0.92)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  content: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xl,
    gap: 4,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.xs,
    flexWrap: "wrap",
  },
  tagPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(250,247,242,0.18)",
    borderWidth: 1,
    borderColor: "rgba(250,247,242,0.35)",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 30,
    color: colors.bg,
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.md,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(26,23,20,0.5)",
    borderWidth: 1,
    borderColor: "rgba(250,247,242,0.18)",
  },
  badge: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  badgeLike: {
    top: spacing.xl,
    left: spacing.xl,
    backgroundColor: "#22C55E",
    borderWidth: 2.5,
    borderColor: "#16A34A",
  },
  badgeNope: {
    top: spacing.xl,
    right: spacing.xl,
    backgroundColor: "#EF4444",
    borderWidth: 2.5,
    borderColor: "#DC2626",
  },
  badgeSuper: {
    alignSelf: "center",
    top: 80,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryDeep,
  },
});

export const COCKTAIL_CARD_DIMENSIONS = { width: CARD_W, height: CARD_H };
