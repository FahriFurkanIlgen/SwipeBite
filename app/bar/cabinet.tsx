import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router, Stack } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Camera, Check, RotateCcw } from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import {
  BAR_CATEGORY_LABEL,
  BAR_CATEGORY_ORDER,
  BAR_INGREDIENTS,
} from "@/constants/barCatalog";
import { useBarCabinetStore } from "@/store/barCabinetStore";
import { ALL_COCKTAILS } from "@/constants/allCocktails";
import { rankCocktails } from "@/features/bar/cocktailMatcher";
import {
  cocktailsForCabinet,
  scanBarCabinetImage,
} from "@/features/ai/barCabinetVision";
import { useEntitlementsStore } from "@/store/entitlementsStore";
import { useUpsellStore } from "@/store/upsellStore";
import { track } from "@/features/analytics/analyticsService";
import type { BarIngredient, BarIngredientCategory } from "@/types/bar";

const INGREDIENTS_BY_CATEGORY: Record<BarIngredientCategory, BarIngredient[]> =
  BAR_INGREDIENTS.reduce(
    (acc, ing) => {
      const list = acc[ing.category] ?? [];
      list.push(ing);
      acc[ing.category] = list;
      return acc;
    },
    {} as Record<BarIngredientCategory, BarIngredient[]>,
  );

export default function BarCabinetScreen() {
  const ingredientIds = useBarCabinetStore((s) => s.ingredientIds);
  const hydrated = useBarCabinetStore((s) => s.hydrated);
  const hydrate = useBarCabinetStore((s) => s.hydrate);
  const toggle = useBarCabinetStore((s) => s.toggle);
  const clear = useBarCabinetStore((s) => s.clear);
  const addMany = useBarCabinetStore((s) => s.addMany);

  const [scanning, setScanning] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const ownedSet = React.useMemo(() => new Set(ingredientIds), [ingredientIds]);
  const cookableCount = React.useMemo(
    () =>
      rankCocktails(ownedSet, ALL_COCKTAILS).filter((m) => m.cookable).length,
    [ownedSet],
  );

  // AI scan: photograph the bar, map bottles to catalogue ids, bulk-add them
  // and surface the cocktails that just became makeable. Pro-gated.
  const handleScan = async () => {
    if (scanning) return;
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      const result = perm.granted
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

      // Meter usage only once we have a real photo to process. When the free
      // quota is spent we route to the paywall instead of running the scan.
      const ok = await useEntitlementsStore
        .getState()
        .consume("bar_cabinet_scan");
      if (!ok) {
        useUpsellStore.getState().show("bar_cabinet_scan");
        return;
      }

      setScanning(true);
      const scan = await scanBarCabinetImage(
        asset.base64,
        asset.mimeType ?? "image/jpeg",
      );
      if (scan.ingredientIds.length === 0) {
        Alert.alert(
          "Nothing found",
          "I couldn't recognise any bottles. Try a clearer, well-lit photo of the labels.",
        );
        return;
      }
      const added = await addMany(scan.ingredientIds);
      const cocktails = cocktailsForCabinet(
        useBarCabinetStore.getState().ingredientIds,
      );
      track("bar_cabinet_scan_added", {
        detected: scan.ingredientIds.length,
        added: added.length,
      });

      const detectedNames = scan.ingredients
        .slice(0, 6)
        .map((i) => i.name)
        .join(", ");
      const cocktailPreview = cocktails
        .slice(0, 3)
        .map((c) => c.name)
        .join(", ");
      const body =
        `Found: ${detectedNames}${scan.ingredients.length > 6 ? "…" : ""}.\n\n` +
        (cocktails.length > 0
          ? `You can now make ${cocktails.length} cocktail${
              cocktails.length === 1 ? "" : "s"
            }${cocktailPreview ? ` — e.g. ${cocktailPreview}.` : "."}`
          : "Add a couple more bottles to unlock your first cocktails.");
      Alert.alert(
        added.length > 0
          ? `Added ${added.length} ingredient${added.length === 1 ? "" : "s"}`
          : "Already in your cabinet",
        body,
        cocktails.length > 0
          ? [
              {
                text: "See cocktails",
                onPress: () => router.push("/bar/browse"),
              },
              { text: "Done", style: "cancel" },
            ]
          : [{ text: "OK" }],
      );
    } catch (err) {
      Alert.alert(
        "Scan failed",
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setScanning(false);
    }
  };

  return (
    <Screen background="bg" padded={false}>
      <Stack.Screen options={{ title: "Bar Cabinet" }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={10}
        >
          <ArrowLeft size={18} strokeWidth={2} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="h2">Your Bar Cabinet</Text>
          <Text variant="caption" color={colors.dim}>
            Pick the spirits and mixers you have at home
          </Text>
        </View>
        {ingredientIds.length > 0 ? (
          <Pressable
            onPress={() => void clear()}
            style={styles.clearBtn}
            hitSlop={10}
          >
            <RotateCcw size={14} strokeWidth={2} color={colors.slate} />
            <Text variant="caption" color={colors.slate}>
              Reset
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{ingredientIds.length}</Text>
          <Text variant="caption" color={colors.dim}>
            selected ingredients
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: colors.primaryDeep }]}>
            {cookableCount}
          </Text>
          <Text variant="caption" color={colors.dim}>
            cocktails you can make
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => void handleScan()}
        disabled={scanning}
        style={({ pressed }) => [
          styles.scanBtn,
          pressed && { opacity: 0.9 },
          scanning && { opacity: 0.7 },
        ]}
      >
        {scanning ? (
          <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : (
          <Camera size={18} strokeWidth={2} color={colors.onPrimary} />
        )}
        <Text variant="bodyMedium" weight="700" color={colors.onPrimary}>
          {scanning ? "Reading your bar…" : "Scan my bar with camera"}
        </Text>
      </Pressable>
      <Text variant="caption" color={colors.dim} style={styles.scanHint}>
        Snap your bottles and AI adds them, then shows what you can mix.
      </Text>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {BAR_CATEGORY_ORDER.map((cat, idx) => {
          const items = INGREDIENTS_BY_CATEGORY[cat] ?? [];
          if (items.length === 0) return null;
          return (
            <Animated.View
              key={cat}
              entering={FadeInDown.delay(40 * idx).duration(360)}
              style={{ gap: spacing.sm }}
            >
              <Text variant="overline" color={colors.dim}>
                {BAR_CATEGORY_LABEL[cat]}
              </Text>
              <View style={styles.chipRow}>
                {items.map((ing) => {
                  const active = ownedSet.has(ing.id);
                  return (
                    <Pressable
                      key={ing.id}
                      onPress={() => void toggle(ing.id)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={styles.chipEmoji}>{ing.emoji}</Text>
                      <Text
                        variant="smallMedium"
                        weight={active ? "600" : "500"}
                        color={active ? colors.ink : colors.slate}
                      >
                        {ing.name}
                      </Text>
                      {active ? (
                        <View style={styles.checkBadge}>
                          <Check size={10} strokeWidth={3} color={colors.ink} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          );
        })}
        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={() => router.back()} style={styles.cta}>
          <Text variant="bodyMedium" weight="700" color={colors.ink}>
            Tamam
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.cream,
  },
  summary: {
    flexDirection: "row",
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryDivider: { width: 1, backgroundColor: colors.border },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    marginHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  scanHint: {
    marginHorizontal: spacing.xl,
    marginTop: 8,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  summaryNum: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 36,
    includeFontPadding: false,
    textAlign: "center",
    color: colors.ink,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["2xl"],
    gap: spacing["2xl"],
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipEmoji: { fontSize: 16, fontFamily: fonts.sans },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cta: {
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
