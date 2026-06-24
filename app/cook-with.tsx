import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ChefHat, Search, Sparkles, X } from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { useRecipesStore } from "@/store/recipesStore";
import { usePantryStore } from "@/store/pantryStore";
import {
  searchByIngredients,
  type SearchMode,
} from "@/features/recipes/ingredientSearch";

// Compact catalogue — covers the common Turkish kitchen. We don't need every
// possible ingredient here; users can also type freely into the search box
// and the search fuzzy-matches against the full recipe corpus.
const CATALOG: { category: string; items: string[] }[] = [
  {
    category: "Sebze",
    items: [
      "domates",
      "soğan",
      "sarımsak",
      "biber",
      "patates",
      "salatalık",
      "havuç",
      "kabak",
      "patlıcan",
      "ıspanak",
      "brokoli",
      "mantar",
    ],
  },
  {
    category: "Protein",
    items: [
      "tavuk",
      "kıyma",
      "balık",
      "yumurta",
      "kuru fasulye",
      "mercimek",
      "nohut",
      "sucuk",
      "ton balığı",
      "somon",
    ],
  },
  {
    category: "Süt",
    items: ["süt", "yoğurt", "peynir", "tereyağı", "krema", "labne", "kaşar"],
  },
  {
    category: "Tahıl",
    items: ["makarna", "pirinç", "bulgur", "ekmek", "un", "yulaf", "yufka"],
  },
  {
    category: "Baharat",
    items: ["tuz", "karabiber", "pul biber", "kekik", "kimyon", "nane"],
  },
  {
    category: "Yağ & Sos",
    items: ["zeytinyağı", "salça", "sirke", "soya sosu", "nar ekşisi", "tahin"],
  },
];

const MODE_LABELS: Record<SearchMode, string> = {
  best: "En çok eşleşen",
  all: "Tam eşleşme",
  fewMissing: "Eksiği az",
};

export default function CookWithScreen() {
  const params = useLocalSearchParams<{ pantry?: string }>();
  const startWithPantry = params.pantry === "1";
  const recipes = useRecipesStore((s) => s.items);
  const pantry = usePantryStore((s) => s.items);

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [query, setQuery] = React.useState("");
  const [mode, setMode] = React.useState<SearchMode>("best");
  const [usePantry, setUsePantry] = React.useState(startWithPantry);
  // Snapshot of the selection that was "submitted" via the suggest button.
  // Results only render for this snapshot — changes to `selected` invalidate
  // it so the user explicitly re-runs the search.
  const [committed, setCommitted] = React.useState<string[] | null>(null);
  const [searching, setSearching] = React.useState(false);

  const toggle = React.useCallback((name: string) => {
    const key = name.toLocaleLowerCase("tr-TR").trim();
    if (!key) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    // Any selection change invalidates the previously committed results.
    setCommitted(null);
  }, []);

  const addFromQuery = React.useCallback(() => {
    const v = query.trim();
    if (!v) return;
    for (const part of v.split(/[,\n;]+/)) {
      const p = part.trim();
      if (p) toggle(p);
    }
    setQuery("");
  }, [query, toggle]);

  // When "use pantry" is on, seed the selection with pantry names.
  React.useEffect(() => {
    if (!usePantry) return;
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of pantry) next.add(p.name.toLocaleLowerCase("tr-TR"));
      return next;
    });
  }, [usePantry, pantry]);

  const selectedArr = React.useMemo(() => Array.from(selected), [selected]);

  const results = React.useMemo(() => {
    if (!committed || committed.length === 0) return [];
    return searchByIngredients(committed, recipes, { mode, limit: 30 });
  }, [committed, recipes, mode]);

  const handleSuggest = React.useCallback(() => {
    if (selectedArr.length === 0) return;
    setSearching(true);
    // Defer to the next frame so the spinner actually paints before the
    // (synchronous but heavy) search runs.
    setTimeout(() => {
      setCommitted(selectedArr);
      setSearching(false);
    }, 16);
  }, [selectedArr]);

  // When opened from the pantry "AI Önerisi" CTA (pantry=1), run the search
  // automatically once the pantry items have seeded the selection.
  const autoRan = React.useRef(false);
  React.useEffect(() => {
    if (!startWithPantry || autoRan.current) return;
    if (selectedArr.length === 0) return;
    autoRan.current = true;
    setCommitted(selectedArr);
  }, [startWithPantry, selectedArr]);

  return (
    <Screen background="bg" padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.closeBtn}
        >
          <X size={20} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="overline" color={colors.dim}>
            Bu akşam ne yapsam?
          </Text>
          <Text variant="h2" weight="700">
            Malzemelerden bul
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing["4xl"] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search input */}
        <View style={styles.searchRow}>
          <Search size={16} color={colors.dim} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={addFromQuery}
            placeholder="Ürün yaz: domates, kıyma..."
            placeholderTextColor={colors.dim}
            style={styles.searchInput}
            returnKeyType="done"
          />
          {query.trim() ? (
            <Pressable onPress={addFromQuery} style={styles.addBtn}>
              <Text variant="smallMedium" weight="600" color={colors.bg}>
                Ekle
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Pantry toggle */}
        <Pressable
          onPress={() => {
            setUsePantry((v) => !v);
            setCommitted(null);
          }}
          style={[
            styles.pantryToggle,
            {
              backgroundColor: usePantry ? colors.ink : "transparent",
              borderColor: usePantry ? colors.ink : colors.border,
            },
          ]}
        >
          <Text
            variant="smallMedium"
            weight="600"
            color={usePantry ? colors.bg : colors.slate}
          >
            {usePantry ? "✓ Kilerim dahil" : "+ Kilerimi de ekle"}
          </Text>
        </Pressable>

        {/* Selected chips */}
        {selectedArr.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="overline" color={colors.dim}>
                Seçili ({selectedArr.length})
              </Text>
              <Pressable onPress={() => setSelected(new Set())} hitSlop={6}>
                <Text variant="caption" color={colors.dim}>
                  Temizle
                </Text>
              </Pressable>
            </View>
            <View style={styles.chipWrap}>
              {selectedArr.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => toggle(s)}
                  style={[styles.chip, styles.chipActive]}
                >
                  <Text
                    variant="smallMedium"
                    weight="600"
                    color={colors.bg}
                    style={{ marginRight: 4 }}
                  >
                    {s}
                  </Text>
                  <X size={11} color={colors.bg} strokeWidth={2.5} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Results — moved above the catalog so changes are visible while
            the user picks more chips. */}
        {selectedArr.length === 0 ? (
          <View style={styles.empty}>
            <ChefHat size={32} color={colors.dim} strokeWidth={1.5} />
            <Text
              variant="bodyMedium"
              color={colors.dim}
              style={{ marginTop: 8, textAlign: "center" }}
            >
              Birkaç malzeme seç,{"\n"}sana uygun tarifleri bulayım.
            </Text>
          </View>
        ) : !committed ? (
          <View style={styles.section}>
            <Pressable
              onPress={handleSuggest}
              disabled={searching}
              style={[styles.suggestBtn, { opacity: searching ? 0.7 : 1 }]}
            >
              {searching ? (
                <ActivityIndicator size="small" color={colors.bg} />
              ) : (
                <Sparkles size={16} color={colors.bg} strokeWidth={2} />
              )}
              <Text variant="bodyMedium" weight="700" color={colors.bg}>
                {searching ? "Aranıyor…" : "Tarifleri öner"}
              </Text>
            </Pressable>
            <Text
              variant="caption"
              color={colors.dim}
              align="center"
              style={{ marginTop: 8 }}
            >
              {selectedArr.length} malzeme seçildi
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="overline" color={colors.dim}>
                {results.length} tarif bulundu
              </Text>
            </View>

            {/* Mode pills */}
            <View style={[styles.chipWrap, { marginBottom: spacing.md }]}>
              {(["best", "all", "fewMissing"] as SearchMode[]).map((m) => {
                const isActive = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={[
                      styles.chip,
                      {
                        borderColor: isActive ? colors.primary : colors.border,
                        backgroundColor: isActive
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    <Text
                      variant="smallMedium"
                      weight={isActive ? "600" : "400"}
                      color={isActive ? colors.onPrimary : colors.slate}
                    >
                      {MODE_LABELS[m]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {results.length === 0 ? (
              <Text variant="caption" color={colors.dim}>
                Bu seçimle eşleşen tarif yok. Farklı bir mod dene.
              </Text>
            ) : (
              results.map((r) => (
                <Pressable
                  key={r.recipe.id}
                  onPress={() =>
                    router.push({
                      pathname: "/recipe/[id]",
                      params: { id: r.recipe.id },
                    })
                  }
                  style={styles.resultCard}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" weight="600" numberOfLines={1}>
                      {r.recipe.title}
                    </Text>
                    <Text
                      variant="caption"
                      color={colors.dim}
                      style={{ marginTop: 2 }}
                    >
                      {r.matchedCount}/{r.selectedCount} malzemen var ·{" "}
                      {r.recipe.prepTimeMinutes} dk · {r.recipe.difficulty}
                    </Text>
                    {r.missing.length > 0 ? (
                      <Text
                        variant="caption"
                        color={colors.slate}
                        numberOfLines={2}
                        style={{ marginTop: 4 }}
                      >
                        Eksik: {r.missing.slice(0, 4).join(", ")}
                        {r.missing.length > 4 ? "…" : ""}
                      </Text>
                    ) : (
                      <Text
                        variant="caption"
                        color={colors.primary}
                        style={{ marginTop: 4 }}
                      >
                        ✓ Tüm malzemeler hazır
                      </Text>
                    )}
                  </View>
                  <View style={styles.scoreBadge}>
                    <Text
                      variant="smallMedium"
                      weight="700"
                      color={colors.onPrimary}
                    >
                      {Math.round((r.matchedCount / r.selectedCount) * 100)}%
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Catalog */}
        <View style={styles.section}>
          <Text
            variant="overline"
            color={colors.dim}
            style={{ marginBottom: 8 }}
          >
            Hızlı seç
          </Text>
          {CATALOG.map((cat) => (
            <View key={cat.category} style={{ marginBottom: spacing.md }}>
              <Text
                variant="smallMedium"
                weight="600"
                style={{ marginBottom: 6 }}
              >
                {cat.category}
              </Text>
              <View style={styles.chipWrap}>
                {cat.items.map((it) => {
                  const isActive = selected.has(it.toLocaleLowerCase("tr-TR"));
                  return (
                    <Pressable
                      key={it}
                      onPress={() => toggle(it)}
                      style={[styles.chip, isActive && styles.chipActive]}
                    >
                      <Text
                        variant="smallMedium"
                        weight={isActive ? "600" : "400"}
                        color={isActive ? colors.bg : colors.slate}
                      >
                        {it}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: spacing["2xl"],
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
  addBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  pantryToggle: {
    alignSelf: "flex-start",
    marginHorizontal: spacing["2xl"],
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  section: {
    paddingHorizontal: spacing["2xl"],
    marginTop: spacing["2xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  empty: {
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing["4xl"],
    alignItems: "center",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    marginBottom: 8,
  },
  scoreBadge: {
    minWidth: 48,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  suggestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.ink,
  },
});
