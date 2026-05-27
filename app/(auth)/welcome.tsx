import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button, Input, Screen, Text } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/features/auth/authService";

type Mode = "signin" | "signup";

export default function Welcome() {
  const signInMock = useAuthStore((s) => s.signInMock);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const authLoading = useAuthStore((s) => s.authLoading);
  const isLive = authService.isConfigured();

  const [mode, setMode] = React.useState<Mode>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!isLive) {
      signInMock(name || email.split("@")[0] || "Sen");
      return;
    }
    if (!email.trim() || !password) {
      Alert.alert("Eksik bilgi", "E-posta ve şifre gerekli.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      Alert.alert("Eksik bilgi", "Adını gir.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name.trim());
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "İşlem başarısız oldu.";
      Alert.alert("Hata", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || authLoading;

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
        {isLive ? (
          <>
            {mode === "signup" && (
              <Input
                placeholder={t.auth.namePlaceholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}
            <Input
              placeholder={t.auth.emailPlaceholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Button
              title={
                busy
                  ? t.common.loading
                  : mode === "signin"
                    ? "Giriş yap"
                    : "Hesap oluştur"
              }
              variant="primary"
              fullWidth
              onPress={submit}
              disabled={busy}
            />
            <Button
              title={
                mode === "signin"
                  ? "Hesabın yok mu? Kayıt ol"
                  : "Hesabın var mı? Giriş yap"
              }
              variant="ghost"
              fullWidth
              onPress={() =>
                setMode((m) => (m === "signin" ? "signup" : "signin"))
              }
            />
          </>
        ) : (
          <>
            <Button
              title={t.auth.continueWithEmail}
              variant="primary"
              fullWidth
              onPress={() => signInMock()}
              leftSlot={
                <Ionicons name="mail-outline" size={18} color={colors.snow} />
              }
            />
            <Button
              title={t.auth.continueWithGoogle}
              variant="secondary"
              fullWidth
              onPress={() => signInMock()}
              leftSlot={
                <Ionicons name="logo-google" size={18} color={colors.ink} />
              }
            />
            <Button
              title={t.auth.continueWithApple}
              variant="secondary"
              fullWidth
              onPress={() => signInMock()}
              leftSlot={
                <Ionicons name="logo-apple" size={18} color={colors.ink} />
              }
            />
          </>
        )}
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
