import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button, Screen, Text } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";

export default function Welcome() {
  const signInMock = useAuthStore((s) => s.signInMock);

  const handleSignIn = () => signInMock();

  return (
    <Screen background="canvas" padded>
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Ionicons name="restaurant" size={36} color={colors.ink} />
        </View>
        <Text variant="display" weight="700" align="center" color={colors.ink}>
          {t.auth.welcomeTitle}
        </Text>
        <Text
          variant="body"
          align="center"
          color={colors.graphite}
          style={styles.subtitle}
        >
          {t.auth.welcomeSubtitle}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title={t.auth.continueWithEmail}
          variant="primary"
          fullWidth
          onPress={handleSignIn}
          leftSlot={
            <Ionicons name="mail-outline" size={18} color={colors.snow} />
          }
        />
        <Button
          title={t.auth.continueWithGoogle}
          variant="secondary"
          fullWidth
          onPress={handleSignIn}
          leftSlot={
            <Ionicons name="logo-google" size={18} color={colors.ink} />
          }
        />
        <Button
          title={t.auth.continueWithApple}
          variant="secondary"
          fullWidth
          onPress={handleSignIn}
          leftSlot={<Ionicons name="logo-apple" size={18} color={colors.ink} />}
        />
        <Text
          variant="caption"
          align="center"
          color={colors.slate}
          style={styles.legal}
        >
          {t.auth.legal}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.snow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  subtitle: { maxWidth: 320 },
  actions: { gap: spacing.md, paddingBottom: spacing.xl },
  legal: { marginTop: spacing.sm },
});
