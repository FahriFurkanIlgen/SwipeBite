import React from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronRight, Search, X } from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { ALL_COCKTAILS } from "@/constants/allCocktails";
import { rankCocktails } from "@/features/bar/cocktailMatcher";
import { resolveCocktailImage } from "@/features/bar/cocktailImage";
import { useBarCabinetStore } from "@/store/barCabinetStore";
import type { CocktailMatch } from "@/types/bar";

type FilterMode = "all" | "close";

const VALID_FILTERS: FilterMode[] = ["all", "close"];

export default function BarBrowseScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const filter: FilterMode = VALID_FILTERS.includes(params.filter as FilterMode)
    ? (params.filter as FilterMode)
    : "all";

  const ingredientIds = useBarCabinetStore((s) => s.ingredientIds);
  const hydrated = useBarCabinetStore((s) => s.hydrated);
  const hydrate = useBarCabinetStore((s) => s.hydrate);

  React.useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const ownedSet = React.useMemo(() => new Set(ingredientIds), [ingredientIds]);

  const ranked = React.useMemo(
    () => rankCocktails(ownedSet, ALL_COCKTAILS),
    [ownedSet],
  );

  const [query, setQuery] = React.useState("");

  const results = React.useMemo(() => {
    let pool = ranked;
    if (filter === "close") {
      pool = pool.filter((m) => !m.cookable && m.missingRequired.length <= 2);
    }
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((m) => {
      const c = m.cocktail;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.altName?.toLowerCase().includes(q) ?? false) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [ranked, query, filter]);

  return (
    <Screen background="bg" padded={false}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.back}
        >
          <ArrowLeft size={22} strokeWidth={2} color={colors.ink} />
        </Pressable>
        <Text variant="h3">
          {filter === "close" ? "Almost there" : "All cocktails"}
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <Search size={18} strokeWidth={2} color={colors.dim} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or tag"
          placeholderTextColor={colors.dim}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <X size={18} strokeWidth={2} color={colors.dim} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={results}
        keyExtractor={(m) => m.cocktail.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        windowSize={8}
        renderItem={({ item }) => <BrowseRow match={item} />}
        ListHeaderComponent={
          <Text variant="caption" color={colors.dim} style={styles.count}>
            {results.length} {results.length === 1 ? "cocktail" : "cocktails"}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body" color={colors.slate}>
              No cocktails match “{query}”.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const BrowseRow: React.FC<{ match: CocktailMatch }> = React.memo(
  ({ match }) => {
    const { cocktail, cookable, missingRequired } = match;
    const imgSrc = resolveCocktailImage(cocktail.imageUrl, cocktail.id);
    return (
      <Pressable
        onPress={() => router.push(`/bar/${cocktail.id}`)}
        style={[styles.row, !cookable && styles.rowMuted]}
      >
        <View style={styles.thumbBox}>
          {imgSrc ? (
            <Image source={imgSrc} style={styles.thumb} resizeMode="cover" />
          ) : (
            <Text
              style={{ fontSize: 28, lineHeight: 34, fontFamily: fonts.sans }}
            >
              {cocktail.emoji}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="smallMedium" weight="600" numberOfLines={1}>
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
          {cookable ? (
            <Text
              variant="caption"
              color={colors.primaryDeep}
              weight="600"
              style={{ marginTop: 4 }}
            >
              Ready to make
            </Text>
          ) : (
            <Text
              variant="caption"
              color={colors.accent}
              weight="600"
              style={{ marginTop: 4 }}
              numberOfLines={1}
            >
              Missing: {missingRequired.map((i) => i.name).join(", ")}
            </Text>
          )}
        </View>
        <ChevronRight size={16} color={colors.hairline} strokeWidth={1.8} />
      </Pressable>
    );
  },
);
BrowseRow.displayName = "BrowseRow";

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    padding: 0,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 140,
    gap: spacing.md,
  },
  count: {
    marginBottom: spacing.xs,
  },
  empty: {
    paddingVertical: spacing["2xl"],
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowMuted: {
    backgroundColor: colors.cream,
  },
  thumbBox: {
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
  thumb: {
    width: "100%",
    height: "100%",
  },
});
