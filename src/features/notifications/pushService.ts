import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

/**
 * Thin wrapper around expo-notifications used for in-app reminders.
 *
 * Stays defensive: on simulators or when permissions are denied we
 * silently no-op so demos never crash.
 */

let configured = false;

function configureHandler() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export const pushService = {
  /** Ask for permission. Returns true if granted. */
  async requestPermission(): Promise<boolean> {
    configureHandler();
    if (!Device.isDevice) return false;
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === "granted") return true;
    if (existing.status === "denied" && !existing.canAskAgain) return false;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted";
  },

  /** Make sure an Android default channel exists. */
  async ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== "android") return;
    await Notifications.setNotificationChannelAsync("default", {
      name: "Genel",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 200, 250],
    });
  },

  /** Schedule a one-shot local notification. */
  async scheduleAt(opts: {
    title: string;
    body: string;
    triggerSeconds: number;
    data?: Record<string, unknown>;
  }): Promise<string | null> {
    configureHandler();
    const ok = await this.requestPermission();
    if (!ok) return null;
    await this.ensureAndroidChannel();
    return Notifications.scheduleNotificationAsync({
      content: {
        title: opts.title,
        body: opts.body,
        data: opts.data ?? {},
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(opts.triggerSeconds)),
      },
    });
  },

  async cancel(id: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // ignore
    }
  },

  async cancelAll(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // ignore
    }
  },

  // --- Domain helpers --------------------------------------------------

  /** "Partner is waiting" reminder after a session goes idle. */
  async notifyPartnerWaiting(partnerName: string): Promise<void> {
    await this.scheduleAt({
      title: "Eşin bekliyor",
      body: `${partnerName} bu akşamki seçim için kart kaydırıyor — sen de katıl!`,
      triggerSeconds: 1,
      data: { kind: "partner_waiting" },
    });
  },

  /** Match found pop-up. */
  async notifyMatchFound(recipeTitle: string): Promise<void> {
    await this.scheduleAt({
      title: "Eşleşme! 🎉",
      body: `Bu akşam ${recipeTitle} yapıyorsunuz.`,
      triggerSeconds: 1,
      data: { kind: "match_found" },
    });
  },

  /** Daily 18:00 "what's for dinner" nudge — scheduled as a delay from now. */
  async scheduleDinnerNudge(): Promise<void> {
    const now = new Date();
    const target = new Date();
    target.setHours(18, 0, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    const seconds = Math.floor((target.getTime() - now.getTime()) / 1000);
    await this.scheduleAt({
      title: "Bugün ne yesek?",
      body: "Birkaç kart kaydır, 2 dakikada karar verelim.",
      triggerSeconds: seconds,
      data: { kind: "dinner_nudge" },
    });
  },
};
