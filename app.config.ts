import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "SwipeBite",
  slug: "swipebite",
  scheme: "swipebite",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "app.swipebite",
  },
  android: {
    package: "app.swipebite",
  },
  plugins: ["expo-router", "expo-font"],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    useMockData: process.env.EXPO_PUBLIC_USE_MOCK_DATA ?? "true",
  },
};

export default config;
