import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../../lib/storage/mmkv';

// NOTE: This is a lightweight scaffold. Real IAP/subscription integration
// (RevenueCat / StoreKit / Play Billing) can be layered on later.

type PremiumState = {
  isPro: boolean;
  // Debug helper (DEV-only UI can toggle this)
  setPro: (value: boolean) => void;
};

export const usePremium = create<PremiumState>()(
  persist(
    (set) => ({
      isPro: false,
      setPro: (value) => set({ isPro: value }),
    }),
    {
      name: 'premium-v1',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({ isPro: s.isPro }),
    }
  )
);
