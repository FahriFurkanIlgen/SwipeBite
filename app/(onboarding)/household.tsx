import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Button, Input, Screen, Text } from "@/components/ui";
import { AnimatedHero } from "@/components/ui/AnimatedHero";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { colors, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/features/auth/authService";
import { uuidV4 } from "@/utils/id";

export default function HouseholdScreen() {
  const user = useAuthStore((s) => s.user);
  const existing = useAuthStore((s) => s.household);
  const setHousehold = useAuthStore((s) => s.setHousehold);
  const [name, setName] = React.useState(existing?.name ?? "Bizim Ev");
  const [saving, setSaving] = React.useState(false);

  const handleNext = async () => {
    if (!user) return;
    if (existing) {
      router.push("/(onboarding)/invite");
      return;
    }
    const trimmed = name.trim() || "Bizim Ev";
    setSaving(true);
    try {
      if (authService.isConfigured()) {
        const h = await authService.createHousehold(trimmed, user.id);
        if (h) {
          setHousehold(h);
          router.push("/(onboarding)/invite");
          return;
        }
      }
      // Fallback: local-only household with a real UUID.
      setHousehold({
        id: uuidV4(),
        name: trimmed,
        createdBy: user.id,
        memberIds: [user.id],
        createdAt: new Date().toISOString(),
      });
      router.push("/(onboarding)/invite");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Hane oluşturulamadı.";
      Alert.alert("Hata", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen background="snow">
      <View style={styles.header}>
        <ProgressDots total={4} index={1} />
        <Text variant="caption" color={colors.slate}>
          {t.onboarding.step(2, 4)}
        </Text>
      </View>

      <View style={styles.body}>
        <AnimatedHero emoji="🏠" tagline="EVİNİ TANIT" />
        <Text variant="h1" weight="700">
          {t.onboarding.householdTitle}
        </Text>
        <Text
          variant="body"
          color={colors.slate}
          style={{ marginTop: spacing.sm }}
        >
          {t.onboarding.householdSubtitle}
        </Text>

        <View style={{ marginTop: spacing["2xl"] }}>
          <Input
            placeholder={t.onboarding.householdPlaceholder}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title={saving ? t.common.loading : t.common.continue}
          fullWidth
          onPress={handleNext}
          disabled={saving}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  body: { flex: 1, paddingTop: spacing.xl },
  footer: { paddingVertical: spacing.lg },
});
