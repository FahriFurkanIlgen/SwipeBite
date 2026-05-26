import React from "react";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";

import { Button, Card, Input, Screen, Text } from "@/components/ui";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/features/auth/authService";

/**
 * Household invite / join screen.
 *
 * - If the user already has a household, show an invite code, QR, and share button.
 * - Otherwise, let them enter an invite code to join.
 */
export default function InviteScreen() {
  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);
  const setHousehold = useAuthStore((s) => s.setHousehold);

  const [code, setCode] = React.useState("");
  const [joining, setJoining] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Derive an invite code. If the household has none (mock mode), derive a
  // stable short slug from its id so the QR is still meaningful.
  const inviteCode = React.useMemo(() => {
    if (!household) return "";
    return household.id.slice(-6).toUpperCase();
  }, [household]);

  const inviteUrl = React.useMemo(() => {
    if (!inviteCode) return "";
    return Linking.createURL(`/join/${inviteCode}`);
  }, [inviteCode]);

  const onShare = async () => {
    if (!household) return;
    await Haptics.selectionAsync();
    try {
      await Share.share({
        title: "SwipeBite davet",
        message: `${household.name} hanesine katıl: ${inviteUrl}\nKod: ${inviteCode}`,
      });
    } catch {
      // user cancelled
    }
  };

  const onJoin = async () => {
    if (!user) return;
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError("Geçerli bir davet kodu gir.");
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const h = await authService.joinHouseholdByInviteCode(trimmed, user.id);
      if (!h) {
        // Backend missing or code not found → mock join.
        if (!authService.isConfigured()) {
          setHousehold({
            id: trimmed,
            name: `${trimmed} Hanesi`,
            createdBy: user.id,
            memberIds: [user.id],
            createdAt: new Date().toISOString(),
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
          return;
        }
        setError("Kod bulunamadı.");
        return;
      }
      setHousehold(h);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setError("Katılım başarısız. Tekrar dene.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <Screen background="snow">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.ink} />
        </Pressable>
        <Text variant="bodyMedium" weight="700">
          Hane daveti
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.body}>
        {household ? (
          <Card
            variant="amber"
            padding="lg"
            style={{ gap: spacing.md, alignItems: "center" }}
          >
            <Text variant="caption" weight="700" color={colors.graphite}>
              DAVET KODU
            </Text>
            <Text variant="display" weight="700">
              {inviteCode}
            </Text>
            <View style={styles.qrBox}>
              {inviteUrl ? (
                <QRCode
                  value={inviteUrl}
                  size={180}
                  backgroundColor="#FFFFFF"
                />
              ) : null}
            </View>
            <Text
              variant="small"
              color={colors.graphite}
              style={{ textAlign: "center" }}
            >
              Eşin / ev arkadaşın bu kodu girerek ya da QR'ı tarayarak{" "}
              <Text weight="700">{household.name}</Text> hanesine katılır.
            </Text>
            <Button
              title="Davet bağlantısını paylaş"
              fullWidth
              onPress={onShare}
              leftSlot={
                <Ionicons name="share-outline" size={16} color={colors.snow} />
              }
            />
          </Card>
        ) : null}

        <Card padding="lg" style={{ gap: spacing.md }}>
          <Text variant="bodyMedium" weight="700">
            Mevcut bir haneye katıl
          </Text>
          <Input
            placeholder="Davet kodu (örn. AB12CD)"
            value={code}
            onChangeText={(v) => {
              setCode(v.toUpperCase());
              setError(null);
            }}
            autoCapitalize="characters"
          />
          {error ? (
            <Text variant="small" color="#C0392B">
              {error}
            </Text>
          ) : null}
          <Button
            title={joining ? "Katılıyor…" : "Haneye katıl"}
            fullWidth
            onPress={onJoin}
            disabled={joining}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  body: {
    flex: 1,
    padding: spacing["2xl"],
    gap: spacing.lg,
  },
  qrBox: {
    padding: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: radii.md,
  },
});
