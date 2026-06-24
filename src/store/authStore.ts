import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Household, Profile, SpiceLevel, User } from "@/types/domain";
import { uid } from "@/utils/id";
import { authService } from "@/features/auth/authService";
import { supabase } from "@/lib/supabase";
import {
  REVIEW_DEMO_CODE,
  isReviewDemoEmail,
} from "@/constants/reviewDemo";
import { useEntitlementsStore } from "@/store/entitlementsStore";

const ONBOARDED_KEY = "@swipebite/onboarded";
// The household the user is actively paired with. Persisted so an invite-code
// pairing survives app restarts (and wins over an older self-created house)
// until the user explicitly leaves / signs out.
const ACTIVE_HOUSEHOLD_KEY = "@swipebite/activeHousehold";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  household: Household | null;
  isOnboarded: boolean;
  authLoading: boolean;
  signInMock: (name?: string) => void;
  /** Hidden App Review demo session: full app + Pro, no backend. */
  signInReviewDemo: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  requestEmailOtp: (email: string) => Promise<boolean>;
  verifyEmailOtp: (email: string, code: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  hydrateFromSession: () => Promise<void>;
  /** Re-fetch the active household (e.g. after a partner joins) without a
   *  full session hydrate, so new members show up immediately. */
  refreshHousehold: () => Promise<void>;
  subscribeAuthChanges: () => () => void;
  signOut: () => Promise<void>;
  setProfile: (patch: Partial<Profile>) => void;
  setHousehold: (h: Household | null) => void;
  setOnboarded: (v: boolean) => void;
}

const emptyProfile = (userId: string): Profile => ({
  userId,
  allergies: [],
  hardDislikes: [],
  favoriteCuisines: [],
  spiceTolerance: "mild" as SpiceLevel,
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  household: null,
  isOnboarded: false,
  authLoading: false,
  signInMock: (name = "Sen") => {
    const u: User = {
      id: uid("user"),
      name,
      email: "demo@swapbite.com.tr",
      createdAt: new Date().toISOString(),
    };
    set({ user: u, profile: emptyProfile(u.id) });
  },
  signInReviewDemo: () => {
    const now = new Date().toISOString();
    const u: User = {
      id: uid("user"),
      name: "App Review",
      email: "review@swapbite.com.tr",
      createdAt: now,
    };
    const household: Household = {
      id: uid("house"),
      name: "Demo Mutfak",
      createdBy: u.id,
      memberIds: [u.id],
      createdAt: now,
      inviteCode: "DEMO",
    };
    // Mark onboarded so the reviewer lands straight in the app, and unlock Pro
    // so no AI feature is gated behind the paywall.
    AsyncStorage.setItem(ONBOARDED_KEY, "1").catch(() => undefined);
    void useEntitlementsStore.getState().setTier("pro");
    set({
      user: u,
      profile: emptyProfile(u.id),
      household,
      isOnboarded: true,
    });
  },
  signIn: async (email, password) => {
    set({ authLoading: true });
    try {
      const result = await authService.signInWithPassword(email, password);
      if (!result) {
        // Backend not configured — fall back to mock.
        get().signInMock(email.split("@")[0] ?? "Sen");
        return;
      }
      await get().hydrateFromSession();
    } finally {
      set({ authLoading: false });
    }
  },
  signUp: async (email, password, name) => {
    set({ authLoading: true });
    try {
      const result = await authService.signUpWithPassword(
        email,
        password,
        name,
      );
      if (!result) {
        get().signInMock(name);
        return;
      }
      await get().hydrateFromSession();
    } finally {
      set({ authLoading: false });
    }
  },
  requestEmailOtp: async (email) => {
    // App Review demo account: never hit the backend (no real code is sent).
    if (isReviewDemoEmail(email)) return true;
    set({ authLoading: true });
    try {
      const ok = await authService.sendEmailOtp(email);
      if (!ok) {
        // Backend not configured — drop straight into mock mode so dev can continue.
        get().signInMock(email.split("@")[0] ?? "Sen");
        return false;
      }
      return true;
    } finally {
      set({ authLoading: false });
    }
  },
  verifyEmailOtp: async (email, code) => {
    // App Review demo account: accept only the fixed code and unlock a full
    // local demo session (Pro enabled) without touching the backend.
    if (isReviewDemoEmail(email)) {
      if (code.trim() !== REVIEW_DEMO_CODE) {
        throw new Error("Kod hatalı.");
      }
      get().signInReviewDemo();
      return;
    }
    set({ authLoading: true });
    try {
      const result = await authService.verifyEmailOtp(email, code);
      if (!result) {
        get().signInMock(email.split("@")[0] ?? "Sen");
        return;
      }
      await get().hydrateFromSession();
    } finally {
      set({ authLoading: false });
    }
  },
  signInWithGoogle: async () => {
    set({ authLoading: true });
    try {
      const result = await authService.signInWithGoogle();
      if (!result) {
        // Supabase or Google client IDs not configured — fall back to mock.
        get().signInMock();
        return;
      }
      await get().hydrateFromSession();
    } finally {
      set({ authLoading: false });
    }
  },
  signInWithApple: async () => {
    set({ authLoading: true });
    try {
      const result = await authService.signInWithApple();
      if (!result) {
        // Apple Sign-In unavailable (non-iOS, Expo Go without entitlement,
        // or Supabase not configured) — fall back to mock so dev keeps moving.
        get().signInMock();
        return;
      }
      await get().hydrateFromSession();
    } finally {
      set({ authLoading: false });
    }
  },
  hydrateFromSession: async () => {
    const user = await authService.getCurrentUser();
    if (!user) return;
    const [profile, activeHouseholdId, persistedOnboarded] = await Promise.all([
      authService.getProfile(user.id),
      AsyncStorage.getItem(ACTIVE_HOUSEHOLD_KEY).catch(() => null),
      AsyncStorage.getItem(ONBOARDED_KEY).catch(() => null),
    ]);
    const household = await authService.getPrimaryHousehold(
      user.id,
      activeHouseholdId,
    );
    set({
      user,
      profile: profile ?? emptyProfile(user.id),
      household,
      // Treat the user as onboarded if they have a profile OR a household,
      // OR they previously completed onboarding on this device.
      isOnboarded: !!profile || !!household || persistedOnboarded === "1",
    });
    // Keep the persisted active id in sync with what we actually resolved.
    if (household?.id) {
      AsyncStorage.setItem(ACTIVE_HOUSEHOLD_KEY, household.id).catch(
        () => undefined,
      );
    }
  },
  refreshHousehold: async () => {
    const { user, household } = get();
    if (!user) return;
    const h = await authService.getPrimaryHousehold(user.id, household?.id);
    if (h) set({ household: h });
  },
  subscribeAuthChanges: () => {
    if (!supabase) return () => undefined;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        AsyncStorage.removeItem(ACTIVE_HOUSEHOLD_KEY).catch(() => undefined);
        set({ user: null, profile: null, household: null, isOnboarded: false });
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void get().hydrateFromSession();
      }
    });
    return () => data.subscription.unsubscribe();
  },
  signOut: async () => {
    await authService.signOut();
    AsyncStorage.removeItem(ACTIVE_HOUSEHOLD_KEY).catch(() => undefined);
    set({ user: null, profile: null, household: null, isOnboarded: false });
  },
  setProfile: (patch) => {
    const p = get().profile;
    if (!p) return;
    const next = { ...p, ...patch };
    set({ profile: next });
    // Fire and forget — best effort sync.
    void authService.upsertProfile(next);
  },
  setHousehold: (h) => {
    set({ household: h });
    // Persist which household is active so it survives restarts and wins over
    // an older self-created household during hydration.
    if (h?.id) {
      AsyncStorage.setItem(ACTIVE_HOUSEHOLD_KEY, h.id).catch(() => undefined);
    } else {
      AsyncStorage.removeItem(ACTIVE_HOUSEHOLD_KEY).catch(() => undefined);
    }
  },
  setOnboarded: (v) => {
    set({ isOnboarded: v });
    AsyncStorage.setItem(ONBOARDED_KEY, v ? "1" : "0").catch(() => undefined);
  },
}));
