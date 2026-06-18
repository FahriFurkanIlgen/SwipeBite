import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { t } from "@/constants/copy";
import { featureFlags } from "@/constants/featureFlags";
import { isBar } from "@/constants/appVariant";
import { FloatingTabBar } from "@/components/ui/FloatingTabBar";
import { useAuthStore } from "@/store/authStore";

export default function TabsLayout() {
  // Bar tab is hidden when the user has explicitly declined alcoholic
  // content (`false`). It stays visible (and pops the age-gate modal on
  // first tap) when the flag is `undefined` or `true`.
  const alcoholDeclined = useAuthStore(
    (s) => s.profile?.alcoholContentEnabled === false,
  );
  // For the food-only launch the entire bar tab is hidden via the feature
  // flag, regardless of the per-user alcohol preference.
  const barHidden = !featureFlags.bar || alcoholDeclined;
  // In the SwipeBar variant the food tabs (swipe/planner/pantry) are hidden
  // entirely — the bar experience is the whole app. The Home tab stays
  // visible but renders a bar-specific landing (see (tabs)/index.tsx).
  const foodHidden = isBar;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.slate,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="swipe"
        options={{
          title: t.tabs.swipe,
          href: foodHidden ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: t.tabs.plan,
          href: foodHidden ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: t.tabs.pantry,
          href: foodHidden ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="basket" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bar"
        options={{
          title: t.tabs.bar,
          // `href: null` removes the tab from the bar entirely while keeping
          // the route mounted in the navigator (so deep links still resolve).
          href: barHidden ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wine" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
