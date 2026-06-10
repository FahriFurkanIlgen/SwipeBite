import React from "react";
import {
  Stack,
  useRouter,
  useSegments,
  useRootNavigationState,
} from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import * as Linking from "expo-linking";
import { useShareIntent } from "@/lib/shareIntent";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts as useFraunces,
  Fraunces_300Light_Italic,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import "../global.css";

import { useAuthStore } from "@/store/authStore";
import { useRecipesStore } from "@/store/recipesStore";
import { usePantryStore } from "@/store/pantryStore";
import { usePlannerStore } from "@/store/plannerStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useStatsStore } from "@/store/statsStore";
import { useTutorialStore } from "@/store/tutorialStore";
import { useEntitlementsStore } from "@/store/entitlementsStore";
import { pushService } from "@/features/notifications/pushService";
import { findCookableRecipes } from "@/features/pantry/pantryMatcher";
import { configureGoogleSignIn } from "@/lib/googleAuth";
import { billingService } from "@/features/billing/billingService";
import { UpsellSheet } from "@/features/billing/UpsellSheet";
import { colors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();
  const user = useAuthStore((s) => s.user);
  const onboarded = useAuthStore((s) => s.isOnboarded);

  React.useEffect(() => {
    if (!navState?.key) return;
    const first = segments[0] as string | undefined;
    if (!first) return;
    const inAuth = first === "(auth)";
    const inOnboarding = first === "(onboarding)";

    // Landing is always accessible. We only redirect when the user tries
    // to reach a protected area without the right state:
    //  - not signed in & not on the landing/auth → send to landing
    //  - signed in but not onboarded & not in onboarding/auth → onboarding
    // Signed-in users staying on (auth)/welcome are allowed (it's the landing).
    let target: string | null = null;
    if (!user && !inAuth) {
      target = "/(auth)/welcome";
    } else if (user && !onboarded && !inOnboarding && !inAuth) {
      target = "/(onboarding)/preferences";
    }

    if (target) {
      router.replace(target as never);
    }
  }, [segments, user, onboarded, router, navState?.key]);
}

function RootLayoutNav() {
  useProtectedRoute();
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrateFromSession);
  const subscribeAuthChanges = useAuthStore((s) => s.subscribeAuthChanges);
  const hydrateRecipes = useRecipesStore((s) => s.hydrate);
  const hydratePantry = usePantryStore((s) => s.hydrate);
  const hydratePlanner = usePlannerStore((s) => s.hydrate);
  const hydratePrefs = usePreferencesStore((s) => s.hydrate);
  const hydrateStats = useStatsStore((s) => s.hydrate);
  const hydrateTutorial = useTutorialStore((s) => s.hydrate);
  const hydrateEntitlements = useEntitlementsStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);
  const pantryItems = usePantryStore((s) => s.items);
  const recipes = useRecipesStore((s) => s.items);
  React.useEffect(() => {
    void hydrate();
    void hydrateRecipes();
    void hydrateTutorial();
    void hydrateEntitlements();
    configureGoogleSignIn();
    const unsub = subscribeAuthChanges();
    return unsub;
  }, [hydrate, hydrateRecipes, hydrateTutorial, subscribeAuthChanges]);
  React.useEffect(() => {
    if (household) {
      void hydratePantry(household.id);
      void hydratePlanner(household.id);
      void hydratePrefs(household.id);
    }
  }, [household, hydratePantry, hydratePlanner, hydratePrefs]);
  React.useEffect(() => {
    if (user) void hydrateStats(user.id);
  }, [user, hydrateStats]);
  React.useEffect(() => {
    void billingService.init(user?.id ?? null);
  }, [user]);
  const dinnerNudgeScheduledRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!user) {
      dinnerNudgeScheduledRef.current = null;
      return;
    }
    // Best-effort: ask for permission and schedule the daily 17:00 pantry
    // suggestion nudge. We list a few recipes the household can cook right now
    // with what's already in their pantry.
    const titles = findCookableRecipes(pantryItems, recipes, {
      minCoverage: 50,
      limit: 3,
    }).map((c) => c.recipe.title);
    // Reschedule only when the user or the suggestion set actually changes, so
    // re-hydrates/profile refreshes don't stack up duplicate notifications but
    // fresh pantry edits still refresh the message.
    const key = `${user.id}:${titles.join("|")}`;
    if (dinnerNudgeScheduledRef.current === key) return;
    dinnerNudgeScheduledRef.current = key;
    void pushService.scheduleDinnerNudge(titles);
  }, [user, pantryItems, recipes]);

  // Handle incoming share-sheet content. expo-share-intent surfaces text/url
  // shared from Instagram/Twitter/Safari etc. (works on both iOS share extension
  // and Android intent). We also keep an expo-linking listener so swipebite://
  // deep links continue to work.
  const { shareIntent, resetShareIntent } = useShareIntent();
  React.useEffect(() => {
    if (!shareIntent) return;
    const shared =
      shareIntent.webUrl ||
      shareIntent.text ||
      (shareIntent.files?.[0] as { path?: string } | undefined)?.path ||
      "";
    if (!shared) return;
    router.push({
      pathname: "/import",
      params: { text: shared },
    } as never);
    resetShareIntent();
  }, [shareIntent, resetShareIntent, router]);

  React.useEffect(() => {
    const handleUrl = (url: string | null | undefined) => {
      if (!url) return;
      let shared = url;
      try {
        const parsed = Linking.parse(url);
        const fromQuery =
          (parsed.queryParams?.text as string | undefined) ??
          (parsed.queryParams?.url as string | undefined);
        if (fromQuery) shared = fromQuery;
      } catch {
        // not parseable — treat as raw text
      }
      // Only route deep links that explicitly target import; ignore plain
      // app-open URLs so we don't hijack normal cold starts.
      if (!/\/import(\?|$)/.test(url) && !url.startsWith("swipebite://import"))
        return;
      router.push({
        pathname: "/import",
        params: { text: shared },
      } as never);
    };
    void Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", (e) => handleUrl(e.url));
    return () => sub.remove();
  }, [router]);
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="session/[id]"
        options={{ presentation: "card", animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="match/[id]" options={{ animation: "fade" }} />
      <Stack.Screen
        name="recipe/[id]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="cook/[id]"
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen name="import" options={{ presentation: "modal" }} />
      <Stack.Screen name="cook-with" options={{ presentation: "modal" }} />
      <Stack.Screen name="invite" options={{ presentation: "modal" }} />
      <Stack.Screen
        name="paywall"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="join/[code]" options={{ animation: "fade" }} />
      <Stack.Screen
        name="cici/index"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="cici/[id]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="bar/cabinet"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="bar/session"
        options={{ presentation: "card", animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="bar/match/[id]" options={{ animation: "fade" }} />
      <Stack.Screen
        name="bar/[id]"
        options={{ animation: "slide_from_right" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [frauncesLoaded] = useFraunces({
    Fraunces_300Light_Italic,
    Fraunces_700Bold,
  });
  const [interLoaded] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const fontsLoaded = frauncesLoaded && interLoaded;

  React.useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RootLayoutNav />
        <UpsellSheet />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
