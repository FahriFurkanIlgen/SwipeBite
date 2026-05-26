import React from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, Screen, Text } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";

export default function SwipeTab() {
  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);
  const startSession = useSessionStore((s) => s.startSession);

  const handleStart = () => {
    if (!user || !household) return;
    startSession(household.id, user.id, household.memberIds);
    const id = useSessionStore.getState().session?.id;
    if (id) router.push(`/session/${id}`);
  };

  return (
    <Screen background="snow">
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="flame" size={36} color={colors.ink} />
        </View>
        <Text variant="h1" weight="700" align="center">
          {t.swipe.sessionTitle}
        </Text>
        <Text
          variant="body"
          align="center"
          color={colors.slate}
          style={{ maxWidth: 320 }}
        >
          Ev halkıyla birlikte birkaç kart kaydırın, AI en iyi eşleşmeyi bulsun.
        </Text>

        <Card variant="amber" padding="lg" style={styles.tipCard}>
          <Text variant="small" weight="600" color={colors.ink}>
            İpucu
          </Text>
          <Text variant="small" color={colors.graphite}>
            Sağ → beğen · Sol → geç · Yukarı → süper beğen · Aşağı → asla
          </Text>
        </Card>
      </View>

      <View style={styles.footer}>
        <Button title="Yeni oturum başlat" fullWidth onPress={handleStart} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  tipCard: { marginTop: spacing.xl, gap: spacing.xs, alignSelf: "stretch" },
  footer: { padding: spacing["2xl"] },
});
