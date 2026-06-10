import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ALL_COCKTAILS } from "@/constants/allCocktails";
import { rankCocktails } from "@/features/bar/cocktailMatcher";
import type {
  BarMatchResult,
  BarSession,
  BarSessionFilterMode,
  BarVote,
  BarVoteType,
  Cocktail,
} from "@/types/bar";
import { uuidV4 } from "@/utils/id";

const STORAGE_KEY = "swipebite.barSession.v1";

interface PersistedShape {
  session: BarSession | null;
  votes: BarVote[];
  index: number;
  match: BarMatchResult | null;
}

interface BarSessionState {
  session: BarSession | null;
  /** Resolved cocktail records for the current deck, in order. */
  candidates: Cocktail[];
  /** Pointer into `candidates` for the current top card. */
  index: number;
  votes: BarVote[];
  match: BarMatchResult | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  /**
   * Build a deck and start a new session. `ownedIds` is used to seed the
   * `cookable` / `close` filter modes from the user's bar cabinet.
   * Pool defaults to the full classic catalog.
   */
  startSession: (params: {
    ownerId: string;
    participantIds?: string[];
    householdId?: string;
    filterMode?: BarSessionFilterMode;
    ownedIds: ReadonlySet<string>;
    pool?: Cocktail[];
  }) => BarSession | null;
  vote: (userId: string, cocktailId: string, voteType: BarVoteType) => void;
  next: () => void;
  /** Reverse the last vote (undo). No-op when there are no votes. */
  undo: () => void;
  /**
   * Compute and persist a winner from the current votes. Returns null when
   * nobody liked anything (no positive votes) — UI should show empty state.
   */
  finalize: () => BarMatchResult | null;
  reset: () => void;
}

async function persist(state: PersistedShape) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // best effort
  }
}

function buildDeck(
  filterMode: BarSessionFilterMode,
  ownedIds: ReadonlySet<string>,
  pool: Cocktail[],
): Cocktail[] {
  // Keep decks short and decisive — swiping through 80+ cards is exhausting.
  const MAX_DECK = 10;
  if (filterMode === "all") {
    return [...pool].sort(() => Math.random() - 0.5).slice(0, MAX_DECK);
  }
  const ranked = rankCocktails(ownedIds, pool);
  if (filterMode === "cookable") {
    const cookable = ranked.filter((m) => m.cookable).map((m) => m.cocktail);
    // Avoid empty decks — if cabinet is sparse, fall back to "close".
    if (cookable.length >= 3) {
      return cookable.sort(() => Math.random() - 0.5).slice(0, MAX_DECK);
    }
  }
  // `close` (and the cookable-fallback) — cookable + ≤2 missing.
  const close = ranked
    .filter((m) => m.cookable || m.missingRequired.length <= 2)
    .map((m) => m.cocktail);
  if (close.length >= 3) {
    return close.sort(() => Math.random() - 0.5).slice(0, MAX_DECK);
  }
  // Last resort — full pool shuffled.
  return [...pool].sort(() => Math.random() - 0.5).slice(0, MAX_DECK);
}

export const useBarSessionStore = create<BarSessionState>((set, get) => ({
  session: null,
  candidates: [],
  index: 0,
  votes: [],
  match: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedShape;
        const session = parsed.session ?? null;
        // Resolve candidates from the pool by id, dropping any that no
        // longer exist in the catalog.
        const byId = new Map(ALL_COCKTAILS.map((c) => [c.id, c]));
        const candidates = session
          ? session.cocktailIds
              .map((id) => byId.get(id))
              .filter((c): c is Cocktail => !!c)
          : [];
        set({
          session,
          candidates,
          index: parsed.index ?? 0,
          votes: parsed.votes ?? [],
          match: parsed.match ?? null,
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  startSession: ({
    ownerId,
    participantIds,
    householdId,
    filterMode = "close",
    ownedIds,
    pool = ALL_COCKTAILS,
  }) => {
    const deck = buildDeck(filterMode, ownedIds, pool);
    if (deck.length === 0) return null;
    const session: BarSession = {
      id: uuidV4(),
      householdId,
      ownerId,
      participantIds:
        participantIds && participantIds.length > 0
          ? Array.from(new Set([ownerId, ...participantIds]))
          : [ownerId],
      cocktailIds: deck.map((c) => c.id),
      status: "active",
      createdAt: new Date().toISOString(),
      filterMode,
    };
    set({
      session,
      candidates: deck,
      index: 0,
      votes: [],
      match: null,
    });
    void persist({ session, votes: [], index: 0, match: null });
    return session;
  },

  vote: (userId, cocktailId, voteType) => {
    const { session, votes } = get();
    if (!session || session.status !== "active") return;
    // Replace any prior vote by the same user on the same cocktail so the
    // tally never double-counts a flip-flop.
    const filtered = votes.filter(
      (v) => !(v.userId === userId && v.cocktailId === cocktailId),
    );
    const next: BarVote[] = [
      ...filtered,
      { userId, cocktailId, voteType, createdAt: new Date().toISOString() },
    ];
    set({ votes: next });
    void persist({
      session,
      votes: next,
      index: get().index,
      match: get().match,
    });
  },

  next: () => {
    const { index, candidates, session, votes, match } = get();
    const nextIndex = Math.min(index + 1, candidates.length);
    set({ index: nextIndex });
    void persist({ session, votes, index: nextIndex, match });
  },

  undo: () => {
    const { index, votes, session, match } = get();
    if (!session || index === 0 || votes.length === 0) return;
    const newVotes = votes.slice(0, -1);
    const newIndex = Math.max(0, index - 1);
    set({ votes: newVotes, index: newIndex });
    void persist({ session, votes: newVotes, index: newIndex, match });
  },

  finalize: () => {
    const { session, votes, candidates } = get();
    if (!session) return null;

    // Tally positive votes per cocktail. `superlike` counts as 2 votes for
    // tie-breaking, matching the food-side weighting intuition.
    const tally = new Map<string, number>();
    for (const v of votes) {
      if (v.voteType === "like" || v.voteType === "superlike") {
        const w = v.voteType === "superlike" ? 2 : 1;
        tally.set(v.cocktailId, (tally.get(v.cocktailId) ?? 0) + w);
      }
    }

    if (tally.size === 0) return null;

    // Winner: highest weighted score; ties broken by deck order so the
    // outcome feels deterministic (the first cocktail liked wins a tie).
    let winnerId: string | null = null;
    let winnerScore = -1;
    let winnerOrder = Number.MAX_SAFE_INTEGER;
    const orderById = new Map(candidates.map((c, i) => [c.id, i] as const));
    for (const [id, score] of tally.entries()) {
      const order = orderById.get(id) ?? Number.MAX_SAFE_INTEGER;
      if (
        score > winnerScore ||
        (score === winnerScore && order < winnerOrder)
      ) {
        winnerId = id;
        winnerScore = score;
        winnerOrder = order;
      }
    }

    if (!winnerId) return null;

    // Unique liker count for the headline ("3/4 kişi sevdi").
    const likers = new Set<string>();
    for (const v of votes) {
      if (
        v.cocktailId === winnerId &&
        (v.voteType === "like" || v.voteType === "superlike")
      ) {
        likers.add(v.userId);
      }
    }

    const completedSession: BarSession = { ...session, status: "completed" };
    const result: BarMatchResult = {
      id: uuidV4(),
      cocktailId: winnerId,
      likeCount: likers.size,
      participantCount: session.participantIds.length,
      createdAt: new Date().toISOString(),
    };
    set({ session: completedSession, match: result });
    void persist({
      session: completedSession,
      votes,
      index: get().index,
      match: result,
    });
    return result;
  },

  reset: () => {
    set({ session: null, candidates: [], index: 0, votes: [], match: null });
    void AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  },
}));
