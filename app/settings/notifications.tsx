import React from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { ArrowLeft, Bell, Moon, Users } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, spacing } from "@/constants/theme";
import { pushService } from "@/features/notifications/pushService";
import { findCookableRecipes } from "@/features/pantry/pantryMatcher";
import { usePantryStore } from "@/store/pantryStore";
import { useRecipesStore } from "@/store/recipesStore";

const KIND_DINNER = "dinner_nudge";
const KIND_PARTNER = "partner_waiting";
const KIND_MATCH = "match_found";

export default function NotificationsScreen() {
  const [permission, setPermission] = React.useState<
    "granted" | "denied" | "undetermined"
  >("undetermined");
  const [dinner, setDinner] = React.useState(false);
  const [partner, setPartner] = React.useState(true);
  const [match, setMatch] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const p = await Notifications.getPermissionsAsync();
    setPermission(
      p.status === "granted"
        ? "granted"
        : p.status === "denied"
          ? "denied"
          : "undetermined",
    );
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    setDinner(
      scheduled.some(
        (n) =>
          (n.content.data as { kind?: string } | null)?.kind === KIND_DINNER,
      ),
    );
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleDinner = async (val: boolean) => {
    setBusy(true);
    try {
      if (val) {
        const ok = await pushService.requestPermission();
        if (!ok) {
          Alert.alert(
            "İzin gerekli",
            "Bildirim izni vermek için sistem ayarlarını açmak ister misin?",
            [
              { text: "Vazgeç", style: "cancel" },
              { text: "Ayarları aç", onPress: () => Linking.openSettings() },
            ],
          );
          return;
        }
        // scheduleDinnerNudge() is idempotent (cancels existing dinner
        // nudges first) — safe to call without manual cleanup here.
        const titles = findCookableRecipes(
          usePantryStore.getState().items,
          useRecipesStore.getState().items,
          { minCoverage: 50, limit: 3 },
        ).map((c) => c.recipe.title);
        await pushService.scheduleDinnerNudge(titles);
      } else {
        const scheduled =
          await Notifications.getAllScheduledNotificationsAsync();
        for (const n of scheduled) {
          if (
            (n.content.data as { kind?: string } | null)?.kind === KIND_DINNER
          )
            await pushService.cancel(n.identifier);
        }
      }
      await refresh();
    } finally {
      setBusy(false);
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
              fontSize: 22,
              color: colors.ink,
              letterSpacing: -0.4,
            }}
          >
            Bildirimler
          </Text>
          <Text variant="caption" color={colors.dim}>
            Ne zaman duyalım, ne zaman susalım
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {permission === "denied" ? (
          <Pressable
            onPress={() => Linking.openSettings()}
            style={styles.permissionCard}
          >
            <Text variant="smallMedium" weight="600" color={colors.accent}>
              Bildirim izni kapalı
            </Text>
            <Text variant="caption" color={colors.dim} style={{ marginTop: 4 }}>
              Sistem ayarlarından SwipeBite için bildirimleri aç.
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.card}>
          <ToggleRow
            icon={Moon}
            label="Kiler yemek önerileri"
            sub="Her gün 17:00'de kilerindeki malzemelerle yapabileceğin yemekler"
            value={dinner}
            disabled={busy || permission === "denied"}
            onValueChange={toggleDinner}
          />
          <ToggleRow
            icon={Users}
            label="Eşin bekliyor"
            sub="Oturum başlayınca diğer kişiye haber"
            value={partner}
            disabled
            onValueChange={setPartner}
            border
          />
          <ToggleRow
            icon={Bell}
            label="Eşleşme bildirimi"
            sub="Yeni bir tarifte buluştuğunuzda"
            value={match}
            disabled
            onValueChange={setMatch}
            border
          />
        </View>

        <Text
          variant="caption"
          color={colors.dim}
          style={{ marginTop: spacing.md, paddingHorizontal: spacing.sm }}
        >
          Eşin bekliyor ve eşleşme bildirimleri otomatik gönderilir;
          oturum/eşleşme olduğunda devreye girer.
          {Platform.OS === "ios"
            ? " iOS'ta gerçek cihaz gerekir; simülatörde bildirim çalışmaz."
            : ""}
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

interface ToggleRowProps {
  icon: LucideIcon;
  label: string;
  sub: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (v: boolean) => void;
  border?: boolean;
}
const ToggleRow: React.FC<ToggleRowProps> = ({
  icon: Icon,
  label,
  sub,
  value,
  disabled,
  onValueChange,
  border,
}) => (
  <View
    style={[
      styles.row,
      border && { borderTopWidth: 1, borderTopColor: colors.cream },
    ]}
  >
    <View style={styles.rowIcon}>
      <Icon size={14} color={colors.slate} strokeWidth={1.5} />
    </View>
    <View style={{ flex: 1 }}>
      <Text variant="smallMedium" weight="500">
        {label}
      </Text>
      <Text variant="caption" color={colors.dim} style={{ marginTop: 2 }}>
        {sub}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.cream, true: colors.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.cream}
    />
  </View>
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
  permissionCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
