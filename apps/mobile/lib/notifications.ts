// Daily Card Push Notification System
// Schedules and manages daily activity notifications

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MessageCategory,
  localizeMessage,
  pickMessageSequence,
} from '../data/notification_messages';
import { useSettingsStore } from '../src/stores/settingsStore';
import {
  NotificationFrequency,
  buildFireDates,
  scheduleCountForWindow,
} from './notifications/schedule';

// How many days ahead we queue. Each fire date is its own one-shot notification
// with its own message, so the OS can't repeat a single payload. Refreshed on
// every launch, so a queue only runs dry if the app goes unopened this long.
//
// iOS caps an app at 64 pending notifications. Four queues x 14 daily entries
// would sit at 56 — under the cap, but close enough that the window is kept
// modest deliberately.
const SCHEDULE_WINDOW_DAYS = 14;

// Notification identifiers. Scheduled notifications are found by their data
// `type` tag rather than a fixed id, since each entry in a queue is its own
// notification with its own OS-assigned identifier.
const DAILY_REMINDER_CHANNEL_ID = 'daily-reminder';

// Storage keys
const NOTIFICATION_ENABLED_KEY = '@spicesync_notifications_enabled';
const NOTIFICATION_TIME_KEY = '@spicesync_notification_time';
const NOTIFICATION_FREQUENCY_KEY = '@spicesync_notification_frequency';
const CONVERSATION_NOTIFICATION_ENABLED_KEY =
  '@spicesync_conversation_notifications_enabled';
const CONVERSATION_NOTIFICATION_TIME_KEY =
  '@spicesync_conversation_notification_time';
const MATCH_ALERTS_ENABLED_KEY = '@spicesync_match_alerts_enabled';
const MATCH_ALERTS_TIME_KEY = '@spicesync_match_alerts_time';
const STREAK_REMINDERS_ENABLED_KEY = '@spicesync_streak_reminders_enabled';
const STREAK_REMINDERS_TIME_KEY = '@spicesync_streak_reminders_time';

// Default notification time (8 PM)
const DEFAULT_HOUR = 20;
const DEFAULT_MINUTE = 0;
const DEFAULT_FREQUENCY: NotificationFrequency = 'daily';

export async function resetAllLocalNotifications(): Promise<void> {
  if (typeof Notifications.cancelAllScheduledNotificationsAsync === 'function') {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Initialize notifications
export async function initializeNotifications(): Promise<boolean> {
  try {
    // Request permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return false;
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(
        DAILY_REMINDER_CHANNEL_ID,
        {
          name: 'Daily Activity Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF2D92',
        }
      );
    }

    console.log('[Notifications] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[Notifications] Initialization error:', error);
    return false;
  }
}

function getLanguage(): string {
  try {
    return useSettingsStore.getState().language ?? 'en';
  } catch {
    return 'en';
  }
}

/**
 * Queue one dated notification per fire date, each with its own message.
 *
 * The previous implementation used a single repeating DAILY trigger, which the
 * OS re-fires with the exact same payload forever — so whatever text was picked
 * at schedule time became the only notification the user ever saw.
 */
async function scheduleMessageWindow(options: {
  category: MessageCategory;
  type: string;
  screen: string;
  hour: number;
  minute: number;
  frequency?: NotificationFrequency;
}): Promise<string[]> {
  const {
    category,
    type,
    screen,
    hour,
    minute,
    frequency = DEFAULT_FREQUENCY,
  } = options;
  const language = getLanguage();
  const count = scheduleCountForWindow(frequency, SCHEDULE_WINDOW_DAYS);
  const fireDates = buildFireDates(hour, minute, count, new Date(), frequency);
  const messages = pickMessageSequence(category, fireDates.length);
  const identifiers: string[] = [];

  for (let i = 0; i < fireDates.length; i += 1) {
    const message = messages[i];
    if (!message) break;

    const { title, body } = localizeMessage(message, language);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type, messageId: message.id, screen },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDates[i],
        channelId:
          Platform.OS === 'android' ? DAILY_REMINDER_CHANNEL_ID : undefined,
      },
    });

    identifiers.push(identifier);
  }

  return identifiers;
}

// Schedule the rolling window of activity card notifications
export async function scheduleDailyNotification(
  hour: number = DEFAULT_HOUR,
  minute: number = DEFAULT_MINUTE,
  frequency?: NotificationFrequency
): Promise<string | null> {
  try {
    // Clear the old window so refreshing doesn't stack duplicates.
    await cancelScheduledByType('daily_card');

    const resolved = frequency ?? (await getNotificationFrequency());

    const identifiers = await scheduleMessageWindow({
      category: 'daily_card',
      type: 'daily_card',
      screen: '(tabs)/deck',
      hour,
      minute,
      frequency: resolved,
    });

    // Save settings
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
    await AsyncStorage.setItem(
      NOTIFICATION_TIME_KEY,
      JSON.stringify({ hour, minute })
    );
    await AsyncStorage.setItem(NOTIFICATION_FREQUENCY_KEY, resolved);

    console.log(
      `[Notifications] Queued ${identifiers.length} ${resolved} notifications at ${hour}:${minute.toString().padStart(2, '0')}`
    );
    return identifiers[0] ?? null;
  } catch (error) {
    console.error('[Notifications] Scheduling error:', error);
    return null;
  }
}

/** Read the saved cadence for the activity card queue. */
export async function getNotificationFrequency(): Promise<NotificationFrequency> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_FREQUENCY_KEY);
    if (
      stored === 'daily' ||
      stored === 'every_other_day' ||
      stored === 'weekly'
    ) {
      return stored;
    }
    return DEFAULT_FREQUENCY;
  } catch {
    return DEFAULT_FREQUENCY;
  }
}

/** Change the cadence, re-queueing immediately if the reminder is on. */
export async function updateNotificationFrequency(
  frequency: NotificationFrequency
): Promise<boolean> {
  try {
    const settings = await getNotificationSettings();
    if (settings.enabled) {
      const identifier = await scheduleDailyNotification(
        settings.hour,
        settings.minute,
        frequency
      );
      return identifier !== null;
    }
    await AsyncStorage.setItem(NOTIFICATION_FREQUENCY_KEY, frequency);
    return true;
  } catch (error) {
    console.error('[Notifications] Error updating frequency:', error);
    return false;
  }
}

// ==================== MATCH ALERTS ====================

/**
 * Match alerts nudge the user toward mutual matches they haven't planned yet.
 *
 * The check is deliberately made when the notification *fires*, not here — but
 * local notifications can't run code at fire time, so instead we only queue
 * these when the user has matches worth surfacing, and re-evaluate that on each
 * launch via refreshScheduledNotifications().
 */
export async function scheduleMatchAlerts(
  hour: number = DEFAULT_HOUR,
  minute: number = DEFAULT_MINUTE
): Promise<string | null> {
  try {
    await cancelScheduledByType('match_alert');

    const identifiers = await scheduleMessageWindow({
      category: 'match',
      type: 'match_alert',
      screen: '(tabs)/matches',
      hour,
      minute,
      // Matches change slowly; a daily nudge about them would be nagging.
      frequency: 'weekly',
    });

    await AsyncStorage.setItem(MATCH_ALERTS_ENABLED_KEY, 'true');
    await AsyncStorage.setItem(
      MATCH_ALERTS_TIME_KEY,
      JSON.stringify({ hour, minute })
    );

    console.log(`[Notifications] Queued ${identifiers.length} match alerts`);
    return identifiers[0] ?? null;
  } catch (error) {
    console.error('[Notifications] Match alert scheduling error:', error);
    return null;
  }
}

export async function cancelMatchAlerts(): Promise<boolean> {
  try {
    await cancelScheduledByType('match_alert');
    await AsyncStorage.setItem(MATCH_ALERTS_ENABLED_KEY, 'false');
    return true;
  } catch (error) {
    console.error('[Notifications] Match alert cancellation error:', error);
    return false;
  }
}

export async function getMatchAlertSettings(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  return readQueueSettings(MATCH_ALERTS_ENABLED_KEY, MATCH_ALERTS_TIME_KEY);
}

export async function toggleMatchAlerts(enabled: boolean): Promise<boolean> {
  try {
    const settings = await getMatchAlertSettings();
    if (enabled) {
      return (await scheduleMatchAlerts(settings.hour, settings.minute)) !== null;
    } else {
      return await cancelMatchAlerts();
    }
  } catch (error) {
    console.error('[Notifications] Error toggling match alerts:', error);
    return false;
  }
}

// ==================== STREAK REMINDERS ====================

export async function scheduleStreakReminders(
  hour: number = DEFAULT_HOUR,
  minute: number = DEFAULT_MINUTE
): Promise<string | null> {
  try {
    await cancelScheduledByType('streak_reminder');

    const identifiers = await scheduleMessageWindow({
      category: 'streak',
      type: 'streak_reminder',
      screen: '(tabs)/deck',
      hour,
      minute,
      // A streak only survives if it's kept up daily, so this one has to be daily.
      frequency: 'daily',
    });

    await AsyncStorage.setItem(STREAK_REMINDERS_ENABLED_KEY, 'true');
    await AsyncStorage.setItem(
      STREAK_REMINDERS_TIME_KEY,
      JSON.stringify({ hour, minute })
    );

    console.log(
      `[Notifications] Queued ${identifiers.length} streak reminders`
    );
    return identifiers[0] ?? null;
  } catch (error) {
    console.error('[Notifications] Streak reminder scheduling error:', error);
    return null;
  }
}

export async function cancelStreakReminders(): Promise<boolean> {
  try {
    await cancelScheduledByType('streak_reminder');
    await AsyncStorage.setItem(STREAK_REMINDERS_ENABLED_KEY, 'false');
    return true;
  } catch (error) {
    console.error('[Notifications] Streak reminder cancellation error:', error);
    return false;
  }
}

export async function getStreakReminderSettings(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  return readQueueSettings(
    STREAK_REMINDERS_ENABLED_KEY,
    STREAK_REMINDERS_TIME_KEY
  );
}

export async function toggleStreakReminders(
  enabled: boolean
): Promise<boolean> {
  try {
    const settings = await getStreakReminderSettings();
    if (enabled) {
      return (
        (await scheduleStreakReminders(settings.hour, settings.minute)) !== null
      );
    } else {
      return await cancelStreakReminders();
    }
  } catch (error) {
    console.error('[Notifications] Error toggling streak reminders:', error);
    return false;
  }
}

/** Shared reader for a queue's enabled flag + time. */
async function readQueueSettings(
  enabledKey: string,
  timeKey: string
): Promise<{ enabled: boolean; hour: number; minute: number }> {
  try {
    const [enabled, timeStr] = await Promise.all([
      AsyncStorage.getItem(enabledKey),
      AsyncStorage.getItem(timeKey),
    ]);
    const time = timeStr
      ? JSON.parse(timeStr)
      : { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };

    return {
      enabled: enabled === 'true',
      hour: time.hour ?? DEFAULT_HOUR,
      minute: time.minute ?? DEFAULT_MINUTE,
    };
  } catch {
    return { enabled: false, hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
  }
}

/**
 * Top up every enabled queue. Safe to call on launch: it never *requests*
 * permission (that would pop an unprompted dialog — see
 * shouldInitializeNotificationsOnLaunch), it only re-queues when permission was
 * already granted. Each run rebuilds a full window from today, so fired
 * notifications are replaced with fresh messages instead of the queue draining.
 */
export async function refreshScheduledNotifications(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const [daily, conversation, match, streak] = await Promise.all([
      getNotificationSettings(),
      getConversationNotificationSettings(),
      getMatchAlertSettings(),
      getStreakReminderSettings(),
    ]);

    if (match.enabled) {
      await scheduleMatchAlerts(match.hour, match.minute);
    }
    if (streak.enabled) {
      await scheduleStreakReminders(streak.hour, streak.minute);
    }

    if (daily.enabled) {
      await scheduleDailyNotification(daily.hour, daily.minute);
    }
    if (conversation.enabled) {
      await scheduleDailyConversationNotification(
        conversation.hour,
        conversation.minute
      );
    }
  } catch (error) {
    console.error('[Notifications] Refresh error:', error);
  }
}

/** Cancel every scheduled notification tagged with `type`. */
async function cancelScheduledByType(type: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    }
  }
}

// Cancel the whole queue of daily notifications
export async function cancelDailyNotification(): Promise<boolean> {
  try {
    await cancelScheduledByType('daily_card');
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
    console.log('[Notifications] Daily notifications cancelled');
    return true;
  } catch (error) {
    console.error('[Notifications] Cancellation error:', error);
    return false;
  }
}

// Get notification settings
export async function getNotificationSettings(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  return readQueueSettings(NOTIFICATION_ENABLED_KEY, NOTIFICATION_TIME_KEY);
}

// Update notification time
export async function updateNotificationTime(
  hour: number,
  minute: number
): Promise<boolean> {
  try {
    const settings = await getNotificationSettings();

    if (settings.enabled) {
      await scheduleDailyNotification(hour, minute);
    } else {
      await AsyncStorage.setItem(
        NOTIFICATION_TIME_KEY,
        JSON.stringify({ hour, minute })
      );
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Error updating time:', error);
    return false;
  }
}

// Toggle notifications on/off
export async function toggleNotifications(enabled: boolean): Promise<boolean> {
  try {
    if (enabled) {
      const settings = await getNotificationSettings();
      return (
        (await scheduleDailyNotification(settings.hour, settings.minute)) !==
        null
      );
    } else {
      return await cancelDailyNotification();
    }
  } catch (error) {
    console.error('[Notifications] Error toggling:', error);
    return false;
  }
}

// Send immediate test notification — shows a real message from the bank
export async function sendTestNotification(): Promise<void> {
  try {
    const [message] = pickMessageSequence('daily_card', 1);
    const { title, body } = localizeMessage(message, getLanguage());

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'test', messageId: message.id, screen: '(tabs)/deck' },
        sound: 'default',
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.error('[Notifications] Test notification error:', error);
  }
}

// ==================== DAILY CONVERSATION NOTIFICATIONS ====================

// Schedule the rolling window of conversation starter notifications
export async function scheduleDailyConversationNotification(
  hour: number = 9, // Default 9 AM for conversation prompts
  minute: number = 0
): Promise<string | null> {
  try {
    // Clear the old window so refreshing doesn't stack duplicates.
    await cancelScheduledByType('daily_conversation');

    const identifiers = await scheduleMessageWindow({
      category: 'conversation',
      type: 'daily_conversation',
      screen: '(conversation)',
      hour,
      minute,
    });

    // Save settings
    await AsyncStorage.setItem(CONVERSATION_NOTIFICATION_ENABLED_KEY, 'true');
    await AsyncStorage.setItem(
      CONVERSATION_NOTIFICATION_TIME_KEY,
      JSON.stringify({ hour, minute })
    );

    console.log(
      `[Notifications] Queued ${identifiers.length} conversation notifications at ${hour}:${minute.toString().padStart(2, '0')}`
    );
    return identifiers[0] ?? null;
  } catch (error) {
    console.error('[Notifications] Conversation scheduling error:', error);
    return null;
  }
}

// Cancel the whole queue of conversation notifications
export async function cancelDailyConversationNotification(): Promise<boolean> {
  try {
    await cancelScheduledByType('daily_conversation');
    await AsyncStorage.setItem(CONVERSATION_NOTIFICATION_ENABLED_KEY, 'false');
    console.log('[Notifications] Daily conversation notifications cancelled');
    return true;
  } catch (error) {
    console.error('[Notifications] Conversation cancellation error:', error);
    return false;
  }
}

// Get conversation notification settings
export async function getConversationNotificationSettings(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  try {
    const enabled = await AsyncStorage.getItem(
      CONVERSATION_NOTIFICATION_ENABLED_KEY
    );
    const timeStr = await AsyncStorage.getItem(
      CONVERSATION_NOTIFICATION_TIME_KEY
    );

    const time = timeStr ? JSON.parse(timeStr) : { hour: 9, minute: 0 };

    return {
      enabled: enabled === 'true',
      hour: time.hour ?? 9,
      minute: time.minute ?? 0,
    };
  } catch (error) {
    console.error(
      '[Notifications] Error getting conversation settings:',
      error
    );
    return { enabled: false, hour: 9, minute: 0 };
  }
}

// Update conversation notification time
export async function updateConversationNotificationTime(
  hour: number,
  minute: number
): Promise<boolean> {
  try {
    const settings = await getConversationNotificationSettings();

    if (settings.enabled) {
      await scheduleDailyConversationNotification(hour, minute);
    } else {
      await AsyncStorage.setItem(
        CONVERSATION_NOTIFICATION_TIME_KEY,
        JSON.stringify({ hour, minute })
      );
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Error updating conversation time:', error);
    return false;
  }
}

// Toggle conversation notifications on/off
export async function toggleConversationNotifications(
  enabled: boolean
): Promise<boolean> {
  try {
    if (enabled) {
      const settings = await getConversationNotificationSettings();
      return (
        (await scheduleDailyConversationNotification(
          settings.hour,
          settings.minute
        )) !== null
      );
    } else {
      return await cancelDailyConversationNotification();
    }
  } catch (error) {
    console.error(
      '[Notifications] Error toggling conversation notifications:',
      error
    );
    return false;
  }
}

// Send immediate test conversation notification
export async function sendTestConversationNotification(): Promise<void> {
  try {
    const [message] = pickMessageSequence('conversation', 1);
    const { title, body } = localizeMessage(message, getLanguage());

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'test_conversation',
          messageId: message.id,
          screen: '(conversation)',
        },
        sound: 'default',
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.error(
      '[Notifications] Test conversation notification error:',
      error
    );
  }
}

// Hook for notification management
export function useNotifications() {
  return {
    initialize: initializeNotifications,
    scheduleDaily: scheduleDailyNotification,
    cancelDaily: cancelDailyNotification,
    getSettings: getNotificationSettings,
    updateTime: updateNotificationTime,
    toggle: toggleNotifications,
    sendTest: sendTestNotification,
    refresh: refreshScheduledNotifications,
    // Frequency
    getFrequency: getNotificationFrequency,
    updateFrequency: updateNotificationFrequency,
    // Match alerts
    getMatchAlertSettings,
    toggleMatchAlerts,
    // Streak reminders
    getStreakReminderSettings,
    toggleStreakReminders,
    // Conversation notifications
    scheduleDailyConversation: scheduleDailyConversationNotification,
    cancelDailyConversation: cancelDailyConversationNotification,
    getConversationSettings: getConversationNotificationSettings,
    updateConversationTime: updateConversationNotificationTime,
    toggleConversation: toggleConversationNotifications,
    sendTestConversation: sendTestConversationNotification,
  };
}

// Add notification response listener
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}

// Add notification received listener (foreground)
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}
