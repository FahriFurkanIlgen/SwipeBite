import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Check,
  Clock,
  Link as LinkIcon,
  Sparkles,
  Users,
} from "lucide-react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import {
  importRecipePreview,
  RecipeImportError,
  type ImportedRecipePreview,
} from "@/features/recipes/importRecipe";
import { recipeService } from "@/features/recipes/recipeService";
import { useRecipesStore } from "@/store/recipesStore";

const SOURCES = ["Instagram", "YouTube", "Yemek.com", "NefisYemekler", "Web"];

type PreviewRecipe = ImportedRecipePreview;

export default function ImportScreen() {
  const params = useLocalSearchParams<{ text?: string }>();
  const initialText = (params.text ?? "").toString();
  const initialIsUrl = /^https?:\/\//i.test(initialText.trim());
  const [link, setLink] = React.useState(initialIsUrl ? initialText : "");
  const [caption, setCaption] = React.useState(initialIsUrl ? "" : initialText);
  const [stage, setStage] = React.useState<"input" | "parsing" | "preview">(
    "input",
  );
  const [preview, setPreview] = React.useState<PreviewRecipe | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const spin = useSharedValue(0);
  React.useEffect(() => {
    if (stage === "parsing") {
      spin.value = 0;
      spin.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
      );
    } else {
      cancelAnimation(spin);
    }
  }, [stage, spin]);
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const canSubmit = link.trim().length > 0 || caption.trim().length > 0;

  const handleImport = async () => {
    if (!canSubmit) return;
    setErrorMsg(null);
    setStage("parsing");
    try {
      const result = await importRecipePreview(link, caption);
      setPreview(result);
      setStage("preview");
    } catch (e) {
      const msg =
        e instanceof RecipeImportError
          ? e.message
          : "Tarif alınamadı. Bağlantı ya da metni kontrol et.";
      setErrorMsg(msg);
      setStage("input");
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaved(true);
    const difficulty =
      preview.difficulty === "Orta"
        ? "orta"
        : preview.difficulty === "Zor"
          ? "zor"
          : "kolay";
    const ingredients = preview.ingredients.map((line) => ({ name: line }));
    try {
      if (recipeService.isLive()) {
        const saved = await recipeService.create({
          title: preview.title,
          description: "",
          imageUrl: preview.imageUrl,
          prepTimeMinutes: preview.prepTimeMinutes,
          difficulty,
          servings: preview.servings,
          ingredients,
          steps: preview.steps ?? [],
          tags: preview.tags ?? [],
          cuisine: preview.cuisine ?? "",
          sourceUrl: preview.sourceUrl,
          videoUrl: preview.videoUrl,
        });
        if (saved) await useRecipesStore.getState().hydrate();
      } else {
        // Mock / offline mode: keep the import available in the swipe deck.
        const id = `imp-${Date.now().toString(36)}`;
        useRecipesStore.getState().addLocal({
          id,
          title: preview.title,
          description: "",
          imageUrl: preview.imageUrl,
          prepTimeMinutes: preview.prepTimeMinutes,
          difficulty,
          servings: preview.servings,
          ingredients,
          steps: preview.steps ?? [],
          tags: preview.tags ?? [],
          cuisine: preview.cuisine ?? "",
          ...(preview.sourceUrl ? { sourceUrl: preview.sourceUrl } : {}),
          ...(preview.videoUrl ? { videoUrl: preview.videoUrl } : {}),
        });
      }
    } catch {
      // ignore — still close.
    }
    setTimeout(() => router.back(), 700);
  };

  const handleRetry = () => {
    setPreview(null);
    setSaved(false);
    setStage("input");
  };

  return (
    <Screen background="bg" padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={16} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <View>
          <Text
            style={{
              fontFamily: fonts.serif,
              fontSize: 22,
              color: colors.ink,
              letterSpacing: -0.4,
            }}
          >
            Tarif İçe Aktar
          </Text>
          <Text variant="caption" color={colors.dim}>
            Instagram, web sitesi veya metin
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {stage === "input" ? (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={{ gap: spacing.lg }}
          >
            <View style={styles.card}>
              <Text
                variant="overline"
                color={colors.dim}
                style={{ marginBottom: 10 }}
              >
                Bağlantı veya Metin
              </Text>
              <View style={styles.urlRow}>
                <LinkIcon size={14} color={colors.dim} strokeWidth={1.5} />
                <TextInput
                  placeholder="https://instagram.com/p/…"
                  placeholderTextColor={colors.dim}
                  value={link}
                  onChangeText={setLink}
                  autoCapitalize="none"
                  keyboardType="url"
                  style={styles.urlInput}
                />
              </View>
              <Text
                variant="caption"
                color={colors.hairline}
                align="center"
                style={{ marginVertical: 10 }}
              >
                VEYA
              </Text>
              <TextInput
                placeholder="Tarif metnini buraya yapıştır — Instagram altyazısı, blog yazısı, herhangi bir şey…"
                placeholderTextColor={colors.dim}
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={4}
                style={styles.textarea}
                textAlignVertical="top"
              />
            </View>

            <View>
              <Text
                variant="overline"
                color={colors.dim}
                style={{ marginBottom: 8 }}
              >
                Desteklenen Kaynaklar
              </Text>
              <View style={styles.chipWrap}>
                {SOURCES.map((s) => (
                  <View key={s} style={styles.sourceChip}>
                    <Text variant="smallMedium" color={colors.slate}>
                      {s}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <Pressable
              onPress={handleImport}
              disabled={!canSubmit}
              style={[styles.cta, { opacity: !canSubmit ? 0.4 : 1 }]}
            >
              <Sparkles size={16} color={colors.onPrimary} strokeWidth={1.5} />
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontWeight: "700",
                  fontSize: 15,
                  color: colors.onPrimary,
                }}
              >
                AI ile Ayrıştır
              </Text>
            </Pressable>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text variant="smallMedium" color="#B91C1C">
                  {errorMsg}
                </Text>
              </View>
            ) : null}
          </Animated.View>
        ) : stage === "parsing" ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.parsing}>
            <Animated.View style={[styles.spinner, spinStyle]} />
            <Text
              style={{
                fontFamily: fonts.serif,
                fontSize: 22,
                color: colors.ink,
              }}
            >
              AI Ayrıştırıyor
            </Text>
            <Text variant="smallMedium" color={colors.dim} align="center">
              Malzemeler, adımlar ve meta bilgiler{"\n"}çıkarılıyor…
            </Text>
          </Animated.View>
        ) : preview ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{ gap: spacing.lg }}
          >
            {/* Preview card */}
            <View style={styles.previewCard}>
              <View style={styles.previewHero}>
                <Image
                  source={{ uri: preview.imageUrl }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["transparent", "rgba(26,23,20,0.75)"]}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.previewBadge}>
                  <Text variant="caption" weight="700" color={colors.ink}>
                    {preview.source}
                  </Text>
                </View>
                <View style={styles.previewTitleWrap}>
                  <Text
                    style={{
                      fontFamily: fonts.serif,
                      fontSize: 22,
                      color: colors.bg,
                      letterSpacing: -0.4,
                    }}
                  >
                    {preview.title}
                  </Text>
                </View>
              </View>

              <View style={styles.previewBody}>
                <View style={styles.previewMeta}>
                  <View style={styles.metaItem}>
                    <Clock size={12} color={colors.dim} strokeWidth={1.5} />
                    <Text variant="caption" color={colors.slate}>
                      {preview.prepTimeMinutes} dk
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Users size={12} color={colors.dim} strokeWidth={1.5} />
                    <Text variant="caption" color={colors.slate}>
                      {preview.servings} kişi
                    </Text>
                  </View>
                  <View style={styles.difficultyPill}>
                    <Text variant="caption" weight="700" color={colors.slate}>
                      {preview.difficulty}
                    </Text>
                  </View>
                </View>

                <Text
                  variant="overline"
                  color={colors.dim}
                  style={{ marginBottom: 8 }}
                >
                  Malzemeler ({preview.ingredients.length})
                </Text>
                <View style={styles.ingChips}>
                  {preview.ingredients.map((ing) => (
                    <View key={ing} style={styles.ingChip}>
                      <Text variant="caption" color={colors.slate}>
                        {ing}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Footer actions */}
            <View style={styles.previewFooter}>
              <Pressable onPress={handleRetry} style={styles.retryBtn}>
                <Text variant="smallMedium" weight="600" color={colors.ink}>
                  Yeniden Dene
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={saved}
                style={[
                  styles.saveBtn,
                  { backgroundColor: saved ? colors.forest : colors.primary },
                ]}
              >
                {saved ? (
                  <>
                    <Check size={16} color={colors.bg} strokeWidth={2.5} />
                    <Text variant="smallMedium" weight="700" color={colors.bg}>
                      Eklendi
                    </Text>
                  </>
                ) : (
                  <Text variant="smallMedium" weight="700" color={colors.ink}>
                    Tariflere Ekle
                  </Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
  },
  urlInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ink,
    padding: 0,
  },
  textarea: {
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ink,
    minHeight: 96,
    lineHeight: 20,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sourceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
  },
  cta: {
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 14,
  },
  parsing: {
    alignItems: "center",
    paddingVertical: 80,
    gap: spacing.lg,
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.border,
    borderTopColor: colors.primary,
  },
  previewCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewHero: { height: 160, position: "relative" },
  previewBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(240,180,41,0.9)",
  },
  previewTitleWrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
  },
  previewBody: { padding: spacing.lg },
  previewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  difficultyPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
  },
  ingChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  ingChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
  },
  previewFooter: { flexDirection: "row", gap: spacing.md },
  retryBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    flex: 2,
    height: 52,
    borderRadius: radii.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
});
