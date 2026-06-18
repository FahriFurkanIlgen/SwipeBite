import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, RotateCcw } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { CocktailSwipeCard } from "@/features/bar/CocktailSwipeCard";
import { SwipeActions } from "@/features/swipe/SwipeActions";
import { matchCocktail } from "@/features/bar/cocktailMatcher";
import { useAuthStore } from "@/store/authStore";
import { useBarCabinetStore } from "@/store/barCabinetStore";
import { useBarSessionStore } from "@/store/barSessionStore";
import type { BarSessionFilterMode, BarVoteType } from "@/types/bar";

const VALID_MODES: BarSessionFilterMode[] = ["cookable", "close", "all"];

const FILTER_LABEL: Record<BarSessionFilterMode, string> = {
  cookable: "Ready to make",
  close: "Within reach",
  all: "All cocktails",
};

export default function BarSessionScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const requestedMode: BarSessionFilterMode = (() => {
    const m = params.mode;
    if (
      typeof m === "string" &&
      VALID_MODES.includes(m as BarSessionFilterMode)
    ) {
      return m as BarSessionFilterMode;
    }
    return "close";
  })();

  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);

  const cabinetIds = useBarCabinetStore((s) => s.ingredientIds);
  const cabinetHydrated = useBarCabinetStore((s) => s.hydrated);
  const hydrateCabinet = useBarCabinetStore((s) => s.hydrate);

  const session = useBarSessionStore((s) => s.session);
  const candidates = useBarSessionStore((s) => s.candidates);
  const index = useBarSessionStore((s) => s.index);
  const votes = useBarSessionStore((s) => s.votes);
  const sessionHydrated = useBarSessionStore((s) => s.hydrated);
  const hydrateSession = useBarSessionStore((s) => s.hydrate);
  const startSession = useBarSessionStore((s) => s.startSession);
  const vote = useBarSessionStore((s) => s.vote);
  const next = useBarSessionStore((s) => s.next);
  const undo = useBarSessionStore((s) => s.undo);
  const finalize = useBarSessionStore((s) => s.finalize);

  // Hydrate both stores on mount.
  React.useEffect(() => {
    if (!cabinetHydrated) void hydrateCabinet();
    if (!sessionHydrated) void hydrateSession();
  }, [cabinetHydrated, sessionHydrated, hydrateCabinet, hydrateSession]);

  const ownedSet = React.useMemo(() => new Set(cabinetIds), [cabinetIds]);

  // Once both stores are hydrated, ensure a session exists with the right
  // filter mode. If the prior session had a different mode, restart.
  const startedRef = React.useRef(false);
  React.useEffect(() => {
    if (!cabinetHydrated || !sessionHydrated) return;
    if (!user) return;
    if (startedRef.current) return;
    const needsNewSession =
      !session ||
      session.status !== "active" ||
      session.filterMode !== requestedMode;
    if (needsNewSession) {
      const result = startSession({
        ownerId: user.id,
        participantIds: household?.memberIds,
        householdId: household?.id,
        filterMode: requestedMode,
        ownedIds: ownedSet,
      });
      if (!result) {
        // No deck could be built — bounce back.
        router.replace("/(tabs)/bar");
        return;
      }
    }
    startedRef.current = true;
  }, [
    cabinetHydrated,
    sessionHydrated,
    user,
    household,
    session,
    requestedMode,
    ownedSet,
    startSession,
  ]);

  // Progress bar
  const totalCount = candidates.length || 1;
  const progress = Math.min(index / totalCount, 1);
  const progressValue = useSharedValue(0);
  React.useEffect(() => {
    progressValue.value = withSpring(progress, { stiffness: 200, damping: 30 });
  }, [progress, progressValue]);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  // Guard against double-fire (gesture animateOut + button tap).
  const votingRef = React.useRef(false);
  const lastVotedIdRef = React.useRef<string | null>(null);

  const handleVote = (voteType: BarVoteType) => {
    if (!user) return;
    if (votingRef.current) return;
    // Map "superdislike" — only used by recipe deck — back to dislike.
    const safeType: BarVoteType =
      voteType === "like" || voteType === "superlike" ? voteType : "dislike";
    const fresh = useBarSessionStore.getState();
    const current = fresh.candidates[fresh.index];
    if (!current) return;
    if (lastVotedIdRef.current === current.id) return;

    votingRef.current = true;
    lastVotedIdRef.current = current.id;
    try {
      vote(user.id, current.id, safeType);
      next();
      const newIndex = fresh.index + 1;
      if (newIndex >= fresh.candidates.length) {
        const result = finalize();
        if (result) {
          router.replace(`/bar/match/${result.id}`);
        } else {
          // No likes → bounce back to the bar tab with a quick toast-less
          // empty signal (UI shows the empty state on next mount).
          router.replace("/(tabs)/bar");
        }
      }
    } finally {
      setTimeout(() => {
        votingRef.current = false;
      }, 0);
    }
  };

  // RecipeCard's SwipeActions emits 4 vote types; we collapse to 3 here.
  const handleSwipeAction = (vt: BarVoteType | "superdislike") => {
    if (vt === "superdislike") handleVote("dislike");
    else handleVote(vt);
  };

  const memberIds = session?.participantIds ?? household?.memberIds ?? [];
  const myLikes = React.useMemo(
    () =>
      votes.filter(
        (v) =>
          v.userId === user?.id &&
          (v.voteType === "like" || v.voteType === "superlike"),
      ).length,
    [votes, user?.id],
  );

  const stack = React.useMemo(
    () =>
      candidates
        .slice(index, index + 3)
        .map((cocktail, i) => ({ cocktail, i })),
    [candidates, index],
  );

  if (!sessionHydrated || !cabinetHydrated || !candidates.length) {
    return (
      <Screen background="bg">
        <View style={styles.empty}>
          <Text variant="h2" weight="700" align="center">
            Building your deck…
          </Text>
        </View>
      </Screen>
    );
  }

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

        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <View style={styles.subRow}>
            <Text variant="caption" color={colors.dim}>
              {index}/{candidates.length} cocktails
            </Text>
            <View style={styles.modePill}>
              <Text variant="caption" weight="700" color={colors.ink}>
                {FILTER_LABEL[requestedMode]}
              </Text>
            </View>
            {myLikes > 0 ? (
              <View style={styles.likePill}>
                <Text variant="caption" weight="700" color={colors.ink}>
                  ♥ {myLikes}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={() => undo()}
          style={[styles.backBtn, { opacity: index === 0 ? 0.35 : 1 }]}
          disabled={index === 0}
          hitSlop={12}
        >
          <RotateCcw size={16} color={colors.ink} strokeWidth={2} />
        </Pressable>

        <View style={styles.avatars}>
          {memberIds.slice(0, 3).map((id, i) => (
            <View
              key={id}
              style={[
                styles.avatar,
                { marginLeft: i === 0 ? 0 : -6, zIndex: 10 - i },
              ]}
            >
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 11,
                  color: colors.ink,
                }}
              >
                {id.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.stack}>
        {stack
          .slice()
          .reverse()
          .map(({ cocktail, i }) => {
            const isTop = i === 0;
            const m = matchCocktail(cocktail, ownedSet);
            return (
              <CocktailSwipeCard
                key={cocktail.id}
                cocktail={cocktail}
                match={m}
                stackOffset={i}
                interactive={isTop}
                onVote={isTop ? handleVote : undefined}
              />
            );
          })}
      </View>

      <View style={styles.footer}>
        <SwipeActions onVote={handleSwipeAction} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cream,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  likePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  stack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingBottom: spacing["2xl"],
    paddingTop: spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
});
