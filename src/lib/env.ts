import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<
  string,
  string | undefined
>;

export const env = {
  supabaseUrl: extra.supabaseUrl ?? "",
  supabaseAnonKey: extra.supabaseAnonKey ?? "",
  openaiApiKey: extra.openaiApiKey ?? "",
  googleWebClientId: extra.googleWebClientId ?? "",
  googleIosClientId: extra.googleIosClientId ?? "",
  revenueCatIosKey: extra.revenueCatIosKey ?? "",
  revenueCatAndroidKey: extra.revenueCatAndroidKey ?? "",
  revenueCatTestKey: extra.revenueCatTestKey ?? "",
  /**
   * When "true", AI calls are routed through the Supabase `ai-proxy` Edge
   * Function (secret key stays server-side) instead of calling OpenAI directly
   * with the bundled key. Strongly recommended for production builds.
   */
  aiProxyEnabled:
    (extra.aiProxyEnabled ?? "false").toString().toLowerCase() === "true",
  useMockData:
    (extra.useMockData ?? "true").toString().toLowerCase() !== "false" ||
    !extra.supabaseUrl ||
    !extra.supabaseAnonKey,
};

export const hasOpenAI = Boolean(env.openaiApiKey);
export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const hasGoogleAuth = Boolean(env.googleWebClientId);

/**
 * RevenueCat Test Store keys (`test_...`) ONLY work in development builds. In a
 * release/TestFlight/App Store build the SDK hard-crashes the app on configure
 * ("Wrong API Key … the app will close now"). So we only treat the test key as
 * usable when `__DEV__` is true; production builds require a real platform key.
 */
export const revenueCatUsableTestKey =
  typeof __DEV__ !== "undefined" && __DEV__ ? env.revenueCatTestKey : "";

/**
 * Native in-app purchases are wired when a usable RevenueCat key is present: a
 * real platform key (any build) or the Test Store key (dev builds only).
 */
export const hasBilling = Boolean(
  env.revenueCatIosKey || env.revenueCatAndroidKey || revenueCatUsableTestKey,
);

/** AI is reachable if we have a direct key OR a configured proxy. */
export const hasAI = hasOpenAI || (env.aiProxyEnabled && hasSupabase);
