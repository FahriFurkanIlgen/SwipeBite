import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/Text";
import { colors, radii, shadows, spacing } from "@/constants/theme";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "home",
  swipe: "flame",
  planner: "calendar",
  pantry: "basket",
  profile: "person",
};

const INACTIVE = "#9A9A9A";

/**
 * Premium floating tab bar with blur background and an animated
 * "pill" that slides under the active route. Lives a few pixels
 * off the bottom edge for that polished, premium feel.
 */
export const FloatingTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [tabWidth, setTabWidth] = React.useState(0);
  const x = useSharedValue(0);

  React.useEffect(() => {
    if (tabWidth === 0) return;
    x.value = withSpring(state.index * tabWidth, {
      damping: 16,
      stiffness: 180,
    });
  }, [state.index, tabWidth, x]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: tabWidth,
  }));

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.barShell}>
        <BlurView
          intensity={60}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />
        <View
          style={styles.row}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width / state.routes.length;
            if (Math.abs(w - tabWidth) > 0.5) setTabWidth(w);
          }}
        >
          {tabWidth > 0 ? (
            <Animated.View style={[styles.indicator, indicatorStyle]}>
              <View style={styles.indicatorInner} />
            </Animated.View>
          ) : null}
          {state.routes.map((route, idx) => {
            const isFocused = state.index === idx;
            const opts = descriptors[route.key]?.options;
            const label = (opts?.title ?? route.name) as string;
            const iconName = ICONS[route.name] ?? "ellipse";

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                void Haptics.selectionAsync();
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.tab}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={label}
              >
                <Ionicons
                  name={iconName}
                  size={20}
                  color={isFocused ? colors.ink : INACTIVE}
                />
                <Text
                  variant="caption"
                  weight={isFocused ? "700" : "600"}
                  color={isFocused ? colors.ink : INACTIVE}
                  style={{ letterSpacing: 0.3 }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const BAR_HEIGHT = 68;
const SIDE_INSET = spacing.lg;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SIDE_INSET,
  },
  barShell: {
    height: BAR_HEIGHT,
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    ...shadows.md,
  },
  row: { flex: 1, flexDirection: "row" },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  indicator: {
    position: "absolute",
    top: 8,
    bottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorInner: {
    width: "70%",
    height: "100%",
    borderRadius: radii.pill,
    backgroundColor: colors.amber,
  },
});
