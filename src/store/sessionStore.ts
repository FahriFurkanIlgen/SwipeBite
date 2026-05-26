import { create } from "zustand";
import { MOCK_RECIPES } from "@/constants/mockRecipes";
import {
  MatchResult,
  Recipe,
  SessionStatus,
  SwipeSession,
  Vote,
  VoteType,
} from "@/types/domain";
import { computeMatch } from "@/features/ai/matchEngine";
import { useAuthStore } from "@/store/authStore";
import { usePantryStore } from "@/store/pantryStore";
import { sessionService } from "@/features/session/sessionService";
import { pushService } from "@/features/notifications/pushService";
import { uid } from "@/utils/id";

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
  ) => void;
  vote: (userId: string, recipeId: string, voteType: VoteType) => void;
  applyRemoteVote: (vote: Vote) => void;
  next: () => void;
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
  startSession: (householdId, userId, participantIds = [userId]) => {
    // Tear down any prior subscription.
    get().unsubscribe?.();

    const candidates = [...MOCK_RECIPES]
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);
    const session: SwipeSession = {
      id: uid("session"),
      householdId,
      createdBy: userId,
      sessionType: "dinner",
      status: "active",
      participantIds,
      recipeIds: candidates.map((r) => r.id),
      createdAt: new Date().toISOString(),
    };

    // Best-effort backend create + realtime subscribe.
    void sessionService.createSessionRow({
      id: session.id,
      householdId,
      createdBy: userId,
      participantIds,
      recipeIds: session.recipeIds,
    });
    const unsub = sessionService.subscribeToVotes(session.id, (v) => {
      // Apply only votes from other members; our own write already lives locally.
      if (v.userId !== userId) get().applyRemoteVote(v);
    });

    set({
      session,
      candidates,
      index: 0,
      votes: [],
      match: null,
      unsubscribe: unsub,
    });
  },
  vote: (userId, recipeId, voteType) => {
    const { session, votes } = get();
    if (!session) return;
    const v: Vote = {
      id: uid("vote"),
      sessionId: session.id,
      userId,
      recipeId,
      voteType,
      createdAt: new Date().toISOString(),
    };
    set({ votes: [...votes, v] });
    void sessionService.insertVote({
      sessionId: session.id,
      userId,
      recipeId,
      voteType,
    });
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
    });
    set({ match: m, session: { ...session, status: "completed" } });
    void sessionService.completeSession(session.id);
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
