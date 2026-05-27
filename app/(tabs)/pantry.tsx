import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, Input, Screen, Text } from "@/components/ui";
import { colors, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { usePantryStore } from "@/store/pantryStore";
import { parsePantryText } from "@/features/ai/pantryParser";
import { findCookableRecipes } from "@/features/pantry/pantryMatcher";
import { useRecipesStore } from "@/store/recipesStore";
import { router } from "expo-router";
import { useSessionStore } from "@/store/sessionStore";

export default function PantryScreen() {
  const household = useAuthStore((s) => s.household);
  const user = useAuthStore((s) => s.user);
  const items = usePantryStore((s) => s.items);
  const addMany = usePantryStore((s) => s.addMany);
  const remove = usePantryStore((s) => s.remove);
  const startSession = useSessionStore((s) => s.startSession);
  const recipes = useRecipesStore((s) => s.items);

  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleParse = async () => {
    if (!household || !text.trim()) return;
    setLoading(true);
    try {
      const parsed = await parsePantryText(text, household.id);
      if (parsed.length === 0) {
        Alert.alert("Hmm", "Hiç malzeme bulamadım. Tekrar dener misin?");
        return;
      }
      addMany(parsed);
      setText("");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = () => {
    if (!user || !household) return;
    startSession(household.id, user.id, household.memberIds);
    const id = useSessionStore.getState().session?.id;
    if (id) router.push(`/session/${id}`);
  };

  const cookable = React.useMemo(
    () => findCookableRecipes(items, recipes, { minCoverage: 40, limit: 6 }),
    [items, recipes],
  );

  return (
    <Screen background="snow">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text variant="h1" weight="700">
            {t.pantry.title}
          </Text>
          <Text variant="small" color={colors.slate} style={{ marginTop: 4 }}>
            {t.pantry.subtitle}
          </Text>
        </View>

        <Card padding="lg" style={{ gap: spacing.md }}>
          <Input
            placeholder={t.pantry.inputPlaceholder}
            value={text}
            onChangeText={setText}
            multiline
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
          <Button
            title={loading ? t.common.loading : t.pantry.parse}
            onPress={handleParse}
            loading={loading}
            leftSlot={
              <Ionicons name="sparkles" size={16} color={colors.snow} />
            }
          />
        </Card>

        <View style={{ gap: spacing.sm }}>
          <View style={styles.rowBetween}>
            <Text variant="h3" weight="700">
              Kilerdeki malzemeler
            </Text>
            <Text variant="caption" color={colors.slate}>
              {t.pantry.addedCount(items.length)}
            </Text>
          </View>

          {items.length === 0 ? (
            <Card
              variant="cloud"
              padding="lg"
              style={{ alignItems: "center", gap: spacing.sm }}
            >
              <Ionicons name="basket-outline" size={28} color={colors.slate} />
              <Text variant="small" color={colors.slate}>
                {t.pantry.empty}
              </Text>
            </Card>
          ) : (
            <View style={styles.pillRow}>
              {items.map((i) => (
                <Pressable
                  key={i.id}
                  onPress={() => remove(i.id)}
                  style={styles.chip}
                >
                  <Text variant="small" weight="600" color={colors.ink}>
                    {i.name}
                  </Text>
                  <Ionicons name="close" size={14} color={colors.slate} />
                </Pressable>
              ))}
            </View>
          )}

          {items.length > 0 ? (
            <Button
              title={t.pantry.suggestCta}
              variant="primary"
              onPress={handleSuggest}
              style={{ marginTop: spacing.md }}
              rightSlot={
                <Ionicons name="arrow-forward" size={16} color={colors.snow} />
              }
            />
          ) : null}
        </View>

        {cookable.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <View style={styles.rowBetween}>
              <Text variant="h3" weight="700">
                Şu an yapabilecekleriniz
              </Text>
              <View style={styles.countBadge}>
                <Text variant="caption" weight="700" color={colors.ink}>
                  {cookable.length}
                </Text>
              </View>
            </View>
            <Text variant="small" color={colors.slate}>
              Kilerle uyumlu, eksik malzemesi az tarifler.
            </Text>

            {cookable.map((c) => (
              <Pressable
                key={c.recipe.id}
                onPress={() => router.push(`/recipe/${c.recipe.id}`)}
                style={({ pressed }) => [
                  styles.cookRow,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Image
                  source={{ uri: c.recipe.imageUrl }}
                  style={styles.cookImg}
                  contentFit="cover"
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyMedium" weight="700" numberOfLines={1}>
                    {c.recipe.title}
                  </Text>
                  <Text variant="caption" color={colors.slate}>
                    {c.recipe.prepTimeMinutes} dk · {c.recipe.difficulty}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                    <View
                      style={[
                        styles.statPill,
                        { backgroundColor: colors.amber },
                      ]}
                    >
                      <Ionicons name="basket" size={11} color={colors.ink} />
                      <Text variant="caption" weight="700" color={colors.ink}>
                        %{c.coveragePercent}
                      </Text>
                    </View>
                    {c.missingCount > 0 ? (
                      <View
                        style={[
                          styles.statPill,
                          { backgroundColor: colors.cloud },
                        ]}
                      >
                        <Text
                          variant="caption"
                          weight="600"
                          color={colors.graphite}
                        >
                          {c.missingCount} eksik
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.statPill,
                          { backgroundColor: "#D9F7BE" },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={11}
                          color={colors.ink}
                        />
                        <Text variant="caption" weight="700" color={colors.ink}>
                          Hazır
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.slate}
                />
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing["2xl"],
    gap: spacing.lg,
    paddingBottom: 120,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.amber,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.cloud,
  },
  cookRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.snow,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cloud,
  },
  cookImg: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.cloud,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
});
