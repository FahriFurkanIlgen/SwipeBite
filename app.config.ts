import { ExpoConfig } from "expo/config";

const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

const config: ExpoConfig = {
  name: "SwipeBite",
  slug: "swipebite",
  scheme: "swipebite",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#FAF7F2",
  },
  runtimeVersion: { policy: "appVersion" },
  updates: {
    url: "https://u.expo.dev/e0ff18b9-1a5a-4ca1-8876-978212ef5d62",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "app.swipebite",
    appleTeamId: "23CWBG7W63",
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "app.swipebite",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#F3801F",
    },
    // Note: expo-share-intent plugin auto-injects the SEND/text intent-filter.
    // The `scheme: "swipebite"` at the root also auto-generates the VIEW filter
    // for deep links, so no manual intentFilters block is needed here.
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-apple-authentication",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Fişten ve kiler fotoğrafından malzeme eklemek için fotoğraflarına erişim gerekiyor.",
        cameraPermission:
          "Fiş fotoğrafı çekip malzemeleri otomatik eklemek için kamera erişimi gerekiyor.",
      },
    ],
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
    // Only include the Google Sign-In plugin when its iOS URL scheme is
    // configured. EAS CLI runs `expo config` with EXPO_NO_DOTENV=1 which
    // would otherwise leave the scheme blank and fail plugin validation.
    ...(googleIosUrlScheme
      ? [
          [
            "@react-native-google-signin/google-signin",
            { iosUrlScheme: googleIosUrlScheme },
          ] as [string, { iosUrlScheme: string }],
        ]
      : []),
    // Re-injects `:modular_headers => true` for GoogleUtilities/RecaptchaInterop
    // into the EAS-generated Podfile so AppCheckCore (GoogleSignIn 9.x) can be
    // built as a static library. Without this, EAS `pod install` fails.
    "./plugins/withGoogleSignInModularHeaders",
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    aiProxyEnabled: process.env.EXPO_PUBLIC_AI_PROXY_ENABLED ?? "false",
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    revenueCatTestKey: process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY,
    useMockData: process.env.EXPO_PUBLIC_USE_MOCK_DATA ?? "true",
    eas: {
      projectId: "e0ff18b9-1a5a-4ca1-8876-978212ef5d62",
    },
  },
};

export default config;
