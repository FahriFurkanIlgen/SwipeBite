import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Check, Users } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";

export default function LobbyScreen() {
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);
  const session = useSessionStore((s) => s.session);
  const isLive = useSessionStore((s) => s.isLive);
  const lobby = useSessionStore((s) => s.lobby);
  const loadSession = useSessionStore((s) => s.loadSession);
  const markReady = useSessionStore((s) => s.markReady);
  const allReady = useSessionStore((s) => s.allReady);

  const [ready, setReady] = React.useState(false);

  // Hydrate the session from the backend if we arrived via a deep link.
  React.useEffect(() => {
    if (!routeId || !user) return;
    if (session?.id === routeId) return;
    void loadSession(routeId, user.id);
  }, [routeId, user, session?.id, loadSession]);

  // Solo / non-live sessions have no lobby — go straight to the deck.
  React.useEffect(() => {
    if (session?.id === routeId && !isLive) {
      router.replace(`/session/${routeId}`);
    }
  }, [session?.id, routeId, isLive]);

  // When everyone has readied up, everyone advances to the deck together.
  React.useEffect(() => {
    if (isLive && allReady()) {
      router.replace(`/session/${routeId}`);
    }
  }, [isLive, lobby, allReady, routeId]);

  const onReady = () => {
    setReady(true);
    markReady();
  };

  const participantIds = session?.participantIds ?? household?.memberIds ?? [];
  const readyById = React.useMemo(() => {
    const map = new Map<string, boolean>();
    for (const m of lobby) map.set(m.userId, m.ready);
    return map;
  }, [lobby]);

  const readyCount = participantIds.filter(
    (id) => readyById.get(id) || (id === user?.id && ready),
  ).length;
  const total = participantIds.length;

  return (
    <Screen background="bg" padded={false}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <ArrowLeft size={16} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <View>
          <Text
            style={{
              fontFamily: fonts.serif,
              fontSize: 24,
              color: colors.ink,
              letterSpacing: -0.4,
            }}
          >
            Bekleme Odası
          </Text>
          <Text variant="caption" color={colors.dim}>
            Herkes hazır olunca başlıyoruz
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Animated.View
          entering={FadeInDown.delay(60).duration(450)}
          style={styles.countCard}
        >
          <View style={styles.countIcon}>
            <Users size={20} color={colors.ink} strokeWidth={1.5} />
          </View>
          <Text
            style={{
              fontFamily: fonts.serif,
              fontSize: 30,
              color: colors.ink,
            }}
          >
            {readyCount}/{total}
          </Text>
          <Text variant="caption" color={colors.dim}>
            kişi hazır
          </Text>
        </Animated.View>

        <View style={styles.roster}>
          {participantIds.map((id, i) => {
            const isMe = id === user?.id;
            const isReady = readyById.get(id) || (isMe && ready);
            return (
              <Animated.View
                key={id}
                entering={FadeInDown.delay(120 + i * 50).duration(400)}
                style={styles.row}
              >
                <View style={styles.avatar}>
                  <Text
                    style={{
                      fontFamily: fonts.sansBold,
                      fontSize: 13,
                      color: colors.ink,
                    }}
                  >
                    {(isMe ? (user?.name ?? "S") : id).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text variant="bodyMedium" weight="600" style={{ flex: 1 }}>
                  {isMe ? "Sen" : "Eşin"}
                </Text>
                {isReady ? (
                  <View style={styles.readyPill}>
                    <Check size={13} color={colors.forest} strokeWidth={2.5} />
                    <Text variant="caption" weight="700" color={colors.forest}>
                      Hazır
                    </Text>
                  </View>
                ) : (
                  <Text variant="caption" color={colors.dim}>
                    Bekleniyor…
                  </Text>
                )}
              </Animated.View>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        {!ready ? (
          <Pressable onPress={onReady} style={styles.readyBtn}>
            <Text variant="bodyMedium" weight="700" color={colors.bg}>
              Hazırım
            </Text>
          </Pressable>
        ) : (
          <View style={styles.waitingBtn}>
            <Text variant="bodyMedium" weight="700" color={colors.slate}>
              Diğerleri bekleniyor…
            </Text>
          </View>
        )}
      </View>
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
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  countCard: {
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.xl,
    borderRadius: radii.hero,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  roster: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  readyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.forestSoft,
  },
  footer: {
    padding: spacing.xl,
  },
  readyBtn: {
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  waitingBtn: {
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
});
