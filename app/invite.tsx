import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import QRCode from "react-native-qrcode-svg";
import {
  ArrowLeft,
  Check,
  Copy,
  QrCode as QrCodeIcon,
  Share2,
} from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { authService } from "@/features/auth/authService";

export default function InviteScreen() {
  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);
  const setHousehold = useAuthStore((s) => s.setHousehold);
  const refreshHousehold = useAuthStore((s) => s.refreshHousehold);
  const session = useSessionStore((s) => s.session);

  const [code, setCode] = React.useState("");
  const [joining, setJoining] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [showQR, setShowQR] = React.useState(false);

  const inviteCode = React.useMemo(
    () =>
      household
        ? (household.inviteCode ?? household.id.slice(-6)).toUpperCase()
        : "",
    [household],
  );

  const inviteUrl = React.useMemo(
    () => (inviteCode ? Linking.createURL(`/join/${inviteCode}`) : ""),
    [inviteCode],
  );

  const sessionUrl = React.useMemo(
    () => (session ? Linking.createURL(`/lobby/${session.id}`) : ""),
    [session],
  );

  const onShareSession = async () => {
    if (!session) return;
    await Haptics.selectionAsync();
    try {
      await Share.share({
        title: "SwipeBite oturumu",
        message: `Birlikte tarif seçelim: ${sessionUrl}`,
      });
    } catch {
      /* cancelled */
    }
  };

  const onCopy = async () => {
    await Haptics.selectionAsync();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onShare = async () => {
    if (!household) return;
    await Haptics.selectionAsync();
    try {
      await Share.share({
        title: "SwipeBite davet",
        message: `${household.name} hanesine katıl: ${inviteUrl}\nKod: ${inviteCode}`,
      });
    } catch {
      /* cancelled */
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
      // Re-fetch members so the partner shows up immediately on first pairing.
      void refreshHousehold();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setError("Katılım başarısız. Tekrar dene.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <Screen background="bg" padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={16} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <View>
          <Text
            style={{
              fontFamily: fonts.serif,
              fontSize: 24,
              lineHeight: 32,
              color: colors.ink,
              letterSpacing: -0.4,
              includeFontPadding: false,
            }}
          >
            Davet Et
          </Text>
          <Text variant="caption" color={colors.dim}>
            {household ? `${household.name}'e katılım daveti` : "Hane daveti"}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Illustration */}
          <Animated.View
            entering={FadeInDown.delay(80).duration(500)}
            style={styles.illustration}
          >
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1623065608901-d973ed87284e?w=800&h=400&fit=crop&auto=format",
              }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
            <LinearGradient
              colors={["rgba(26,23,20,0.65)", "rgba(26,23,20,0.2)"]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.illustrationBody}>
              <Text
                style={{
                  fontFamily: fonts.serifItalic,
                  fontSize: 20,
                  color: colors.bg,
                  lineHeight: 26,
                }}
              >
                "Birlikte kaydırın,{"\n"}birlikte yiyin."
              </Text>
            </View>
          </Animated.View>

          {household ? (
            <>
              {/* Invite code card */}
              <View style={styles.codeCard}>
                <Text
                  variant="overline"
                  color={colors.dim}
                  style={{ marginBottom: 12 }}
                >
                  Davet Kodu
                </Text>
                <View style={styles.codeBox}>
                  <Text
                    style={{
                      fontFamily: fonts.serif,
                      fontSize: 28,
                      lineHeight: 38,
                      color: colors.ink,
                      letterSpacing: 2.2,
                      includeFontPadding: false,
                    }}
                  >
                    {inviteCode}
                  </Text>
                  <Pressable
                    onPress={onCopy}
                    style={[
                      styles.copyBtn,
                      {
                        backgroundColor: copied
                          ? colors.forest
                          : colors.primary,
                      },
                    ]}
                  >
                    {copied ? (
                      <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                    ) : (
                      <Copy size={15} color={colors.ink} strokeWidth={2} />
                    )}
                  </Pressable>
                </View>
                <Text
                  variant="small"
                  color={colors.dim}
                  style={{ marginTop: 12 }}
                >
                  Kodu arkadaşınıza gönderin ya da aşağıdaki bağlantıyı
                  paylaşın.
                </Text>
              </View>

              {/* Share actions */}
              <View style={{ gap: 12 }}>
                <Pressable onPress={onShare} style={styles.shareDark}>
                  <View
                    style={[
                      styles.shareIcon,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Share2 size={18} color={colors.ink} strokeWidth={1.5} />
                  </View>
                  <View>
                    <Text variant="smallMedium" weight="600" color={colors.bg}>
                      Bağlantıyı Paylaş
                    </Text>
                    <Text
                      variant="caption"
                      color="rgba(250,247,242,0.5)"
                      numberOfLines={1}
                    >
                      {inviteUrl}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setShowQR(!showQR)}
                  style={styles.shareLight}
                >
                  <View
                    style={[styles.shareIcon, { backgroundColor: colors.card }]}
                  >
                    <QrCodeIcon
                      size={18}
                      color={colors.slate}
                      strokeWidth={1.5}
                    />
                  </View>
                  <View>
                    <Text variant="smallMedium" weight="600">
                      QR Kod Göster
                    </Text>
                    <Text variant="caption" color={colors.dim}>
                      Yanındakileri anında davet et
                    </Text>
                  </View>
                </Pressable>
              </View>

              {showQR && inviteUrl ? (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  style={styles.qrCard}
                >
                  <View style={styles.qrBox}>
                    <QRCode
                      value={inviteUrl}
                      size={160}
                      backgroundColor="#FFFFFF"
                      color={colors.ink}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: fonts.serif,
                      fontSize: 18,
                      lineHeight: 26,
                      color: colors.ink,
                      letterSpacing: 1.5,
                      includeFontPadding: false,
                    }}
                  >
                    {inviteCode}
                  </Text>
                  <Text variant="caption" color={colors.dim} align="center">
                    Kamerayı koda doğrultun
                  </Text>
                </Animated.View>
              ) : null}
            </>
          ) : null}

          {/* Join existing */}
          <View style={styles.joinCard}>
            <Text
              variant="smallMedium"
              weight="700"
              style={{ marginBottom: 4 }}
            >
              Mevcut bir haneye katıl
            </Text>
            <Text
              variant="caption"
              color={colors.dim}
              style={{ marginBottom: spacing.md }}
            >
              Davet kodu girerek mevcut bir haneye katılabilirsin.
            </Text>
            <TextInput
              placeholder="AB12CD"
              placeholderTextColor={colors.dim}
              value={code}
              onChangeText={(v) => {
                setCode(v.toUpperCase());
                setError(null);
              }}
              autoCapitalize="characters"
              style={styles.joinInput}
            />
            {error ? (
              <Text
                variant="small"
                color={colors.accent}
                style={{ marginTop: 6 }}
              >
                {error}
              </Text>
            ) : null}
            <Pressable
              onPress={onJoin}
              disabled={joining}
              style={[styles.joinBtn, { opacity: joining ? 0.6 : 1 }]}
            >
              <Text variant="smallMedium" weight="700" color={colors.ink}>
                {joining ? "Katılıyor…" : "Haneye katıl"}
              </Text>
            </Pressable>
          </View>

          {session && session.status === "active" ? (
            <View style={styles.joinCard}>
              <Text
                variant="smallMedium"
                weight="700"
                style={{ marginBottom: 4 }}
              >
                Aktif kaydırma oturumu
              </Text>
              <Text
                variant="caption"
                color={colors.dim}
                style={{ marginBottom: spacing.md }}
              >
                Birlikte tarif seçmek için oturum bağlantısını paylaş.
              </Text>
              <Pressable onPress={onShareSession} style={styles.shareDark}>
                <View
                  style={[
                    styles.shareIcon,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Share2 size={18} color={colors.ink} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="smallMedium" weight="600" color={colors.bg}>
                    Oturumu paylaş
                  </Text>
                  <Text
                    variant="caption"
                    color="rgba(250,247,242,0.5)"
                    numberOfLines={1}
                  >
                    {sessionUrl}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => router.replace(`/lobby/${session.id}`)}
                style={styles.startSwipeBtn}
              >
                <Text variant="smallMedium" weight="700" color={colors.ink}>
                  Kaydırmaya başla
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  illustration: {
    height: 180,
    borderRadius: radii.hero,
    overflow: "hidden",
    position: "relative",
  },
  illustrationBody: {
    position: "absolute",
    inset: 0,
    padding: spacing.xl,
    justifyContent: "flex-end",
  },
  codeCard: {
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderStyle: "dashed",
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  shareDark: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.ink,
  },
  shareLight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  qrCard: {
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 10,
  },
  qrBox: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  joinCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  joinInput: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: 2,
  },
  joinBtn: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  startSwipeBtn: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
