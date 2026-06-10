import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { RecipeCard } from "@/features/swipe/RecipeCard";
import { SwipeActions } from "@/features/swipe/SwipeActions";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePantryStore } from "@/store/pantryStore";
import { sessionService } from "@/features/session/sessionService";
import { scoreRecipes } from "@/features/ai/recommendationEngine";
import {
  classifyCourse,
  COURSE_LABEL,
} from "@/features/recipes/recipeClassifier";
import { VoteType } from "@/types/domain";

export default function SessionScreen() {
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const household = useAuthStore((s) => s.household);
  const candidates = useSessionStore((s) => s.candidates);
  const index = useSessionStore((s) => s.index);
  const votes = useSessionStore((s) => s.votes);
  const session = useSessionStore((s) => s.session);
  const vote = useSessionStore((s) => s.vote);
  const next = useSessionStore((s) => s.next);
  const finalize = useSessionStore((s) => s.finalize);
  const extendDeck = useSessionStore((s) => s.extendDeck);
  const loadSession = useSessionStore((s) => s.loadSession);
  const pantry = usePantryStore((s) => s.items);
  const isLive = useSessionStore((s) => s.isLive);
  const lobby = useSessionStore((s) => s.lobby);
  const markFinished = useSessionStore((s) => s.markFinished);
  const allFinished = useSessionStore((s) => s.allFinished);
  const loadMatchFromRemote = useSessionStore((s) => s.loadMatchFromRemote);

  const [waiting, setWaiting] = React.useState(false);
  // If the route id doesn't match the in-memory session, try to load it from
  // the backend (deep link / cross-device invite flow).
  React.useEffect(() => {
    if (!routeId || !user) return;
    if (session?.id === routeId) return;
    void loadSession(routeId, user.id);
  }, [routeId, user, session?.id, loadSession]);

  // Waiting room coordination. Host computes the match once everyone has
  // finished; other members wait for the session row to flip to "completed"
  // and then pull the host-computed result.
  const isHost = session?.createdBy === user?.id;
  React.useEffect(() => {
    if (!waiting || !isLive || !session) return;
    if (isHost && allFinished()) {
      const m = finalize();
      if (m) router.replace(`/match/${m.id}`);
    }
  }, [waiting, isLive, session, isHost, lobby, allFinished, finalize]);

  React.useEffect(() => {
    if (!waiting || !isLive || !session || isHost) return;
    const unsub = sessionService.subscribeToSession(session.id, (status) => {
      if (status === "completed") {
        void loadMatchFromRemote(session.id).then((m) => {
          if (m) router.replace(`/match/${m.id}`);
        });
      }
    });
    return unsub;
  }, [waiting, isLive, session, isHost, loadMatchFromRemote]);

  const totalCount = candidates.length || 1;
  const progress = Math.min(index / totalCount, 1);
  const progressValue = useSharedValue(0);

  React.useEffect(() => {
    progressValue.value = withSpring(progress, { stiffness: 200, damping: 30 });
  }, [progress, progressValue]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const recommendations = React.useMemo(
    () =>
      scoreRecipes({
        recipes: candidates,
        profiles: profile ? [profile] : [],
        pantry,
        recentRecipeIds: [],
        votes,
      }),
    [candidates, profile, pantry, votes],
  );

  const enriched = React.useMemo(() => {
    const byId = new Map(recommendations.map((r) => [r.recipe.id, r]));
    return candidates.map((c) => byId.get(c.id));
  }, [candidates, recommendations]);

  const stack = React.useMemo(
    () => enriched.slice(index, index + 3).map((rec, i) => ({ rec, i })),
    [enriched, index],
  );

  // Guards against double-fire when a swipe gesture's animateOut callback
  // overlaps with a tap on the SwipeActions buttons (or any second invocation
  // dispatched before React re-renders with the advanced index).
  const votingRef = React.useRef(false);
  const lastVotedRecipeRef = React.useRef<string | null>(null);

  const handleVote = (type: VoteType) => {
    if (!user) return;
    if (votingRef.current) return;
    // Always read fresh state — `index`/`candidates` from the selector
    // closure can be stale across the 240ms swipe-out animation.
    const fresh = useSessionStore.getState();
    const liveIndex = fresh.index;
    const liveCandidates = fresh.candidates;
    const current = liveCandidates[liveIndex];
    if (!current) return;
    // Same recipe just voted on (e.g. animateOut firing after a button tap
    // already advanced the deck) → ignore.
    if (lastVotedRecipeRef.current === current.id) return;

    votingRef.current = true;
    lastVotedRecipeRef.current = current.id;
    try {
      vote(user.id, current.id, type);
      next();
      const newIndex = liveIndex + 1;
      if (newIndex >= liveCandidates.length) {
        const fresh2 = useSessionStore.getState();
        // Live session: finishing the deck drops you into the waiting room
        // until everyone else is done — the host then computes the match.
        if (fresh2.isLive) {
          fresh2.markFinished();
          setWaiting(true);
          return;
        }
        // Refill the deck if the user hasn't liked anything yet — keep
        // suggesting rather than dead-ending on "no match".
        const after = useSessionStore.getState();
        const hasPositive = after.votes.some(
          (v) => v.voteType === "like" || v.voteType === "superlike",
        );
        if (!hasPositive) {
          const added = extendDeck();
          if (added > 0) return;
        }
        const match = finalize();
        if (match) router.replace(`/match/${match.id}`);
        else router.replace("/(tabs)");
      }
    } finally {
      // Release on the next tick so a stale animateOut callback firing in the
      // same frame can't sneak through.
      setTimeout(() => {
        votingRef.current = false;
      }, 0);
    }
  };

  const memberIds = session?.participantIds ?? household?.memberIds ?? [];

  if (waiting) {
    const finishedCount = lobby.filter((m) => m.finished).length;
    const total = session?.participantIds.length ?? 1;
    return (
      <Screen background="bg">
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text variant="h2" weight="700" align="center">
            Oylarını tamamladın
          </Text>
          <Text
            variant="body"
            color={colors.slate}
            align="center"
            style={{ maxWidth: 300 }}
          >
            Sonuçlar bekleniyor — diğerleri seçimlerini bitirince eşleşmeyi
            birlikte göreceksiniz.
          </Text>
          <View style={styles.waitCountPill}>
            <Text variant="smallMedium" weight="700" color={colors.ink}>
              {finishedCount}/{total} kişi bitirdi
            </Text>
          </View>
        </View>
      </Screen>
    );
  }

  if (!candidates.length) {
    return (
      <Screen background="bg">
        <View style={styles.empty}>
          <Text variant="h2" weight="700" align="center">
            {t.swipe.emptyTitle}
          </Text>
          <Text
            variant="body"
            color={colors.slate}
            align="center"
            style={{ maxWidth: 280 }}
          >
            {t.swipe.emptySubtitle}
          </Text>
          <Pressable onPress={() => router.back()} style={styles.emptyBtn}>
            <Text variant="bodyMedium" weight="700" color={colors.ink}>
              {t.common.back}
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const currentRecipe = candidates[index];
  const currentCourse = currentRecipe ? classifyCourse(currentRecipe) : null;
  const showCoursePill = session?.mealPlan === "aksam" && currentCourse;

  // Live vote tally for the top card — surfaces other members' choices in
  // multi-user sessions so you know who else has weighed in.
  const totalParticipants = session?.participantIds?.length ?? 1;
  const currentLikes = React.useMemo(() => {
    if (!currentRecipe) return 0;
    const likers = new Set<string>();
    for (const v of votes) {
      if (
        v.recipeId === currentRecipe.id &&
        (v.voteType === "like" || v.voteType === "superlike")
      ) {
        likers.add(v.userId);
      }
    }
    return likers.size;
  }, [votes, currentRecipe]);
  const showVoteBadge = totalParticipants >= 2 && currentLikes > 0;

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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text variant="caption" color={colors.dim}>
              {index}/{candidates.length} tarif
            </Text>
            {showCoursePill ? (
              <View style={styles.coursePill}>
                <Text variant="caption" weight="700" color={colors.ink}>
                  {COURSE_LABEL[currentCourse]}
                </Text>
              </View>
            ) : null}
            {showVoteBadge ? (
              <View style={styles.voteBadge}>
                <Text variant="caption" weight="700" color={colors.ink}>
                  ♥ {currentLikes}/{totalParticipants}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

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
          .map(({ rec, i }) => {
            if (!rec) return null;
            const isTop = i === 0;
            return (
              <RecipeCard
                key={rec.recipe.id}
                recipe={rec.recipe}
                pantryMatchPercent={rec.pantryMatchPercent}
                householdCompatibilityPercent={
                  rec.householdCompatibilityPercent
                }
                aiNote={rec.explanation}
                stackOffset={i}
                interactive={isTop}
                onVote={isTop ? handleVote : undefined}
              />
            );
          })}
      </View>

      <View style={styles.footer}>
        <SwipeActions onVote={handleVote} />
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
    backgroundColor: colors.muted,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  coursePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  voteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  stack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing["2xl"],
  },
  emptyBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  waitCountPill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
  },
});
