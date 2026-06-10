import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Household, Profile, SpiceLevel, User } from "@/types/domain";
import { uid } from "@/utils/id";
import { authService } from "@/features/auth/authService";
import { supabase } from "@/lib/supabase";

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
      email: "demo@swipebite.app",
      createdAt: new Date().toISOString(),
    };
    set({ user: u, profile: emptyProfile(u.id) });
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
