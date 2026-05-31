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
import { useAuthStore } from "@/store/authStore";
import { usePantryStore } from "@/store/pantryStore";
import { usePlannerStore } from "@/store/plannerStore";
import { useSessionStore } from "@/store/sessionStore";
import { useStatsStore } from "@/store/statsStore";

export default function PrivacyScreen() {
  const signOut = useAuthStore((s) => s.signOut);

  const clearLocalData = () => {
    Alert.alert(
      "Yerel verileri sil",
      "Kiler, haftalık plan, beğeniler ve pişirme sayıları cihazdan silinecek. Devam edilsin mi?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
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
              Alert.alert("Tamam", "Yerel veriler temizlendi.");
            })();
          },
        },
      ],
    );
  };

  const deleteAccount = () => {
    Alert.alert(
      "Hesabımı sil",
      "Hesabını silmek için lütfen destek ile iletişime geç: destek@swipebite.app",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "E-posta gönder",
          onPress: () =>
            Linking.openURL(
              "mailto:destek@swipebite.app?subject=Hesap%20silme%20talebi",
            ),
        },
        {
          text: "Çıkış yap",
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
            Gizlilik
          </Text>
          <Text variant="caption" color={colors.dim}>
            Verilerin nerede, ne için tutuluyor
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
            title="Hangi veriler tutuluyor?"
            body="Ad, e-posta, hane üyelikleri, tarif beğenileri, kiler içeriği ve haftalık planın. Tarif kaynakları cihazda mock olarak gelir; gerçek hesabınla eşleşmez."
          />
          <InfoRow
            icon={Eye}
            title="Kim görebilir?"
            body="Hane üyelerin senin beğenilerini ve kileri görebilir. Diğer haneler veya kullanıcılar göremez. Hesap dışı kimseyle paylaşılmaz."
            border
          />
          <InfoRow
            icon={Lock}
            title="Güvenlik"
            body="Tüm istekler HTTPS üzerinden Supabase'e gider. Satır-düzeyi güvenlik (RLS) ile yalnızca senin haneye ait satırlar dönülür."
            border
          />
          <InfoRow
            icon={FileText}
            title="Üçüncü taraflar"
            body="Bildirimler için Expo Notifications, tarif önerileri için (opsiyonel) OpenAI API. OpenAI'a yalnızca anonim metin gönderilir."
            border
          />
        </View>

        <View style={[styles.card, { marginTop: spacing.lg }]}>
          <ActionRow
            icon={Trash2}
            label="Yerel verileri sil"
            sub="Kiler, plan, beğeniler — sadece bu cihazdan"
            danger={false}
            onPress={clearLocalData}
          />
          <ActionRow
            icon={Trash2}
            label="Hesabımı sil"
            sub="Tüm verilerin kalıcı olarak silinmesini talep et"
            danger
            border
            onPress={deleteAccount}
          />
        </View>

        <Text
          variant="caption"
          color={colors.dim}
          style={{ marginTop: spacing.lg, paddingHorizontal: spacing.sm }}
        >
          Sorun bildirmek için: destek@swipebite.app
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
