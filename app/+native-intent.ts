import { getShareExtensionKey } from "expo-share-intent";

// expo-share-intent delivers shared content to the app via a deep link shaped
// like `swipebite://dataUrl=<shareExtensionKey>`. Without this handler expo-router
// tries to resolve that path as a screen and renders the "Unmatched Route" error.
// Here we intercept the system path early and redirect to a known route so the
// `useShareIntent` hook (mounted in app/_layout.tsx) can pick up the payload.
export function redirectSystemPath({ path }: { path: string }): string {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      // Land on the home tab; the share-intent hook in _layout forwards the
      // shared text/url to the /import screen once the payload is resolved.
      return "/";
    }
    return path;
  } catch {
    return "/";
  }
}
