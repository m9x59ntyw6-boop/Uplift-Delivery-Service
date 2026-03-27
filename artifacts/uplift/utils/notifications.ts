/**
 * Push notification setup for Uplift.
 * Fully functional on physical devices with a development build.
 * Gracefully skips on Expo Go, simulators, and web — no warnings emitted.
 */

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

// Expo Go (storeClient) does not support remote push notifications in SDK 53+
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isWeb = Platform.OS === "web";

// Suppress known library-level warnings that are noise for this project:
// – expo-notifications web stub warns about push token listeners (we don't use them on web)
if (isWeb || isExpoGo) {
  const _origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (msg.includes("[expo-notifications]") || msg.includes("expo-notifications")) return;
    _origWarn.apply(console, args);
  };
}

// Only configure the notification handler on native dev/standalone builds
if (!isWeb && !isExpoGo) {
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
}

let _pushToken: string | null = null;

/**
 * Request notification permissions and return the Expo push token.
 * Returns null safely on Expo Go, simulators, and web.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Skip entirely on web or Expo Go — avoids library warnings
    if (isWeb || isExpoGo) return null;

    // Requires a real physical device
    if (!Device.isDevice) return null;

    // Android notification channel setup
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("uplift-chat", {
        name: "Uplift Chat",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1A73E8",
      });
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    // Resolve EAS projectId — required for remote push tokens
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      undefined;

    if (!projectId) return null;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    _pushToken = token;
    console.log("[Notifications] Push token:", token);
    return token;
  } catch {
    return null;
  }
}

/**
 * Show a local (in-app) notification — silently skipped on Expo Go / web.
 */
export async function showLocalNotification(title: string, body: string) {
  try {
    if (isWeb || isExpoGo || !Device.isDevice) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: "default" },
      trigger: null,
    });
  } catch {}
}

/**
 * Dismiss all pending notifications (call when user opens chat).
 */
export async function clearNotifications() {
  try {
    if (isWeb || isExpoGo) return;
    await Notifications.dismissAllNotificationsAsync();
  } catch {}
}

export function getPushToken() {
  return _pushToken;
}
