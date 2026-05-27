import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { colors, radii } from "@/constants/theme";

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/**
 * Shimmering rectangle placeholder. Cheap, animated on the UI thread.
 */
export const Skeleton: React.FC<Props> = ({
  width = "100%",
  height = 16,
  radius = radii.md,
  style,
}) => {
  const t = useSharedValue(0);

  React.useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [t]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.5, 1], [0.55, 1, 0.55]),
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius: radius },
        animatedStyle,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.cloud,
  },
});
