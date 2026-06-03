import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { ChevronRight, Plus, Sparkles, X } from "lucide-react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { CoachMark } from "@/components/ui/CoachMark";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { usePantryStore } from "@/store/pantryStore";
import { useRecipesStore } from "@/store/recipesStore";
import { useSessionStore } from "@/store/sessionStore";
import { parsePantryText } from "@/features/ai/pantryParser";
import { findCookableRecipes } from "@/features/pantry/pantryMatcher";
import {
  PANTRY_CATEGORY_INDEX,
  PANTRY_DROPPED_NAMES,
  PANTRY_QUICK_CATALOG,
} from "@/constants/pantryCatalog";
import { uid } from "@/utils/id";
import type { PantryItem } from "@/types/domain";

const QUICK_PAGE_SIZE = 12;

/** Strip common Turkish possessive/plural suffixes for a fallback lookup
 *  (e.g. "sütü" → "süt"). */
function canonicalKey(name: string): string {
  return name
    .replace(
      /(lar|ler|ları|leri|sı|si|su|sü|nın|nin|nun|nün|ın|in|un|ün)$/u,
      "",
    )
    .trim();
}

function categorize(name: string): string {
  const lower = name.toLocaleLowerCase("tr-TR").trim();
  return (
    PANTRY_CATEGORY_INDEX[lower] ??
    PANTRY_CATEGORY_INDEX[canonicalKey(lower)] ??
    "Diğer"
  );
}


export default function PantryScreen() {
  const household = useAuthStore((s) => s.household);
  const user = useAuthStore((s) => s.user);
  const items = usePantryStore((s) => s.items);
  const addMany = usePantryStore((s) => s.addMany);
  const remove = usePantryStore((s) => s.remove);
  const startSession = useSessionStore((s) => s.startSession);

  const inputRef = React.useRef<TextInput>(null);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [pickSaving, setPickSaving] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string>("Tümü");

  // Quick-add catalogue is now hand-curated in src/constants/pantryCatalog.ts
  // (sourced from güncel.xlsx). Already sorted by usage within each category.
  const QUICK_CATALOG = PANTRY_QUICK_CATALOG;

  const [quickCat, setQuickCat] = React.useState<string>(
    QUICK_CATALOG[0]?.category ?? "Sebze",
  );
  const [visibleCounts, setVisibleCounts] = React.useState<
    Record<string, number>
  >({});
  const visibleCount = visibleCounts[quickCat] ?? QUICK_PAGE_SIZE;
  const showMore = React.useCallback(() => {
    setVisibleCounts((prev) => ({
      ...prev,
      [quickCat]: (prev[quickCat] ?? QUICK_PAGE_SIZE) + QUICK_PAGE_SIZE,
    }));
  }, [quickCat]);
  const existingNames = React.useMemo(
    () => new Set(items.map((i) => i.name.toLocaleLowerCase("tr-TR"))),
    [items],
  );

  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of items) {
      const k = it.category ?? "Diğer";
      map.set(k, [...(map.get(k) ?? []), it]);
    }
    return Array.from(map.entries());
  }, [items]);

  const categories = React.useMemo(
    () => ["Tümü", ...grouped.map(([cat]) => cat)],
    [grouped],
  );

  const filteredGroups = React.useMemo(
    () =>
      activeCategory === "Tümü"
        ? grouped
        : grouped.filter(([cat]) => cat === activeCategory),
    [grouped, activeCategory],
  );

  // Spinner for parsing state
  const spin = useSharedValue(0);
  React.useEffect(() => {
    if (loading) {
      spin.value = 0;
      spin.value = withRepeat(
        withTiming(1, { duration: 800, easing: Easing.linear }),
        -1,
      );
    } else {
      cancelAnimation(spin);
    }
  }, [loading, spin]);
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const buildItems = React.useCallback(
    (names: string[]): PantryItem[] => {
      if (!household) return [];
      const now = new Date().toISOString();
      const seen = new Set<string>();
      const out: PantryItem[] = [];
      for (const raw of names) {
        const name = raw.trim().toLocaleLowerCase("tr-TR");
        if (!name || name.length < 2) continue;
        if (seen.has(name) || existingNames.has(name)) continue;
        seen.add(name);
        out.push({
          id: uid("pantry"),
          householdId: household.id,
          name,
          category: categorize(name),
          createdAt: now,
        });
      }
      return out;
    },
    [household, existingNames],
  );

  const handleQuickAdd = async () => {
    if (!household || !text.trim()) return;
    const parts = text.split(/[,\n;]+/);
    const newItems = buildItems(parts);
    setText("");
    if (newItems.length === 0) return;
    setSaving(true);
    try {
      await addMany(newItems);
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickPick = async (name: string) => {
    if (!household) return;
    const newItems = buildItems([name]);
    if (newItems.length === 0) return;
    setPickSaving(name);
    try {
      await addMany(newItems);
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setPickSaving(null);
    }
  };

  const handleParse = async () => {
    if (!household || !text.trim()) return;
    setLoading(true);
    try {
      const parsed = await parsePantryText(text, household.id);
      if (parsed.length === 0) {
        Alert.alert("Hmm", "Hiç malzeme bulamadım. Tekrar dener misin?");
        return;
      }
      try {
        await addMany(parsed);
        setText("");
      } catch (err) {
        Alert.alert(
          "Hata",
          err instanceof Error ? err.message : "Kaydedilemedi",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = () => {
    if (!user || !household) return;
    // Rank recipes by pantry coverage and seed the swipe session with the
    // best matches so the user actually sees "what you can cook" not random.
    const pool = useRecipesStore.getState().getOrFallback();
    const cookable = findCookableRecipes(items, pool, {
      minCoverage: 30,
      limit: 8,
    });
    const seedIds = cookable.map((c) => c.recipe.id);
    startSession(household.id, user.id, household.memberIds, seedIds);
    const id = useSessionStore.getState().session?.id;
    if (id) router.push(`/session/${id}`);
  };

  return (
    <Screen background="bg" padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text variant="overline" color={colors.dim}>
            {t.pantry.title}
          </Text>
          <View style={styles.titleRow}>
            <Text variant="h1">Ne var{"\n"}kilerde?</Text>
            <View style={styles.countBadge}>
              <Text variant="smallMedium" weight="600" color={colors.slate}>
                {items.length} malzeme
              </Text>
            </View>
          </View>
        </View>

        {/* Input card */}
        <View style={styles.inputCard}>
          <Text
            variant="overline"
            color={colors.dim}
            style={{ marginBottom: 10 }}
          >
            Malzeme Ekle
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              placeholder="örn. domates, süt, yumurta"
              placeholderTextColor={colors.dim}
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleQuickAdd}
              returnKeyType="done"
              blurOnSubmit={false}
              style={styles.input}
            />
            <Pressable
              onPress={handleQuickAdd}
              disabled={!text.trim() || saving}
              style={[
                styles.addBtn,
                { opacity: text.trim() && !saving ? 1 : 0.4 },
              ]}
              hitSlop={6}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.bg} />
              ) : (
                <Plus size={18} color={colors.bg} strokeWidth={2.5} />
              )}
            </Pressable>
          </View>
          <Text variant="caption" color={colors.dim} style={{ marginTop: 8 }}>
            Virgülle ayır: "domates, süt, 2 yumurta"
          </Text>

          {/* Quick picks */}
          <View style={{ marginTop: spacing.md }}>
            <Text
              variant="overline"
              color={colors.dim}
              style={{ marginBottom: 8 }}
            >
              Sık Eklenenler
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingRight: 4 }}
              style={{ marginBottom: 10 }}
            >
              {QUICK_CATALOG.map((c) => {
                const isActive = c.category === quickCat;
                return (
                  <Pressable
                    key={c.category}
                    onPress={() => setQuickCat(c.category)}
                    style={[
                      styles.quickCatTab,
                      {
                        backgroundColor: isActive ? colors.ink : "transparent",
                        borderColor: isActive ? colors.ink : colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="smallMedium"
                      weight={isActive ? "600" : "400"}
                      color={isActive ? colors.bg : colors.slate}
                      style={{ fontSize: 12 }}
                    >
                      {c.category}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {(() => {
              const allItems =
                QUICK_CATALOG.find((c) => c.category === quickCat)?.items ?? [];
              const available = allItems.filter((q) => !existingNames.has(q));
              const shown = available.slice(0, visibleCount);
              const hasMore = available.length > shown.length;
              return (
                <View style={styles.quickWrap}>
                  {shown.map((q) => {
                    const isSaving = pickSaving === q;
                    return (
                      <Pressable
                        key={q}
                        onPress={() => void handleQuickPick(q)}
                        disabled={isSaving}
                        style={[
                          styles.quickChip,
                          { opacity: isSaving ? 0.5 : 1 },
                        ]}
                      >
                        {isSaving ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.slate}
                          />
                        ) : (
                          <Plus
                            size={11}
                            color={colors.slate}
                            strokeWidth={2}
                          />
                        )}
                        <Text variant="smallMedium" color={colors.slate}>
                          {q}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {available.length === 0 ? (
                    <Text variant="caption" color={colors.dim}>
                      Bu kategorideki hepsi kilerinde ✓
                    </Text>
                  ) : null}
                  {hasMore ? (
                    <Pressable
                      onPress={showMore}
                      style={[
                        styles.quickChip,
                        { borderColor: colors.ink, borderStyle: "dashed" },
                      ]}
                    >
                      <Text
                        variant="smallMedium"
                        weight="600"
                        color={colors.ink}
                      >
                        + {available.length - shown.length} daha
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })()}
          </View>

          {/* AI parse — secondary, for pasted captions */}
          <Pressable
            onPress={handleParse}
            disabled={!text.trim() || loading}
            style={styles.aiLink}
            hitSlop={6}
          >
            <Animated.View style={loading ? spinStyle : undefined}>
              <Sparkles size={13} color={colors.primary} strokeWidth={1.5} />
            </Animated.View>
            <Text
              variant="smallMedium"
              weight="600"
              color={loading || !text.trim() ? colors.dim : colors.primary}
            >
              {loading ? "AI ayrıştırıyor…" : "AI ile akıllı ayrıştır"}
            </Text>
          </Pressable>
        </View>

        {/* Category filter pills */}
        {items.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}
          >
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: isActive ? colors.ink : colors.cream,
                      borderColor: isActive ? colors.ink : colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="smallMedium"
                    weight={isActive ? "600" : "400"}
                    color={isActive ? colors.bg : colors.slate}
                    style={{ fontSize: 12 }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Items */}
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="smallMedium" color={colors.slate} align="center">
              {t.pantry.empty}
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            {filteredGroups.map(([cat, list], i) => (
              <Animated.View
                key={cat}
                entering={FadeInDown.delay(i * 60).duration(400)}
              >
                {activeCategory === "Tümü" ? (
                  <Text
                    variant="overline"
                    color={colors.dim}
                    style={{ marginBottom: spacing.sm }}
                  >
                    {cat}
                  </Text>
                ) : null}
                <View style={styles.chipWrap}>
                  {list.map((item) => (
                    <View key={item.id} style={styles.chip}>
                      <Text variant="smallMedium">{item.name}</Text>
                      <Pressable
                        onPress={() => {
                          void remove(item.id).catch((err) =>
                            Alert.alert(
                              "Hata",
                              err instanceof Error ? err.message : "Silinemedi",
                            ),
                          );
                        }}
                        style={styles.removeBtn}
                        hitSlop={8}
                      >
                        <X size={9} color={colors.slate} strokeWidth={2.5} />
                      </Pressable>
                    </View>
                  ))}
                  {activeCategory === "Tümü" ? (
                    <Pressable
                      onPress={() => inputRef.current?.focus()}
                      style={styles.addChip}
                    >
                      <Plus size={11} color={colors.dim} strokeWidth={2} />
                      <Text variant="caption" color={colors.dim}>
                        Ekle
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        {/* AI CTA */}
        {items.length > 0 ? (
          <Pressable onPress={handleSuggest} style={styles.aiCta}>
            <Text variant="overline" color={colors.primary}>
              AI Önerisi
            </Text>
            <Text
              style={{
                fontFamily: fonts.serif,
                fontSize: 20,
                color: colors.bg,
                letterSpacing: -0.2,
                marginTop: 4,
                marginBottom: 4,
              }}
            >
              Bunlarla ne yapsam?
            </Text>
            <Text
              variant="smallMedium"
              color="rgba(250,247,242,0.6)"
              style={{ marginBottom: spacing.md }}
            >
              Kilerdeki {items.length} malzemeyle yapılabilecek tarifleri bul
            </Text>
            <View style={styles.aiCtaFooter}>
              <Text variant="smallMedium" weight="600" color={colors.primary}>
                Tarif Önerisi Al
              </Text>
              <ChevronRight
                size={14}
                color={colors.primary}
                strokeWidth={2.5}
              />
            </View>
          </Pressable>
        ) : null}

        {/* Independent search — works whether the pantry is empty or not. */}
        <Pressable
          onPress={() => router.push("/cook-with")}
          style={styles.cookWithCta}
        >
          <View style={{ flex: 1 }}>
            <Text variant="overline" color={colors.dim}>
              Bağımsız arama
            </Text>
            <Text variant="bodyMedium" weight="600" style={{ marginTop: 2 }}>
              Bu akşam ne yapsam?
            </Text>
            <Text variant="caption" color={colors.dim} style={{ marginTop: 2 }}>
              Kilerden bağımsız malzemelerle tarif bul
            </Text>
          </View>
          <ChevronRight size={16} color={colors.ink} strokeWidth={2} />
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
      <CoachMark
        storageKey="pantryCoach"
        title="Kilerini ekle, AI önersin"
        description="Evdeki malzemeleri buraya ekle. AI sadece elindekilerden yapılabilecek tarifleri öne çıkarır — alışverişe gitmeden bugün ne yapacağını bul."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["3xl"],
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 4,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    marginBottom: 4,
  },
  inputCard: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textarea: {
    minHeight: 70,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.cream,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.cream,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  quickWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickCatTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiLink: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  aiBtn: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  empty: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    alignItems: "center",
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderStyle: "dashed",
  },
  removeBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  aiCta: {
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: colors.ink,
  },
  aiCtaFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cookWithCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
});
