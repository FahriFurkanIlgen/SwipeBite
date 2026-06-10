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
import { Camera, ChevronRight, Plus, Sparkles, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
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
import { parsePantryText, parsePantryImage } from "@/features/ai/pantryParser";
import { track } from "@/features/analytics/analyticsService";
import { useEntitlementsStore } from "@/store/entitlementsStore";
import { useUpsellStore } from "@/store/upsellStore";
import {
  PANTRY_CATEGORY_INDEX,
  PANTRY_DROPPED_NAMES,
  PANTRY_QUICK_CATALOG,
} from "@/constants/pantryCatalog";
import { uid } from "@/utils/id";
import type { PantryItem } from "@/types/domain";

const QUICK_PAGE_SIZE = 12;

/** Flat lookup of every catalog item (name + its category) so the input can
 *  search across ALL categories at once instead of forcing the user to pick a
 *  category tab first. Built once at module load. */
const FLAT_CATALOG: { name: string; category: string }[] =
  PANTRY_QUICK_CATALOG.flatMap((c) =>
    c.items.map((name) => ({ name, category: c.category })),
  );

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

  const inputRef = React.useRef<TextInput>(null);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
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

  // Quick-catalog suggestions for the active tab, minus what's already in the
  // pantry. Memoized so toggling unrelated state doesn't re-filter the whole
  // catalog (~50 items) on every render.
  const quickAvailable = React.useMemo(() => {
    const allItems =
      QUICK_CATALOG.find((c) => c.category === quickCat)?.items ?? [];
    return allItems.filter((q) => !existingNames.has(q));
  }, [quickCat, existingNames]);

  // Live type-ahead over the whole catalog. As the user types, surface up to 8
  // matching catalog items (across every category) so they can tap to add the
  // canonical name instead of free-typing. Skips bulk mode (comma lists).
  const searchMatches = React.useMemo(() => {
    const q = text.trim().toLocaleLowerCase("tr-TR");
    if (q.length < 1 || /[,\n;]/.test(q)) return [];
    const starts: typeof FLAT_CATALOG = [];
    const contains: typeof FLAT_CATALOG = [];
    for (const entry of FLAT_CATALOG) {
      if (existingNames.has(entry.name)) continue;
      if (entry.name.startsWith(q)) starts.push(entry);
      else if (entry.name.includes(q)) contains.push(entry);
    }
    return [...starts, ...contains].slice(0, 8);
  }, [text, existingNames]);

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

  // Tapping a type-ahead suggestion adds the canonical item and clears the box.
  const handleSearchPick = async (name: string) => {
    if (!household) return;
    const newItems = buildItems([name]);
    if (newItems.length === 0) return;
    setText("");
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
    const ok = await useEntitlementsStore.getState().consume("ai_pantry_parse");
    if (!ok) {
      useUpsellStore.getState().show("ai_pantry_parse");
      return;
    }
    setLoading(true);
    try {
      const parsed = await parsePantryText(text, household.id);
      if (parsed.length === 0) {
        Alert.alert("Hmm", "Hiç malzeme bulamadım. Tekrar dener misin?");
        return;
      }
      try {
        await addMany(parsed);
        track("ai_pantry_parse_added", { count: parsed.length });
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

  // Receipt / pantry-shelf OCR. Opens the camera (with gallery fallback),
  // sends the photo to the vision model, and bulk-adds the detected items.
  const handleScanReceipt = async () => {
    if (!household || scanning) return;
    // Meter usage. When the monthly free quota is exhausted (Faz 1) we pop the
    // "Pro yakında" upsell sheet instead of running the (paid) vision call.
    const ok = await useEntitlementsStore.getState().consume("receipt_scan");
    if (!ok) {
      useUpsellStore.getState().show("receipt_scan");
      return;
    }
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      const useCamera = perm.granted;
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            base64: true,
            quality: 0.5,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            base64: true,
            quality: 0.5,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.base64) return;

      setScanning(true);
      const mime = asset.mimeType ?? "image/jpeg";
      const parsed = await parsePantryImage(asset.base64, household.id, mime);
      // Drop anything already in the pantry so we don't create duplicates.
      const fresh = parsed.filter((p) => !existingNames.has(p.name));
      if (fresh.length === 0) {
        Alert.alert("Hmm", t.pantry.scanEmpty);
        return;
      }
      await addMany(fresh);
      track("receipt_scan_added", { count: fresh.length });
      Alert.alert("Eklendi", t.pantry.addedCount(fresh.length));
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Okunamadı");
    } finally {
      setScanning(false);
    }
  };

  const handleSuggest = () => {
    // The ingredient-search screen ranks recipes far better than a blind swipe
    // session. When the pantry has items, pre-select them and auto-run; when
    // empty, open it plain so the user can pick ingredients freely.
    router.push(items.length > 0 ? "/cook-with?pantry=1" : "/cook-with");
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

          {/* Live type-ahead: matches across the whole catalog as you type */}
          {searchMatches.length > 0 ? (
            <View style={[styles.quickWrap, { marginTop: spacing.md }]}>
              {searchMatches.map((m) => {
                const isSaving = pickSaving === m.name;
                return (
                  <Pressable
                    key={m.name}
                    onPress={() => void handleSearchPick(m.name)}
                    disabled={isSaving}
                    style={[styles.quickChip, { opacity: isSaving ? 0.5 : 1 }]}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color={colors.slate} />
                    ) : (
                      <Plus size={11} color={colors.primary} strokeWidth={2} />
                    )}
                    <Text variant="smallMedium" color={colors.ink}>
                      {m.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

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
              const available = quickAvailable;
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

          {/* Receipt OCR — bulk-add from a shopping receipt / shelf photo */}
          <Pressable
            onPress={() => void handleScanReceipt()}
            disabled={scanning}
            style={styles.scanBtn}
            hitSlop={6}
          >
            {scanning ? (
              <ActivityIndicator size="small" color={colors.slate} />
            ) : (
              <Camera size={15} color={colors.ink} strokeWidth={2} />
            )}
            <Text
              variant="smallMedium"
              weight="600"
              color={scanning ? colors.dim : colors.ink}
            >
              {scanning ? t.pantry.scanReading : t.pantry.scanCta}
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

        {/* AI CTA — opens the ingredient search. With pantry items it auto-runs
            against the kitchen; empty, it opens for free ingredient picking. */}
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
            Bu akşam ne yapsam?
          </Text>
          <Text
            variant="smallMedium"
            color="rgba(250,247,242,0.6)"
            style={{ marginBottom: spacing.md }}
          >
            {items.length > 0
              ? `Kilerdeki ${items.length} malzemeyle yapılabilecek tarifleri bul`
              : "Elindeki malzemeleri seç, yapabileceğin tarifleri bul"}
          </Text>
          <View style={styles.aiCtaFooter}>
            <Text variant="smallMedium" weight="600" color={colors.primary}>
              Tarif Önerisi Al
            </Text>
            <ChevronRight size={14} color={colors.primary} strokeWidth={2.5} />
          </View>
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
  scanBtn: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
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
});
