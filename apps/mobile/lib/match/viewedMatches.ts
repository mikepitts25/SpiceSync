import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { mmkvStorage } from '../storage/mmkv';

type ViewedMatchesState = {
  viewedIds: Record<string, true>;
  seenReadyIdsByProfile: Record<string, Record<string, true>>;
  markViewed: (id: string) => void;
  acknowledgeReadyMatches: (profileId: string, ids: readonly string[]) => void;
  clearViewed: () => void;
};

const normalizeId = (id: string): string | null => {
  const normalized = String(id || '').trim();
  return normalized.length ? normalized : null;
};

export function countUnseenReadyMatches(
  matches: readonly { id: string }[],
  seenIds: Readonly<Record<string, true>> = {}
): number {
  return matches.reduce(
    (count, match) => count + (seenIds[match.id] ? 0 : 1),
    0
  );
}

export const useViewedMatchesStore = create<ViewedMatchesState>()(
  persist(
    (set) => ({
      viewedIds: {},
      seenReadyIdsByProfile: {},
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
      acknowledgeReadyMatches: (profileId, ids) => {
        const normalizedProfileId = normalizeId(profileId);
        if (!normalizedProfileId) return;

        const normalizedIds = ids
          .map(normalizeId)
          .filter((id): id is string => Boolean(id));
        if (!normalizedIds.length) return;

        set((state) => {
          const current =
            state.seenReadyIdsByProfile[normalizedProfileId] ?? {};
          const next = { ...current };
          let changed = false;

          for (const id of normalizedIds) {
            if (!next[id]) {
              next[id] = true;
              changed = true;
            }
          }

          if (!changed) return state;
          return {
            seenReadyIdsByProfile: {
              ...state.seenReadyIdsByProfile,
              [normalizedProfileId]: next,
            },
          };
        });
      },
      clearViewed: () => set({ viewedIds: {}, seenReadyIdsByProfile: {} }),
    }),
    {
      name: 'viewed-matches',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        viewedIds: state.viewedIds,
        seenReadyIdsByProfile: state.seenReadyIdsByProfile,
      }),
    }
  )
);
