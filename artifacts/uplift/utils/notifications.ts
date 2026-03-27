/**
 * Push notification setup for Uplift.
 * Works on physical devices with a development build.
 * On Expo Go / simulators / web, gracefully skips.
 */

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";

// How notifications appear when the app is in the foreground
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {}

let _pushToken: string | null = null;

/**
 * Request notification permissions and return the Expo push token.
 * Returns null if not on a physical device, on Expo Go, or if permission is denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Push notifications only work on real physical devices
    if (!Device.isDevice) {
      console.log("[Notifications] Skipping — not a physical device");
      return null;
    }

    // Android needs a notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("uplift-chat", {
        name: "Uplift Chat",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1A73E8",
      });
    }

    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request if not already granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Notifications] Permission denied");
      return null;
    }

    // Resolve projectId — required in bare/Expo Go environments
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      undefined;

    if (!projectId) {
      // No projectId available (Expo Go without EAS) — skip remote token gracefully
      console.log("[Notifications] No projectId — skipping remote push token (use a dev build for full push support)");
      return null;
    }

    // Get the Expo push token
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    _pushToken = token;
    console.log("[Notifications] Push token registered:", token);
    return token;
  } catch (e: any) {
    // Log at debug level — this is expected on Expo Go
    console.log("[Notifications] Push registration skipped:", e?.message ?? e);
    return null;
  }
}

/**
 * Show a local notification immediately (works even when app is open).
 * Use when a chat message arrives and the app is in the foreground.
 */
export async function showLocalNotification(title: string, body: string) {
  try {
    if (!Device.isDevice) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: "default" },
      trigger: null,
    });
  } catch {
    // Silently ignore — local notifications not critical
  }
}

/**
 * Clear all pending notifications (call when user opens the chat).
 */
export async function clearNotifications() {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch {}
}

export function getPushToken() {
  return _pushToken;
}
