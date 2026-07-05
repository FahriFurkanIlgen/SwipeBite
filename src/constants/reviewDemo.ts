/**
 * Hidden App Review demo account.
 *
 * Apple App Review cannot complete the e-mail OTP flow (they can't receive the
 * code), so Guideline 2.1(a) requires a way to access the full app. When the
 * reviewer signs in with this exact e-mail + code we bypass the real OTP,
 * create a local demo session and unlock Pro so every feature is reachable.
 *
 * Provide these credentials in App Store Connect → App Review Information.
 * This is a deliberate, documented review affordance — it only ever triggers
 * for this one e-mail address and never sends/accepts real user data.
 */
export const REVIEW_DEMO_EMAIL = "review@swipebite.com.tr";

/** Fixed code the reviewer enters on the OTP screen. */
export const REVIEW_DEMO_CODE = "000000";

/** True when the given e-mail is the review demo account (case-insensitive). */
export function isReviewDemoEmail(email: string): boolean {
  return email.trim().toLowerCase() === REVIEW_DEMO_EMAIL;
}
