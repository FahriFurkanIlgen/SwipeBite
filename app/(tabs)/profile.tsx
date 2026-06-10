import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import {
  Bell,
  ChevronRight,
  Edit3,
  HelpCircle,
  Lightbulb,
  LogOut,
  Settings2,
  Shield,
  Sparkles,
  Wine,
  type LucideIcon,
} from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { CoachMark } from "@/components/ui/CoachMark";
import { AgeGateModal } from "@/features/bar/AgeGateModal";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { featureFlags } from "@/constants/featureFlags";
import { useAuthStore } from "@/store/authStore";
import { useRecipesStore } from "@/store/recipesStore";
import { usePantryStore } from "@/store/pantryStore";
import { useSessionStore } from "@/store/sessionStore";
import { useStatsStore } from "@/store/statsStore";
import { useTutorialStore } from "@/store/tutorialStore";
import { useEntitlementsStore } from "@/store/entitlementsStore";

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const household = useAuthStore((s) => s.household);
  const signOut = useAuthStore((s) => s.signOut);
  const refreshHousehold = useAuthStore((s) => s.refreshHousehold);
  const cookCounts = useStatsStore((s) => s.cookCounts);
  const favorites = useStatsStore((s) => s.favorites);
  const recipes = useRecipesStore((s) => s.items);
  const pantryItems = usePantryStore((s) => s.items);
  const session = useSessionStore((s) => s.session);

  // Re-fetch household membership whenever the profile tab gains focus so a
  // partner who joined via invite code shows up without an app restart (there
  // is no realtime subscription on household_members).
  useFocusEffect(
    React.useCallback(() => {
      void refreshHousehold();
    }, [refreshHousehold]),
  );

  const resetTutorials = useTutorialStore((s) => s.resetAll);
  const handleResetTutorial = React.useCallback(() => {
    void resetTutorials();
    router.push("/(onboarding)/tutorial");
  }, [resetTutorials]);

  const setProfile = useAuthStore((s) => s.setProfile);
  const alcoholFlag = profile?.alcoholContentEnabled;
  const [barGateOpen, setBarGateOpen] = React.useState(false);

  // Hidden developer toggle: long-press the footer to flip the Pro tier so we
  // can test with/without AI quotas before a real paywall exists (Faz 2).
  const tier = useEntitlementsStore((s) => s.tier);
  const setTier = useEntitlementsStore((s) => s.setTier);
  const handleTierToggle = React.useCallback(() => {
    void setTier(tier === "pro" ? "free" : "pro");
  }, [tier, setTier]);

  const handleBarToggle = React.useCallback(() => {
    if (alcoholFlag === true) {
      // Disable Bar mode immediately — no extra prompt.
      setProfile({ alcoholContentEnabled: false });
    } else {
      // Re-enable: require the 18+ confirmation again.
      setBarGateOpen(true);
    }
  }, [alcoholFlag, setProfile]);

  const totalCooked = Object.values(cookCounts).reduce((a, b) => a + b, 0);
  const sessionsRun = session ? 1 : 0;
  const savedRecipes = React.useMemo(
    () =>
      favorites
        .map((id) => recipes.find((r) => r.id === id))
        .filter((r): r is NonNullable<typeof r> => !!r),
    [favorites, recipes],
  );

  return (
    <Screen background="bg" padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 24,
                  color: colors.ink,
                }}
              >
                {(user?.name ?? "S").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.avatarEdit}>
              <Edit3 size={11} color={colors.ink} strokeWidth={2} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h3">{user?.name ?? "Misafir"}</Text>
            <Text variant="small" color={colors.dim} style={{ marginTop: 2 }}>
              {user?.email ?? "—"}
            </Text>
            {household ? (
              <View style={styles.householdBadge}>
                <View style={styles.dot} />
                <Text variant="caption" weight="600" color={colors.slate}>
                  {household.name}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Household */}
        {household ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text variant="overline" color={colors.dim}>
                Ev Halkı
              </Text>
              <Pressable onPress={() => router.push("/invite")}>
                <Text
                  variant="smallMedium"
                  weight="600"
                  color={colors.primaryDeep}
                >
                  + Davet et
                </Text>
              </Pressable>
            </View>
            <View style={styles.householdRow}>
              <View style={styles.memberItem}>
                <View style={styles.memberAvatarWrap}>
                  <View style={styles.memberAvatar}>
                    <Text
                      style={{
                        fontFamily: fonts.sans,
                        fontWeight: "700",
                        color: colors.ink,
                      }}
                    >
                      {(user?.name ?? "S").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.onlineDot} />
                </View>
                <Text variant="caption" weight="500">
                  {user?.name ?? "Sen"}
                </Text>
                <View style={[styles.rolePill, styles.rolePillMe]}>
                  <Text
                    variant="caption"
                    weight="600"
                    color={colors.primaryDeep}
                  >
                    Sen
                  </Text>
                </View>
              </View>
              {household.memberIds.slice(1).map((id) => (
                <View key={id} style={styles.memberItem}>
                  <View style={styles.memberAvatarWrap}>
                    <View
                      style={[
                        styles.memberAvatar,
                        { backgroundColor: colors.cream },
                      ]}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.sans,
                          fontWeight: "700",
                          color: colors.slate,
                        }}
                      >
                        {id.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.onlineDot} />
                  </View>
                  <Text variant="caption" weight="500">
                    {id.slice(0, 4)}
                  </Text>
                  <View style={[styles.rolePill, styles.rolePillOther]}>
                    <Text variant="caption" weight="600" color={colors.dim}>
                      Eş
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Preferences */}
        <View>
          <View style={styles.sectionHeader}>
            <Text variant="overline" color={colors.dim}>
              Tercihlerim
            </Text>
            <Pressable onPress={() => router.push("/(onboarding)/preferences")}>
              <Text
                variant="smallMedium"
                weight="600"
                color={colors.primaryDeep}
              >
                Düzenle
              </Text>
            </Pressable>
          </View>
          <View style={styles.chipWrap}>
            {(profile?.favoriteCuisines ?? []).map((c) => (
              <View key={c} style={styles.prefChip}>
                <Text variant="smallMedium" color={colors.ink}>
                  {c}
                </Text>
              </View>
            ))}
            {(profile?.allergies ?? []).map((a) => (
              <View key={a} style={[styles.prefChip, styles.prefChipMute]}>
                <Text
                  variant="smallMedium"
                  color={colors.hairline}
                  style={{ textDecorationLine: "line-through" }}
                >
                  {a}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Saved */}
        {savedRecipes.length > 0 ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text variant="overline" color={colors.dim}>
                Kaydedilenler
              </Text>
              <Text
                variant="smallMedium"
                weight="600"
                color={colors.primaryDeep}
              >
                {savedRecipes.length} tarif
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {savedRecipes.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => router.push(`/recipe/${r.id}`)}
                  style={styles.savedItem}
                >
                  <Image
                    source={{ uri: r.imageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Pro */}
        <Pressable
          onPress={() => router.push("/paywall")}
          style={[
            styles.proCard,
            tier === "pro" && { backgroundColor: colors.forestSoft },
          ]}
        >
          <View style={styles.proIcon}>
            <Sparkles size={18} strokeWidth={2} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" weight="700" color={colors.ink}>
              {tier === "pro" ? "SwipeBite Pro · Aktif" : "SwipeBite Pro"}
            </Text>
            <Text variant="small" color={colors.slate}>
              {tier === "pro"
                ? "Tüm AI özellikleri sınırsız"
                : "Sınırsız AI · reklamsız · tüm aile"}
            </Text>
          </View>
          {tier !== "pro" ? (
            <ChevronRight size={18} color={colors.slate} strokeWidth={2} />
          ) : null}
        </Pressable>

        {/* Settings */}
        <View style={styles.settingsCard}>
          <SettingsRow
            icon={Settings2}
            label="Aile Tercihleri"
            sub="Haftalık plan için detaylı ayarlar"
            onPress={() => router.push("/settings/preferences")}
          />
          <SettingsRow
            icon={Bell}
            label="Bildirimler"
            sub="Eşleşme bildirimleri"
            border
            onPress={() => router.push("/settings/notifications")}
          />
          {featureFlags.bar ? (
            <SettingsRow
              icon={Wine}
              label="Bar modu"
              sub={
                alcoholFlag === true
                  ? "Açık · kokteyl tarifleri görünür"
                  : alcoholFlag === false
                    ? "Kapalı · alkollü içerik gizli"
                    : "Yaş onayı bekliyor"
              }
              border
              trailing={
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor:
                      alcoholFlag === true ? colors.primary : colors.cream,
                  }}
                >
                  <Text
                    variant="caption"
                    weight="600"
                    color={alcoholFlag === true ? colors.ink : colors.slate}
                  >
                    {alcoholFlag === true ? "Açık" : "Kapalı"}
                  </Text>
                </View>
              }
              onPress={handleBarToggle}
            />
          ) : null}
          <SettingsRow
            icon={Shield}
            label="Gizlilik"
            sub="Verileriniz"
            border
            onPress={() => router.push("/settings/privacy")}
          />
          <SettingsRow
            icon={HelpCircle}
            label="Yardım"
            sub="SSS ve destek"
            border
            onPress={() => router.push("/settings/help")}
          />
          <SettingsRow
            icon={Lightbulb}
            label="Tanıtımı tekrar göster"
            sub="Uygulama turunu yeniden başlat"
            border
            onPress={handleResetTutorial}
          />
          <Pressable
            onPress={signOut}
            style={[
              styles.settingsRow,
              { borderTopWidth: 1, borderTopColor: colors.cream },
            ]}
          >
            <View
              style={[
                styles.settingsIcon,
                { backgroundColor: colors.accentSoft },
              ]}
            >
              <LogOut size={14} color={colors.accent} strokeWidth={1.5} />
            </View>
            <Text variant="smallMedium" weight="500" color={colors.accent}>
              {t.profile.signOut}
            </Text>
          </Pressable>
        </View>

        <Pressable onLongPress={handleTierToggle} delayLongPress={600}>
          <Text
            variant="caption"
            color={colors.dim}
            style={{ textAlign: "center", marginTop: spacing.lg }}
          >
            SwipeBite{tier === "pro" ? " Pro" : ""}
          </Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
      <CoachMark
        storageKey="inviteCoach"
        title="Aile üyesini davet et"
        description="Profilinden 'Eve davet et' diyerek bir bağlantı paylaş. Eşin/ailen aynı ev hesabına katıldığında birlikte kaydırıp eşleşebilirsiniz."
      />
      <AgeGateModal
        visible={featureFlags.bar && barGateOpen}
        onConfirm={() => {
          setProfile({ alcoholContentEnabled: true });
          setBarGateOpen(false);
        }}
        onDecline={() => {
          setProfile({ alcoholContentEnabled: false });
          setBarGateOpen(false);
        }}
      />
    </Screen>
  );
}

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  sub: string;
  border?: boolean;
  /** Optional element rendered on the right side instead of the chevron. */
  trailing?: React.ReactNode;
  onPress?: () => void;
}
const SettingsRow: React.FC<SettingsRowProps> = ({
  icon: Icon,
  label,
  sub,
  border,
  trailing,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.settingsRow,
      border && { borderTopWidth: 1, borderTopColor: colors.cream },
    ]}
  >
    <View style={styles.settingsIcon}>
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
    {trailing ?? (
      <ChevronRight size={14} color={colors.hairline} strokeWidth={1.5} />
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["3xl"],
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEdit: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  householdBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 4,
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  householdRow: { flexDirection: "row", gap: spacing.md },
  memberItem: { alignItems: "center", gap: 4 },
  memberAvatarWrap: { position: "relative" },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.forest,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginTop: 2,
  },
  rolePillMe: { backgroundColor: colors.primarySoft },
  rolePillOther: { backgroundColor: colors.cream },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  prefChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prefChipMute: { backgroundColor: colors.card },
  savedGrid: { flexDirection: "row", gap: 8 },
  savedItem: {
    width: 92,
    height: 92,
    borderRadius: 12,
    overflow: "hidden",
  },
  settingsCard: {
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  proCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  proIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
});
