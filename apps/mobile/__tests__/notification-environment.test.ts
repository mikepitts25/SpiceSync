import { shouldInitializeNotificationsOnLaunch } from '../lib/notifications/environment';

describe('notification environment', () => {
  it('does not initialize notifications automatically in Expo Go', () => {
    expect(shouldInitializeNotificationsOnLaunch('expo')).toBe(false);
  });

  it('initializes notifications automatically in development and standalone builds', () => {
    expect(shouldInitializeNotificationsOnLaunch('standalone')).toBe(true);
    expect(shouldInitializeNotificationsOnLaunch('guest')).toBe(true);
    expect(shouldInitializeNotificationsOnLaunch(null)).toBe(true);
  });
});
