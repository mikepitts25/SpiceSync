import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type MainTourScreenId } from '../../lib/main-screen-tours';
import { mmkvStorage } from '../../lib/storage/mmkv';

type DismissedTourScreens = Partial<Record<MainTourScreenId, true>>;

export type ScreenToursState = {
  dismissedTourScreens: DismissedTourScreens;
  isTourDismissed: (screenId: MainTourScreenId) => boolean;
  dismissTour: (screenId: MainTourScreenId) => void;
  resetTour: (screenId: MainTourScreenId) => void;
  resetAllTours: () => void;
};

export const useScreenToursStore = create<ScreenToursState>()(
  persist(
    (set, get) => ({
      dismissedTourScreens: {},
      isTourDismissed: (screenId) => !!get().dismissedTourScreens[screenId],
      dismissTour: (screenId) =>
        set((state) => ({
          dismissedTourScreens: {
            ...state.dismissedTourScreens,
            [screenId]: true,
          },
        })),
      resetTour: (screenId) =>
        set((state) => {
          const dismissedTourScreens = { ...state.dismissedTourScreens };
          delete dismissedTourScreens[screenId];

          return { dismissedTourScreens };
        }),
      resetAllTours: () => set({ dismissedTourScreens: {} }),
    }),
    {
      name: 'spicesync-screen-tours-v1',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        dismissedTourScreens: state.dismissedTourScreens,
      }),
    }
  )
);
