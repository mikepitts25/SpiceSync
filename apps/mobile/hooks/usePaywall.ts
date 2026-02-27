import { useState, useCallback } from 'react';
import { useSettingsStore } from './stores/settingsStore';
import { router } from 'expo-router';

export type PremiumFeature = 
  | 'insights'
  | 'custom-activities'
  | 'export'
  | 'unlimited-profiles'
  | 'premium-themes';

const FREE_FEATURES: PremiumFeature[] = [];

export function usePaywall() {
  const unlocked = useSettingsStore((state) => state.unlocked);
  const [showPaywall, setShowPaywall] = useState(false);

  const checkAccess = useCallback((feature: PremiumFeature): boolean => {
    if (unlocked) return true;
    if (FREE_FEATURES.includes(feature)) return true;
    
    setShowPaywall(true);
    return false;
  }, [unlocked]);

  const openPaywall = useCallback(() => {
    setShowPaywall(true);
    router.push('/(unlock)');
  }, []);

  const closePaywall = useCallback(() => {
    setShowPaywall(false);
  }, []);

  return {
    unlocked,
    showPaywall,
    checkAccess,
    openPaywall,
    closePaywall,
  };
}
