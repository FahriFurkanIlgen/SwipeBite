/**
 * Centralised legal / support links.
 *
 * Apple App Review requires functional links to the privacy policy and Terms
 * of Use (EULA) inside the auto-renewable subscription purchase flow
 * (Guideline 3.1.2(c)) and a working Support URL (Guideline 1.5).
 *
 * Keep these pages LIVE over HTTPS and make sure the same domain is used in
 * App Store Connect (Support URL + Privacy Policy field) so branding stays
 * consistent (avoids the 4.3 "spam / mismatched metadata" signal).
 */

/** Primary product domain — must match App Store Connect metadata. */
export const SITE_BASE = "https://swapbite.com.tr";

/** Privacy policy — also set this exact URL in App Store Connect → Privacy Policy. */
export const PRIVACY_URL = `${SITE_BASE}/privacy.html`;

/** Support page — also set this exact URL in App Store Connect → Support URL. */
export const SUPPORT_URL = `${SITE_BASE}/support.html`;

/**
 * Terms of Use (EULA). We use Apple's standard EULA, which Apple accepts for
 * the in-app link and for the App Description. If you switch to a custom EULA,
 * host it under SITE_BASE and update this constant.
 */
export const TERMS_URL =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

/** Support contact e-mail used across settings + help screens. */
export const SUPPORT_EMAIL = "destek@swapbite.com.tr";
