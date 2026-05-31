import { create } from "zustand";
import {
  MatchResult,
  MealPlan,
  Recipe,
  SessionStatus,
  SwipeSession,
  Vote,
  VoteType,
} from "@/types/domain";
import { computeMatch } from "@/features/ai/matchEngine";
import {
  buildDeckForMealPlan,
  Course,
  recommendMealPlanForNow,
} from "@/features/recipes/recipeClassifier";
import { useAuthStore } from "@/store/authStore";
import { usePantryStore } from "@/store/pantryStore";
import { useRecipesStore } from "@/store/recipesStore";
import { useStatsStore } from "@/store/statsStore";
import { sessionService } from "@/features/session/sessionService";
import { pushService } from "@/features/notifications/pushService";
import { uuidV4 } from "@/utils/id";

interface SessionState {
  session: SwipeSession | null;
  candidates: Recipe[];
  index: number;
  votes: Vote[];
  match: MatchResult | null;
  unsubscribe: (() => void) | null;
  startSession: (
    householdId: string,
    userId: string,
    participantIds?: string[],
    seedRecipeIds?: string[],
    mealPlan?: MealPlan,
    includeCourses?: Course[],
  ) => void;
  /**
   * Join a session by id (deep link / invite). Loads server row, rebuilds
   * deck from persisted recipe ids, hydrates votes and subscribes to
   * realtime updates. Returns true if hydration succeeded.
   */
  loadSession: (sessionId: string, userId: string) => Promise<boolean>;
  vote: (userId: string, recipeId: string, voteType: VoteType) => void;
  applyRemoteVote: (vote: Vote) => void;
  next: () => void;
  /**
   * Append a fresh batch of unseen recipes onto `candidates`. Used when the
   * deck is exhausted but the user hasn't liked anything yet — we'd rather
   * keep suggesting than dead-end on "no match".
   * Returns the number of recipes appended (0 = no more available).
   */
  extendDeck: () => number;
  finalize: () => MatchResult | null;
  reset: () => void;
  setStatus: (status: SessionStatus) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  candidates: [],
  index: 0,
  votes: [],
  match: null,
  unsubscribe: null,
  startSession: (
    householdId,
    userId,
    participantIds = [userId],
    seedRecipeIds,
    mealPlan,
    includeCourses,
  ) => {
    // Tear down any prior subscription.
    get().unsubscribe?.();

    const recipesState = useRecipesStore.getState();
    const pool = recipesState.getOrFallback();
    const plan: MealPlan = mealPlan ?? recommendMealPlanForNow();
    let candidates: Recipe[];
    if (seedRecipeIds && seedRecipeIds.length > 0) {
      const byId = new Map(pool.map((r) => [r.id, r]));
      const seeded = seedRecipeIds
        .map((id) => byId.get(id))
        .filter((r): r is Recipe => !!r);
      // Fill up to 8 with meal-plan-appropriate recipes (variety + course mix).
      const used = new Set(seeded.map((r) => r.id));
      const deck = buildDeckForMealPlan(plan, pool, includeCourses).filter(
        (r) => !used.has(r.id),
      );
      candidates = [...seeded, ...deck].slice(0, 8);
    } else {
      candidates = buildDeckForMealPlan(plan, pool, includeCourses);
    }
    const sessionTypeFor: Record<MealPlan, SwipeSession["sessionType"]> = {
      kahvalti: "breakfast",
      ogle: "lunch",
      aksam: "dinner",
      tatli: "snack",
      atistirma: "snack",
      icecek: "snack",
    };
    const session: SwipeSession = {
      id: uuidV4(),
      householdId,
      createdBy: userId,
      sessionType: sessionTypeFor[plan],
      status: "active",
      participantIds,
      recipeIds: candidates.map((r) => r.id),
      createdAt: new Date().toISOString(),
      mealPlan: plan,
      includeCourses: includeCourses as string[] | undefined,
    };

    // Only persist to backend when recipes came from Supabase (UUID ids).
    // With mock catalog the slug ids would violate the uuid FK constraints.
    const live =
      sessionService.isConfigured() && recipesState.source === "live";
    let unsub: (() => void) | null = null;
    if (live) {
      void sessionService.createSessionRow({
        id: session.id,
        householdId,
        createdBy: userId,
        participantIds,
        recipeIds: session.recipeIds,
      });
      unsub = sessionService.subscribeToVotes(session.id, (v) => {
        if (v.userId !== userId) get().applyRemoteVote(v);
      });
    }

    set({
      session,
      candidates,
      index: 0,
      votes: [],
      match: null,
      unsubscribe: unsub,
    });
  },
  loadSession: async (sessionId, userId) => {
    // Already loaded? just ensure subscription is alive.
    const existing = get().session;
    if (existing?.id === sessionId) return true;
    if (!sessionService.isConfigured()) return false;
    const row = await sessionService.getSession(sessionId);
    if (!row) return false;

    get().unsubscribe?.();

    // Make sure this user is recorded as a participant.
    if (!row.participantIds.includes(userId)) {
      void sessionService.joinSession(sessionId, userId);
    }
    const participantIds = row.participantIds.includes(userId)
      ? row.participantIds
      : [...row.participantIds, userId];

    const pool = useRecipesStore.getState().getOrFallback();
    const byId = new Map(pool.map((r) => [r.id, r]));
    const candidates = row.recipeIds
      .map((id) => byId.get(id))
      .filter((r): r is Recipe => !!r);

    // Hydrate existing votes so the UI shows live counts immediately.
    const remoteVotes = await sessionService.listVotes(sessionId);

    const session: SwipeSession = {
      id: row.id,
      householdId: row.householdId,
      createdBy: row.createdBy,
      sessionType: "dinner",
      status: (row.status as SessionStatus) ?? "active",
      participantIds,
      recipeIds: row.recipeIds,
      createdAt: new Date().toISOString(),
    };

    const unsub = sessionService.subscribeToVotes(sessionId, (v) => {
      if (v.userId !== userId) get().applyRemoteVote(v);
    });

    set({
      session,
      candidates,
      index: 0,
      votes: remoteVotes,
      match: null,
      unsubscribe: unsub,
    });
    return true;
  },
  vote: (userId, recipeId, voteType) => {
    const { session, votes } = get();
    if (!session) return;
    const v: Vote = {
      id: uuidV4(),
      sessionId: session.id,
      userId,
      recipeId,
      voteType,
      createdAt: new Date().toISOString(),
    };
    set({ votes: [...votes, v] });
    // Auto-save liked / superliked recipes to the user's favorites so they
    // appear on the home "Son Eşleşmeler" strip and the profile "Kaydettiklerim"
    // grid even before a match is finalized.
    if (voteType === "like" || voteType === "superlike") {
      useStatsStore.getState().addFavorite(recipeId);
    }
    const live =
      sessionService.isConfigured() &&
      useRecipesStore.getState().source === "live";
    if (live) {
      void sessionService.insertVote({
        sessionId: session.id,
        userId,
        recipeId,
        voteType,
      });
    }
  },
  applyRemoteVote: (v) => {
    const { votes } = get();
    // Dedupe: skip if we've already seen this (session, user, recipe) pair.
    if (
      votes.some(
        (x) =>
          x.sessionId === v.sessionId &&
          x.userId === v.userId &&
          x.recipeId === v.recipeId,
      )
    ) {
      return;
    }
    set({ votes: [...votes, v] });
  },
  next: () =>
    set((s) => ({ index: Math.min(s.index + 1, s.candidates.length) })),
  extendDeck: () => {
    const { session, candidates } = get();
    if (!session) return 0;
    const pool = useRecipesStore.getState().getOrFallback();
    const seen = new Set(candidates.map((r) => r.id));
    const plan: MealPlan = session.mealPlan ?? recommendMealPlanForNow();
    const includeCourses = session.includeCourses as Course[] | undefined;
    // First try a course-aware refill from the meal plan.
    const planFresh = buildDeckForMealPlan(plan, pool, includeCourses).filter(
      (r) => !seen.has(r.id),
    );
    let fresh = planFresh;
    // If the meal-plan deck is exhausted, fall back to *any* unseen recipe
    // from the pool, shuffled — keeps the experience going on small decks.
    if (fresh.length === 0) {
      fresh = pool
        .filter((r) => !seen.has(r.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 12);
    }
    if (fresh.length === 0) return 0;
    const nextCandidates = [...candidates, ...fresh];
    set({
      candidates: nextCandidates,
      session: { ...session, recipeIds: nextCandidates.map((r) => r.id) },
    });
    return fresh.length;
  },
  finalize: () => {
    const { session, candidates, votes } = get();
    if (!session) return null;
    const auth = useAuthStore.getState();
    const pantry = usePantryStore.getState().items;
    const profiles = auth.profile ? [auth.profile] : [];
    const m = computeMatch({
      sessionId: session.id,
      votes,
      candidates,
      participantIds: session.participantIds,
      profiles,
      pantry,
      recentRecipeIds: [],
      mealPlan: session.mealPlan,
    });
    set({ match: m, session: { ...session, status: "completed" } });
    const live =
      sessionService.isConfigured() &&
      useRecipesStore.getState().source === "live";
    if (live) {
      void sessionService.completeSession(session.id);
      if (m) {
        void sessionService.insertMatch({
          sessionId: session.id,
          recipeId: m.recipeId,
          score: m.score,
          reasons: m.reasons,
          likedByUserIds: m.likedByUserIds,
          missingIngredients: m.missingIngredients,
        });
      }
    }
    if (m) {
      const matchedRecipe = candidates.find((r) => r.id === m.recipeId);
      if (matchedRecipe) {
        void pushService.notifyMatchFound(matchedRecipe.title);
      }
    }
    return m;
  },
  reset: () => {
    get().unsubscribe?.();
    set({
      session: null,
      candidates: [],
      index: 0,
      votes: [],
      match: null,
      unsubscribe: null,
    });
  },
  setStatus: (status) => {
    const s = get().session;
    if (!s) return;
    set({ session: { ...s, status } });
  },
}));
