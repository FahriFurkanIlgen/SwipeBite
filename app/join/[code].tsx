import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Button, Card, Screen, Text } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/features/auth/authService";

/**
 * Deep-link target: swipebite://join/CODE
 * If the user is signed in, join immediately and bounce to home.
 * Otherwise stash the code and send them to welcome.
 */
export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const user = useAuthStore((s) => s.user);
  const setHousehold = useAuthStore((s) => s.setHousehold);

  const [state, setState] = React.useState<
    "loading" | "ok" | "error" | "needsAuth"
  >("loading");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!code) {
        setState("error");
        setError("Geçersiz davet kodu.");
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
              name: `${code} Hanesi`,
              createdBy: user.id,
              memberIds: [user.id],
              createdAt: new Date().toISOString(),
            });
            setState("ok");
            setTimeout(() => router.replace("/(tabs)"), 600);
            return;
          }
          setState("error");
          setError("Kod bulunamadı.");
          return;
        }
        setHousehold(h);
        setState("ok");
        setTimeout(() => router.replace("/(tabs)"), 600);
      } catch {
        if (!cancelled) {
          setState("error");
          setError("Katılım başarısız.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, user, setHousehold]);

  return (
    <Screen background="snow">
      <View
        style={{ flex: 1, padding: spacing["2xl"], justifyContent: "center" }}
      >
        <Card variant="amber" padding="lg" style={{ gap: spacing.md }}>
          {state === "loading" ? (
            <>
              <Text variant="h2" weight="700">
                Haneye katılınıyor…
              </Text>
              <Text variant="small" color={colors.graphite}>
                Kod: {code}
              </Text>
            </>
          ) : state === "ok" ? (
            <Text variant="h2" weight="700">
              Hoş geldin! 🎉
            </Text>
          ) : state === "needsAuth" ? (
            <>
              <Text variant="h2" weight="700">
                Önce giriş yap
              </Text>
              <Text variant="small" color={colors.graphite}>
                {code} kodlu haneye katılmak için hesabını oluştur.
              </Text>
              <Button
                title="Devam et"
                onPress={() => router.replace("/(auth)/welcome")}
              />
            </>
          ) : (
            <>
              <Text variant="h2" weight="700">
                Katılım başarısız
              </Text>
              <Text variant="small" color={colors.graphite}>
                {error}
              </Text>
              <Button
                title="Ana sayfa"
                onPress={() => router.replace("/(tabs)")}
              />
            </>
          )}
        </Card>
      </View>
    </Screen>
  );
}
