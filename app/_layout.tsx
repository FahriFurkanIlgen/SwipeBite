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
import "../global.css";

import { useAuthStore } from "@/store/authStore";
import { useRecipesStore } from "@/store/recipesStore";
import { pushService } from "@/features/notifications/pushService";

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

    let target: string | null = null;
    if (!user && !inAuth) {
      target = "/(auth)/welcome";
    } else if (user && !onboarded && !inOnboarding) {
      target = "/(onboarding)/preferences";
    } else if (user && onboarded && (inAuth || inOnboarding)) {
      target = "/(tabs)";
    }

    if (target) {
      const t = target;
      // Defer to the next tick so the navigator finishes mounting before we navigate.
      const id = setTimeout(() => {
        router.replace(t as never);
      }, 0);
      return () => clearTimeout(id);
    }
  }, [segments, user, onboarded, router, navState?.key]);
}

function RootLayoutNav() {
  useProtectedRoute();
  const hydrate = useAuthStore((s) => s.hydrateFromSession);
  const subscribeAuthChanges = useAuthStore((s) => s.subscribeAuthChanges);
  const hydrateRecipes = useRecipesStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  React.useEffect(() => {
    void hydrate();
    void hydrateRecipes();
    const unsub = subscribeAuthChanges();
    return unsub;
  }, [hydrate, hydrateRecipes, subscribeAuthChanges]);
  React.useEffect(() => {
    if (!user) return;
    // Best-effort: ask for permission and schedule the daily dinner nudge.
    void pushService.scheduleDinnerNudge();
  }, [user]);
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
      <Stack.Screen name="invite" options={{ presentation: "modal" }} />
      <Stack.Screen name="join/[code]" options={{ animation: "fade" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RootLayoutNav />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
