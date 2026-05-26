import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, Pill, Screen, Text } from "@/components/ui";
import { colors, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { findRecipe } from "@/constants/mockRecipes";
import { usePantryStore } from "@/store/pantryStore";
import { useAuthStore } from "@/store/authStore";
import { useStatsStore } from "@/store/statsStore";
import { adaptRecipe, AdaptedRecipe } from "@/features/ai/recipeAdapter";

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = findRecipe(id ?? "");
  const pantry = usePantryStore((s) => s.items);
  const profile = useAuthStore((s) => s.profile);
  const isFavorite = useStatsStore((s) =>
    recipe ? s.favorites.includes(recipe.id) : false,
  );
  const toggleFavorite = useStatsStore((s) => s.toggleFavorite);

  const [adapted, setAdapted] = React.useState<AdaptedRecipe | null>(null);
  const [adapting, setAdapting] = React.useState(false);

  if (!recipe) {
    return (
      <Screen background="snow">
        <View style={styles.empty}>
          <Text variant="h2" weight="700">
            Tarif bulunamadı
          </Text>
          <Button title={t.common.back} onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const pantryNames = pantry.map((p) => p.name);
  const missing = recipe.ingredients
    .map((i) => i.name)
    .filter((n) => !pantryNames.some((p) => n.includes(p) || p.includes(n)));

  const handleAdapt = async () => {
    setAdapting(true);
    try {
      const result = await adaptRecipe({
        recipe,
        profiles: profile ? [profile] : [],
        pantryNames,
      });
      setAdapted(result);
    } finally {
      setAdapting(false);
    }
  };

  return (
    <Screen background="snow" padded={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing["4xl"] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: recipe.imageUrl }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.75)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroTop}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.iconBtn}
            >
              <Ionicons name="chevron-back" size={22} color={colors.snow} />
            </Pressable>
            <Pressable
              hitSlop={12}
              style={styles.iconBtn}
              onPress={() => toggleFavorite(recipe.id)}
              accessibilityLabel={
                isFavorite ? "Favoriden çıkar" : "Favorilere ekle"
              }
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? "#FF4D6D" : colors.snow}
              />
            </Pressable>
          </View>
          <View style={styles.heroBody}>
            <Text variant="h1" weight="700" color={colors.snow}>
              {recipe.title}
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Meta
                icon="time-outline"
                label={`${recipe.prepTimeMinutes} dk`}
              />
              <Meta icon="flame-outline" label={recipe.difficulty} />
              <Meta
                icon="people-outline"
                label={`${recipe.servings} kişilik`}
              />
            </View>
          </View>
        </View>

        <View style={{ padding: spacing["2xl"], gap: spacing.lg }}>
          <View style={styles.pillRow}>
            {recipe.tags.map((tag) => (
              <Pill key={tag} label={tag} variant="accent" />
            ))}
          </View>

          <Text variant="body" color={colors.graphite}>
            {recipe.description}
          </Text>

          {missing.length > 0 ? (
            <Card variant="amber" padding="lg" style={{ gap: 4 }}>
              <Text variant="caption" weight="700" color={colors.stone}>
                {t.match.missingIngredients.toUpperCase()}
              </Text>
              <Text variant="small" color={colors.graphite}>
                {missing.slice(0, 6).join(", ")}
              </Text>
            </Card>
          ) : null}

          <Section title={t.recipe.ingredients}>
            {recipe.ingredients.map((i) => (
              <View key={i.name} style={styles.ingRow}>
                <View style={styles.dot} />
                <Text variant="body" style={{ flex: 1 }}>
                  {i.name}
                </Text>
                {i.quantity ? (
                  <Text variant="small" color={colors.slate}>
                    {i.quantity}
                  </Text>
                ) : null}
              </View>
            ))}
          </Section>

          <Section title={t.recipe.steps}>
            {recipe.steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text variant="caption" weight="700" color={colors.snow}>
                    {i + 1}
                  </Text>
                </View>
                <Text variant="body" style={{ flex: 1 }}>
                  {s}
                </Text>
              </View>
            ))}
          </Section>

          {adapted ? (
            <Card variant="cloud" padding="lg" style={{ gap: 6 }}>
              <Text variant="bodyMedium" weight="700">
                AI uyarlaması
              </Text>
              {adapted.notes.map((n, i) => (
                <Text key={i} variant="small" color={colors.graphite}>
                  • {n}
                </Text>
              ))}
              {adapted.substitutions.map((s, i) => (
                <Text key={i} variant="small" color={colors.graphite}>
                  {s.from} → {s.to}
                </Text>
              ))}
            </Card>
          ) : null}

          <View style={{ gap: spacing.md }}>
            <Button
              title={t.recipe.cookCta}
              fullWidth
              onPress={() => router.push(`/cook/${recipe.id}` as never)}
              rightSlot={<Ionicons name="play" size={16} color={colors.snow} />}
            />
            <Button
              title={adapting ? t.common.loading : t.recipe.explainCta}
              variant="secondary"
              fullWidth
              onPress={handleAdapt}
              loading={adapting}
              leftSlot={
                <Ionicons name="sparkles" size={16} color={colors.ink} />
              }
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={{ gap: spacing.sm }}>
    <Text variant="h3" weight="700">
      {title}
    </Text>
    <View style={{ gap: spacing.sm }}>{children}</View>
  </View>
);

const Meta: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}> = ({ icon, label }) => (
  <View style={styles.metaPill}>
    <Ionicons name={icon} size={12} color={colors.snow} />
    <Text variant="caption" weight="600" color={colors.snow}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  hero: { height: 360, justifyContent: "space-between" },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingTop: spacing["3xl"],
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBody: { padding: spacing["2xl"], gap: spacing.sm },
  metaPill: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  ingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ink },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
});
