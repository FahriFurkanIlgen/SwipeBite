import React from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Check, Sparkles, X } from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, radii, spacing } from "@/constants/theme";
import { L } from "@/constants/appVariant";
import { PRIVACY_URL, TERMS_URL } from "@/constants/legal";
import { track } from "@/features/analytics/analyticsService";
import {
  billingService,
  type ResolvedPlan,
} from "@/features/billing/billingService";
import { PRO_BENEFITS, type PlanPeriod } from "@/features/billing/plans";
import { useEntitlementsStore } from "@/store/entitlementsStore";

export default function PaywallScreen() {
  const setTier = useEntitlementsStore((s) => s.setTier);
  const [plans, setPlans] = React.useState<ResolvedPlan[]>([]);
  const [selected, setSelected] = React.useState<PlanPeriod>("yearly");
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    track("paywall_shown", {});
    let active = true;
    void billingService.offerings().then((p) => {
      if (!active) return;
      setPlans(p);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const unlockPro = async () => {
    await setTier("pro");
    Alert.alert(
      L("SwipeBite Pro aktif", "SwipeBar Pro active"),
      L(
        "Artık tüm AI özellikleri sınırsız.",
        "All AI features are now unlimited.",
      ),
    );
    router.back();
  };

  const handlePurchase = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await billingService.purchase(selected);
      if (res.entitled) {
        await unlockPro();
      } else if (!res.cancelled && res.error) {
        Alert.alert(L("Satın alma", "Purchase"), res.error);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await billingService.restore();
      if (res.entitled) {
        await unlockPro();
      } else {
        Alert.alert(
          L("Geri yükleme", "Restore"),
          L(
            "Bu hesapta aktif bir Pro aboneliği bulunamadı.",
            "No active Pro subscription found on this account.",
          ),
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen background="bg" padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <X size={20} strokeWidth={2} color={colors.slate} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Sparkles size={26} strokeWidth={2} color={colors.ink} />
          </View>
          <Text variant="overline" color={colors.dim}>
            {L("SwipeBite Pro", "SwipeBar Pro")}
          </Text>
          <Text variant="h1" style={{ marginTop: 4, textAlign: "center" }}>
            {L("Mutfakta sınırsız yardım", "Unlimited help at the bar")}
          </Text>
          <Text
            variant="body"
            color={colors.slate}
            style={{
              marginTop: spacing.xs,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            {L(
              "Eksik malzemeyi sana göre tarife çevir, haftalık planını AI kursun — limit yok.",
              "Adapt recipes to what you have and let AI build your weekly plan — no limits.",
            )}
          </Text>
        </View>

        <View style={styles.benefits}>
          {PRO_BENEFITS.map((b) => (
            <View key={b} style={styles.benefitRow}>
              <View style={styles.benefitTick}>
                <Check size={13} strokeWidth={2.6} color={colors.forest} />
              </View>
              <Text
                variant="smallMedium"
                color={colors.ink}
                style={{ flex: 1, lineHeight: 20 }}
              >
                {b}
              </Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.ink}
            style={{ marginTop: spacing.xl }}
          />
        ) : (
          <View style={styles.plans}>
            {plans.map((p, i) => {
              const active = p.id === selected;
              return (
                <Animated.View key={p.id} entering={FadeInDown.delay(i * 70)}>
                  <Pressable
                    onPress={() => setSelected(p.id)}
                    style={[styles.planCard, active && styles.planCardActive]}
                  >
                    <View style={styles.radio}>
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.planHeader}>
                        <Text
                          variant="bodyMedium"
                          weight="700"
                          color={colors.ink}
                        >
                          {p.label}
                        </Text>
                        {p.badge ? (
                          <View style={styles.badge}>
                            <Text
                              variant="caption"
                              weight="600"
                              color={colors.ink}
                            >
                              {p.badge}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text variant="small" color={colors.slate}>
                        {p.price}
                        {p.subline ? ` · ${p.subline}` : ""}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={handlePurchase}
          disabled={busy || loading}
          style={[styles.cta, (busy || loading) && styles.ctaDisabled]}
        >
          {busy ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text variant="bodyMedium" weight="700" color={colors.ink}>
              {L("Pro'ya geç", "Go Pro")}
            </Text>
          )}
        </Pressable>

        {!billingService.isConfigured() ? (
          <Text
            variant="caption"
            color={colors.dim}
            style={{ textAlign: "center", marginTop: spacing.sm }}
          >
            {L("Test modu — gerçek ödeme alınmaz.", "Test mode — no real charge.")}
          </Text>
        ) : null}

        <Pressable onPress={handleRestore} hitSlop={8} style={styles.restore}>
          <Text variant="small" color={colors.dim}>
            {L("Satın alımları geri yükle", "Restore purchases")}
          </Text>
        </Pressable>

        <Text
          variant="caption"
          color={colors.dim}
          style={{ textAlign: "center", marginTop: spacing.xs, lineHeight: 18 }}
        >
          {L(
            "SwipeBite Pro, seçtiğin döneme (aylık veya yıllık) göre ücretlendirilir ve dönem sonunda otomatik yenilenir. Ödeme, satın alma onayında Apple Kimliği hesabından tahsil edilir. Abonelik, mevcut dönem bitmeden en az 24 saat önce iptal edilmezse otomatik yenilenir. Aboneliği istediğin zaman cihazının Ayarlar → Apple Kimliği → Abonelikler bölümünden yönetebilir veya iptal edebilirsin.",
            "SwipeBar Pro is billed for your selected period (monthly or yearly) and renews automatically at the end of the period. Payment is charged to your Apple ID account at confirmation of purchase. The subscription renews automatically unless canceled at least 24 hours before the end of the current period. You can manage or cancel your subscription anytime in your device's Settings → Apple ID → Subscriptions.",
          )}
        </Text>

        <View style={styles.legalRow}>
          <Pressable
            onPress={() => Linking.openURL(TERMS_URL).catch(() => undefined)}
            hitSlop={8}
          >
            <Text variant="caption" color={colors.slate} style={styles.legalLink}>
              Kullanım Koşulları (EULA)
            </Text>
          </Pressable>
          <Text variant="caption" color={colors.dim}>
            ·
          </Text>
          <Pressable
            onPress={() => Linking.openURL(PRIVACY_URL).catch(() => undefined)}
            hitSlop={8}
          >
            <Text variant="caption" color={colors.slate} style={styles.legalLink}>
              Gizlilik Politikası
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: spacing.md,
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  benefits: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  benefitTick: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.forestSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  plans: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  planCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  cta: {
    marginTop: spacing.xl,
    height: 54,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  restore: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  legalLink: {
    textDecorationLine: "underline",
  },
});
