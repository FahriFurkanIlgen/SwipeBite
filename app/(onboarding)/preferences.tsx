import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Button, Pill, Screen, Text } from "@/components/ui";
import { AnimatedHero } from "@/components/ui/AnimatedHero";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { colors, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { SpiceLevel } from "@/types/domain";

const ALLERGIES = [
  "Süt",
  "Yumurta",
  "Gluten",
  "Yer fıstığı",
  "Kabuklu yemiş",
  "Deniz ürünleri",
  "Soya",
];
const DISLIKES = [
  "Mantar",
  "Patlıcan",
  "Karnabahar",
  "Brokoli",
  "Ahtapot",
  "Ciğer",
  "Acı",
];
const CUISINES = [
  "Türk",
  "İtalyan",
  "Akdeniz",
  "Asya",
  "Meksika",
  "Hint",
  "Orta Doğu",
];

const SPICES: { value: SpiceLevel; label: string }[] = [
  { value: "none", label: t.spice.none },
  { value: "mild", label: t.spice.mild },
  { value: "medium", label: t.spice.medium },
  { value: "hot", label: t.spice.hot },
];

export default function PreferencesScreen() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <Screen background="snow">
      <View style={styles.header}>
        <ProgressDots total={4} index={0} />
        <Text variant="caption" color={colors.slate}>
          {t.onboarding.step(1, 4)}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedHero emoji="🥕" tagline="DAMAĞINI TANIYALIM" />
        <Section
          title={t.onboarding.allergiesTitle}
          subtitle={t.onboarding.allergiesSubtitle}
        >
          <PillGroup
            options={ALLERGIES}
            selected={profile?.allergies ?? []}
            onChange={(allergies) => setProfile({ allergies })}
          />
        </Section>

        <Section
          title={t.onboarding.dislikesTitle}
          subtitle={t.onboarding.dislikesSubtitle}
        >
          <PillGroup
            options={DISLIKES}
            selected={profile?.hardDislikes ?? []}
            onChange={(hardDislikes) => setProfile({ hardDislikes })}
          />
        </Section>

        <Section
          title={t.onboarding.spiceTitle}
          subtitle={t.onboarding.spiceSubtitle}
        >
          <View style={styles.pillRow}>
            {SPICES.map((s) => (
              <Pill
                key={s.value}
                label={s.label}
                selected={profile?.spiceTolerance === s.value}
                onPress={() => setProfile({ spiceTolerance: s.value })}
              />
            ))}
          </View>
        </Section>

        <Section
          title={t.onboarding.cuisinesTitle}
          subtitle={t.onboarding.cuisinesSubtitle}
        >
          <PillGroup
            options={CUISINES}
            selected={profile?.favoriteCuisines ?? []}
            onChange={(favoriteCuisines) => setProfile({ favoriteCuisines })}
          />
        </Section>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t.common.continue}
          fullWidth
          onPress={() => router.push("/(onboarding)/household")}
        />
      </View>
    </Screen>
  );
}

const Section: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <View style={styles.section}>
    <Text variant="h2" weight="700">
      {title}
    </Text>
    {subtitle ? (
      <Text variant="small" color={colors.slate}>
        {subtitle}
      </Text>
    ) : null}
    <View style={{ marginTop: spacing.md }}>{children}</View>
  </View>
);

const PillGroup: React.FC<{
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}> = ({ options, selected, onChange }) => (
  <View style={styles.pillRow}>
    {options.map((o) => (
      <Pill
        key={o}
        label={o}
        selected={selected.includes(o)}
        onPress={() =>
          onChange(
            selected.includes(o)
              ? selected.filter((s) => s !== o)
              : [...selected, o],
          )
        }
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  content: { paddingBottom: spacing["3xl"], gap: spacing["2xl"] },
  section: { gap: spacing.xs },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  footer: { paddingVertical: spacing.lg },
});
