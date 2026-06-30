import { isPurchaseProviderConfigured } from './purchaseService';

export function isFreeBetaPremiumAccessEnabled(): boolean {
  return (
    !isPurchaseProviderConfigured() &&
    process.env.EXPO_PUBLIC_FREE_BETA_ACCESS !== 'false'
  );
}

export function hasPremiumFeatureAccess(explicitUnlock: boolean): boolean {
  return explicitUnlock || isFreeBetaPremiumAccessEnabled();
}
