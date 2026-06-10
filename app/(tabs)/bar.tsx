import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronRight,
  Heart,
  Lock,
  Package,
  Sparkles,
  Wine,
} from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { AgeGateModal } from "@/features/bar/AgeGateModal";
import { useBarCabinetStore } from "@/store/barCabinetStore";
import { ALL_COCKTAILS } from "@/constants/allCocktails";
import {
  rankCocktails,
  suggestNextIngredients,
} from "@/features/bar/cocktailMatcher";
import { resolveCocktailImage } from "@/features/bar/cocktailImage";
import type { CocktailMatch } from "@/types/bar";

export default function BarTab() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const alcoholFlag = profile?.alcoholContentEnabled;

  const ingredientIds = useBarCabinetStore((s) => s.ingredientIds);
  const hydrated = useBarCabinetStore((s) => s.hydrated);
  const hydrate = useBarCabinetStore((s) => s.hydrate);
  const addIngredient = useBarCabinetStore((s) => s.add);

  // Hydrate the cabinet only when Bar mode is actually unlocked.
  React.useEffect(() => {
    if (alcoholFlag === true && !hydrated) void hydrate();
  }, [alcoholFlag, hydrated, hydrate]);

  // First-tap age gate: shown when the user has never made a choice
  // (`undefined`). If they actively declined (`false`), the Bar tab is
  // already hidden by the layout — but we keep a defensive empty state
  // here for deep-link entries.
  const [gateOpen, setGateOpen] = React.useState(alcoholFlag === undefined);

  React.useEffect(() => {
    setGateOpen(alcoholFlag === undefined);
  }, [alcoholFlag]);

  const handleConfirm = () => {
    setProfile({ alcoholContentEnabled: true });
    setGateOpen(false);
  };

  const handleDecline = () => {
    setProfile({ alcoholContentEnabled: false });
    setGateOpen(false);
    // Layout will hide this tab on next render — bounce the user back to
    // the home tab so they aren't stranded on a hidden route.
    router.replace("/(tabs)");
  };

  return (
    <Screen background="bg" padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(420)}
          style={styles.header}
        >
          <View style={styles.iconWrap}>
            <Wine size={26} strokeWidth={1.8} color={colors.ink} />
          </View>
          <Text variant="h1">Bar</Text>
          <Text
            variant="body"
            color={colors.slate}
            style={{ marginTop: spacing.xs }}
          >
            Kokteyl tarifleri ve ev halkıyla içecek eşleştirme
          </Text>
        </Animated.View>

        {alcoholFlag === true ? (
          <UnlockedContent
            ingredientIds={ingredientIds}
            onAddIngredient={(id) => void addIngredient(id)}
          />
        ) : alcoholFlag === false ? (
          <DeclinedPlaceholder />
        ) : (
          <LockedPlaceholder />
        )}
      </ScrollView>

      <AgeGateModal
        visible={gateOpen}
        onConfirm={handleConfirm}
        onDecline={handleDecline}
      />
    </Screen>
  );
}

const UnlockedContent: React.FC<{
  ingredientIds: string[];
  onAddIngredient: (id: string) => void;
}> = ({ ingredientIds, onAddIngredient }) => {
  const ownedSet = React.useMemo(() => new Set(ingredientIds), [ingredientIds]);

  const ranked = React.useMemo(
    () => rankCocktails(ownedSet, ALL_COCKTAILS),
    [ownedSet],
  );
  const { cookable, closeOnes, everythingElse } = React.useMemo(() => {
    const cookableList = ranked.filter((m) => m.cookable);
    const closeList = ranked.filter(
      (m) => !m.cookable && m.missingRequired.length <= 2,
    );
    const restList = ranked.filter(
      (m) => !m.cookable && m.missingRequired.length > 2,
    );
    return {
      cookable: cookableList,
      closeOnes: closeList,
      everythingElse: restList,
    };
  }, [ranked]);

  const suggestions = React.useMemo(
    () => suggestNextIngredients(ownedSet, ALL_COCKTAILS, 4),
    [ownedSet],
  );

  return (
    <View style={{ gap: spacing.xl }}>
      {/* Cabinet card */}
      <Pressable
        onPress={() => router.push("/bar/cabinet")}
        style={styles.cabinetCard}
      >
        <View style={styles.cabinetIcon}>
          <Package size={20} strokeWidth={1.8} color={colors.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="overline" color={colors.dim}>
            Bar Dolabın
          </Text>
          <Text variant="smallMedium" weight="600" style={{ marginTop: 2 }}>
            {ingredientIds.length === 0
              ? "Henüz boş — başlamak için içkilerini ekle"
              : `${ingredientIds.length} malzeme · ${cookable.length} kokteyl yapabilirsin`}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.hairline} strokeWidth={1.8} />
      </Pressable>

      {/* Decision CTA — start a swipe session */}
      <DecisionCta
        cookableCount={cookable.length}
        cabinetEmpty={ingredientIds.length === 0}
      />

      {/* Empty state when cabinet is empty */}
      {ingredientIds.length === 0 ? (
        <Pressable
          onPress={() => router.push("/bar/cabinet")}
          style={styles.emptyCard}
        >
          <Sparkles size={22} strokeWidth={1.8} color={colors.primaryDeep} />
          <Text variant="h3" style={{ marginTop: spacing.sm }}>
            Bar dolabını kurmaya başla
          </Text>
          <Text
            variant="body"
            color={colors.slate}
            style={{ marginTop: spacing.xs, lineHeight: 22 }}
          >
            Evdeki içkileri ve mikserleri seç, sana yapabileceğin kokteylleri
            önerelim.
          </Text>
          <View style={styles.emptyCta}>
            <Text variant="bodyMedium" weight="700" color={colors.ink}>
              Dolabı kur
            </Text>
            <ChevronRight size={16} strokeWidth={2} color={colors.ink} />
          </View>
        </Pressable>
      ) : null}

      {/* Cookable now */}
      {cookable.length > 0 ? (
        <Section
          title="Şimdi yapabilirsin"
          subtitle={`${cookable.length} kokteyl elinde`}
        >
          <View style={{ gap: spacing.md }}>
            {cookable.map((m) => (
              <CocktailRow key={m.cocktail.id} match={m} />
            ))}
          </View>
        </Section>
      ) : null}

      {/* Suggestions to unlock more */}
      {suggestions.length > 0 ? (
        <Section
          title="Bir adım uzakta"
          subtitle="Ekle, yeni kokteyller açılsın"
        >
          <View style={styles.suggestRow}>
            {suggestions.map(({ ingredient, unlocks }) => (
              <Pressable
                key={ingredient.id}
                onPress={() => onAddIngredient(ingredient.id)}
                style={styles.suggestChip}
              >
                <Text style={styles.suggestEmoji}>{ingredient.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="smallMedium" weight="600">
                    {ingredient.name}
                  </Text>
                  <Text variant="caption" color={colors.dim}>
                    +{unlocks} kokteyl açılır
                  </Text>
                </View>
                <View style={styles.suggestPlus}>
                  <Text
                    weight="700"
                    color={colors.ink}
                    style={{ fontSize: 18, lineHeight: 18 }}
                  >
                    +
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Section>
      ) : null}

      {/* Close-ones */}
      {closeOnes.length > 0 ? (
        <Section title="Az eksiğin var" subtitle="1-2 malzeme uzaklıkta">
          <View style={{ gap: spacing.md }}>
            {closeOnes.map((m) => (
              <CocktailRow key={m.cocktail.id} match={m} />
            ))}
          </View>
        </Section>
      ) : null}

      {/* Everything else */}
      {everythingElse.length > 0 ? (
        <Section title="Tüm kokteyller" subtitle="Klasiklere göz at">
          <View style={{ gap: spacing.md }}>
            {everythingElse.map((m) => (
              <CocktailRow key={m.cocktail.id} match={m} />
            ))}
          </View>
        </Section>
      ) : null}
    </View>
  );
};

const Section: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <View style={{ gap: spacing.md }}>
    <View>
      <Text variant="h3">{title}</Text>
      {subtitle ? (
        <Text variant="caption" color={colors.dim} style={{ marginTop: 2 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    {children}
  </View>
);

const CocktailRow: React.FC<{ match: CocktailMatch }> = React.memo(
  ({ match }) => {
    const { cocktail, cookable, missingRequired } = match;
    const imgSrc = resolveCocktailImage(cocktail.imageUrl, cocktail.id);
    return (
      <Pressable
        onPress={() => router.push(`/bar/${cocktail.id}`)}
        style={[styles.cocktailRow, !cookable && styles.cocktailRowMuted]}
      >
        <View style={styles.cocktailEmojiBox}>
          {imgSrc ? (
            <Image
              source={imgSrc}
              style={styles.cocktailThumb}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ fontSize: 28, fontFamily: fonts.sans }}>
              {cocktail.emoji}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="smallMedium" weight="600">
            {cocktail.name}
          </Text>
          <Text
            variant="caption"
            color={colors.slate}
            style={{ marginTop: 2 }}
            numberOfLines={1}
          >
            {cocktail.description}
          </Text>
          {!cookable ? (
            <Text
              variant="caption"
              color={colors.accent}
              weight="600"
              style={{ marginTop: 4 }}
            >
              Eksik: {missingRequired.map((i) => i.name).join(", ")}
            </Text>
          ) : null}
        </View>
        <ChevronRight size={16} color={colors.hairline} strokeWidth={1.8} />
      </Pressable>
    );
  },
);
CocktailRow.displayName = "CocktailRow";

const DecisionCta: React.FC<{
  cookableCount: number;
  cabinetEmpty: boolean;
}> = ({ cookableCount, cabinetEmpty }) => {
  // Pick the most useful filter mode based on the cabinet state.
  // - Empty cabinet → browse the entire classic catalog ("all")
  // - Anything in cabinet → "close" (cookable + ≤2 missing) for variety
  const mode = cabinetEmpty ? "all" : "close";
  const headline = cabinetEmpty
    ? "Bugün ne içsek?"
    : cookableCount > 0
      ? "Birlikte karar verin"
      : "Yakın olanları keşfet";
  const subtitle = cabinetEmpty
    ? "12 klasik kokteyl arasından kaydırarak seç"
    : cookableCount > 0
      ? `${cookableCount} yapabildiğin + bir kaç fikir daha`
      : "Az eksiğin olanları kaydırarak seç";

  return (
    <Pressable
      onPress={() => router.push(`/bar/session?mode=${mode}`)}
      style={styles.decisionCard}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.decisionIcon}>
        <Heart size={18} color={colors.ink} fill={colors.ink} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="overline" color={colors.ink} style={{ opacity: 0.7 }}>
          KARAR VERME ZAMANI
        </Text>
        <Text
          weight="700"
          color={colors.ink}
          style={{
            fontFamily: fonts.serif,
            fontSize: 22,
            letterSpacing: -0.3,
            marginTop: 2,
          }}
        >
          {headline}
        </Text>
        <Text
          variant="small"
          color={colors.ink}
          style={{ opacity: 0.75, marginTop: 4 }}
        >
          {subtitle}
        </Text>
      </View>
      <View style={styles.decisionArrow}>
        <ChevronRight size={16} color={colors.ink} strokeWidth={2} />
      </View>
    </Pressable>
  );
};

const LockedPlaceholder: React.FC = () => (
  <View style={styles.card}>
    <View style={[styles.cardIcon, { backgroundColor: colors.cream }]}>
      <Lock size={20} strokeWidth={1.8} color={colors.slate} />
    </View>
    <Text variant="h3" style={{ marginTop: spacing.md }}>
      Yaş onayı gerekli
    </Text>
    <Text
      variant="body"
      color={colors.slate}
      style={{ marginTop: spacing.xs, lineHeight: 22 }}
    >
      Bar bölümünü kullanabilmek için 18 yaşından büyük olduğunu onaylaman
      gerekiyor.
    </Text>
  </View>
);

const DeclinedPlaceholder: React.FC = () => {
  const setProfile = useAuthStore((s) => s.setProfile);
  return (
    <View style={styles.card}>
      <View style={[styles.cardIcon, { backgroundColor: colors.cream }]}>
        <Lock size={20} strokeWidth={1.8} color={colors.slate} />
      </View>
      <Text variant="h3" style={{ marginTop: spacing.md }}>
        Bar modu kapalı
      </Text>
      <Text
        variant="body"
        color={colors.slate}
        style={{ marginTop: spacing.xs, lineHeight: 22 }}
      >
        Bu bölümü tercih etmediğini söylemiştin. Fikrini değiştirdiysen Profil
        &gt; Ayarlar üzerinden tekrar açabilir, ya da buradan da açabilirsin.
      </Text>
      <Pressable
        onPress={() => setProfile({ alcoholContentEnabled: undefined })}
        style={styles.cta}
      >
        <Text variant="bodyMedium" weight="700" color={colors.ink}>
          Yaş onayını tekrar göster
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: 140,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    marginTop: spacing.lg,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cabinetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cabinetIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  decisionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.primaryDeep,
    overflow: "hidden",
  },
  decisionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(250,247,242,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(26,23,20,0.1)",
  },
  decisionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(250,247,242,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  emptyCta: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cocktailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cocktailRowMuted: {
    backgroundColor: colors.cream,
  },
  cocktailEmojiBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  cocktailThumb: {
    width: "100%",
    height: "100%",
  },
  suggestRow: {
    gap: spacing.sm,
  },
  suggestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestEmoji: {
    fontSize: 22,
    fontFamily: fonts.sans,
    width: 28,
    textAlign: "center",
  },
  suggestPlus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
