import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image, type ImageProps } from "expo-image";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/constants/theme";

type Props = Omit<ImageProps, "onLoadEnd" | "onError"> & {
  /** Border radius for the shimmer placeholder (match the image's radius). */
  placeholderRadius?: number;
  /** Style for the wrapper. Usually StyleSheet.absoluteFill or explicit dims. */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * `expo-image` wrapper that shows a shimmering placeholder while the image
 * decodes/loads and cross-fades to the real image once ready. Local bundled
 * images (fenomen tarifleri) resolve almost instantly; remote URLs get a
 * visible loader so the screen never shows an empty hole.
 */
export const RecipeImage: React.FC<Props> = ({
  placeholderRadius = 0,
  containerStyle,
  style,
  transition = 220,
  ...rest
}) => {
  const fade = useSharedValue(1); // 1 = placeholder visible, 0 = hidden
  const shimmer = useSharedValue(0);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [shimmer]);

  const handleReady = React.useCallback(() => {
    fade.value = withTiming(0, { duration: 220 });
    setTimeout(() => setDone(true), 260);
  }, [fade]);

  const placeholderStyle = useAnimatedStyle(() => ({
    opacity:
      fade.value * interpolate(shimmer.value, [0, 0.5, 1], [0.55, 1, 0.55]),
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        {...rest}
        style={style}
        transition={transition}
        onLoad={handleReady}
        onError={handleReady}
      />
      {!done ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.placeholder,
            { borderRadius: placeholderRadius },
            placeholderStyle,
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  placeholder: {
    backgroundColor: colors.cloud,
  },
});
