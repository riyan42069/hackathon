// ─── Notification stubs for Expo Go ──────────────────────────────────────────
// expo-notifications is not supported in Expo Go.
// To enable real push notifications, install expo-notifications + expo-device,
// add the plugin to app.json, and create a development build:
//   npx expo install expo-notifications expo-device
//   npx expo prebuild --platform ios --clean
//   npx expo run:ios

export async function registerForPushNotificationsAsync(): Promise<boolean> {
  console.log('[Notifications] Stubbed — install expo-notifications and use a dev build for real notifications.');
  return false;
}

export async function scheduleMedicationReminder(
  patientName: string,
  medicineName: string,
  timeStr: string,
): Promise<string | null> {
  console.log(`[Notifications] Would schedule: ${medicineName} for ${patientName} at ${timeStr}`);
  return null;
}

export async function cancelAllNotifications(): Promise<void> {
  console.log('[Notifications] Stubbed — nothing to cancel.');
}

export async function getDeliveredNotifications() {
  return [];
}

export async function addNotificationListeners(
  _onReceived: (notification: any) => void,
  _onTapped: (response: any) => void,
): Promise<(() => void) | null> {
  return null;
}
