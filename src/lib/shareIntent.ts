// Wrapper around `expo-share-intent` that gracefully degrades when running
// in Expo Go (where the native module isn't bundled). In dev builds / EAS
// builds the real hook is used; in Expo Go we return a no-op so the bundler
// doesn't fail to resolve the native module at runtime.
import Constants from "expo-constants";

type ShareIntentValue = {
  shareIntent: {
    webUrl?: string | null;
    text?: string | null;
    files?: Array<{ path?: string }> | null;
  } | null;
  resetShareIntent: () => void;
};

const noop: () => ShareIntentValue = () => ({
  shareIntent: null,
  resetShareIntent: () => undefined,
});

let impl: () => ShareIntentValue = noop;

// Expo Go's appOwnership === "expo"; dev / standalone builds report "standalone"
// or undefined (newer SDKs). Only attempt to load the native module outside Expo Go.
if (Constants.appOwnership !== "expo") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-share-intent");
    if (mod && typeof mod.useShareIntent === "function") {
      impl = mod.useShareIntent;
    }
  } catch {
    // Module not installed or not linked — fall back to no-op.
  }
}

export const useShareIntent = (...args: unknown[]): ShareIntentValue =>
  (impl as (...a: unknown[]) => ShareIntentValue)(...args);
