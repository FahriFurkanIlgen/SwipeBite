import React from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Mail } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { Text } from "@/components/ui/Text";
import { Screen } from "@/components/ui/Screen";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/features/auth/authService";

type Mode = "signin" | "signup";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1647772809798-f34d785c981c?w=900&h=1400&fit=crop&auto=format";

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

function AppleMark() {
  return (
    <Svg width={16} height={18} viewBox="0 0 384 512">
      <Path
        fill={colors.bg}
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM229.3 81.1c19.3-22.9 17.6-43.8 17-51.3-17 1-36.7 11.6-47.9 24.6-12.3 13.9-19.6 31.1-18 50.9 18.5 1.4 35.4-8.1 48.9-24.2z"
      />
    </Svg>
  );
}

export default function Welcome() {
  const signInMock = useAuthStore((s) => s.signInMock);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const authLoading = useAuthStore((s) => s.authLoading);
  const user = useAuthStore((s) => s.user);
  const isOnboarded = useAuthStore((s) => s.isOnboarded);
  const isLive = authService.isConfigured();

  const [emailMode, setEmailMode] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  // Landing always shows for 3 seconds. After that, either auto-redirect a
  // signed-in user into the app or reveal the login buttons sliding up.
  const [revealed, setRevealed] = React.useState(false);
  const busy = submitting || authLoading;

  React.useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // After the splash window: signed-in users are forwarded automatically.
  React.useEffect(() => {
    if (!revealed || !user) return;
    router.replace(isOnboarded ? "/(tabs)" : "/(onboarding)/preferences");
  }, [revealed, user, isOnboarded]);

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

  const handleSocialMock = () => {
    if (isLive) {
      setEmailMode(true);
    } else {
      signInMock();
    }
  };

  return (
    <Screen background="ink" padded={false} statusBar="light">
      <View style={styles.heroWrap}>
        <Image
          source={{ uri: HERO_IMAGE }}
          style={styles.heroImg}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            "rgba(26,23,20,0.1)",
            "rgba(26,23,20,0.2)",
            "rgba(26,23,20,0.85)",
            "rgba(26,23,20,0.98)",
          ]}
          locations={[0, 0.4, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              style={{ marginBottom: 12 }}
            >
              <Text
                variant="overline"
                color={colors.primary}
                style={{ letterSpacing: 2.2 }}
              >
                Ev halkı için
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(350).duration(700)}
              style={{ marginBottom: 8 }}
            >
              <View style={styles.brandRow}>
                <Text style={styles.brandLight}>Swipe</Text>
                <Text style={styles.brandAccent}>Bite</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(600)}>
              <Text style={styles.tagline}>{t.app.tagline}</Text>
            </Animated.View>

            {revealed && !user ? (
              <Animated.View
                entering={FadeInDown.duration(500)}
                style={styles.authPanel}
              >
                {!isLive ? (
                  <View style={{ gap: spacing.md, width: "100%" }}>
                    <Pressable
                      onPress={() => signInMock()}
                      style={styles.socialLight}
                      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    >
                      <View style={styles.btnInner}>
                        <Text
                          variant="bodyMedium"
                          weight="600"
                          color={colors.ink}
                          style={styles.btnLabel}
                        >
                          Hemen başla
                        </Text>
                        <ChevronRight
                          size={16}
                          strokeWidth={2}
                          color={colors.ink}
                        />
                      </View>
                    </Pressable>
                    <Text
                      variant="caption"
                      align="center"
                      color="rgba(250,247,242,0.45)"
                    >
                      Hesap oluşturmadan deneyebilirsin.
                    </Text>
                  </View>
                ) : !emailMode ? (
                  <View style={{ gap: spacing.md, width: "100%" }}>
                    <Pressable
                      onPress={handleSocialMock}
                      style={styles.socialLight}
                      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    >
                      <View style={styles.btnInner}>
                        <GoogleMark />
                        <Text
                          variant="bodyMedium"
                          weight="600"
                          color={colors.ink}
                          style={styles.btnLabel}
                        >
                          {t.auth.continueWithGoogle}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={handleSocialMock}
                      style={styles.socialDark}
                      android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                    >
                      <View style={styles.btnInner}>
                        <AppleMark />
                        <Text
                          variant="bodyMedium"
                          weight="600"
                          color={colors.bg}
                          style={styles.btnLabel}
                        >
                          {t.auth.continueWithApple}
                        </Text>
                      </View>
                    </Pressable>

                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text variant="caption" color="rgba(250,247,242,0.4)">
                        VEYA
                      </Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <Pressable
                      onPress={() =>
                        isLive ? setEmailMode(true) : signInMock()
                      }
                      style={styles.socialOutline}
                    >
                      <View style={styles.btnInner}>
                        <Mail
                          size={16}
                          strokeWidth={1.5}
                          color="rgba(250,247,242,0.7)"
                        />
                        <Text
                          variant="bodyMedium"
                          weight="500"
                          color="rgba(250,247,242,0.85)"
                          style={styles.btnLabel}
                        >
                          {t.auth.continueWithEmail}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ gap: spacing.md, width: "100%" }}>
                    <Pressable
                      onPress={() => setEmailMode(false)}
                      style={styles.backRow}
                      accessibilityLabel={t.common.back}
                    >
                      <ChevronLeft
                        size={14}
                        color="rgba(250,247,242,0.6)"
                        strokeWidth={1.8}
                      />
                      <Text variant="caption" color="rgba(250,247,242,0.6)">
                        {t.common.back}
                      </Text>
                    </Pressable>

                    {mode === "signup" ? (
                      <TextInput
                        placeholder={t.auth.namePlaceholder}
                        placeholderTextColor="rgba(250,247,242,0.4)"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        style={styles.darkInput}
                      />
                    ) : null}

                    <TextInput
                      placeholder={t.auth.emailPlaceholder}
                      placeholderTextColor="rgba(250,247,242,0.4)"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={styles.darkInput}
                    />

                    <TextInput
                      placeholder="Şifre"
                      placeholderTextColor="rgba(250,247,242,0.4)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      style={styles.darkInput}
                    />

                    <Pressable
                      onPress={submit}
                      disabled={busy}
                      style={[styles.primaryCta, busy && styles.pressed]}
                    >
                      <View style={styles.btnInner}>
                        <Text
                          variant="bodyMedium"
                          weight="600"
                          color={colors.ink}
                          style={styles.btnLabel}
                        >
                          {busy
                            ? t.common.loading
                            : mode === "signin"
                              ? "Devam et"
                              : "Hesap oluştur"}
                        </Text>
                        <ChevronRight
                          size={16}
                          strokeWidth={2}
                          color={colors.ink}
                        />
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        setMode((m) => (m === "signin" ? "signup" : "signin"))
                      }
                      style={styles.toggleRow}
                    >
                      <Text
                        variant="small"
                        color="rgba(250,247,242,0.6)"
                        align="center"
                      >
                        {mode === "signin"
                          ? "Hesabın yok mu? Kayıt ol"
                          : "Hesabın var mı? Giriş yap"}
                      </Text>
                    </Pressable>
                  </View>
                )}

                <Text
                  variant="caption"
                  align="center"
                  color="rgba(250,247,242,0.35)"
                  style={styles.legal}
                >
                  {t.auth.legal}
                </Text>
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: { ...StyleSheet.absoluteFillObject },
  heroImg: { width: "100%", height: "100%", opacity: 0.75 },
  scroll: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  content: {
    justifyContent: "flex-end",
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["4xl"],
    paddingTop: spacing["4xl"],
  },
  brandRow: { flexDirection: "row", alignItems: "baseline" },
  brandLight: {
    fontFamily: fonts.serif,
    fontSize: 62,
    lineHeight: 62,
    letterSpacing: -1.86,
    color: colors.bg,
  },
  brandAccent: {
    fontFamily: fonts.serif,
    fontSize: 62,
    lineHeight: 62,
    letterSpacing: -1.86,
    color: colors.primary,
  },
  tagline: {
    fontFamily: fonts.serifItalic,
    fontSize: 22,
    lineHeight: 28,
    color: "rgba(250,247,242,0.72)",
    letterSpacing: -0.22,
    marginBottom: spacing["3xl"],
  },
  authPanel: {
    borderRadius: radii.hero,
    backgroundColor: "rgba(250,247,242,0.07)",
    borderWidth: 1,
    borderColor: "rgba(250,247,242,0.12)",
    padding: spacing.xl,
  },
  socialLight: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
  },
  socialDark: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: "rgba(250,247,242,0.15)",
  },
  socialOutline: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(250,247,242,0.18)",
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnLabel: {
    marginLeft: 10,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(250,247,242,0.12)",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  darkInput: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: "rgba(250,247,242,0.08)",
    borderWidth: 1,
    borderColor: "rgba(250,247,242,0.15)",
    color: colors.bg,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  primaryCta: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  toggleRow: { paddingVertical: 4 },
  legal: { marginTop: spacing.lg, lineHeight: 16 },
});
