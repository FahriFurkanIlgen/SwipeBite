import { supabase } from "@/lib/supabase";
import {
  configureGoogleSignIn,
  GoogleSignin,
  isGoogleSignInAvailable,
} from "@/lib/googleAuth";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
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

  /**
   * Send a 6-digit email OTP. Creates the auth user if one does not exist
   * (Supabase default for `signInWithOtp` when `shouldCreateUser` is true).
   */
  async sendEmailOtp(email: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
    return true;
  },

  /**
   * Verify the 6-digit code the user received via email. Returns the
   * authenticated user id on success.
   */
  async verifyEmailOtp(
    email: string,
    token: string,
  ): Promise<{ userId: string } | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) throw error;
    if (!data.user) return null;
    // Mirror into public.users so downstream FKs work.
    await supabase.from("users").upsert({
      id: data.user.id,
      name:
        (data.user.user_metadata?.name as string | undefined) ??
        email.split("@")[0],
      email: data.user.email ?? email,
    });
    return { userId: data.user.id };
  },

  async signOut(): Promise<void> {
    if (!supabase) return;
    try {
      if (isGoogleSignInAvailable) {
        const signedIn = GoogleSignin.hasPreviousSignIn();
        if (signedIn) await GoogleSignin.signOut();
      }
    } catch {
      // best effort
    }
    await supabase.auth.signOut();
  },

  /**
   * Native Google Sign-In → exchange the resulting `idToken` for a
   * Supabase session via `signInWithIdToken`. Returns null when either
   * Supabase or Google client IDs are not configured so callers can
   * fall back to mock mode.
   */
  async signInWithGoogle(): Promise<{ userId: string } | null> {
    if (!supabase || !isGoogleSignInAvailable) return null;
    configureGoogleSignIn();

    // NOTE: The "Original" GoogleSignin.signIn() API only accepts
    // `SignInParams = { loginHint?: string }` — it does NOT support a custom
    // `nonce`. Any nonce we pass is silently ignored, so the returned id_token
    // has no `nonce` claim. Supabase only enforces the nonce when we pass one
    // to signInWithIdToken, so we must NOT pass a nonce here (passing one would
    // make Supabase hash it and compare against the absent claim → "nonces
    // mismatch"). A nonce would require the Universal/One-Tap sign-in API.
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    // google-signin v13+ returns { type: "success" | "cancelled", data }
    // older versions return the user object directly.
    const idToken =
      // v13+ shape
      (result as { data?: { idToken?: string | null } }).data?.idToken ??
      // legacy shape
      (result as { idToken?: string | null }).idToken ??
      null;
    if (!idToken) {
      throw new Error("Google ID token alınamadı.");
    }
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    if (error) throw error;
    if (!data.user) return null;
    // Mirror into public.users so downstream FKs work.
    const name =
      (data.user.user_metadata?.name as string | undefined) ??
      (data.user.user_metadata?.full_name as string | undefined) ??
      data.user.email?.split("@")[0] ??
      "Sen";
    await supabase.from("users").upsert({
      id: data.user.id,
      name,
      email: data.user.email,
      avatar_url:
        (data.user.user_metadata?.avatar_url as string | undefined) ?? null,
    });
    return { userId: data.user.id };
  },

  /**
   * Native Sign in with Apple → exchange the resulting `identityToken` for a
   * Supabase session via `signInWithIdToken`. iOS-only; on other platforms
   * (including Expo Go on iOS where the entitlement is missing) returns null.
   */
  async signInWithApple(): Promise<{ userId: string } | null> {
    if (!supabase) return null;
    if (Platform.OS !== "ios") return null;
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) return null;

    // Per Supabase Apple guide: hash a raw nonce, send hashed to Apple,
    // then forward the raw nonce to Supabase so it can verify the JWT.
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error("Apple identity token alınamadı.");
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error) throw error;
    if (!data.user) return null;

    // Apple returns fullName ONLY on first sign-in. Compose a friendly name
    // from whatever we have, falling back to the email local-part.
    const appleName = [
      credential.fullName?.givenName,
      credential.fullName?.familyName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    const name =
      appleName ||
      (data.user.user_metadata?.name as string | undefined) ||
      (data.user.user_metadata?.full_name as string | undefined) ||
      data.user.email?.split("@")[0] ||
      "Sen";

    await supabase.from("users").upsert({
      id: data.user.id,
      name,
      email: data.user.email,
      avatar_url:
        (data.user.user_metadata?.avatar_url as string | undefined) ?? null,
    });
    return { userId: data.user.id };
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
      alcoholContentEnabled: data.alcohol_content_enabled ?? undefined,
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
      alcohol_content_enabled: profile.alcoholContentEnabled ?? null,
      updated_at: new Date().toISOString(),
    });
  },

  async getPrimaryHousehold(
    userId: string,
    preferredHouseholdId?: string | null,
  ): Promise<Household | null> {
    if (!supabase) return null;
    let householdId: string | null = null;
    // Prefer an explicitly chosen household (e.g. one the user joined via an
    // invite code) so the pairing sticks across restarts instead of randomly
    // resolving back to a self-created household. Only honour it while the
    // user is actually still a member of it.
    if (preferredHouseholdId) {
      const { data: pref } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", userId)
        .eq("household_id", preferredHouseholdId)
        .maybeSingle();
      if (pref) householdId = pref.household_id;
    }
    if (!householdId) {
      // Fall back to the most recently joined household (a freshly joined
      // partner household should win over an older self-created one).
      const { data: mem } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", userId)
        .order("joined_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!mem) return null;
      householdId = mem.household_id;
    }
    const { data: h } = await supabase
      .from("households")
      .select("*")
      .eq("id", householdId)
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
      inviteCode: h.invite_code ?? undefined,
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
      inviteCode: h.invite_code ?? inviteCode,
    };
  },

  async joinHouseholdByInviteCode(
    inviteCode: string,
    userId: string,
  ): Promise<Household | null> {
    if (!supabase) return null;
    // Use a SECURITY DEFINER RPC: the joining user is not yet a member, so a
    // direct SELECT on `households` is filtered out by RLS. The RPC looks up
    // the household by code, adds the caller as a member, and returns the row.
    const { data: h, error } = await supabase.rpc(
      "join_household_by_invite_code",
      { p_code: inviteCode.toUpperCase() },
    );
    if (error || !h) return null;
    const household = Array.isArray(h) ? h[0] : h;
    if (!household) return null;
    const { data: members } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", household.id);
    return {
      id: household.id,
      name: household.name,
      createdBy: household.created_by,
      memberIds:
        (members ?? []).length > 0
          ? (members ?? []).map((m) => m.user_id)
          : [userId],
      createdAt: household.created_at,
      inviteCode: household.invite_code ?? undefined,
    };
  },
};
