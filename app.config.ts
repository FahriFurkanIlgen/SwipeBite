import { ExpoConfig } from "expo/config";

const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

/**
 * App variant selector. The same codebase ships two App Store apps:
 *   - APP_VARIANT unset / "food" → SwipeBite (default, unchanged)
 *   - APP_VARIANT="bar"          → SwipeBar (cocktail/bar experience)
 * EAS sets APP_VARIANT via the build profile env (see eas.json). The variant
 * is also exposed at runtime through `extra.appVariant`.
 */
const APP_VARIANT = (process.env.APP_VARIANT ?? "food").toLowerCase();
const IS_BAR = APP_VARIANT === "bar";

const variantConfig = IS_BAR
  ? {
      name: "SwipeBar",
      slug: "swipebar",
      scheme: "swipebar",
      // SwipeBar artwork (deep blue #41639C). Save the attached icon as
      // ./assets/icon-bar.png (1024×1024); it's reused for splash + adaptive.
      icon: "./assets/icon-bar.png",
      splashImage: "./assets/icon-bar.png",
      splashBackground: "#41639C",
      bundleIdentifier: "app.swipebar",
      androidPackage: "app.swipebar",
      adaptiveIcon: "./assets/icon-bar.png",
      adaptiveBackground: "#41639C",
      // SwipeBar uses its own EAS project + EAS Update channel. Values come
      // from `eas init` (project 22adc23f-…); env vars override for CI.
      easProjectId:
        process.env.EAS_PROJECT_ID_BAR ??
        "22adc23f-64e9-4595-8040-204a17839086",
      updatesUrl:
        process.env.EAS_UPDATE_URL_BAR ??
        "https://u.expo.dev/22adc23f-64e9-4595-8040-204a17839086",
    }
  : {
      name: "SwipeBite",
      slug: "swipebite",
      scheme: "swipebite",
      icon: "./assets/icon.png",
      splashImage: "./assets/splash-icon.png",
      splashBackground: "#FAF7F2",
      bundleIdentifier: "app.swipebite",
      androidPackage: "app.swipebite",
      adaptiveIcon: "./assets/adaptive-icon.png",
      adaptiveBackground: "#F3801F",
      easProjectId: "e0ff18b9-1a5a-4ca1-8876-978212ef5d62",
      updatesUrl: "https://u.expo.dev/e0ff18b9-1a5a-4ca1-8876-978212ef5d62",
    };

const config: ExpoConfig = {
  name: variantConfig.name,
  slug: variantConfig.slug,
  scheme: variantConfig.scheme,
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: variantConfig.icon,
  splash: {
    image: variantConfig.splashImage,
    resizeMode: "contain",
    backgroundColor: variantConfig.splashBackground,
  },
  runtimeVersion: { policy: "appVersion" },
  ...(variantConfig.updatesUrl
    ? { updates: { url: variantConfig.updatesUrl } }
    : {}),
  ios: {
    supportsTablet: false,
    bundleIdentifier: variantConfig.bundleIdentifier,
    appleTeamId: "23CWBG7W63",
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: variantConfig.androidPackage,
    adaptiveIcon: {
      foregroundImage: variantConfig.adaptiveIcon,
      backgroundColor: variantConfig.adaptiveBackground,
    },
    // Note: expo-share-intent plugin auto-injects the SEND/text intent-filter.
    // The root `scheme` also auto-generates the VIEW filter for deep links,
    // so no manual intentFilters block is needed here.
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-apple-authentication",
    [
      "expo-build-properties",
      {
        ios: {
          // GoogleSignIn 9 pulls in AppCheckCore, a Swift pod that depends on
          // GoogleUtilities and RecaptchaInterop. When building static
          // libraries these need module maps, otherwise pod install fails with
          // "cannot yet be integrated as static libraries". Force modular
          // headers for the offending transitive pods.
          extraPods: [
            { name: "GoogleUtilities", modular_headers: true },
            { name: "RecaptchaInterop", modular_headers: true },
          ],
        },
      },
    ],
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
  ],
  extra: {
    appVariant: APP_VARIANT,
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
      projectId: variantConfig.easProjectId,
    },
  },
};

export default config;
