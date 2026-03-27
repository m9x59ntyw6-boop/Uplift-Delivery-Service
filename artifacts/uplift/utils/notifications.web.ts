/**
 * Web stub for notifications — expo-notifications is not imported at all on web,
 * which prevents the library from emitting its "not supported on web" warning.
 */

export async function registerForPushNotifications(): Promise<string | null> {
  return null;
}

export async function showLocalNotification(_title: string, _body: string) {}

export async function clearNotifications() {}

export function getPushToken() {
  return null;
}
