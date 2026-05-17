import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { useCoupleLinkStore } from './coupleLink';
import { useEventQueueStore } from './eventQueue';
import { getIdentityIfExists } from './identity';

export type RevealConsentBucket = 'partialYesMaybe' | 'mutualMaybe';

type ConsentMap = Partial<Record<RevealConsentBucket, number>>;

type RevealConsentState = {
  local: ConsentMap;
  partner: ConsentMap;
  grantLocal: (bucket: RevealConsentBucket, updatedAt?: number) => void;
  applyPartnerConsent: (bucket: RevealConsentBucket, updatedAt: number) => void;
  hasUnlock: (bucket: RevealConsentBucket, isRemote: boolean) => boolean;
  reset: () => void;
};

export const useRevealConsentStore = create<RevealConsentState>()(
  persist(
    (set, get) => ({
      local: {},
      partner: {},
      grantLocal: (bucket, updatedAt = Date.now()) => {
        set((state) => ({
          local: {
            ...state.local,
            [bucket]: Math.max(state.local[bucket] ?? 0, updatedAt),
          },
        }));
      },
      applyPartnerConsent: (bucket, updatedAt) => {
        set((state) => ({
          partner: {
            ...state.partner,
            [bucket]: Math.max(state.partner[bucket] ?? 0, updatedAt),
          },
        }));
      },
      hasUnlock: (bucket, isRemote) => {
        const state = get();
        if (!state.local[bucket]) return false;
        if (!isRemote) return true;
        return Boolean(state.partner[bucket]);
      },
      reset: () => set({ local: {}, partner: {} }),
    }),
    {
      name: 'spicesync-reveal-consent',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export async function requestRevealUnlock(
  bucket: RevealConsentBucket
): Promise<void> {
  const updatedAt = Date.now();
  useRevealConsentStore.getState().grantLocal(bucket, updatedAt);

  const link = useCoupleLinkStore.getState().link;
  if (!link || link.status !== 'active') return;

  const id = await getIdentityIfExists();
  if (!id) return;

  useEventQueueStore.getState().enqueue({
    schemaVersion: 1,
    eventType: 'reveal.unlock',
    authorDeviceId: id.identity.deviceId,
    bucket,
    updatedAt,
  });
}
