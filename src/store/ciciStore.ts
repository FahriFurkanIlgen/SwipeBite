import { create } from "zustand";
import { ciciService } from "@/features/cici/ciciService";
import { CiciSession } from "@/types/domain";

interface CiciState {
  session: CiciSession | null;
  loading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;

  create: (input: {
    creatorId: string;
    creatorName: string;
    creatorAvatar?: string;
  }) => Promise<string | null>;
  joinByCode: (
    code: string,
    name: string,
    avatar?: string,
  ) => Promise<string | null>;
  open: (sessionId: string) => Promise<void>;
  close: () => void;
  refresh: () => Promise<void>;

  /** Creator: starts the first round (lobby → voting). */
  startRound: () => Promise<void>;
  /** Anyone: tally current round + start next one (or finalize). */
  advanceRound: (round: number) => Promise<void>;
  /** Cast or replace this user's vote for a round. */
  castVote: (userId: string, round: number, itemId: string) => Promise<void>;
}

export const useCiciStore = create<CiciState>((set, get) => ({
  session: null,
  loading: false,
  error: null,
  unsubscribe: null,

  async create(input) {
    set({ loading: true, error: null });
    const s = await ciciService.createSession(input);
    set({ loading: false });
    if (!s) {
      set({ error: "Oturum oluşturulamadı." });
      return null;
    }
    set({ session: s });
    return s.id;
  },

  async joinByCode(code, name, avatar) {
    set({ loading: true, error: null });
    const id = await ciciService.joinByCode(code, name, avatar);
    set({ loading: false });
    if (!id) {
      set({ error: "Kod bulunamadı." });
      return null;
    }
    return id;
  },

  async open(sessionId) {
    get().close();
    set({ loading: true, error: null });
    const s = await ciciService.getSession(sessionId);
    set({ loading: false, session: s });
    if (!s) return;
    const unsubscribe = ciciService.subscribe(sessionId, () => {
      get().refresh();
    });
    set({ unsubscribe });
  },

  close() {
    const u = get().unsubscribe;
    if (u) u();
    set({ session: null, unsubscribe: null, error: null });
  },

  async refresh() {
    const cur = get().session;
    if (!cur) return;
    const s = await ciciService.getSession(cur.id);
    if (s) set({ session: s });
  },

  async startRound() {
    const s = get().session;
    if (!s) return;
    await ciciService.startRound(s.id);
    await get().refresh();
  },

  async advanceRound(round) {
    const s = get().session;
    if (!s) return;
    await ciciService.advanceRound(s.id, round);
    await get().refresh();
  },

  async castVote(userId, round, itemId) {
    const s = get().session;
    if (!s) return;
    // Optimistic — replace any prior vote for the same round/user.
    const optimistic: CiciSession = {
      ...s,
      votes: [
        ...s.votes.filter((v) => !(v.userId === userId && v.round === round)),
        { userId, round, itemId, createdAt: new Date().toISOString() },
      ],
    };
    set({ session: optimistic });
    await ciciService.castVote(s.id, userId, round, itemId);
    // Re-pull so we don't rely solely on realtime (which can lag) and so the
    // UI reflects what the server actually accepted.
    await get().refresh();
  },
}));
