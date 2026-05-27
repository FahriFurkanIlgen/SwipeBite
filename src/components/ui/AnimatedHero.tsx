import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { colors, radii, spacing } from "@/constants/theme";
import { Text } from "./Text";

interface Props {
  emoji: string;
  /** Optional small tagline shown below emoji */
  tagline?: string;
}

/**
 * Floating, gently bobbing emoji inside a soft amber circle.
 * Used as a hero illustration in onboarding screens.
 */
export const AnimatedHero: React.FC<Props> = ({ emoji, tagline }) => {
  const y = useSharedValue(0);
  const rot = useSharedValue(0);

  React.useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    rot.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(6, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, [y, rot]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotateZ: `${rot.value}deg` }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.circle, style]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
      {tagline ? (
        <Text
          variant="caption"
          weight="700"
          color={colors.slate}
          style={styles.tagline}
        >
          {tagline}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  circle: {
    width: 96,
    height: 96,
    borderRadius: radii.pill,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 52, lineHeight: 60 },
  tagline: { letterSpacing: 1 },
});
