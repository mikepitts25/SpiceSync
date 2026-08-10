import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { PRODUCT_SKUS } from '../../lib/pricing';

export const PREMIUM_STORAGE_KEY = 'spicesync-premium-v3';

export type Subscription = {
  tier: 'free' | 'premium';
  expiresAt: null;
  startedAt: number;
  productId: string | null;
  receipt: string | null;
  verifiedByStore: boolean;
};

type PremiumState = {
  subscription: Subscription;
  setLifetimeEntitlement: (receipt: string | null, purchasedAt: number) => void;
  clearStoreEntitlement: () => void;
  isPremium: () => boolean;
};

function freeSubscription(): Subscription {
  return {
    tier: 'free',
    expiresAt: null,
    startedAt: Date.now(),
    productId: null,
    receipt: null,
    verifiedByStore: false,
  };
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      subscription: freeSubscription(),

      setLifetimeEntitlement: (receipt, purchasedAt) => {
        set({
          subscription: {
            tier: 'premium',
            expiresAt: null,
            startedAt: purchasedAt,
            productId: PRODUCT_SKUS.PREMIUM_LIFETIME,
            receipt,
            verifiedByStore: true,
          },
        });
      },

      clearStoreEntitlement: () => set({ subscription: freeSubscription() }),

      isPremium: () => {
        const { subscription } = get();
        return (
          subscription.tier === 'premium' &&
          subscription.productId === PRODUCT_SKUS.PREMIUM_LIFETIME &&
          subscription.verifiedByStore
        );
      },
    }),
    {
      name: PREMIUM_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ subscription: state.subscription }),
    }
  )
);
