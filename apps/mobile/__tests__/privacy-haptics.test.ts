jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
}));

import * as Haptics from 'expo-haptics';

import { haptic } from '../hooks/useHaptics';
import { shouldShowPrivacyCover } from '../lib/privacyCover';
import { useSettingsStore } from '../src/stores/settingsStore';

describe('privacy and feedback preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({ hapticsEnabled: true });
  });

  it('covers app-switcher snapshots only when discrete mode is enabled', () => {
    expect(shouldShowPrivacyCover('active', true)).toBe(false);
    expect(shouldShowPrivacyCover('inactive', true)).toBe(true);
    expect(shouldShowPrivacyCover('background', true)).toBe(true);
    expect(shouldShowPrivacyCover('background', false)).toBe(false);
  });

  it('suppresses all haptic feedback when the preference is disabled', async () => {
    useSettingsStore.setState({ hapticsEnabled: false });

    await haptic('selection');

    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it('plays haptic feedback when the preference is enabled', async () => {
    await haptic('selection');

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });
});
