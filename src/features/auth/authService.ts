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

    // Native Google Sign-In follows the OIDC spec: the nonce we pass is
    // returned verbatim in the id_token's `nonce` claim (NOT hashed by
    // Google). Supabase, on the other hand, SHA-256-hashes the nonce we
    // supply and compares against that claim. So we must:
    //   - send the HASHED nonce to Google (claim = hashed)
    //   - send the RAW nonce to Supabase (Supabase hashes it → matches)
    // This mirrors the Apple Sign-In flow.
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await (
      GoogleSignin.signIn as unknown as (params?: {
        nonce?: string;
      }) => Promise<unknown>
    )({ nonce: hashedNonce });
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
      nonce: rawNonce,
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
