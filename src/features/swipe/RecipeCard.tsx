import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import { colors, radii, shadows, spacing } from "@/constants/theme";
import { Recipe, VoteType } from "@/types/domain";
import { Text } from "@/components/ui/Text";
import { t } from "@/constants/copy";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W - spacing["2xl"] * 2, 380);
const CARD_H = CARD_W * 1.5;
const SWIPE_THRESHOLD = 110;
const SUPER_THRESHOLD = 140;
const HAPTIC_THRESHOLD = 80;

export interface RecipeCardProps {
  recipe: Recipe;
  pantryMatchPercent?: number;
  householdCompatibilityPercent?: number;
  aiNote?: string;
  /** Stack ordering: 0 = top, 1 = behind, etc. */
  stackOffset?: number;
  /** Whether this card responds to gestures (only the top card). */
  interactive?: boolean;
  onVote?: (type: VoteType) => void;
}

const SPRING_SOFT = { damping: 16, stiffness: 160, mass: 0.7 } as const;

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  pantryMatchPercent = 0,
  householdCompatibilityPercent = 0,
  aiNote,
  stackOffset = 0,
  interactive = true,
  onVote,
}) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const hapticArmed = useSharedValue(true);

  const triggerVote = (type: VoteType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
    onVote?.(type);
  };

  const lightHaptic = () => {
    Haptics.selectionAsync().catch(() => undefined);
  };

  const animateOut = (type: VoteType, x: number, y: number) => {
    tx.value = withTiming(x, { duration: 240 });
    ty.value = withTiming(y, { duration: 240 });
    rot.value = withTiming(x / 18, { duration: 240 }, () => {
      runOnJS(triggerVote)(type);
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
      const { translationX: x, translationY: y, velocityX: vx } = e;
      hapticArmed.value = true;
      if (y < -SUPER_THRESHOLD && Math.abs(x) < SUPER_THRESHOLD) {
        runOnJS(animateOut)("superlike", 0, -800);
      } else if (y > SUPER_THRESHOLD && Math.abs(x) < SUPER_THRESHOLD) {
        runOnJS(animateOut)("superdislike", 0, 800);
      } else if (x > SWIPE_THRESHOLD || vx > 800) {
        runOnJS(animateOut)("like", 800, y);
      } else if (x < -SWIPE_THRESHOLD || vx < -800) {
        runOnJS(animateOut)("dislike", -800, y);
      } else {
        tx.value = withSpring(0, SPRING_SOFT);
        ty.value = withSpring(0, SPRING_SOFT);
        rot.value = withSpring(0, SPRING_SOFT);
      }
    });

  // Stack progression: as top card moves, back cards inch forward.
  const cardStyle = useAnimatedStyle(() => {
    const dragMagnitude = Math.min(
      1,
      Math.max(Math.abs(tx.value), Math.abs(ty.value)) / SWIPE_THRESHOLD,
    );
    const baseScale = 1 - stackOffset * 0.05;
    const scale = stackOffset === 0 ? 1 : baseScale + dragMagnitude * 0.05;
    const baseY = stackOffset * 14;
    const adjY = stackOffset === 0 ? ty.value : baseY - dragMagnitude * 14;
    const opacity = stackOffset === 0 ? 1 : 0.55 + dragMagnitude * 0.45;

    return {
      opacity,
      transform: [
        { translateX: tx.value },
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

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Image
          source={{ uri: recipe.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={250}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.92)"]}
          locations={[0.4, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />

        <Animated.View
          style={[styles.badge, styles.badgeLike, likeStyle]}
          pointerEvents="none"
        >
          <Ionicons name="heart" size={16} color={colors.snow} />
          <Text variant="bodyMedium" weight="700" color={colors.snow}>
            BEĞENDİM
          </Text>
        </Animated.View>
        <Animated.View
          style={[styles.badge, styles.badgeNope, nopeStyle]}
          pointerEvents="none"
        >
          <Ionicons name="close" size={18} color={colors.snow} />
          <Text variant="bodyMedium" weight="700" color={colors.snow}>
            GEÇ
          </Text>
        </Animated.View>
        <Animated.View
          style={[styles.badge, styles.badgeSuper, superStyle]}
          pointerEvents="none"
        >
          <Ionicons name="star" size={16} color={colors.snow} />
          <Text variant="bodyMedium" weight="700" color={colors.snow}>
            SÜPER
          </Text>
        </Animated.View>

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <Meta
              icon="time-outline"
              label={t.swipe.prepTime(recipe.prepTimeMinutes)}
            />
            <Meta
              icon="people-outline"
              label={`%${householdCompatibilityPercent}`}
            />
            <Meta icon="basket-outline" label={`%${pantryMatchPercent}`} />
          </View>
          <Text variant="h1" color={colors.snow} weight="700">
            {recipe.title}
          </Text>
          {aiNote ? (
            <View style={styles.aiRow}>
              <Ionicons name="sparkles" size={14} color={colors.canvas} />
              <Text variant="small" color={colors.snow} style={styles.aiText}>
                {aiNote}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const Meta: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}> = ({ icon, label }) => (
  <View style={styles.meta}>
    <Ionicons name={icon} size={14} color={colors.snow} />
    <Text variant="caption" color={colors.snow} weight="700">
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radii.card,
    backgroundColor: colors.ink,
    overflow: "hidden",
    alignSelf: "center",
    position: "absolute",
    ...shadows.lg,
  },
  image: { ...StyleSheet.absoluteFillObject },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing["2xl"],
    gap: spacing.sm,
  },
  metaRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  aiRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
    marginTop: 4,
  },
  aiText: { flex: 1, opacity: 0.95 },
  badge: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...shadows.md,
  },
  badgeLike: {
    top: spacing["2xl"],
    right: spacing["2xl"],
    backgroundColor: colors.like,
    transform: [{ rotate: "-10deg" }],
  },
  badgeNope: {
    top: spacing["2xl"],
    left: spacing["2xl"],
    backgroundColor: colors.nope,
    transform: [{ rotate: "10deg" }],
  },
  badgeSuper: {
    alignSelf: "center",
    top: 80,
    backgroundColor: colors.superlike,
  },
});

export const RECIPE_CARD_DIMENSIONS = { width: CARD_W, height: CARD_H };
