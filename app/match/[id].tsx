import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, Screen, Text } from "@/components/ui";
import { colors, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useSessionStore } from "@/store/sessionStore";
import { findRecipe } from "@/constants/mockRecipes";
import { useAuthStore } from "@/store/authStore";

export default function MatchScreen() {
  const match = useSessionStore((s) => s.match);
  const reset = useSessionStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);

  if (!match) {
    return (
      <Screen background="snow">
        <View style={styles.empty}>
          <Text variant="h2" weight="700">
            Eşleşme bulunamadı
          </Text>
          <Text variant="body" color={colors.slate} align="center">
            Görünüşe göre bu turda ortak bir karar çıkmadı. Tekrar deneyelim mi?
          </Text>
          <Button
            title="Ana sayfaya dön"
            onPress={() => router.replace("/(tabs)")}
          />
        </View>
      </Screen>
    );
  }

  const recipe = findRecipe(match.recipeId);
  if (!recipe) return null;

  return (
    <Screen background="snow" padded={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: recipe.imageUrl }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroTop}>
            <Pressable
              onPress={() => router.replace("/(tabs)")}
              hitSlop={12}
              style={styles.iconBtn}
            >
              <Ionicons name="close" size={20} color={colors.snow} />
            </Pressable>
            <View style={styles.matchBadge}>
              <Ionicons name="sparkles" size={14} color={colors.ink} />
              <Text variant="caption" weight="700">
                {t.match.title.toUpperCase()}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.heroBody}>
            <Text
              variant="caption"
              weight="600"
              color={colors.snow}
              style={{ opacity: 0.85 }}
            >
              {t.match.subtitle}
            </Text>
            <Text variant="display" weight="700" color={colors.snow}>
              {recipe.title}
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pill
                icon="time-outline"
                label={t.swipe.prepTime(recipe.prepTimeMinutes)}
              />
              <Pill
                icon="people-outline"
                label={`${match.likedByUserIds.length || 1} oy`}
              />
              <Pill icon="trending-up-outline" label={`Skor ${match.score}`} />
            </View>
          </View>
        </View>

        <View style={{ padding: spacing["2xl"], gap: spacing.lg }}>
          <Card variant="amber" padding="lg" style={{ gap: spacing.xs }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <Ionicons name="sparkles" size={16} color={colors.ink} />
              <Text variant="bodyMedium" weight="700">
                {t.match.whyMatched}
              </Text>
            </View>
            {match.reasons.map((r, i) => (
              <Text key={i} variant="small" color={colors.graphite}>
                • {r}
              </Text>
            ))}
          </Card>

          {match.missingIngredients.length > 0 ? (
            <Card padding="lg" style={{ gap: spacing.xs }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Ionicons name="basket-outline" size={16} color={colors.ink} />
                <Text variant="bodyMedium" weight="700">
                  Alışveriş listesi
                </Text>
              </View>
              <Text variant="small" color={colors.slate}>
                Bu tarifi yapmak için eksik {match.missingIngredients.length}{" "}
                malzeme:
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: spacing.xs,
                  marginTop: spacing.xs,
                }}
              >
                {match.missingIngredients.map((ing) => (
                  <View
                    key={ing}
                    style={{
                      backgroundColor: colors.cloud,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 6,
                      borderRadius: radii.pill,
                    }}
                  >
                    <Text variant="caption" weight="600" color={colors.ink}>
                      {ing}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : (
            <Card variant="amber" padding="lg" style={{ gap: spacing.xs }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.ink}
                />
                <Text variant="bodyMedium" weight="700">
                  Tüm malzemeler hazır
                </Text>
              </View>
              <Text variant="small" color={colors.graphite}>
                Mutfağa geçebilirsin — eksik bir şey yok.
              </Text>
            </Card>
          )}

          <View style={{ gap: spacing.sm }}>
            <Text variant="h3" weight="700">
              {t.match.alternativesTitle}
            </Text>
            {match.alternatives.map((alt) => {
              const r = findRecipe(alt.recipeId);
              if (!r) return null;
              return (
                <Pressable
                  key={alt.recipeId}
                  onPress={() => router.push(`/recipe/${r.id}`)}
                  style={({ pressed }) => [
                    styles.altRow,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Image
                    source={{ uri: r.imageUrl }}
                    style={styles.altImg}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="caption" weight="600" color={colors.slate}>
                      {alt.label.toUpperCase()}
                    </Text>
                    <Text variant="bodyMedium" weight="600">
                      {r.title}
                    </Text>
                    <Text variant="caption" color={colors.slate}>
                      {r.prepTimeMinutes} dk · {r.difficulty}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.slate}
                  />
                </Pressable>
              );
            })}
          </View>

          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            <Button
              title={t.match.cookCta}
              fullWidth
              onPress={() => router.push(`/recipe/${recipe.id}`)}
              rightSlot={
                <Ionicons name="arrow-forward" size={18} color={colors.snow} />
              }
            />
            <Button
              title={t.match.swipeAgain}
              variant="ghost"
              fullWidth
              onPress={() => {
                reset();
                router.replace("/(tabs)/swipe");
              }}
            />
          </View>

          {user ? null : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const Pill: React.FC<{
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
  hero: { height: 460, justifyContent: "space-between" },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
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
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.canvas,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
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
  altRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.snow,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cloud,
  },
  altImg: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.cloud,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing["2xl"],
  },
});
