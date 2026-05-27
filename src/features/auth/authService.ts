import { supabase } from "@/lib/supabase";
import { Household, Profile, User } from "@/types/domain";

/**
 * Thin wrapper around Supabase auth + profile/household fetching.
 * All methods are safe to call when Supabase is not configured — they
 * simply return null so callers can fall back to mock data.
 */
export const authService = {
  isConfigured: () => !!supabase,

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<{ userId: string } | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user ? { userId: data.user.id } : null;
  },

  async signUpWithPassword(
    email: string,
    password: string,
    name: string,
  ): Promise<{ userId: string } | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (!data.user) return null;
    // Mirror into public.users.
    await supabase.from("users").upsert({
      id: data.user.id,
      name,
      email,
    });
    return { userId: data.user.id };
  },

  async sendMagicLink(email: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  },

  async signOut(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    if (!u) return null;
    const { data: row } = await supabase
      .from("users")
      .select("*")
      .eq("id", u.id)
      .maybeSingle();
    return {
      id: u.id,
      name: row?.name ?? (u.user_metadata?.name as string) ?? "Sen",
      email: u.email ?? undefined,
      avatarUrl: row?.avatar_url ?? undefined,
      createdAt: u.created_at ?? new Date().toISOString(),
    };
  },

  async getProfile(userId: string): Promise<Profile | null> {
    if (!supabase) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return null;
    return {
      userId,
      allergies: data.allergies ?? [],
      hardDislikes: data.hard_dislikes ?? [],
      favoriteCuisines: data.favorite_cuisines ?? [],
      spiceTolerance: data.spice_tolerance ?? "mild",
    };
  },

  async upsertProfile(profile: Profile): Promise<void> {
    if (!supabase) return;
    await supabase.from("profiles").upsert({
      user_id: profile.userId,
      allergies: profile.allergies,
      hard_dislikes: profile.hardDislikes,
      favorite_cuisines: profile.favoriteCuisines,
      spice_tolerance: profile.spiceTolerance,
      updated_at: new Date().toISOString(),
    });
  },

  async getPrimaryHousehold(userId: string): Promise<Household | null> {
    if (!supabase) return null;
    const { data: mem } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!mem) return null;
    const { data: h } = await supabase
      .from("households")
      .select("*")
      .eq("id", mem.household_id)
      .maybeSingle();
    if (!h) return null;
    const { data: members } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", h.id);
    return {
      id: h.id,
      name: h.name,
      createdBy: h.created_by,
      memberIds: (members ?? []).map((m) => m.user_id),
      createdAt: h.created_at,
    };
  },

  async createHousehold(
    name: string,
    userId: string,
  ): Promise<Household | null> {
    if (!supabase) return null;
    // Defensive: make sure the public.users mirror row exists. Without it
    // households.created_by FK would fail.
    const { data: authData } = await supabase.auth.getUser();
    const authed = authData.user;
    if (authed) {
      const { error: userErr } = await supabase.from("users").upsert({
        id: authed.id,
        name:
          (authed.user_metadata?.name as string | undefined) ??
          authed.email?.split("@")[0] ??
          "Sen",
        email: authed.email,
      });
      if (userErr) throw userErr;
    }
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data: h, error } = await supabase
      .from("households")
      .insert({ name, created_by: userId, invite_code: inviteCode })
      .select()
      .single();
    if (error) throw error;
    const { error: memberErr } = await supabase
      .from("household_members")
      .insert({ household_id: h.id, user_id: userId, role: "owner" });
    if (memberErr) throw memberErr;
    return {
      id: h.id,
      name: h.name,
      createdBy: userId,
      memberIds: [userId],
      createdAt: h.created_at,
    };
  },

  async joinHouseholdByInviteCode(
    inviteCode: string,
    userId: string,
  ): Promise<Household | null> {
    if (!supabase) return null;
    const { data: h } = await supabase
      .from("households")
      .select("*")
      .eq("invite_code", inviteCode.toUpperCase())
      .maybeSingle();
    if (!h) return null;
    await supabase
      .from("household_members")
      .upsert({ household_id: h.id, user_id: userId, role: "member" });
    const { data: members } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", h.id);
    return {
      id: h.id,
      name: h.name,
      createdBy: h.created_by,
      memberIds: (members ?? []).map((m) => m.user_id),
      createdAt: h.created_at,
    };
  },
};
