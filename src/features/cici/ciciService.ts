import { supabase } from "@/lib/supabase";
import { CiciMember, CiciSession, CiciStatus, CiciVote } from "@/types/domain";
import { FASTFOOD_ITEMS } from "@/constants/fastfoodItems";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function genCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++)
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

interface SessionRow {
  id: string;
  code: string;
  created_by: string;
  status: CiciStatus;
  item_ids: string[] | null;
  round_seconds: number | null;
  current_round: number | null;
  round_left_id: string | null;
  round_right_id: string | null;
  round_started_at: string | null;
  current_winner_id: string | null;
  deck_index: number | null;
  winner_item_id: string | null;
  created_at: string;
}

interface MemberRow {
  session_id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  joined_at: string;
  finished_at: string | null;
}

interface VoteRow {
  session_id: string;
  user_id: string;
  round: number;
  item_id: string;
  created_at: string;
}

const toMember = (r: MemberRow): CiciMember => ({
  userId: r.user_id,
  name: r.name,
  avatarUrl: r.avatar_url ?? undefined,
  joinedAt: r.joined_at,
  finishedAt: r.finished_at ?? undefined,
});

const toVote = (r: VoteRow): CiciVote => ({
  userId: r.user_id,
  round: r.round,
  itemId: r.item_id,
  createdAt: r.created_at,
});

export interface CreateCiciInput {
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
}

export const ciciService = {
  isConfigured: () => !!supabase,

  /** Build a shuffled deck of all catalog items, capped at 8. */
  pickDeck(): string[] {
    return FASTFOOD_ITEMS.map((i) => ({ id: i.id, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.id)
      .slice(0, 8);
  },

  async createSession(input: CreateCiciInput): Promise<CiciSession | null> {
    if (!supabase) return null;
    const itemIds = this.pickDeck();
    let code = genCode();
    // Try a few times in case of collision
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from("cici_sessions")
        .insert({
          code,
          created_by: input.creatorId,
          status: "lobby",
          item_ids: itemIds,
        })
        .select("*")
        .single();
      if (!error && data) {
        // Add creator as first member
        await supabase.from("cici_members").upsert({
          session_id: data.id,
          user_id: input.creatorId,
          name: input.creatorName,
          avatar_url: input.creatorAvatar ?? null,
        });
        return await this.getSession(data.id);
      }
      if (error?.code === "23505") {
        code = genCode();
        continue;
      }
      console.warn("[cici] createSession error", error);
      return null;
    }
    return null;
  },

  /** Resolve session by code & insert caller as member via RPC. */
  async joinByCode(
    code: string,
    name: string,
    avatar?: string,
  ): Promise<string | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("join_cici_session", {
      p_code: code.trim().toUpperCase(),
      p_name: name,
      p_avatar: avatar ?? null,
    });
    if (error) {
      console.warn("[cici] joinByCode", error.message);
      return null;
    }
    return data as string;
  },

  async getSession(id: string): Promise<CiciSession | null> {
    if (!supabase) return null;
    const [s, m, v] = await Promise.all([
      supabase.from("cici_sessions").select("*").eq("id", id).maybeSingle(),
      supabase.from("cici_members").select("*").eq("session_id", id),
      supabase.from("cici_votes").select("*").eq("session_id", id),
    ]);
    if (s.error || !s.data) return null;
    const row = s.data as SessionRow;
    return {
      id: row.id,
      code: row.code,
      createdBy: row.created_by,
      status: row.status,
      itemIds: row.item_ids ?? [],
      roundSeconds: row.round_seconds ?? 30,
      currentRound: row.current_round ?? 0,
      roundLeftId: row.round_left_id ?? undefined,
      roundRightId: row.round_right_id ?? undefined,
      roundStartedAt: row.round_started_at ?? undefined,
      currentWinnerId: row.current_winner_id ?? undefined,
      deckIndex: row.deck_index ?? 0,
      winnerItemId: row.winner_item_id ?? undefined,
      createdAt: row.created_at,
      members: ((m.data ?? []) as MemberRow[]).map(toMember),
      votes: ((v.data ?? []) as VoteRow[]).map(toVote),
    };
  },

  /** Creator: kick off the first round. Calls server RPC. */
  async startRound(sessionId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.rpc("start_cici_round", {
      p_session_id: sessionId,
    });
    if (error) console.warn("[cici] startRound", error.message);
  },

  /** Anyone in the session: tally + pick winner of round, then start next. */
  async advanceRound(sessionId: string, round: number): Promise<string | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("advance_cici_round", {
      p_session_id: sessionId,
      p_round: round,
    });
    if (error) {
      console.warn("[cici] advanceRound", error.message);
      throw new Error(error.message);
    }
    // Then immediately ask the server to start the next round (or finalize).
    await this.startRound(sessionId);
    return (data as string) ?? null;
  },

  /** Cast or replace this user's vote for the current round. */
  async castVote(
    sessionId: string,
    userId: string,
    round: number,
    itemId: string,
  ) {
    if (!supabase) return;
    const { error } = await supabase.from("cici_votes").upsert(
      {
        session_id: sessionId,
        user_id: userId,
        round,
        item_id: itemId,
      },
      { onConflict: "session_id,user_id,round" },
    );
    if (error) {
      console.warn("[cici] castVote", error.message);
      throw new Error(error.message);
    }
  },

  /** Subscribe to all session changes. Returns an unsubscribe fn. */
  subscribe(sessionId: string, onChange: () => void): () => void {
    if (!supabase) return () => {};
    const ch = supabase
      .channel(`cici:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cici_sessions",
          filter: `id=eq.${sessionId}`,
        },
        onChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cici_members",
          filter: `session_id=eq.${sessionId}`,
        },
        onChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cici_votes",
          filter: `session_id=eq.${sessionId}`,
        },
        onChange,
      )
      .subscribe();
    return () => {
      supabase?.removeChannel(ch);
    };
  },
};
