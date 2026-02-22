import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// ─── Configure how notifications appear when the app is in the foreground ─────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Request permission & set up Android channel ─────────────────────────────
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  // Set up Android notification channel (required for Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medication', {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate: true,
    });
  }

  // Must be a physical device for push notifications
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  return true;
}

// ─── Parse a time string like "8:00 AM" into hours and minutes ───────────────
function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
}

// ─── Schedule a daily repeating notification for a medicine at a specific time ─
export async function scheduleMedicationReminder(
  patientName: string,
  medicineName: string,
  timeStr: string,
): Promise<string | null> {
  const parsed = parseTime(timeStr);
  if (!parsed) {
    console.warn(`Could not parse time: "${timeStr}"`);
    return null;
  }

  // Cancel any existing notification for this patient+medicine+time combo
  const identifier = `${patientName}-${medicineName}-${timeStr}`.replace(/\s+/g, '_');
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (_) {
    // Ignore if it didn't exist
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `Time for ${medicineName}`,
        body: `${patientName} — it's time to take ${medicineName}.`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && { channelId: 'medication' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsed.hours,
        minute: parsed.minutes,
      },
    });
    console.log(`Scheduled daily notification "${id}" at ${timeStr} for ${medicineName}`);
    return id;
  } catch (e) {
    console.error('Failed to schedule notification:', e);
    return null;
  }
}

// ─── Schedule all reminders for a patient's medicines ─────────────────────────
export async function scheduleAllRemindersForPatient(
  patientName: string,
  medicines: { name: string; pillSchedule: string; pillsLeft?: number; totalPillsPrescribed?: string }[],
): Promise<void> {
  for (const med of medicines) {
    const pillsLeft = med.pillsLeft ?? parseInt(med.totalPillsPrescribed || '0', 10);
    if (pillsLeft <= 0) continue; // Don't schedule for empty medicines

    // A medicine can have multiple schedule times: "8:00 AM, 8:00 PM"
    const times = (med.pillSchedule || '').split(',').map(t => t.trim()).filter(Boolean);
    for (const time of times) {
      await scheduleMedicationReminder(patientName, med.name, time);
    }
  }
}

// ─── Cancel all scheduled notifications ───────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Get all currently scheduled notifications (for debugging) ────────────────
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// ─── Get delivered notifications ──────────────────────────────────────────────
export async function getDeliveredNotifications() {
  return await Notifications.getPresentedNotificationsAsync();
}
