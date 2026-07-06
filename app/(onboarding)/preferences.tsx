import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { isBar, L, onboardingStepCount } from "@/constants/appVariant";
import { useAuthStore } from "@/store/authStore";
import { SpiceLevel } from "@/types/domain";

const ALLERGIES = isBar
  ? ["Dairy", "Egg", "Gluten", "Peanut", "Tree nuts", "Seafood", "Soy"]
  : [
      "Süt",
      "Yumurta",
      "Gluten",
      "Yer fıstığı",
      "Kabuklu yemiş",
      "Deniz ürünleri",
      "Soya",
    ];
const CUISINES = isBar
  ? [
      "Classic",
      "Tropical",
      "Refreshing",
      "Spirit-forward",
      "Sour",
      "Sparkling",
      "Bitter",
      "Sweet",
    ]
  : [
      "Türk",
      "İtalyan",
      "Akdeniz",
      "Asya",
      "Meksika",
      "Hint",
      "Orta Doğu",
      "Fransız",
    ];
const SPICES: { value: SpiceLevel; label: string; emoji: string }[] = [
  { value: "none", label: t.spice.none, emoji: "😌" },
  { value: "mild", label: t.spice.mild, emoji: "🌶" },
  { value: "medium", label: t.spice.medium, emoji: "🌶🌶" },
  { value: "hot", label: t.spice.hot, emoji: "🔥" },
];

export default function PreferencesScreen() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <Screen background="bg">
      <View style={styles.header}>
        <ProgressDots total={onboardingStepCount} index={0} />
        <Text variant="caption" color={colors.dim}>
          {t.onboarding.step(1, onboardingStepCount)}
        </Text>
      </View>

      <Animated.View entering={FadeInDown.delay(80).duration(500)}>
        <Text variant="h1">{t.onboarding.allergiesTitle}</Text>
        <Text
          variant="body"
          color={colors.slate}
          style={{ marginTop: spacing.sm }}
        >
          {L(
            "Size en uygun önerileri sunabilmemiz için",
            "So we can tailor the best suggestions for you",
          )}
        </Text>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Section label={L("Sevdiğiniz Mutfaklar", "Styles you enjoy")}>
          <ChipGroup
            options={CUISINES}
            selected={profile?.favoriteCuisines ?? []}
            onChange={(favoriteCuisines) => setProfile({ favoriteCuisines })}
          />
        </Section>

        <Section label={L("Acı Seviyesi", "Strength tolerance")}>
          <View style={styles.spiceRow}>
            {SPICES.map((s) => {
              const active = profile?.spiceTolerance === s.value;
              return (
                <Pressable
                  key={s.value}
                  onPress={() => setProfile({ spiceTolerance: s.value })}
                  style={[styles.spiceItem, active && styles.spiceItemActive]}
                >
                  <Text style={styles.spiceEmoji}>{s.emoji}</Text>
                  <Text
                    variant="caption"
                    weight={active ? "600" : "400"}
                    color={active ? colors.ink : colors.dim}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section label={L("Alerjiler / İstemiyorum", "Allergies / Avoid")}>
          <ChipGroup
            options={ALLERGIES}
            selected={profile?.allergies ?? []}
            onChange={(allergies) => setProfile({ allergies })}
            variant="accent"
          />
        </Section>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push("/(onboarding)/household")}
          style={styles.cta}
        >
          <Text variant="bodyMedium" weight="700" color={colors.onPrimary}>
            {t.common.continue}
          </Text>
          <ChevronRight size={18} strokeWidth={2.5} color={colors.onPrimary} />
        </Pressable>
      </View>
    </Screen>
  );
}

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <View style={{ gap: spacing.md }}>
    <Text variant="overline" color={colors.dim}>
      {label}
    </Text>
    {children}
  </View>
);

const ChipGroup: React.FC<{
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  variant?: "primary" | "accent";
}> = ({ options, selected, onChange, variant = "primary" }) => (
  <View style={styles.chipRow}>
    {options.map((o) => {
      const active = selected.includes(o);
      const activeBg =
        variant === "accent" ? colors.accentSoft : colors.primary;
      const activeBorder =
        variant === "accent" ? colors.accent : colors.primary;
      const activeColor =
        variant === "accent" ? colors.accent : colors.onPrimary;
      return (
        <Pressable
          key={o}
          onPress={() =>
            onChange(
              selected.includes(o)
                ? selected.filter((s) => s !== o)
                : [...selected, o],
            )
          }
          style={[
            styles.chip,
            {
              backgroundColor: active ? activeBg : colors.cream,
              borderColor: active ? activeBorder : colors.border,
            },
          ]}
        >
          <Text
            variant="smallMedium"
            weight={active ? "600" : "400"}
            color={active ? activeColor : colors.slate}
          >
            {active && variant === "accent" ? "✕ " : ""}
            {o}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  content: {
    gap: spacing["2xl"],
    paddingTop: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  spiceRow: { flexDirection: "row", gap: spacing.sm },
  spiceItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    gap: 4,
  },
  spiceItemActive: {
    backgroundColor: "#FFF3CD",
    borderColor: colors.primary,
  },
  spiceEmoji: { fontSize: 16, fontFamily: fonts.sans },
  footer: { paddingTop: spacing.md, paddingBottom: spacing.lg },
  cta: {
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
});
