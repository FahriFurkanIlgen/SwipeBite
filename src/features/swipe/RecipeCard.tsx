import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Heart, Package, Users, X } from "lucide-react-native";
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
import { Recipe, VoteType } from "@/types/domain";
import { Text } from "@/components/ui/Text";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W - spacing.xl * 2, 380);
const CARD_H = CARD_W * 1.5;
const SWIPE_THRESHOLD = 110;
const SUPER_THRESHOLD = 140;
const HAPTIC_THRESHOLD = 80;

export interface RecipeCardProps {
  recipe: Recipe;
  pantryMatchPercent?: number;
  householdCompatibilityPercent?: number;
  aiNote?: string;
  stackOffset?: number;
  interactive?: boolean;
  onVote?: (type: VoteType) => void;
}

const SPRING_SOFT = { damping: 18, stiffness: 220, mass: 0.6 } as const;
const SPRING_STACK = { damping: 20, stiffness: 180, mass: 0.7 } as const;
const EXIT_EASING = Easing.bezier(0.2, 0.6, 0.2, 1);

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
  // Animates between stack positions so newly-promoted cards glide forward
  // instead of snapping when the deck index advances.
  const offset = useSharedValue(stackOffset);
  React.useEffect(() => {
    offset.value = withSpring(stackOffset, SPRING_STACK);
  }, [stackOffset, offset]);

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
    const duration = 260;
    const config = { duration, easing: EXIT_EASING };
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
      // Fly the card out in the direction of motion so the exit feels
      // continuous with the gesture instead of teleporting to a fixed point.
      const exitX = (sign: number) =>
        sign * Math.max(SCREEN_W * 1.4, Math.abs(vx) * 0.25 + 600);
      const exitY = (sign: number) =>
        sign * Math.max(SCREEN_W * 1.4, Math.abs(vy) * 0.25 + 600);
      if (y < -SUPER_THRESHOLD && Math.abs(x) < SUPER_THRESHOLD) {
        runOnJS(animateOut)("superlike", x, exitY(-1));
      } else if (y > SUPER_THRESHOLD && Math.abs(x) < SUPER_THRESHOLD) {
        runOnJS(animateOut)("superdislike", x, exitY(1));
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
    // Use the springy `offset` (not the raw prop) so promotions glide.
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
          colors={["rgba(26,23,20,0.05)", "rgba(26,23,20,0.8)"]}
          locations={[0.4, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />

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
          <Text variant="caption" weight="700" color={colors.ink}>
            ★ SÜPER
          </Text>
        </Animated.View>

        {interactive ? (
          <View style={styles.content}>
            <View style={styles.tagsRow}>
              {recipe.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text variant="caption" weight="600" color={colors.bg}>
                    {tag.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {recipe.title}
            </Text>
            <Text variant="small" color="rgba(250,247,242,0.7)">
              {recipe.cuisine}
            </Text>

            <View style={styles.metaRow}>
              <Meta icon={Clock} label={`${recipe.prepTimeMinutes} dk`} />
              <Meta
                icon={Users}
                label={`%${householdCompatibilityPercent} ev`}
              />
              <View style={[styles.meta, styles.metaAccent]}>
                <Package size={11} color={colors.ink} strokeWidth={1.5} />
                <Text variant="caption" weight="700" color={colors.ink}>
                  %{pantryMatchPercent} kiler
                </Text>
              </View>
            </View>

            {aiNote ? (
              <View style={styles.aiBox}>
                <Text variant="small" color="rgba(250,247,242,0.75)">
                  ✦ {aiNote}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
};

interface MetaProps {
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  label: string;
}
const Meta: React.FC<MetaProps> = ({ icon: Icon, label }) => (
  <View style={styles.meta}>
    <Icon size={11} color="rgba(250,247,242,0.8)" strokeWidth={1.5} />
    <Text variant="caption" weight="500" color="rgba(250,247,242,0.85)">
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 28,
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
    top: 0,
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 2,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(250,247,242,0.18)",
    borderWidth: 1,
    borderColor: "rgba(250,247,242,0.25)",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 35,
    color: colors.bg,
    letterSpacing: -0.64,
  },
  metaRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(26,23,20,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  metaAccent: {
    backgroundColor: "rgba(240,180,41,0.85)",
    borderColor: "transparent",
  },
  aiBox: {
    marginTop: spacing.sm,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(26,23,20,0.55)",
    borderWidth: 1,
    borderColor: "rgba(250,247,242,0.1)",
  },
  badge: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
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

export const RECIPE_CARD_DIMENSIONS = { width: CARD_W, height: CARD_H };
