import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ArrowLeft,
  Check,
  Clock,
  GlassWater,
  Plus,
  Wine,
} from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { BAR_INGREDIENT_INDEX } from "@/constants/barCatalog";
import {
  COCKTAIL_GLASS_LABEL,
  COCKTAIL_TECHNIQUE_LABEL,
} from "@/constants/famousCocktails";
import { ALL_COCKTAIL_INDEX } from "@/constants/allCocktails";
import { useBarCabinetStore } from "@/store/barCabinetStore";
import { matchCocktail } from "@/features/bar/cocktailMatcher";
import { resolveCocktailImage } from "@/features/bar/cocktailImage";

export default function CocktailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cocktail = id ? ALL_COCKTAIL_INDEX[id] : undefined;

  const ingredientIds = useBarCabinetStore((s) => s.ingredientIds);
  const addIngredient = useBarCabinetStore((s) => s.add);
  const ownedSet = React.useMemo(() => new Set(ingredientIds), [ingredientIds]);

  if (!cocktail) {
    return (
      <Screen background="bg">
        <Stack.Screen options={{ title: "Kokteyl" }} />
        <View style={styles.notFound}>
          <Text variant="h3">Tarif bulunamadı</Text>
          <Pressable onPress={() => router.back()} style={styles.cta}>
            <Text variant="bodyMedium" weight="700" color={colors.ink}>
              Geri dön
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const match = matchCocktail(cocktail, ownedSet);

  return (
    <Screen background="bg" padded={false}>
      <Stack.Screen options={{ title: cocktail.name, headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={10}
          >
            <ArrowLeft size={18} strokeWidth={2} color={colors.ink} />
          </Pressable>
          {(() => {
            const src = resolveCocktailImage(cocktail.imageUrl, cocktail.id);
            return src ? (
              <Image source={src} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <Text style={styles.heroEmoji}>{cocktail.emoji}</Text>
            );
          })()}
          <Text variant="h1" align="center">
            {cocktail.name}
          </Text>
          {cocktail.altName && cocktail.altName !== cocktail.name ? (
            <Text variant="caption" color={colors.dim} align="center">
              {cocktail.altName}
            </Text>
          ) : null}
          <Text
            variant="body"
            color={colors.slate}
            align="center"
            style={{ marginTop: spacing.sm, lineHeight: 22 }}
          >
            {cocktail.description}
          </Text>
        </Animated.View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <MetaPill
            icon={<Clock size={14} color={colors.slate} strokeWidth={1.8} />}
            label={`${cocktail.prepTimeMinutes} dk`}
          />
          <MetaPill
            icon={<Wine size={14} color={colors.slate} strokeWidth={1.8} />}
            label={COCKTAIL_TECHNIQUE_LABEL[cocktail.technique]}
          />
          <MetaPill
            icon={
              <GlassWater size={14} color={colors.slate} strokeWidth={1.8} />
            }
            label={COCKTAIL_GLASS_LABEL[cocktail.glass]}
          />
        </View>

        {/* Cookability badge */}
        <View
          style={[
            styles.statusCard,
            match.cookable ? styles.statusCookable : styles.statusMissing,
          ]}
        >
          <Text
            variant="overline"
            color={match.cookable ? colors.forest : colors.accent}
          >
            {match.cookable ? "Hazırsın" : "Eksik malzeme var"}
          </Text>
          <Text
            variant="smallMedium"
            color={colors.ink}
            style={{ marginTop: 4, lineHeight: 20 }}
          >
            {match.cookable
              ? "Bu kokteyl için ihtiyacın olan her şey bar dolabında."
              : `${match.missingRequired.length} malzeme eksik. Aşağıdan dolabına ekleyebilirsin.`}
          </Text>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text variant="overline" color={colors.dim}>
            Malzemeler
          </Text>
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            {cocktail.ingredients.map((ref) => {
              const ing = BAR_INGREDIENT_INDEX[ref.ingredientId];
              if (!ing) return null;
              const owned = ownedSet.has(ing.id);
              return (
                <View
                  key={ref.ingredientId}
                  style={[
                    styles.ingRow,
                    owned && { backgroundColor: colors.forestSoft },
                  ]}
                >
                  <Text style={styles.ingEmoji}>{ing.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text variant="smallMedium" weight="600">
                      {ing.name}
                      {ref.optional ? (
                        <Text variant="caption" color={colors.dim} weight="400">
                          {"  "}· isteğe bağlı
                        </Text>
                      ) : null}
                    </Text>
                    <Text variant="caption" color={colors.slate}>
                      {ref.amount}
                    </Text>
                  </View>
                  {owned ? (
                    <View style={styles.ownedBadge}>
                      <Check size={12} strokeWidth={2.6} color={colors.ink} />
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => void addIngredient(ing.id)}
                      hitSlop={8}
                      style={styles.addBtn}
                    >
                      <Plus size={14} strokeWidth={2.4} color={colors.ink} />
                      <Text variant="caption" weight="600" color={colors.ink}>
                        Ekle
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Steps */}
        <View style={styles.section}>
          <Text variant="overline" color={colors.dim}>
            Hazırlanışı
          </Text>
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            {cocktail.steps.map((step, idx) => (
              <View key={idx} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text
                    style={{
                      fontFamily: fonts.serif,
                      fontSize: 14,
                      color: colors.ink,
                    }}
                  >
                    {idx + 1}
                  </Text>
                </View>
                <Text
                  variant="body"
                  color={colors.ink}
                  style={{ flex: 1, lineHeight: 22 }}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </Screen>
  );
}

const MetaPill: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => (
  <View style={styles.metaPill}>
    {icon}
    <Text variant="caption" weight="500" color={colors.slate}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing["2xl"],
    gap: spacing.xl,
  },
  hero: {
    alignItems: "center",
    gap: spacing.xs,
  },
  backBtn: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
    fontFamily: fonts.sans,
  },
  heroImage: {
    width: 160,
    height: 160,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.cream,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.cream,
  },
  statusCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  statusCookable: {
    backgroundColor: colors.forestSoft,
    borderColor: colors.forest,
  },
  statusMissing: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  section: {
    gap: spacing.sm,
  },
  ingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ingEmoji: {
    fontSize: 22,
    fontFamily: fonts.sans,
    width: 28,
    textAlign: "center",
  },
  ownedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  step: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  cta: {
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
