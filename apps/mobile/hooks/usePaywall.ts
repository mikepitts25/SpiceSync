import { useState, useCallback } from 'react';
import { usePremiumStore, PremiumFeature } from '../src/stores/premium';
import { router } from 'expo-router';

const FREE_FEATURES: PremiumFeature[] = [];

export function usePaywall() {
  const unlocked = usePremiumStore((state) => state.isPremium());
  const hasPackAccess = usePremiumStore((state) => state.hasPackAccess);
  const [showPaywall, setShowPaywall] = useState(false);

  const checkAccess = useCallback((feature: PremiumFeature): boolean => {
    if (unlocked) return true;
    if (FREE_FEATURES.includes(feature)) return true;
    
    setShowPaywall(true);
    return false;
  }, [unlocked]);

  const checkCardAccess = useCallback((cardId: string): boolean => {
    // Free cards are always accessible
    if (!cardId.startsWith('p-') && !cardId.startsWith('k-') && !cardId.startsWith('vac-') && !cardId.startsWith('k201-') && !cardId.startsWith('dn-')) {
      return true;
    }
    
    // Check pack access for pack cards
    if (cardId.startsWith('vac-') || cardId.startsWith('k201-') || cardId.startsWith('dn-')) {
      return hasPackAccess(cardId);
    }
    
    // Premium cards require premium
    if (unlocked) return true;
    
    return false;
  }, [unlocked, hasPackAccess]);

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
    checkCardAccess,
    openPaywall,
    closePaywall,
  };
}

// Re-export types for convenience
export type { PremiumFeature } from '../src/stores/premium';
