import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

import { useSettingsStore } from '../src/stores/settingsStore';

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

async function performHaptic(type: HapticType): Promise<void> {
  switch (type) {
    case 'light':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'success':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'error':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'selection':
      await Haptics.selectionAsync();
      break;
  }
}

async function safelyPerform(
  type: HapticType,
  enabled: boolean
): Promise<void> {
  if (!enabled) return;
  try {
    await performHaptic(type);
  } catch (error) {
    console.log('[Haptics] Failed:', type, error);
  }
}

export function useHaptics() {
  const enabled = useSettingsStore((state) => state.hapticsEnabled);
  const trigger = useCallback(
    (type: HapticType) => safelyPerform(type, enabled),
    [enabled]
  );

  return {
    trigger,
    cardDraw: useCallback(() => trigger('light'), [trigger]),
    match: useCallback(() => trigger('medium'), [trigger]),
    achievement: useCallback(() => trigger('heavy'), [trigger]),
    streakMilestone: useCallback(() => trigger('success'), [trigger]),
    buttonPress: useCallback(() => trigger('selection'), [trigger]),
    error: useCallback(() => trigger('error'), [trigger]),
    success: useCallback(() => trigger('success'), [trigger]),
  };
}

export async function haptic(type: HapticType): Promise<void> {
  await safelyPerform(type, useSettingsStore.getState().hapticsEnabled);
}
