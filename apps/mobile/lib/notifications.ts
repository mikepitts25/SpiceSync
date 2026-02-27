// Push Notifications Service
// Setup for Expo Notifications

import { Platform } from 'react-native';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export type NotificationType = 
  | 'daily_suggestion'
  | 'new_match'
  | 'partner_activity'
  | 'streak_reminder'
  | 'achievement_unlocked'
  | 'game_reminder';

// Notification content templates
const NOTIFICATION_TEMPLATES: Record<NotificationType, () => NotificationPayload> = {
  daily_suggestion: () => ({
    title: '💡 New Suggestion for You',
    body: 'Check out today\'s personalized activity recommendation!',
    data: { type: 'suggestion', screen: '(suggestions)' },
  }),
  
  new_match: () => ({
    title: '💕 New Match!',
    body: 'You and your partner both liked a new activity. Check it out!',
    data: { type: 'match', screen: '(matches)' },
  }),
  
  partner_activity: () => ({
    title: '👀 Partner Activity',
    body: 'Your partner just voted on some activities. See what they liked!',
    data: { type: 'activity', screen: '(matches)' },
  }),
  
  streak_reminder: () => ({
    title: '🔥 Streak in Danger!',
    body: 'You\'re about to lose your daily streak. Open the app to keep it going!',
    data: { type: 'streak', screen: '(deck)' },
  }),
  
  achievement_unlocked: () => ({
    title: '🏆 Achievement Unlocked!',
    body: 'You earned a new badge. Open to see what you unlocked!',
    data: { type: 'achievement', screen: '(about)/AchievementsScreen' },
  }),
  
  game_reminder: () => ({
    title: '🎲 Time to Play!',
    body: 'Take a break and play Spice Dice with your partner.',
    data: { type: 'game', screen: '(game)' },
  }),
};

// Initialize notifications (call this in app startup)
export async function initializeNotifications(): Promise<boolean> {
  // This would use expo-notifications in production
  // For now, we'll create the structure
  
  console.log('[Notifications] Service initialized');
  return true;
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  // Would use Notifications.requestPermissionsAsync()
  // For now, return true to indicate the flow works
  return true;
}

// Schedule a local notification
export async function scheduleNotification(
  type: NotificationType,
  trigger: { seconds: number } | { hour: number; minute: number; repeats: boolean }
): Promise<string | null> {
  const template = NOTIFICATION_TEMPLATES[type]();
  
  console.log('[Notifications] Scheduled:', type, template.title);
  
  // Would use Notifications.scheduleNotificationAsync()
  // Returns notification identifier
  return `notification-${Date.now()}`;
}

// Cancel a scheduled notification
export async function cancelNotification(identifier: string): Promise<void> {
  console.log('[Notifications] Cancelled:', identifier);
  // Would use Notifications.cancelScheduledNotificationAsync(identifier)
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  console.log('[Notifications] All cancelled');
  // Would use Notifications.cancelAllScheduledNotificationsAsync()
}

// Set up daily reminder
export async function setupDailyReminder(hour: number = 20, minute: number = 0): Promise<void> {
  // Cancel existing daily reminders
  await cancelAllNotifications();
  
  // Schedule new daily reminder
  await scheduleNotification('daily_suggestion', {
    hour,
    minute,
    repeats: true,
  });
  
  console.log(`[Notifications] Daily reminder set for ${hour}:${minute}`);
}

// Send immediate local notification
export async function sendImmediateNotification(
  type: NotificationType
): Promise<void> {
  const template = NOTIFICATION_TEMPLATES[type]();
  
  console.log('[Notifications] Immediate:', template.title, template.body);
  
  // Would use Notifications.presentNotificationAsync()
}

// Get all scheduled notifications
export async function getScheduledNotifications(): Promise<any[]> {
  // Would use Notifications.getAllScheduledNotificationsAsync()
  return [];
}

// Notification categories (for action buttons)
export const NOTIFICATION_CATEGORIES = [
  {
    identifier: 'match',
    actions: [
      { identifier: 'view', buttonTitle: 'View Match' },
      { identifier: 'dismiss', buttonTitle: 'Dismiss' },
    ],
  },
  {
    identifier: 'suggestion',
    actions: [
      { identifier: 'try_it', buttonTitle: 'Try It' },
      { identifier: 'later', buttonTitle: 'Later' },
    ],
  },
];

// Hook for components to trigger notifications
export function useNotifications() {
  const triggerNotification = async (type: NotificationType) => {
    await sendImmediateNotification(type);
  };
  
  const scheduleReminder = async (type: NotificationType, seconds: number) => {
    await scheduleNotification(type, { seconds });
  };
  
  return {
    triggerNotification,
    scheduleReminder,
    setupDailyReminder,
    cancelAllNotifications,
  };
}
