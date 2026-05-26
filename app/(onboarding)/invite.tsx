import React from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, Screen, Text } from "@/components/ui";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { colors, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";

export default function InviteScreen() {
  const household = useAuthStore((s) => s.household);

  return (
    <Screen background="snow">
      <View style={styles.header}>
        <ProgressDots total={4} index={2} />
        <Text variant="caption" color={colors.slate}>
          {t.onboarding.step(3, 4)}
        </Text>
      </View>

      <View style={styles.body}>
        <Text variant="h1" weight="700">
          {t.onboarding.invitePartnerTitle}
        </Text>
        <Text
          variant="body"
          color={colors.slate}
          style={{ marginTop: spacing.sm }}
        >
          {t.onboarding.invitePartnerSubtitle}
        </Text>

        <Card
          variant="amber"
          style={{
            marginTop: spacing["2xl"],
            alignItems: "center",
            gap: spacing.lg,
          }}
        >
          <View style={styles.qr}>
            <Ionicons name="qr-code" size={80} color={colors.ink} />
          </View>
          <Text variant="bodyMedium" weight="600">
            {household?.name ?? "Bizim Ev"}
          </Text>
          <Text variant="caption" color={colors.graphite} align="center">
            Eşin uygulamayı açıp bu kodu tarasın veya bağlantıyı kullansın.
          </Text>
        </Card>

        <View style={{ gap: spacing.md, marginTop: spacing["2xl"] }}>
          <Button
            title={t.onboarding.inviteViaLink}
            variant="secondary"
            fullWidth
            leftSlot={
              <Ionicons name="link-outline" size={18} color={colors.ink} />
            }
            onPress={() => router.push("/(onboarding)/finish")}
          />
          <Button
            title={t.onboarding.inviteViaQr}
            variant="secondary"
            fullWidth
            leftSlot={
              <Ionicons name="qr-code-outline" size={18} color={colors.ink} />
            }
            onPress={() => router.push("/(onboarding)/finish")}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title={t.onboarding.inviteLater}
          variant="ghost"
          fullWidth
          onPress={() => router.push("/(onboarding)/finish")}
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
  qr: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: colors.snow,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { paddingVertical: spacing.lg },
});
