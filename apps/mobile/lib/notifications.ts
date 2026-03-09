// Daily Card Push Notification System
// Schedules and manages daily activity notifications

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useKinks, KinkItem } from './data';
import { getDailyStarter } from './conversationStarters';

// Notification identifiers
const DAILY_CARD_NOTIFICATION_ID = 'daily-card-notification';
const DAILY_CONVERSATION_NOTIFICATION_ID = 'daily-conversation-notification';
const DAILY_REMINDER_CHANNEL_ID = 'daily-reminder';

// Storage keys
const NOTIFICATION_ENABLED_KEY = '@spicesync_notifications_enabled';
const NOTIFICATION_TIME_KEY = '@spicesync_notification_time';
const CONVERSATION_NOTIFICATION_ENABLED_KEY = '@spicesync_conversation_notifications_enabled';
const CONVERSATION_NOTIFICATION_TIME_KEY = '@spicesync_conversation_notification_time';

// Default notification time (8 PM)
const DEFAULT_HOUR = 20;
const DEFAULT_MINUTE = 0;

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Initialize notifications
export async function initializeNotifications(): Promise<boolean> {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
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
      await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
        name: 'Daily Activity Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF2D92',
      });
    }
    
    console.log('[Notifications] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[Notifications] Initialization error:', error);
    return false;
  }
}

// Get random activity for notification
function getRandomActivity(kinks: KinkItem[]): KinkItem | null {
  if (!kinks.length) return null;
  const randomIndex = Math.floor(Math.random() * kinks.length);
  return kinks[randomIndex];
}

// Schedule daily notification
export async function scheduleDailyNotification(
  hour: number = DEFAULT_HOUR,
  minute: number = DEFAULT_MINUTE
): Promise<string | null> {
  try {
    // Cancel existing notification
    await cancelDailyNotification();
    
    // Get a random activity
    const { kinks } = useKinks('en');
    const activity = getRandomActivity(kinks);
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💡 Daily Spice Idea',
        body: activity 
          ? `Today's idea: ${activity.title}`
          : 'Discover something new with your partner today!',
        data: { 
          type: 'daily_card',
          activityId: activity?.id,
          screen: '(deck)',
        },
        sound: 'default',
      },
      trigger: {
        hour,
        minute,
        repeats: true,
        channelId: Platform.OS === 'android' ? DAILY_REMINDER_CHANNEL_ID : undefined,
      } as Notifications.DailyTriggerInput,
    });
    
    // Save settings
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
    await AsyncStorage.setItem(NOTIFICATION_TIME_KEY, JSON.stringify({ hour, minute }));
    
    console.log(`[Notifications] Daily notification scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
    return identifier;
  } catch (error) {
    console.error('[Notifications] Scheduling error:', error);
    return null;
  }
}

// Cancel daily notification
export async function cancelDailyNotification(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'daily_card') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
    console.log('[Notifications] Daily notification cancelled');
  } catch (error) {
    console.error('[Notifications] Cancellation error:', error);
  }
}

// Get notification settings
export async function getNotificationSettings(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  try {
    const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
    const timeStr = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
    
    const time = timeStr ? JSON.parse(timeStr) : { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
    
    return {
      enabled: enabled === 'true',
      hour: time.hour ?? DEFAULT_HOUR,
      minute: time.minute ?? DEFAULT_MINUTE,
    };
  } catch (error) {
    console.error('[Notifications] Error getting settings:', error);
    return { enabled: false, hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
  }
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
      await AsyncStorage.setItem(NOTIFICATION_TIME_KEY, JSON.stringify({ hour, minute }));
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
      await scheduleDailyNotification(settings.hour, settings.minute);
    } else {
      await cancelDailyNotification();
    }
    return true;
  } catch (error) {
    console.error('[Notifications] Error toggling:', error);
    return false;
  }
}

// Send immediate test notification
export async function sendTestNotification(): Promise<void> {
  try {
    const { kinks } = useKinks('en');
    const activity = getRandomActivity(kinks);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💡 Test Notification',
        body: activity 
          ? `Sample: ${activity.title}`
          : 'This is how your daily notifications will look!',
        data: { type: 'test', screen: '(deck)' },
        sound: 'default',
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.error('[Notifications] Test notification error:', error);
  }
}

// ==================== DAILY CONVERSATION NOTIFICATIONS ====================

// Schedule daily conversation starter notification
export async function scheduleDailyConversationNotification(
  hour: number = 9, // Default 9 AM for conversation prompts
  minute: number = 0
): Promise<string | null> {
  try {
    // Cancel existing notification
    await cancelDailyConversationNotification();
    
    // Get today's conversation starter
    const starter = getDailyStarter();
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💬 Today\'s Conversation Starter',
        body: starter.question.substring(0, 100) + (starter.question.length > 100 ? '...' : ''),
        data: { 
          type: 'daily_conversation',
          starterId: starter.id,
          screen: '(conversation)',
        },
        sound: 'default',
      },
      trigger: {
        hour,
        minute,
        repeats: true,
        channelId: Platform.OS === 'android' ? DAILY_REMINDER_CHANNEL_ID : undefined,
      } as Notifications.DailyTriggerInput,
    });
    
    // Save settings
    await AsyncStorage.setItem(CONVERSATION_NOTIFICATION_ENABLED_KEY, 'true');
    await AsyncStorage.setItem(CONVERSATION_NOTIFICATION_TIME_KEY, JSON.stringify({ hour, minute }));
    
    console.log(`[Notifications] Daily conversation notification scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
    return identifier;
  } catch (error) {
    console.error('[Notifications] Conversation scheduling error:', error);
    return null;
  }
}

// Cancel daily conversation notification
export async function cancelDailyConversationNotification(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'daily_conversation') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
    await AsyncStorage.setItem(CONVERSATION_NOTIFICATION_ENABLED_KEY, 'false');
    console.log('[Notifications] Daily conversation notification cancelled');
  } catch (error) {
    console.error('[Notifications] Conversation cancellation error:', error);
  }
}

// Get conversation notification settings
export async function getConversationNotificationSettings(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  try {
    const enabled = await AsyncStorage.getItem(CONVERSATION_NOTIFICATION_ENABLED_KEY);
    const timeStr = await AsyncStorage.getItem(CONVERSATION_NOTIFICATION_TIME_KEY);
    
    const time = timeStr ? JSON.parse(timeStr) : { hour: 9, minute: 0 };
    
    return {
      enabled: enabled === 'true',
      hour: time.hour ?? 9,
      minute: time.minute ?? 0,
    };
  } catch (error) {
    console.error('[Notifications] Error getting conversation settings:', error);
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
      await AsyncStorage.setItem(CONVERSATION_NOTIFICATION_TIME_KEY, JSON.stringify({ hour, minute }));
    }
    
    return true;
  } catch (error) {
    console.error('[Notifications] Error updating conversation time:', error);
    return false;
  }
}

// Toggle conversation notifications on/off
export async function toggleConversationNotifications(enabled: boolean): Promise<boolean> {
  try {
    if (enabled) {
      const settings = await getConversationNotificationSettings();
      await scheduleDailyConversationNotification(settings.hour, settings.minute);
    } else {
      await cancelDailyConversationNotification();
    }
    return true;
  } catch (error) {
    console.error('[Notifications] Error toggling conversation notifications:', error);
    return false;
  }
}

// Send immediate test conversation notification
export async function sendTestConversationNotification(): Promise<void> {
  try {
    const starter = getDailyStarter();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💬 Test: Conversation Starter',
        body: starter.question.substring(0, 100) + (starter.question.length > 100 ? '...' : ''),
        data: { type: 'test_conversation', screen: '(conversation)' },
        sound: 'default',
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.error('[Notifications] Test conversation notification error:', error);
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

// Add notification received listener (foreground)
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}
