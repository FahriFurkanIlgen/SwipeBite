import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  Database,
  Eye,
  FileText,
  Lock,
  Trash2,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, spacing } from "@/constants/theme";
import { isBar, L } from "@/constants/appVariant";
import { PRIVACY_URL, TERMS_URL } from "@/constants/legal";
import { useAuthStore } from "@/store/authStore";
import { usePantryStore } from "@/store/pantryStore";
import { usePlannerStore } from "@/store/plannerStore";
import { useSessionStore } from "@/store/sessionStore";
import { useStatsStore } from "@/store/statsStore";

const SUPPORT_EMAIL = isBar ? "support@swipebar.app" : "destek@swapbite.com.tr";

export default function PrivacyScreen() {
  const signOut = useAuthStore((s) => s.signOut);

  const clearLocalData = () => {
    Alert.alert(
      L("Yerel verileri sil", "Clear local data"),
      L(
        "Kiler, haftalık plan, beğeniler ve pişirme sayıları cihazdan silinecek. Devam edilsin mi?",
        "Your cabinet, weekly plan, likes, and counts will be removed from this device. Continue?",
      ),
      [
        { text: L("Vazgeç", "Cancel"), style: "cancel" },
        {
          text: L("Sil", "Delete"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await usePantryStore.getState().clear();
              } catch {
                // ignore
              }
              try {
                await usePlannerStore.getState().clear();
              } catch {
                // ignore
              }
              useSessionStore.getState().reset();
              useStatsStore.getState().reset();
              Alert.alert(L("Tamam", "Done"), L("Yerel veriler temizlendi.", "Local data cleared."));
            })();
          },
        },
      ],
    );
  };

  const deleteAccount = () => {
    Alert.alert(
      L("Hesabımı sil", "Delete my account"),
      L(
        `Hesabını silmek için lütfen destek ile iletişime geç: ${SUPPORT_EMAIL}`,
        `To delete your account, please contact support: ${SUPPORT_EMAIL}`,
      ),
      [
        { text: L("Vazgeç", "Cancel"), style: "cancel" },
        {
          text: L("E-posta gönder", "Send email"),
          onPress: () =>
            Linking.openURL(
              `mailto:${SUPPORT_EMAIL}?subject=${L("Hesap%20silme%20talebi", "Account%20deletion%20request")}`,
            ),
        },
        {
          text: L("Çıkış yap", "Sign out"),
          style: "destructive",
          onPress: () => void signOut(),
        },
      ],
    );
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
              fontSize: 22,
              color: colors.ink,
              letterSpacing: -0.4,
            }}
          >
            {L("Gizlilik", "Privacy")}
          </Text>
          <Text variant="caption" color={colors.dim}>
            {L("Verilerin nerede, ne için tutuluyor", "Where and why your data is kept")}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <InfoRow
            icon={Database}
            title={L("Hangi veriler tutuluyor?", "What data is stored?")}
            body={L(
              "Ad, e-posta, hane üyelikleri, tarif beğenileri, kiler içeriği ve haftalık planın. Tarif kaynakları cihazda mock olarak gelir; gerçek hesabınla eşleşmez.",
              "Your name, email, group memberships, recipe likes, cabinet contents, and weekly plan. Recipe sources are mocked on-device and aren't tied to your real account.",
            )}
          />
          <InfoRow
            icon={Eye}
            title={L("Kim görebilir?", "Who can see it?")}
            body={L(
              "Hane üyelerin senin beğenilerini ve kileri görebilir. Diğer haneler veya kullanıcılar göremez. Hesap dışı kimseyle paylaşılmaz.",
              "Your group members can see your likes and cabinet. Other groups or users cannot. Nothing is shared outside your account.",
            )}
            border
          />
          <InfoRow
            icon={Lock}
            title={L("Güvenlik", "Security")}
            body={L(
              "Tüm istekler HTTPS üzerinden Supabase'e gider. Satır-düzeyi güvenlik (RLS) ile yalnızca senin haneye ait satırlar dönülür.",
              "All requests go to Supabase over HTTPS. Row-level security (RLS) returns only rows that belong to your group.",
            )}
            border
          />
          <InfoRow
            icon={FileText}
            title={L("Üçüncü taraflar", "Third parties")}
            body={L(
              "Bildirimler için Expo Notifications, tarif önerileri için (opsiyonel) OpenAI API. OpenAI'a yalnızca anonim metin gönderilir.",
              "Expo Notifications for push, and (optional) OpenAI API for suggestions. Only anonymous text is sent to OpenAI.",
            )}
            border
          />
        </View>

        <View style={[styles.card, { marginTop: spacing.lg }]}>
          <ActionRow
            icon={Trash2}
            label={L("Yerel verileri sil", "Clear local data")}
            sub={L("Kiler, plan, beğeniler — sadece bu cihazdan", "Cabinet, plan, likes — this device only")}
            danger={false}
            onPress={clearLocalData}
          />
          <ActionRow
            icon={Trash2}
            label={L("Hesabımı sil", "Delete my account")}
            sub={L("Tüm verilerin kalıcı olarak silinmesini talep et", "Request permanent deletion of all your data")}
            danger
            border
            onPress={deleteAccount}
          />
        </View>

        <View style={[styles.card, { marginTop: spacing.lg }]}>
          <ActionRow
            icon={FileText}
            label="Gizlilik Politikası"
            sub="Verilerin nasıl işlendiğini tam metinle oku"
            danger={false}
            onPress={() =>
              Linking.openURL(PRIVACY_URL).catch(() => undefined)
            }
          />
          <ActionRow
            icon={FileText}
            label="Kullanım Koşulları (EULA)"
            sub="Abonelik ve kullanım şartları"
            danger={false}
            border
            onPress={() => Linking.openURL(TERMS_URL).catch(() => undefined)}
          />
        </View>

        <Text
          variant="caption"
          color={colors.dim}
          style={{ marginTop: spacing.lg, paddingHorizontal: spacing.sm }}
        >
          {L(`Sorun bildirmek için: ${SUPPORT_EMAIL}`, `To report an issue: ${SUPPORT_EMAIL}`)}
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

interface InfoRowProps {
  icon: LucideIcon;
  title: string;
  body: string;
  border?: boolean;
}
const InfoRow: React.FC<InfoRowProps> = ({
  icon: Icon,
  title,
  body,
  border,
}) => (
  <View
    style={[
      styles.infoRow,
      border && { borderTopWidth: 1, borderTopColor: colors.cream },
    ]}
  >
    <View style={styles.rowIcon}>
      <Icon size={14} color={colors.slate} strokeWidth={1.5} />
    </View>
    <View style={{ flex: 1 }}>
      <Text variant="smallMedium" weight="600">
        {title}
      </Text>
      <Text
        variant="caption"
        color={colors.dim}
        style={{ marginTop: 4, lineHeight: 18 }}
      >
        {body}
      </Text>
    </View>
  </View>
);

interface ActionRowProps {
  icon: LucideIcon;
  label: string;
  sub: string;
  danger?: boolean;
  border?: boolean;
  onPress: () => void;
}
const ActionRow: React.FC<ActionRowProps> = ({
  icon: Icon,
  label,
  sub,
  danger,
  border,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.row,
      border && { borderTopWidth: 1, borderTopColor: colors.cream },
    ]}
  >
    <View
      style={[styles.rowIcon, danger && { backgroundColor: colors.accentSoft }]}
    >
      <Icon
        size={14}
        color={danger ? colors.accent : colors.slate}
        strokeWidth={1.5}
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text
        variant="smallMedium"
        weight="500"
        color={danger ? colors.accent : colors.ink}
      >
        {label}
      </Text>
      <Text variant="caption" color={colors.dim} style={{ marginTop: 2 }}>
        {sub}
      </Text>
    </View>
  </Pressable>
);

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
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
});
