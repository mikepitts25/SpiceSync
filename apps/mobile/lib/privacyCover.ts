import type { AppStateStatus } from 'react-native';

export function shouldShowPrivacyCover(
  appState: AppStateStatus,
  discreteModeEnabled: boolean
): boolean {
  return discreteModeEnabled && appState !== 'active';
}
