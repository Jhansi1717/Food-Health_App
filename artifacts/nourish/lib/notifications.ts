import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export type ReminderSettings = {
  enabled: boolean;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  water: boolean;
  breakfastHour: number;
  lunchHour: number;
  dinnerHour: number;
};

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: false,
  breakfast: true,
  lunch: true,
  dinner: true,
  water: true,
  breakfastHour: 8,
  lunchHour: 13,
  dinnerHour: 19,
};

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

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  configureHandler();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function clearAllReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

export async function scheduleReminders(
  s: ReminderSettings,
  name: string,
): Promise<void> {
  if (Platform.OS === "web") return;
  await clearAllReminders();
  if (!s.enabled) return;
  const ok = await ensurePermission();
  if (!ok) return;

  const greet = name ? `, ${name}` : "";

  const items: { hour: number; title: string; body: string; enabled: boolean }[] = [
    {
      enabled: s.breakfast,
      hour: s.breakfastHour,
      title: `Good morning${greet}`,
      body: "Log your breakfast in Nourish to start the day strong.",
    },
    {
      enabled: s.lunch,
      hour: s.lunchHour,
      title: "Lunch check-in",
      body: "What's on your plate? Tap to log and see your remaining calories.",
    },
    {
      enabled: s.dinner,
      hour: s.dinnerHour,
      title: "Dinner time",
      body: "Round out the day — log dinner for a clear picture tomorrow.",
    },
  ];

  for (const item of items) {
    if (!item.enabled) continue;
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: item.title, body: item.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: item.hour,
          minute: 0,
          repeats: true,
        },
      });
    } catch {
      // ignore individual failures
    }
  }

  if (s.water) {
    // Hourly water nudges between 9am and 8pm
    for (let h = 10; h <= 20; h += 2) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Sip check",
            body: "A quick glass of water keeps energy and focus steady.",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: h,
            minute: 0,
            repeats: true,
          },
        });
      } catch {
        // ignore
      }
    }
  }
}
