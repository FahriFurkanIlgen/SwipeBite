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
    // Note: expo-share-intent plugin auto-injects the SEND/text intent-filter.
    // The `scheme: "swipebite"` at the root also auto-generates the VIEW filter
    // for deep links, so no manual intentFilters block is needed here.
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-share-intent",
      {
        iosActivationRules: {
          NSExtensionActivationSupportsWebURLWithMaxCount: 1,
          NSExtensionActivationSupportsText: true,
        },
        androidIntentFilters: ["text/*"],
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    useMockData: process.env.EXPO_PUBLIC_USE_MOCK_DATA ?? "true",
  },
};

export default config;
