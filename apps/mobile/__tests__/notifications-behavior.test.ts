import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { toggleNotifications } from '../lib/notifications';
import {
  getNotificationDestination,
  getNotificationSummaryLabel,
} from '../lib/notifications/routing';

describe('notification behavior', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('does not report a reminder as enabled when scheduling fails', async () => {
    (
      Notifications.scheduleNotificationAsync as jest.Mock
    ).mockRejectedValueOnce(new Error('scheduler unavailable'));

    await expect(toggleNotifications(true)).resolves.toBe(false);
  });

  it('routes notification taps to approved app destinations', () => {
    expect(getNotificationDestination({ type: 'daily_card' })).toBe(
      '/(tabs)/deck'
    );
    expect(getNotificationDestination({ type: 'match_alert' })).toBe(
      '/(tabs)/matches'
    );
    expect(getNotificationDestination({ type: 'daily_conversation' })).toBe(
      '/(conversation)'
    );
    expect(
      getNotificationDestination({ screen: 'https://malicious.example' })
    ).toBeNull();
  });

  it('summarizes the actual enabled notification cadence', () => {
    expect(
      getNotificationSummaryLabel({
        dailyEnabled: true,
        frequency: 'weekly',
        otherEnabled: false,
      })
    ).toBe('Weekly');
    expect(
      getNotificationSummaryLabel({
        dailyEnabled: false,
        frequency: 'daily',
        otherEnabled: true,
      })
    ).toBe('On');
    expect(
      getNotificationSummaryLabel({
        dailyEnabled: false,
        frequency: 'daily',
        otherEnabled: false,
      })
    ).toBe('Off');
  });
});
