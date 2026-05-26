import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, Screen, Text } from "@/components/ui";
import { AISuggestionBubble } from "@/components/ai/AISuggestionBubble";
import { colors, radii, shadows, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePantryStore } from "@/store/pantryStore";
import { usePlannerStore } from "@/store/plannerStore";
import { MOCK_RECIPES } from "@/constants/mockRecipes";
import { buildHomeSuggestions } from "@/features/ai/suggestionFeed";

const greet = () => {
  const h = new Date().getHours();
  if (h < 11) return t.home.greetingMorning;
  if (h < 18) return t.home.greetingDay;
  return t.home.greetingEvening;
};

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);
  const session = useSessionStore((s) => s.session);
  const startSession = useSessionStore((s) => s.startSession);
  const pantry = usePantryStore((s) => s.items);
  const plan = usePlannerStore((s) => s.plan);

  const suggestions = React.useMemo(
    () =>
      buildHomeSuggestions({
        pantry,
        recipes: MOCK_RECIPES,
        plan,
        recentCookedRecipeIds: [],
        recentSessionDates: session ? [session.createdAt] : [],
      }),
    [pantry, plan, session],
  );

  const handleStart = () => {
    if (!user || !household) return;
    startSession(household.id, user.id, household.memberIds);
    router.push(`/session/${useSessionStore.getState().session?.id}`);
  };

  return (
    <Screen background="snow">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text variant="small" color={colors.slate}>
              {greet()},
            </Text>
            <Text variant="h1" weight="700">
              {user?.name ?? "Sen"}
            </Text>
          </View>
          <Pressable
            style={styles.avatar}
            onPress={() => router.push("/(tabs)/profile")}
            accessibilityLabel="Profil"
          >
            <Ionicons name="person" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <Card variant="canvas" elevated padding="2xl" style={styles.hero}>
          <Text variant="caption" weight="600" color={colors.stone}>
            {household?.name ?? "Bizim Ev"}
          </Text>
          <Text variant="h1" weight="700" color={colors.ink}>
            Bugün ne yesek?
          </Text>
          <Text variant="small" color={colors.graphite}>
            Birkaç kart kaydır, ev halkıyla anlaş.
          </Text>
          <Button
            title={t.home.primaryCta}
            fullWidth
            onPress={handleStart}
            style={{ marginTop: spacing.md }}
            rightSlot={
              <Ionicons name="arrow-forward" size={18} color={colors.snow} />
            }
          />
        </Card>

        {session?.status === "active" ? (
          <Card variant="cloud" padding="lg" style={styles.activeSession}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" weight="600" color={colors.slate}>
                {t.home.activeSessionTitle.toUpperCase()}
              </Text>
              <Text variant="bodyMedium" weight="600">
                {t.home.waitingPartner}
              </Text>
            </View>
            <Button
              title="Devam"
              size="sm"
              onPress={() => router.push(`/session/${session.id}`)}
            />
          </Card>
        ) : null}

        <View style={styles.quickGrid}>
          <QuickAction
            label={t.home.quickFromPantry}
            icon="basket-outline"
            onPress={() => router.push("/(tabs)/pantry")}
          />
          <QuickAction
            label={t.home.quickWeekly}
            icon="calendar-outline"
            onPress={() => router.push("/(tabs)/planner")}
          />
          <QuickAction
            label={t.home.quickImport}
            icon="logo-instagram"
            onPress={() => router.push("/import")}
          />
          <QuickAction
            label={t.home.quickSaved}
            icon="bookmark-outline"
            onPress={() => router.push("/(tabs)/profile")}
          />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="h3" weight="700">
            AI önerileri
          </Text>
          {suggestions.map((s) => (
            <AISuggestionBubble
              key={s.id}
              message={s.message}
              icon={s.icon ? iconNameFor(s.icon) : undefined}
              onPress={onPressFor(s.id)}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const iconNameFor = (
  key: "sparkles" | "basket" | "calendar" | "time" | "leaf",
): keyof typeof Ionicons.glyphMap => {
  switch (key) {
    case "basket":
      return "basket-outline";
    case "calendar":
      return "calendar-outline";
    case "time":
      return "time-outline";
    case "leaf":
      return "leaf-outline";
    default:
      return "sparkles";
  }
};

const onPressFor = (id: string): (() => void) | undefined => {
  switch (id) {
    case "pantry-cookable":
    case "pantry-empty":
    case "pantry-empty-match":
      return () => router.push("/(tabs)/pantry");
    case "no-plan":
    case "grocery-ready":
      return () => router.push("/(tabs)/planner");
    default:
      return undefined;
  }
};

const QuickAction: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.quick, pressed && { opacity: 0.85 }]}
  >
    <View style={styles.quickIcon}>
      <Ionicons name={icon} size={20} color={colors.ink} />
    </View>
    <Text variant="small" weight="600" color={colors.ink}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  scroll: {
    padding: spacing["2xl"],
    gap: spacing["2xl"],
    paddingBottom: spacing["4xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cloud,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { gap: spacing.xs },
  activeSession: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  quick: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.snow,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cloud,
    ...shadows.sm,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
  },
});
