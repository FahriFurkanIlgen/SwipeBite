import React from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/features/auth/authService";
import { uuidV4 } from "@/utils/id";

export default function HouseholdScreen() {
  const user = useAuthStore((s) => s.user);
  const existing = useAuthStore((s) => s.household);
  const setHousehold = useAuthStore((s) => s.setHousehold);
  const [name, setName] = React.useState(existing?.name ?? "");
  const [saving, setSaving] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

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
    <Screen background="bg">
      <View style={styles.header}>
        <ProgressDots total={4} index={1} />
        <Text variant="caption" color={colors.dim}>
          {t.onboarding.step(2, 4)}
        </Text>
      </View>

      <Animated.View entering={FadeInDown.delay(80).duration(500)}>
        <Text variant="h1">{t.onboarding.householdTitle}</Text>
        <Text
          variant="body"
          color={colors.slate}
          style={{ marginTop: spacing.sm }}
        >
          Ev halkınıza bir isim verin. Bu isim paylaşım bağlantılarında ve
          bildirimlerinde görünecek.
        </Text>
      </Animated.View>

      <View style={{ flex: 1, gap: spacing.lg, paddingTop: spacing["2xl"] }}>
        <TextInput
          placeholder={t.onboarding.householdPlaceholder}
          placeholderTextColor={colors.dim}
          value={name}
          onChangeText={setName}
          autoFocus
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, focused && { borderColor: colors.primary }]}
        />
        <View style={styles.tip}>
          <Text variant="smallMedium" color="#6B5000">
            💡 Evinize sonradan isim değiştirebilirsiniz. Şimdilik istediğiniz
            herhangi bir ismi kullanabilirsiniz.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handleNext}
          disabled={saving}
          style={[styles.cta, saving && { opacity: 0.94 }]}
        >
          <Text variant="bodyMedium" weight="700" color={colors.ink}>
            {saving ? t.common.loading : t.common.continue}
          </Text>
          <ChevronRight size={18} strokeWidth={2.5} color={colors.ink} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  input: {
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: "transparent",
    color: colors.ink,
    fontFamily: fonts.serif,
    fontSize: 20,
  },
  tip: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
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
});
