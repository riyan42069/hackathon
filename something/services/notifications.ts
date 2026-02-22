import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Helper to check if we are running in Expo Go
const isExpoGo = (global as any).expo?.modules?.ExpoGo !== undefined;

export async function registerForPushNotificationsAsync() {
  // COMMENT THESE OUT TO TRY AND FORCE IT:
  if (Platform.OS === 'web' || isExpoGo) {
    return false;
  }

  try {
    const Notifications = await import('expo-notifications');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    return false;
  }
}

export async function scheduleMedicationReminder(patientName: string, medicineName: string, timeStr: string) {
  console.log(`[MOCK NOTIFICATION] Scheduled for ${patientName}: ${medicineName} at ${timeStr}`);

  if (isExpoGo) {
    // Alert the dev so you know it "would" have worked
    console.warn("Notification scheduled in logic, but suppressed to prevent Expo Go crash.");
    return;
  }

  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 Time for ${patientName}'s Meds!`,
        body: `It is time to take ${medicineName}.`,
      },
      trigger: { seconds: 5 } as any,
    });
  } catch (e) {
    console.error("Failed to schedule:", e);
  }
}
export async function getDeliveredNotifications() {
  try {
    const Notifications = await import('expo-notifications');
    // This gets notifications that have already been presented on the device
    return await Notifications.getPresentedNotificationsAsync();
  } catch (e) {
    console.log("Could not fetch delivered notifications", e);
    return [];
  }
}