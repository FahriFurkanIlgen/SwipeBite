import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/features/auth/authService";
import { L } from "@/constants/appVariant";

export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const user = useAuthStore((s) => s.user);
  const setHousehold = useAuthStore((s) => s.setHousehold);
  const refreshHousehold = useAuthStore((s) => s.refreshHousehold);

  const [state, setState] = React.useState<
    "loading" | "ok" | "error" | "needsAuth"
  >("loading");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!code) {
        setState("error");
        setError(L("Geçersiz davet kodu.", "Invalid invite code."));
        return;
      }
      if (!user) {
        setState("needsAuth");
        return;
      }
      try {
        const h = await authService.joinHouseholdByInviteCode(code, user.id);
        if (cancelled) return;
        if (!h) {
          if (!authService.isConfigured()) {
            setHousehold({
              id: code,
              name: L(`${code} Hanesi`, `${code} Bar`),
              createdBy: user.id,
              memberIds: [user.id],
              createdAt: new Date().toISOString(),
            });
            setState("ok");
            setTimeout(() => router.replace("/(tabs)"), 700);
            return;
          }
          setState("error");
          setError(L("Kod bulunamadı.", "Code not found."));
          return;
        }
        setHousehold(h);
        // Re-fetch members in case the just-inserted membership row wasn't
        // visible yet when the RPC returned (replication lag) — ensures the
        // partner shows up on this first pairing without an app restart.
        void refreshHousehold();
        setState("ok");
        setTimeout(() => router.replace("/(tabs)"), 700);
      } catch {
        if (!cancelled) {
          setState("error");
          setError(L("Katılım başarısız.", "Couldn't join."));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, user, setHousehold, refreshHousehold]);

  return (
    <Screen background="bg">
      <View style={styles.center}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
          {state === "loading" ? (
            <>
              <View style={styles.spinner} />
              <Text style={styles.title}>
                {L("Haneye katılınıyor…", "Joining…")}
              </Text>
              <Text variant="small" color={colors.dim}>
                {L("Kod", "Code")}: {code}
              </Text>
            </>
          ) : state === "ok" ? (
            <Animated.View
              entering={ZoomIn.duration(400)}
              style={{ alignItems: "center", gap: spacing.md }}
            >
              <View style={styles.checkCircle}>
                <Text style={{ fontSize: 32 }}>🎉</Text>
              </View>
              <Text style={styles.title}>{L("Hoş geldin!", "Welcome!")}</Text>
              <Text variant="small" color={colors.dim} align="center">
                {L("Yönlendiriliyorsun…", "Redirecting…")}
              </Text>
            </Animated.View>
          ) : state === "needsAuth" ? (
            <>
              <Text style={styles.title}>{L("Önce giriş yap", "Sign in first")}</Text>
              <Text variant="small" color={colors.dim} align="center">
                {L(
                  `${code} kodlu haneye katılmak için hesabını oluştur.`,
                  `Create your account to join with code ${code}.`,
                )}
              </Text>
              <Pressable
                onPress={() => router.replace("/(auth)/welcome")}
                style={styles.cta}
              >
                <Text variant="smallMedium" weight="700" color={colors.ink}>
                  {L("Devam et", "Continue")}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>
                {L("Katılım başarısız", "Couldn't join")}
              </Text>
              <Text variant="small" color={colors.dim} align="center">
                {error}
              </Text>
              <Pressable
                onPress={() => router.replace("/(tabs)")}
                style={styles.cta}
              >
                <Text variant="smallMedium" weight="700" color={colors.ink}>
                  {L("Ana sayfa", "Home")}
                </Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: spacing["2xl"] },
  card: {
    padding: spacing["2xl"],
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: spacing.md,
  },
  spinner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.border,
    borderTopColor: colors.primary,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  cta: {
    marginTop: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
