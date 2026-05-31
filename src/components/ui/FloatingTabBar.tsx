import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Home as HomeIcon,
  Layers,
  CalendarDays,
  Package,
  User,
  type LucideIcon,
} from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, shadows, spacing } from "@/constants/theme";

const ICONS: Record<string, LucideIcon> = {
  index: HomeIcon,
  swipe: Layers,
  planner: CalendarDays,
  pantry: Package,
  profile: User,
};

/**
 * Cream floating tab bar with an animated inner pill on the active tab.
 * White surface, soft warm shadow, mustard icon on active.
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
      damping: 22,
      stiffness: 220,
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
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.barShell}>
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
            const Icon = ICONS[route.name] ?? HomeIcon;

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
                <Icon
                  size={20}
                  strokeWidth={isFocused ? 2 : 1.5}
                  color={isFocused ? colors.primary : colors.dim}
                />
                <Text
                  style={{
                    fontSize: 10,
                    lineHeight: 10,
                    fontFamily: fonts.sansMedium,
                    color: isFocused ? colors.ink : colors.dim,
                    letterSpacing: 0.2,
                  }}
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

const BAR_HEIGHT = 64;
const SIDE_INSET = spacing.md;

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
    borderRadius: radii.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 8,
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
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorInner: {
    width: "100%",
    height: "100%",
    borderRadius: radii.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
