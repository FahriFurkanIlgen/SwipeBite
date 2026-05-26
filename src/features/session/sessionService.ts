import { supabase } from "@/lib/supabase";
import { Vote, VoteType } from "@/types/domain";

/**
 * Realtime + persistence layer for swipe sessions.
 *
 * When Supabase is not configured everything becomes a no-op so the
 * local mock session keeps working unchanged.
 */
export const sessionService = {
  isConfigured: () => !!supabase,

  async insertVote(vote: {
    sessionId: string;
    userId: string;
    recipeId: string;
    voteType: VoteType;
  }): Promise<void> {
    if (!supabase) return;
    await supabase.from("votes").upsert(
      {
        session_id: vote.sessionId,
        user_id: vote.userId,
        recipe_id: vote.recipeId,
        vote_type: vote.voteType,
      },
      { onConflict: "session_id,user_id,recipe_id" },
    );
  },

  async createSessionRow(input: {
    id: string;
    householdId: string;
    createdBy: string;
    participantIds: string[];
    recipeIds: string[];
  }): Promise<void> {
    if (!supabase) return;
    await supabase.from("swipe_sessions").upsert({
      id: input.id,
      household_id: input.householdId,
      created_by: input.createdBy,
      participant_ids: input.participantIds,
      recipe_ids: input.recipeIds,
      status: "active",
    });
  },

  async completeSession(id: string): Promise<void> {
    if (!supabase) return;
    await supabase
      .from("swipe_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);
  },

  /**
   * Subscribe to remote vote inserts for a given session. Returns an
   * unsubscribe function. No-op (returns noop) if Supabase missing.
   */
  subscribeToVotes(
    sessionId: string,
    onVote: (vote: Vote) => void,
  ): () => void {
    const client = supabase;
    if (!client) return () => undefined;
    const channel = client
      .channel(`session:${sessionId}:votes`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            session_id: string;
            user_id: string;
            recipe_id: string;
            vote_type: VoteType;
            created_at: string;
          };
          onVote({
            id: row.id,
            sessionId: row.session_id,
            userId: row.user_id,
            recipeId: row.recipe_id,
            voteType: row.vote_type,
            createdAt: row.created_at,
          });
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  },

  /**
   * Subscribe to status changes on the session row (e.g. another member
   * marks it completed). Returns unsubscribe.
   */
  subscribeToSession(
    sessionId: string,
    onChange: (status: string) => void,
  ): () => void {
    const client = supabase;
    if (!client) return () => undefined;
    const channel = client
      .channel(`session:${sessionId}:row`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "swipe_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as { status: string };
          if (row?.status) onChange(row.status);
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  },
};
