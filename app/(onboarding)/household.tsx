import React from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Button, Input, Screen, Text } from "@/components/ui";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { colors, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { uid } from "@/utils/id";

export default function HouseholdScreen() {
  const user = useAuthStore((s) => s.user);
  const setHousehold = useAuthStore((s) => s.setHousehold);
  const [name, setName] = React.useState("Bizim Ev");

  const handleNext = () => {
    if (!user) return;
    setHousehold({
      id: uid("hh"),
      name: name.trim() || "Bizim Ev",
      createdBy: user.id,
      memberIds: [user.id],
      createdAt: new Date().toISOString(),
    });
    router.push("/(onboarding)/invite");
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
        <Button title={t.common.continue} fullWidth onPress={handleNext} />
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
