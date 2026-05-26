import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, Pill, Screen, Text } from "@/components/ui";
import { colors, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import {
  computeStreak,
  favoriteRecipeId,
  useStatsStore,
} from "@/store/statsStore";
import { findRecipe, MOCK_RECIPES } from "@/constants/mockRecipes";

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const household = useAuthStore((s) => s.household);
  const signOut = useAuthStore((s) => s.signOut);
  const cookDates = useStatsStore((s) => s.cookDates);
  const cookCounts = useStatsStore((s) => s.cookCounts);
  const favorites = useStatsStore((s) => s.favorites);

  const streak = React.useMemo(() => computeStreak(cookDates), [cookDates]);
  const topRecipe = React.useMemo(() => {
    const id = favoriteRecipeId(cookCounts);
    return id ? findRecipe(id) : null;
  }, [cookCounts]);
  const favoriteRecipes = React.useMemo(
    () =>
      favorites
        .map((id) => MOCK_RECIPES.find((r) => r.id === id))
        .filter((r): r is NonNullable<typeof r> => !!r),
    [favorites],
  );

  return (
    <Screen background="snow">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text variant="h1" weight="700">
            {t.profile.title}
          </Text>
        </View>

        <Card variant="amber" padding="lg" style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" weight="700">
              {user?.name}
            </Text>
            <Text variant="small" color={colors.graphite}>
              {user?.email}
            </Text>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <Card padding="lg" style={styles.statCard}>
            <Ionicons name="flame" size={22} color={colors.ink} />
            <Text variant="display" weight="700">
              {streak}
            </Text>
            <Text variant="caption" color={colors.graphite}>
              günlük seri
            </Text>
          </Card>
          <Card padding="lg" style={styles.statCard}>
            <Ionicons name="restaurant" size={22} color={colors.ink} />
            <Text variant="display" weight="700">
              {Object.values(cookCounts).reduce((a, b) => a + b, 0)}
            </Text>
            <Text variant="caption" color={colors.graphite}>
              pişirilen tarif
            </Text>
          </Card>
          <Card padding="lg" style={styles.statCard}>
            <Ionicons name="heart" size={22} color={colors.ink} />
            <Text variant="display" weight="700">
              {favorites.length}
            </Text>
            <Text variant="caption" color={colors.graphite}>
              favori
            </Text>
          </Card>
        </View>

        {topRecipe ? (
          <Pressable
            onPress={() => router.push(`/recipe/${topRecipe.id}` as never)}
          >
            <Card variant="amber" padding="lg" style={styles.topRecipeCard}>
              <View style={{ flex: 1 }}>
                <Text variant="caption" weight="700" color={colors.graphite}>
                  EN SEVDİĞİN
                </Text>
                <Text variant="bodyMedium" weight="700">
                  {topRecipe.title}
                </Text>
                <Text variant="small" color={colors.graphite}>
                  {cookCounts[topRecipe.id]} kez yapıldı
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.ink} />
            </Card>
          </Pressable>
        ) : null}

        {favoriteRecipes.length > 0 ? (
          <Section icon="heart-outline" title="Favorilerim">
            <View style={{ gap: spacing.sm }}>
              {favoriteRecipes.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => router.push(`/recipe/${r.id}` as never)}
                  style={styles.favRow}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" weight="600">
                      {r.title}
                    </Text>
                    <Text variant="caption" color={colors.graphite}>
                      {r.prepTimeMinutes} dk · {r.difficulty}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.graphite}
                  />
                </Pressable>
              ))}
            </View>
          </Section>
        ) : null}

        <Section icon="home" title={t.profile.household}>
          <Text variant="bodyMedium" weight="600">
            {household?.name ?? "—"}
          </Text>
          <Text variant="caption" color={colors.slate}>
            {household?.memberIds.length ?? 1} üye
          </Text>
          <Button
            title={t.profile.invite}
            variant="secondary"
            size="sm"
            onPress={() => router.push("/invite")}
            style={{ marginTop: spacing.sm, alignSelf: "flex-start" }}
            leftSlot={
              <Ionicons
                name="person-add-outline"
                size={14}
                color={colors.ink}
              />
            }
          />
        </Section>

        <Section icon="alert-circle" title={t.profile.allergies}>
          <PillList
            items={profile?.allergies ?? []}
            fallback="Tanımlı alerji yok."
          />
        </Section>

        <Section icon="close-circle" title={t.profile.dislikes}>
          <PillList
            items={profile?.hardDislikes ?? []}
            fallback="Sevmediğin malzeme eklenmemiş."
          />
        </Section>

        <Section icon="flame-outline" title={t.profile.spice}>
          <Text variant="bodyMedium" weight="600">
            {profile?.spiceTolerance ?? "mild"}
          </Text>
        </Section>

        <Section icon="restaurant-outline" title={t.profile.cuisines}>
          <PillList
            items={profile?.favoriteCuisines ?? []}
            fallback="Henüz tercih eklemedin."
          />
        </Section>

        <Button
          title={t.profile.signOut}
          variant="ghost"
          fullWidth
          onPress={signOut}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </Screen>
  );
}

const Section: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <Card padding="lg" style={{ gap: spacing.sm }}>
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
    >
      <Ionicons name={icon} size={18} color={colors.ink} />
      <Text variant="bodyMedium" weight="700">
        {title}
      </Text>
    </View>
    {children}
  </Card>
);

const PillList: React.FC<{ items: string[]; fallback: string }> = ({
  items,
  fallback,
}) => {
  if (!items.length) {
    return (
      <Text variant="small" color={colors.slate}>
        {fallback}
      </Text>
    );
  }
  return (
    <View style={styles.pillRow}>
      {items.map((i) => (
        <Pill key={i} label={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: spacing["2xl"],
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  userCard: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.snow,
    alignItems: "center",
    justifyContent: "center",
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCard: { flex: 1, alignItems: "center", gap: 4 },
  topRecipeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  favRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
});
