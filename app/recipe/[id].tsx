import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { RecipeImage } from "@/components/ui/RecipeImage";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Heart,
  Package,
  Play,
  Sparkles,
  Users,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { getRecipeImageSource } from "@/features/recipes/recipeImage";
import { useRecipesStore } from "@/store/recipesStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePantryStore } from "@/store/pantryStore";
import { useAuthStore } from "@/store/authStore";
import { useStatsStore } from "@/store/statsStore";
import { adaptRecipe, AdaptedRecipe } from "@/features/ai/recipeAdapter";
import { useEntitlementsStore } from "@/store/entitlementsStore";
import { useUpsellStore } from "@/store/upsellStore";

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const storeRecipe = useRecipesStore((s) =>
    s.items.find((r) => r.id === (id ?? "")),
  );
  // Influencer / custom-pool recipes don't live in the global recipes store.
  // Fall back to the active session's custom pool and dealt candidates so the
  // "Tarifi Gör" CTA from the match screen always resolves the recipe.
  const customPool = useSessionStore((s) => s.customPool);
  const candidates = useSessionStore((s) => s.candidates);
  const recipe = React.useMemo(() => {
    if (storeRecipe) return storeRecipe;
    const rid = id ?? "";
    return (
      customPool?.find((r) => r.id === rid) ??
      candidates.find((r) => r.id === rid)
    );
  }, [storeRecipe, customPool, candidates, id]);
  const pantry = usePantryStore((s) => s.items);
  const profile = useAuthStore((s) => s.profile);
  const isFavorite = useStatsStore((s) =>
    recipe ? s.favorites.includes(recipe.id) : false,
  );
  const toggleFavorite = useStatsStore((s) => s.toggleFavorite);

  const [adapted, setAdapted] = React.useState<AdaptedRecipe | null>(null);
  const [adapting, setAdapting] = React.useState(false);

  // Derived pantry coverage. Memoized so it doesn't recompute the O(n×m)
  // ingredient/pantry comparison on every unrelated re-render (favorite
  // toggles, adapt state, etc.). Null-safe so the hook order stays stable
  // even before the early "recipe not found" return below.
  const recipeIngredients = recipe?.ingredients;
  const { ingredientsWithPantry, pantryMatchPct, missingCount } =
    React.useMemo(() => {
      const ingredients = recipeIngredients ?? [];
      const pantryNames = pantry.map((p) => p.name.toLowerCase());
      const withPantry = ingredients.map((ing) => ({
        ...ing,
        inPantry: pantryNames.some(
          (p) =>
            ing.name.toLowerCase().includes(p) ||
            p.includes(ing.name.toLowerCase()),
        ),
      }));
      const matchPct = Math.round(
        (withPantry.filter((i) => i.inPantry).length /
          Math.max(1, ingredients.length)) *
          100,
      );
      const missing = withPantry.filter((i) => !i.inPantry).length;
      return {
        ingredientsWithPantry: withPantry,
        pantryMatchPct: matchPct,
        missingCount: missing,
      };
    }, [recipeIngredients, pantry]);

  if (!recipe) {
    return (
      <Screen background="bg">
        <View style={styles.empty}>
          <Text variant="h2">Tarif bulunamadı</Text>
          <Pressable onPress={() => router.back()} style={styles.cta}>
            <Text variant="bodyMedium" weight="700" color={colors.ink}>
              {t.common.back}
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const difficultyColor =
    recipe.difficulty === "kolay"
      ? colors.forest
      : recipe.difficulty === "orta"
        ? colors.primaryDeep
        : colors.accent;

  const handleAdapt = async () => {
    const ok = await useEntitlementsStore.getState().consume("recipe_adapt");
    if (!ok) {
      useUpsellStore.getState().show("recipe_adapt");
      return;
    }
    setAdapting(true);
    try {
      const result = await adaptRecipe({
        recipe,
        profiles: profile ? [profile] : [],
        pantryNames: pantry.map((p) => p.name),
      });
      setAdapted(result);
    } finally {
      setAdapting(false);
    }
  };

  return (
    <Screen background="bg" padded={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing["4xl"] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <RecipeImage
            source={getRecipeImageSource(recipe)}
            style={StyleSheet.absoluteFillObject}
            containerStyle={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(26,23,20,0.1)", "rgba(26,23,20,0.75)"]}
            locations={[0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroTop}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.iconBtn}
            >
              <ArrowLeft size={16} color={colors.bg} strokeWidth={2} />
            </Pressable>
            <Pressable
              hitSlop={12}
              onPress={() => toggleFavorite(recipe.id)}
              style={styles.iconBtn}
            >
              <Heart
                size={16}
                color={isFavorite ? colors.accent : colors.bg}
                fill={isFavorite ? colors.accent : "transparent"}
                strokeWidth={2}
              />
            </Pressable>
          </View>
          <View style={styles.heroBody}>
            <View style={styles.tagsRow}>
              {recipe.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text variant="caption" weight="600" color={colors.bg}>
                    {tag.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.heroTitle}>{recipe.title}</Text>
            <Text
              variant="small"
              color="rgba(250,247,242,0.7)"
              style={{ marginTop: 2 }}
            >
              {recipe.cuisine}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.metaGrid}>
            <MetaCard
              icon={Clock}
              value={`${recipe.prepTimeMinutes}dk`}
              label="Süre"
            />
            <MetaCard
              icon={Users}
              value={`${recipe.servings} kişi`}
              label="Kişi"
            />
            <MetaCard
              icon={Sparkles}
              value={recipe.difficulty}
              label="Zorluk"
              color={difficultyColor}
            />
            <MetaCard
              icon={Flame}
              value={
                typeof recipe.caloriesPerServing === "number"
                  ? `~${recipe.caloriesPerServing}`
                  : "—"
              }
              label="kcal / porsiyon"
            />
          </View>

          <View style={styles.pantryBanner}>
            <View style={styles.pantryIcon}>
              <Package size={18} color={colors.ink} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="smallMedium" weight="600">
                %{pantryMatchPct} Kiler Uyumu
              </Text>
              <Text variant="caption" color="#8A6800" style={{ marginTop: 2 }}>
                {missingCount} malzeme eksik
              </Text>
            </View>
            <View style={styles.pantryRing}>
              <Svg width={44} height={44} viewBox="0 0 44 44">
                <Circle
                  cx={22}
                  cy={22}
                  r={18}
                  stroke={colors.border}
                  strokeWidth={4}
                  fill="none"
                />
                <Circle
                  cx={22}
                  cy={22}
                  r={18}
                  stroke={colors.primary}
                  strokeWidth={4}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - pantryMatchPct / 100)}`}
                  transform="rotate(-90 22 22)"
                />
              </Svg>
              <Text
                style={{
                  position: "absolute",
                  fontFamily: fonts.sansBold,
                  fontSize: 10,
                  color: colors.ink,
                }}
              >
                {pantryMatchPct}%
              </Text>
            </View>
          </View>

          {recipe.description ? (
            <Text variant="body" color={colors.graphite}>
              {recipe.description}
            </Text>
          ) : null}

          <View>
            <Text
              variant="overline"
              color={colors.dim}
              style={{ marginBottom: spacing.md }}
            >
              Malzemeler — {recipe.servings} kişilik
            </Text>
            <View style={{ gap: spacing.sm }}>
              {ingredientsWithPantry.map((ing, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(i * 40).duration(400)}
                  style={[styles.ingRow, ing.inPantry && styles.ingRowActive]}
                >
                  <View
                    style={[
                      styles.ingDot,
                      {
                        backgroundColor: ing.inPantry
                          ? colors.forest
                          : colors.border,
                      },
                    ]}
                  >
                    {ing.inPantry ? (
                      <Check size={11} color={colors.bg} strokeWidth={2.5} />
                    ) : (
                      <View style={styles.ingDotInner} />
                    )}
                  </View>
                  <Text variant="smallMedium" weight="500" style={{ flex: 1 }}>
                    {ing.name}
                  </Text>
                  {ing.quantity ? (
                    <Text variant="small" color={colors.dim}>
                      {ing.quantity}
                    </Text>
                  ) : null}
                </Animated.View>
              ))}
            </View>
          </View>

          <View>
            <Text
              variant="overline"
              color={colors.dim}
              style={{ marginBottom: spacing.md }}
            >
              Hazırlanış — {recipe.steps.length} adım
            </Text>
            <View style={{ gap: spacing.md }}>
              {recipe.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text
                      style={{
                        fontFamily: fonts.serif,
                        fontSize: 12,
                        color: colors.slate,
                      }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.stepBody,
                      i < recipe.steps.length - 1 && styles.stepBorder,
                    ]}
                  >
                    <Text variant="smallMedium" color={colors.graphite}>
                      {step}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            onPress={handleAdapt}
            disabled={adapting}
            style={styles.adaptCard}
          >
            <View style={styles.adaptIcon}>
              <Sparkles size={16} color={colors.primary} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="smallMedium" weight="600">
                {adapting ? t.common.loading : t.recipe.explainCta}
              </Text>
              <Text variant="caption" color={colors.slate}>
                Alerji, kiler ve tercihlerinize göre
              </Text>
            </View>
            <ChevronRight size={16} color={colors.dim} strokeWidth={1.5} />
          </Pressable>

          {adapted ? (
            <View style={styles.adaptedCard}>
              <Text variant="smallMedium" weight="700">
                AI uyarlaması
              </Text>
              {adapted.notes.map((n, i) => (
                <Text key={`n${i}`} variant="small" color={colors.graphite}>
                  • {n}
                </Text>
              ))}
              {adapted.substitutions.map((s, i) => (
                <Text key={`s${i}`} variant="small" color={colors.graphite}>
                  {s.from} → {s.to}
                </Text>
              ))}
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push(`/cook/${recipe.id}`)}
            style={styles.cookCta}
          >
            <Text variant="bodyMedium" weight="700" color={colors.ink}>
              {t.recipe.cookCta}
            </Text>
            <ChevronRight size={18} color={colors.ink} strokeWidth={2.5} />
          </Pressable>

          {recipe.videoUrl || recipe.sourceUrl ? (
            <View style={styles.sourceWrap}>
              {recipe.videoUrl ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(recipe.videoUrl!).catch(() => undefined)
                  }
                  style={[styles.sourceBtn, styles.sourceBtnPrimary]}
                >
                  <Play
                    size={14}
                    color={colors.bg}
                    fill={colors.bg}
                    strokeWidth={2}
                  />
                  <Text variant="smallMedium" weight="700" color={colors.bg}>
                    Videoyu izle
                  </Text>
                </Pressable>
              ) : null}
              {recipe.sourceUrl ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(recipe.sourceUrl!).catch(() => undefined)
                  }
                  style={styles.sourceBtn}
                >
                  <ExternalLink size={14} color={colors.ink} strokeWidth={2} />
                  <Text variant="smallMedium" weight="700" color={colors.ink}>
                    {recipe.sourceUrl.includes("yemek.com")
                      ? "yemek.com’da aç"
                      : "Kaynak sayfası"}
                  </Text>
                </Pressable>
              ) : null}
              {recipe.sourceUrl?.includes("yemek.com") ? (
                <Text
                  variant="caption"
                  color={colors.dim}
                  style={{ marginTop: 4 }}
                >
                  Tarif kaynağı: yemek.com
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

interface MetaCardProps {
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  value: string;
  label: string;
  color?: string;
}

const MetaCard: React.FC<MetaCardProps> = ({
  icon: Icon,
  value,
  label,
  color,
}) => (
  <View style={styles.metaCard}>
    <Icon size={14} color={color ?? colors.dim} strokeWidth={1.5} />
    <Text variant="smallMedium" weight="700" color={color ?? colors.ink}>
      {value}
    </Text>
    <Text variant="overline" color={colors.dim}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  hero: { height: 280 },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingTop: spacing["3xl"],
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(26,23,20,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBody: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    gap: 4,
  },
  tagsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 6 },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: "rgba(250,247,242,0.15)",
    borderWidth: 1,
    borderColor: "rgba(250,247,242,0.2)",
  },
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 37,
    color: colors.bg,
    letterSpacing: -0.85,
  },
  content: { padding: spacing.xl, gap: spacing.lg },
  metaGrid: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  metaCard: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 4,
  },
  pantryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(240,180,41,0.3)",
  },
  pantryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pantryRing: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ingRowActive: {
    backgroundColor: "#F5FDF5",
    borderColor: "rgba(107,143,113,0.25)",
  },
  ingDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  ingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dim,
  },
  stepRow: { flexDirection: "row", gap: spacing.md },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepBody: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  stepBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  adaptCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 18,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adaptIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  adaptedCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    gap: 4,
  },
  cookCta: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  sourceWrap: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  sourceBtn: {
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  sourceBtnPrimary: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  cta: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
});
