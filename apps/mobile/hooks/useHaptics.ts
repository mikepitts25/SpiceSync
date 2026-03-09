// Haptic feedback utility hook
// Provides consistent tactile feedback across the app

import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export type HapticType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error'
  | 'selection';

export function useHaptics() {
  const trigger = useCallback(async (type: HapticType) => {
    try {
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
    } catch (error) {
      // Silently fail if haptics aren't available
      console.log('[Haptics] Failed to trigger:', type, error);
    }
  }, []);

  // Predefined haptic patterns for common actions
  const cardDraw = useCallback(() => trigger('light'), [trigger]);
  const match = useCallback(() => trigger('medium'), [trigger]);
  const achievement = useCallback(() => trigger('heavy'), [trigger]);
  const streakMilestone = useCallback(() => trigger('success'), [trigger]);
  const buttonPress = useCallback(() => trigger('selection'), [trigger]);
  const error = useCallback(() => trigger('error'), [trigger]);
  const success = useCallback(() => trigger('success'), [trigger]);

  return {
    trigger,
    cardDraw,
    match,
    achievement,
    streakMilestone,
    buttonPress,
    error,
    success,
  };
}

// Standalone function for use outside of hooks
export async function haptic(type: HapticType) {
  try {
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
  } catch (error) {
    console.log('[Haptics] Failed:', error);
  }
}
