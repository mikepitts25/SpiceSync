import { shouldInitializeNotificationsOnLaunch } from '../lib/notifications/environment';

describe('notification environment', () => {
  it('does not initialize notifications automatically in Expo Go', () => {
    expect(shouldInitializeNotificationsOnLaunch('expo')).toBe(false);
  });

  it('does not request notification permission automatically in standalone builds', () => {
    expect(shouldInitializeNotificationsOnLaunch('standalone')).toBe(false);
    expect(shouldInitializeNotificationsOnLaunch('guest')).toBe(false);
    expect(shouldInitializeNotificationsOnLaunch(null)).toBe(false);
  });
});
