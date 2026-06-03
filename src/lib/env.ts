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
  useMockData:
    (extra.useMockData ?? "true").toString().toLowerCase() !== "false" ||
    !extra.supabaseUrl ||
    !extra.supabaseAnonKey,
};

export const hasOpenAI = Boolean(env.openaiApiKey);
export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const hasGoogleAuth = Boolean(env.googleWebClientId);
