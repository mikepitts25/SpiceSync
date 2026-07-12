import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';

type StarterPackState = {
  dismissedByProfile: Record<string, boolean>;
  dismiss: (profileId: string) => void;
};

export const useStarterPackStore = create<StarterPackState>()(
  persist(
    (set) => ({
      dismissedByProfile: {},
      dismiss: (profileId) => {
        const key = String(profileId ?? '').trim();
        if (!key) return;
        set((state) => ({
          dismissedByProfile: { ...state.dismissedByProfile, [key]: true },
        }));
      },
    }),
    {
      name: 'starter-pack',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
