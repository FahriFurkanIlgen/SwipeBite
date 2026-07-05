import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Clock, QrCode, Share2 } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { colors, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { L } from "@/constants/appVariant";
import { featureFlags } from "@/constants/featureFlags";
import { useAuthStore } from "@/store/authStore";

export default function InviteOnboardingScreen() {
  const household = useAuthStore((s) => s.household);
  const code = household?.id.slice(0, 6).toUpperCase() ?? "ABC123";
  // When the bar feature is disabled for launch, skip the bar age-gate
  // onboarding step and go straight to the finish screen.
  const nextStep = featureFlags.bar
    ? "/(onboarding)/bar"
    : "/(onboarding)/finish";

  return (
    <Screen background="bg">
      <View style={styles.header}>
        <ProgressDots total={5} index={2} />
        <Text variant="caption" color={colors.dim}>
          {t.onboarding.step(3, 5)}
        </Text>
      </View>

      <Animated.View entering={FadeInDown.delay(80).duration(500)}>
        <Text variant="h1">{t.onboarding.invitePartnerTitle}</Text>
        <Text
          variant="body"
          color={colors.slate}
          style={{ marginTop: spacing.sm }}
        >
          {L(
            "Ev halkınızı davet edin. Onlar da kendi tercihlerini ekleyebilir ve birlikte eşleşebilirsiniz.",
            "Invite your friends. They can add their own preferences and you can match together.",
          )}
        </Text>
      </Animated.View>

      <View style={{ flex: 1, gap: spacing.md, paddingTop: spacing["2xl"] }}>
        <InviteRow
          icon={Share2}
          iconBg={colors.primary}
          iconColor={colors.onPrimary}
          title={t.onboarding.inviteViaLink}
          subtitle={`${L("swipebite.com.tr", "swipebar.app")}/join/${code}`}
          onPress={() => router.push(nextStep)}
        />
        <InviteRow
          icon={QrCode}
          iconBg={colors.muted}
          iconColor={colors.slate}
          title={t.onboarding.inviteViaQr}
          subtitle={L(
            "Yanındakileri hemen davet et",
            "Invite people nearby instantly",
          )}
          onPress={() => router.push("/invite")}
        />
        <InviteRow
          icon={Clock}
          iconBg={colors.muted}
          iconColor={colors.slate}
          title={t.onboarding.inviteLater}
          subtitle={L("Şimdilik tek başına kullan", "Use it solo for now")}
          onPress={() => router.push(nextStep)}
        />
      </View>
    </Screen>
  );
}

interface InviteRowProps {
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const InviteRow: React.FC<InviteRowProps> = ({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onPress,
}) => (
  <Pressable onPress={onPress} style={styles.row}>
    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
      <Icon size={18} color={iconColor} strokeWidth={1.5} />
    </View>
    <View style={{ flex: 1 }}>
      <Text variant="smallMedium" weight="600">
        {title}
      </Text>
      <Text variant="caption" color={colors.slate} style={{ marginTop: 2 }}>
        {subtitle}
      </Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
