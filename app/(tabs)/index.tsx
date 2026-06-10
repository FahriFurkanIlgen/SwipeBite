import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  BookmarkCheck,
  CalendarDays,
  ChefHat,
  ChevronRight,
  Clock,
  Flame,
  Package,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { AISuggestionBubble } from "@/components/ai/AISuggestionBubble";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { featureFlags } from "@/constants/featureFlags";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePantryStore } from "@/store/pantryStore";
import { usePlannerStore } from "@/store/plannerStore";
import { useRecipesStore } from "@/store/recipesStore";
import { useStatsStore } from "@/store/statsStore";
import { usePromoStore } from "@/store/promoStore";
import { buildHomeSuggestions } from "@/features/ai/suggestionFeed";
import { findCookableRecipes } from "@/features/pantry/pantryMatcher";
import { INFLUENCER_RECIPES } from "@/constants/influencerRecipes";
import {
  countByCategory,
  INFLUENCER_CATEGORY_LABEL,
  InfluencerCategory,
  pickInfluencerRecipes,
} from "@/features/recipes/influencerCategories";
import { InfluencerCategoryPicker } from "@/features/recipes/InfluencerCategoryPicker";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1580069491658-8220b0e8722d?w=900&h=500&fit=crop&auto=format";

const greet = () => {
  const h = new Date().getHours();
  if (h < 11) return t.home.greetingMorning;
  if (h < 18) return t.home.greetingDay;
  return t.home.greetingEvening;
};

const DATE_FMT = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const emojiFor = (id: string) => {
  if (id.includes("pantry")) return "🫙";
  if (id.includes("plan") || id.includes("grocery")) return "📅";
  if (id.includes("soup") || id.includes("time")) return "⏱";
  if (id.includes("leaf") || id.includes("vege")) return "🌿";
  return "✨";
};

const tagFor = (id: string) => {
  if (id.includes("pantry")) return "Kiler Uyumu";
  if (id.includes("plan") || id.includes("grocery")) return "Haftalık Plan";
  return "Ev Uyumu";
};

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);
  const session = useSessionStore((s) => s.session);
  const sessionCandidates = useSessionStore((s) => s.candidates);
  const sessionIndex = useSessionStore((s) => s.index);
  const startSession = useSessionStore((s) => s.startSession);
  const pantry = usePantryStore((s) => s.items);
  const plan = usePlannerStore((s) => s.plan);
  const recipes = useRecipesStore((s) => s.items);
  const favorites = useStatsStore((s) => s.favorites);
  const promos = usePromoStore((s) => s.items);
  const hydratePromos = usePromoStore((s) => s.hydrate);

  // Pull the latest promos/sponsored banners from Supabase on mount. Managed
  // from the dashboard, so new campaigns appear without an app update.
  React.useEffect(() => {
    void hydratePromos("home_banner");
  }, [hydratePromos]);

  const homePromos = React.useMemo(
    () => promos.filter((p) => p.placement === "home_banner"),
    [promos],
  );

  const handlePromoPress = React.useCallback(
    (promo: (typeof promos)[number]) => {
      if (promo.actionType === "route" && promo.actionTarget) {
        router.push(promo.actionTarget as never);
      } else if (promo.actionType === "url" && promo.actionTarget) {
        void Linking.openURL(promo.actionTarget).catch(() => undefined);
      }
    },
    [],
  );

  const suggestions = React.useMemo(
    () =>
      buildHomeSuggestions({
        pantry,
        recipes,
        plan,
        recentCookedRecipeIds: [],
        recentSessionDates: session ? [session.createdAt] : [],
      }),
    [pantry, plan, session, recipes],
  );

  const handleStart = () => {
    router.push("/(tabs)/swipe");
  };

  const handleSuggestion = (id: string) => {
    if (id.includes("pantry")) return router.push("/(tabs)/pantry");
    if (id.includes("plan") || id.includes("grocery"))
      return router.push("/(tabs)/planner");
    return undefined;
  };

  const [influencerPickerOpen, setInfluencerPickerOpen] = React.useState(false);
  const influencerCounts = React.useMemo(
    () => countByCategory(INFLUENCER_RECIPES),
    [],
  );

  const startInfluencerSession = (category: InfluencerCategory) => {
    if (!user || !household) return;
    setInfluencerPickerOpen(false);
    const deck = pickInfluencerRecipes(INFLUENCER_RECIPES, pantry, category, {
      limit: 12,
    });
    if (deck.length === 0) {
      Alert.alert(
        INFLUENCER_CATEGORY_LABEL[category],
        "Bu kategoride henüz tarif yok.",
      );
      return;
    }
    startSession(
      household.id,
      user.id,
      household.memberIds,
      undefined,
      undefined,
      undefined,
      deck,
    );
    const id = useSessionStore.getState().session?.id;
    if (id) router.push(`/session/${id}`);
  };

  const featured = React.useMemo(() => {
    const byId = new Map(recipes.map((r) => [r.id, r]));
    return favorites
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .slice(0, 8);
  }, [favorites, recipes]);

  // Recipes the household can mostly cook with what's already in the pantry.
  // Falls back to a few catalogue examples when the pantry is empty so the
  // slider always shows something to tap into.
  const pantryPicks = React.useMemo(() => {
    if (pantry.length > 0) {
      const cookable = findCookableRecipes(pantry, recipes, {
        minCoverage: 40,
        limit: 8,
      });
      if (cookable.length > 0) {
        return cookable.map((c) => ({
          recipe: c.recipe,
          percent: c.coveragePercent,
        }));
      }
    }
    return recipes.slice(0, 5).map((r) => ({ recipe: r, percent: 0 }));
  }, [pantry, recipes]);
  const dateLabel = DATE_FMT.format(new Date());

  return (
    <Screen background="bg" padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="overline" color={colors.dim}>
              {dateLabel}
            </Text>
            <Text variant="h2" style={{ marginTop: 4 }}>
              {greet()}, {user?.name ?? "Sen"}
            </Text>
          </View>
          <Pressable
            style={styles.avatar}
            onPress={() => router.push("/(tabs)/profile")}
            accessibilityLabel="Profil"
          >
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarInner}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarInner}>
                <Text
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 18,
                    color: colors.ink,
                  }}
                >
                  {(user?.name ?? "S").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Hero CTA */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)}>
          <Pressable onPress={handleStart} style={styles.hero}>
            <Image
              source={{ uri: HERO_IMAGE }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
            <LinearGradient
              colors={[
                "rgba(26,23,20,0.6)",
                "rgba(26,23,20,0.1)",
                "rgba(26,23,20,0)",
              ]}
              locations={[0, 0.6, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroContent}>
              <View>
                <Text variant="overline" color={colors.primary}>
                  Yeni Oturum
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 28,
                    lineHeight: 31,
                    color: colors.bg,
                    letterSpacing: -0.56,
                    marginTop: 4,
                  }}
                >
                  Bugün ne{"\n"}yesek?
                </Text>
              </View>
              <View style={styles.heroCta}>
                <Text variant="smallMedium" weight="700" color={colors.ink}>
                  Kaydırmaya başla
                </Text>
                <ChevronRight size={14} strokeWidth={2.5} color={colors.ink} />
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* Cici Boğaz CTA */}
        {featureFlags.cici ? (
          <Animated.View entering={FadeInDown.delay(120).duration(500)}>
            <Pressable
              onPress={() => router.push("/cici")}
              style={styles.ciciCard}
            >
              <View style={styles.ciciIcon}>
                <UtensilsCrossed size={22} color={colors.primaryDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="overline" color={colors.primaryDeep}>
                  Cici Boğaz
                </Text>
                <Text
                  variant="bodyMedium"
                  weight="700"
                  style={{ marginTop: 2 }}
                >
                  Bugün dışarıdan ne söyleyelim?
                </Text>
                <Text
                  variant="caption"
                  color={colors.dim}
                  style={{ marginTop: 2 }}
                >
                  Grup kur • Herkes oy versin • Kazanan belirlensin
                </Text>
              </View>
              <ChevronRight
                size={18}
                color={colors.hairline}
                strokeWidth={1.5}
              />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Promo / sponsored banners — managed from the Supabase dashboard */}
        {homePromos.map((promo, i) => {
          const tappable = promo.actionType !== "none";
          return (
            <Animated.View
              key={promo.id}
              entering={FadeInDown.delay(140 + i * 40).duration(500)}
            >
              <Pressable
                onPress={tappable ? () => handlePromoPress(promo) : undefined}
                disabled={!tappable}
                style={[
                  styles.promoCard,
                  promo.bgColor ? { backgroundColor: promo.bgColor } : null,
                ]}
              >
                {promo.imageUrl ? (
                  <Image
                    source={{ uri: promo.imageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                  />
                ) : null}
                {promo.imageUrl ? (
                  <LinearGradient
                    colors={["rgba(26,23,20,0.05)", "rgba(26,23,20,0.78)"]}
                    locations={[0, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                ) : null}
                <View style={styles.promoContent}>
                  {promo.overline ? (
                    <Text
                      variant="overline"
                      color={
                        promo.imageUrl
                          ? colors.bg
                          : (promo.textColor ?? colors.primaryDeep)
                      }
                    >
                      {promo.overline}
                    </Text>
                  ) : null}
                  <Text
                    variant="bodyMedium"
                    weight="700"
                    color={
                      promo.imageUrl
                        ? colors.bg
                        : (promo.textColor ?? colors.ink)
                    }
                    style={{ marginTop: 2 }}
                  >
                    {promo.title}
                  </Text>
                  {promo.subtitle ? (
                    <Text
                      variant="caption"
                      color={
                        promo.imageUrl ? "rgba(250,247,242,0.85)" : colors.dim
                      }
                      style={{ marginTop: 2 }}
                    >
                      {promo.subtitle}
                    </Text>
                  ) : null}
                  {tappable && promo.ctaLabel ? (
                    <View style={styles.promoCtaRow}>
                      <Text
                        variant="smallMedium"
                        weight="700"
                        color={promo.imageUrl ? colors.bg : colors.primaryDeep}
                      >
                        {promo.ctaLabel}
                      </Text>
                      <ChevronRight
                        size={14}
                        strokeWidth={2.5}
                        color={promo.imageUrl ? colors.bg : colors.primaryDeep}
                      />
                    </View>
                  ) : null}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Active session */}
        {session?.status === "active" ? (
          <Animated.View entering={FadeInDown.delay(160).duration(500)}>
            <Pressable
              onPress={() => router.push(`/session/${session.id}`)}
              style={styles.activeCard}
            >
              <View style={styles.activeThumbWrap}>
                {recipes[0]?.imageUrl ? (
                  <Image
                    source={{ uri: recipes[0].imageUrl }}
                    style={styles.activeThumb}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.activeThumb} />
                )}
                <View style={styles.activeDot} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="overline" color={colors.accent}>
                  {t.home.activeSessionTitle}
                </Text>
                <Text
                  variant="bodyMedium"
                  weight="600"
                  style={{ marginTop: 2 }}
                >
                  {t.home.waitingPartner}
                </Text>
                {sessionCandidates.length > 0 ? (
                  <Text
                    variant="caption"
                    color={colors.dim}
                    style={{ marginTop: 2 }}
                  >
                    {sessionIndex}/{sessionCandidates.length} oylandı
                  </Text>
                ) : null}
              </View>
              <ChevronRight
                size={18}
                strokeWidth={1.5}
                color={colors.hairline}
              />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Quick actions */}
        <View style={{ gap: spacing.md }}>
          <Text variant="overline" color={colors.dim}>
            Hızlı Erişim
          </Text>
          <View style={styles.quickGrid}>
            <QuickAction
              icon={Package}
              label={t.home.quickFromPantry}
              sub={`${pantry.length} malzeme`}
              tint={colors.cream}
              accent={colors.slate}
              onPress={() => router.push("/(tabs)/pantry")}
            />
            <QuickAction
              icon={CalendarDays}
              label={t.home.quickWeekly}
              sub={
                plan ? `${plan.days.length} gün planlandı` : "Henüz plan yok"
              }
              tint={colors.primarySoft}
              accent={colors.primaryDeep}
              onPress={() => router.push("/(tabs)/planner")}
            />
            <QuickAction
              icon={ChefHat}
              label="Bu akşam ne yapsam?"
              sub="Malzemelerden tarif bul"
              tint={colors.primarySoft}
              accent={colors.primaryDeep}
              onPress={() => router.push("/cook-with")}
            />
            <QuickAction
              icon={BookmarkCheck}
              label={t.home.quickSaved}
              sub="Kaydedilenler"
              tint={colors.forestSoft}
              accent={colors.forest}
              onPress={() => router.push("/(tabs)/profile")}
            />
            <QuickAction
              icon={Sparkles}
              label={t.home.quickInfluencer}
              sub={
                INFLUENCER_RECIPES.length > 0
                  ? `${INFLUENCER_RECIPES.length} tarif • kategoriye göre`
                  : "Yakında"
              }
              tint={colors.primarySoft}
              accent={colors.primaryDeep}
              onPress={() => {
                if (!user || !household) return;
                if (INFLUENCER_RECIPES.length === 0) {
                  Alert.alert(
                    "Yakında",
                    "Fenomen tarifler hazırlanıyor. Birkaç gün içinde burada olacak.",
                  );
                  return;
                }
                setInfluencerPickerOpen(true);
              }}
            />
          </View>
        </View>

        {/* Pantry-based meal suggestions slider */}
        {pantryPicks.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="overline" color={colors.dim}>
                  Kilerdekilerle Yapabileceğin Yemekler
                </Text>
                <Text
                  variant="caption"
                  color={colors.dim}
                  style={{ marginTop: 2 }}
                >
                  {pantry.length > 0
                    ? "Elindeki malzemelere göre öneriler"
                    : "Örnek tarifler — kilerini doldurunca kişiselleşir"}
                </Text>
              </View>
              <Pressable onPress={() => router.push("/cook-with")}>
                <Text variant="smallMedium" color={colors.primaryDeep}>
                  Tümünü gör
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md }}
            >
              {pantryPicks.map(({ recipe, percent }, i) => (
                <Animated.View
                  key={recipe.id}
                  entering={FadeInDown.delay(160 + i * 60).duration(450)}
                >
                  <Pressable
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                    style={styles.pantryCard}
                  >
                    <View style={styles.pantryImgWrap}>
                      <Image
                        source={{ uri: recipe.imageUrl }}
                        style={styles.pantryImg}
                        contentFit="cover"
                      />
                      {percent > 0 ? (
                        <View style={styles.pantryBadge}>
                          <Package
                            size={10}
                            color={colors.ink}
                            strokeWidth={2}
                          />
                          <Text
                            variant="caption"
                            weight="700"
                            style={{ fontSize: 10 }}
                          >
                            %{percent}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text
                      variant="smallMedium"
                      weight="600"
                      numberOfLines={2}
                      style={{ fontSize: 13, lineHeight: 16 }}
                    >
                      {recipe.title}
                    </Text>
                    <View style={styles.pantryCardFooter}>
                      <View style={styles.featuredMeta}>
                        <Clock size={10} color={colors.dim} strokeWidth={1.5} />
                        <Text variant="caption" color={colors.dim}>
                          {recipe.prepTimeMinutes} dk
                        </Text>
                      </View>
                      <View style={styles.pantryDetail}>
                        <Text
                          variant="caption"
                          weight="700"
                          color={colors.primaryDeep}
                        >
                          Detay
                        </Text>
                        <ChevronRight
                          size={12}
                          color={colors.primaryDeep}
                          strokeWidth={2.5}
                        />
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* AI suggestions */}
        <View style={{ gap: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Text variant="overline" color={colors.dim}>
              AI Önerileri
            </Text>
            <View style={styles.sectionMeta}>
              <Flame size={11} color={colors.primary} strokeWidth={2} />
              <Text variant="caption" color={colors.dim}>
                Kişiselleştirilmiş
              </Text>
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            {suggestions.map((s, i) => (
              <Animated.View
                key={s.id}
                entering={FadeInDown.delay(240 + i * 70).duration(450)}
              >
                <AISuggestionBubble
                  message={s.message}
                  tag={tagFor(s.id)}
                  emoji={emojiFor(s.id)}
                  onPress={() => handleSuggestion(s.id)}
                />
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Recent recipes */}
        {featured.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text variant="overline" color={colors.dim}>
                Son Eşleşmeler
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/profile")}>
                <Text variant="smallMedium" color={colors.primaryDeep}>
                  Tümünü gör
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md }}
            >
              {featured.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => router.push(`/recipe/${r.id}`)}
                  style={styles.featured}
                >
                  <Image
                    source={{ uri: r.imageUrl }}
                    style={styles.featuredImg}
                    contentFit="cover"
                  />
                  <View style={styles.featuredMeta}>
                    <Clock size={9} color={colors.dim} strokeWidth={1.5} />
                    <Text variant="caption" color={colors.dim}>
                      {r.prepTimeMinutes} dk
                    </Text>
                  </View>
                  <Text
                    variant="smallMedium"
                    weight="600"
                    numberOfLines={2}
                    style={{ fontSize: 11, lineHeight: 14 }}
                  >
                    {r.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={{ height: spacing["4xl"] }} />
      </ScrollView>

      <InfluencerCategoryPicker
        visible={influencerPickerOpen}
        counts={influencerCounts}
        pantryAware={pantry.length >= 3}
        onSelect={startInfluencerSession}
        onClose={() => setInfluencerPickerOpen(false)}
      />
    </Screen>
  );
}

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  sub: string;
  tint: string;
  accent: string;
  onPress: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({
  icon: Icon,
  label,
  sub,
  tint,
  accent,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={[styles.quick, { backgroundColor: tint }]}
  >
    <View style={styles.quickIcon}>
      <Icon size={18} color={accent} strokeWidth={1.5} />
    </View>
    <Text variant="smallMedium" weight="600">
      {label}
    </Text>
    <Text variant="caption" color={colors.dim}>
      {sub}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["3xl"],
    gap: spacing["2xl"],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    height: 200,
    borderRadius: radii.hero,
    overflow: "hidden",
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,23,20,0.45)",
  },
  heroContent: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "space-between",
  },
  heroCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ciciCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ciciIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  promoCard: {
    position: "relative",
    overflow: "hidden",
    minHeight: 96,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promoContent: {
    padding: spacing.lg,
    justifyContent: "center",
    minHeight: 96,
  },
  promoCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  activeThumbWrap: { position: "relative" },
  activeThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.cream,
  },
  activeDot: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.card,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  quick: {
    width: "47.5%",
    padding: spacing.lg,
    borderRadius: radii.xl,
    gap: 4,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featured: { width: 88, gap: 6 },
  featuredImg: {
    width: 88,
    height: 88,
    borderRadius: radii.md,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pantryCard: {
    width: 160,
    gap: 8,
    padding: spacing.sm,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pantryImgWrap: {
    position: "relative",
  },
  pantryImg: {
    width: "100%",
    height: 104,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
  },
  pantryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  pantryCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pantryDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});
