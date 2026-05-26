import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, Screen, Text } from "@/components/ui";
import { RecipeCard } from "@/features/swipe/RecipeCard";
import { SwipeActions } from "@/features/swipe/SwipeActions";
import { colors, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { scoreRecipes } from "@/features/ai/recommendationEngine";
import { usePantryStore } from "@/store/pantryStore";
import { VoteType } from "@/types/domain";

export default function SessionScreen() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const candidates = useSessionStore((s) => s.candidates);
  const index = useSessionStore((s) => s.index);
  const votes = useSessionStore((s) => s.votes);
  const vote = useSessionStore((s) => s.vote);
  const next = useSessionStore((s) => s.next);
  const finalize = useSessionStore((s) => s.finalize);
  const pantry = usePantryStore((s) => s.items);

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

  const handleVote = (type: VoteType) => {
    if (!user) return;
    const current = candidates[index];
    if (!current) return;
    vote(user.id, current.id, type);
    const newIndex = index + 1;
    next();
    if (newIndex >= candidates.length) {
      const match = finalize();
      if (match) router.replace(`/match/${match.id}`);
      else router.replace("/(tabs)");
    }
  };

  if (!candidates.length) {
    return (
      <Screen background="snow">
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
          <Button
            title={t.common.back}
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  // Render up to 3 cards stacked (top is interactive)
  const stack = enriched.slice(index, index + 3).map((rec, i) => ({ rec, i }));

  return (
    <Screen background="snow">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <View>
          <Text
            variant="caption"
            weight="600"
            color={colors.slate}
            align="center"
          >
            {t.swipe.sessionTitle.toUpperCase()}
          </Text>
          <Text variant="bodyMedium" weight="700" align="center">
            {index + 1} / {candidates.length}
          </Text>
        </View>
        <View style={{ width: 26 }} />
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
        <Text
          variant="caption"
          color={colors.slate}
          align="center"
          style={{ marginTop: spacing.sm }}
        >
          {t.swipe.swipeHint}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  stack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { paddingVertical: spacing.lg },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing["2xl"],
  },
});
