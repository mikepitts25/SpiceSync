const resolved = (value) => jest.fn().mockResolvedValue(value);

module.exports = {
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: resolved({ status: 'granted' }),
  requestPermissionsAsync: resolved({ status: 'granted' }),
  setNotificationChannelAsync: resolved(undefined),
  scheduleNotificationAsync: resolved('notification-id'),
  getAllScheduledNotificationsAsync: resolved([]),
  cancelScheduledNotificationAsync: resolved(undefined),
  cancelAllScheduledNotificationsAsync: resolved(undefined),
  getLastNotificationResponseAsync: resolved(null),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
};
