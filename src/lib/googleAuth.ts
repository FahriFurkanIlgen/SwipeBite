import Constants from "expo-constants";
import { env, hasGoogleAuth } from "./env";

/**
 * Native Google Sign-In is unavailable in Expo Go (it ships only in custom
 * dev clients / production builds). Detect that runtime and fall back to a
 * no-op stub so the app does not crash on import.
 */
const isExpoGo = Constants.appOwnership === "expo";

type GoogleSigninModule =
  typeof import("@react-native-google-signin/google-signin");

let nativeModule: GoogleSigninModule | null = null;
if (!isExpoGo) {
  // Lazy require keeps the native binding out of the Expo Go bundle path.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  nativeModule = require("@react-native-google-signin/google-signin");
}

const stubGoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  hasPreviousSignIn: () => false,
  signIn: async () => {
    throw new Error(
      "Google ile giriş Expo Go içinde desteklenmiyor. Geliştirme build'i gerekir.",
    );
  },
  signOut: async () => {},
} as const;

export const GoogleSignin: GoogleSigninModule["GoogleSignin"] =
  (nativeModule?.GoogleSignin as GoogleSigninModule["GoogleSignin"]) ??
  (stubGoogleSignin as unknown as GoogleSigninModule["GoogleSignin"]);

export const statusCodes: GoogleSigninModule["statusCodes"] =
  nativeModule?.statusCodes ??
  ({
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
    IN_PROGRESS: "IN_PROGRESS",
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
    SIGN_IN_REQUIRED: "SIGN_IN_REQUIRED",
  } as unknown as GoogleSigninModule["statusCodes"]);

export const isGoogleSignInAvailable = !isExpoGo && hasGoogleAuth;

let configured = false;

/**
 * Configure the native Google Sign-In SDK once. Must be called before
 * any sign-in attempt. Safe to call multiple times — only runs once.
 *
 * - `webClientId` is required to get the `idToken` we hand off to Supabase.
 * - `iosClientId` is required on iOS for the native auth flow.
 */
export function configureGoogleSignIn(): void {
  if (configured || !isGoogleSignInAvailable) return;
  GoogleSignin.configure({
    webClientId: env.googleWebClientId,
    iosClientId: env.googleIosClientId || undefined,
    offlineAccess: false,
  });
  configured = true;
}
