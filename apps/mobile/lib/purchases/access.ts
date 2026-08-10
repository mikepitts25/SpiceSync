import { isPurchaseProviderConfigured } from './config';

export function isFreeBetaPremiumAccessEnabled(): boolean {
  return (
    !isPurchaseProviderConfigured() &&
    process.env.EXPO_PUBLIC_FREE_BETA_ACCESS === 'true'
  );
}

export function hasPremiumFeatureAccess(explicitUnlock: boolean): boolean {
  return explicitUnlock || isFreeBetaPremiumAccessEnabled();
}
