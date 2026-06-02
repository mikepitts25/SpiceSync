import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { mmkvStorage } from '../storage/mmkv';

type ViewedMatchesState = {
  viewedIds: Record<string, true>;
  markViewed: (id: string) => void;
  clearViewed: () => void;
};

const normalizeId = (id: string): string | null => {
  const normalized = String(id || '').trim();
  return normalized.length ? normalized : null;
};

export const useViewedMatchesStore = create<ViewedMatchesState>()(
  persist(
    (set) => ({
      viewedIds: {},
      markViewed: (id) => {
        const normalized = normalizeId(id);
        if (!normalized) return;

        set((state) => {
          if (state.viewedIds[normalized]) return state;
          return {
            viewedIds: {
              ...state.viewedIds,
              [normalized]: true,
            },
          };
        });
      },
      clearViewed: () => set({ viewedIds: {} }),
    }),
    {
      name: 'viewed-matches',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ viewedIds: state.viewedIds }),
    }
  )
);
