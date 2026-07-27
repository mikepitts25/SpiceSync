// Local-only Couple Dice saved prompts, partitioned by active profile ID.
// Saved rolls never leave the device and are not visible to a partner —
// there is no sharing feature in v1.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { mmkvStorage } from '../storage/mmkv';
import type { DiceRoll } from '../coupleDice';

export type SavedDiceRoll = DiceRoll & {
  id: string;
  savedAt: number;
};

type CoupleDiceState = {
  savedByProfileId: Record<string, SavedDiceRoll[]>;
  getSaved: (profileId: string) => SavedDiceRoll[];
  saveRoll: (profileId: string, roll: DiceRoll, now?: number) => void;
  deleteSaved: (profileId: string, id: string) => void;
};

function createSavedId(): string {
  return `dice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useCoupleDiceStore = create<CoupleDiceState>()(
  persist(
    (set, get) => ({
      savedByProfileId: {},

      getSaved: (profileId) => get().savedByProfileId[profileId] ?? [],

      saveRoll: (profileId, roll, now = Date.now()) => {
        const entry: SavedDiceRoll = {
          ...roll,
          id: createSavedId(),
          savedAt: now,
        };
        set((state) => ({
          savedByProfileId: {
            ...state.savedByProfileId,
            [profileId]: [entry, ...(state.savedByProfileId[profileId] ?? [])],
          },
        }));
      },

      deleteSaved: (profileId, id) => {
        set((state) => {
          const current = state.savedByProfileId[profileId];
          if (!current) return state;
          return {
            savedByProfileId: {
              ...state.savedByProfileId,
              [profileId]: current.filter((entry) => entry.id !== id),
            },
          };
        });
      },
    }),
    {
      name: 'couple-dice',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ savedByProfileId: state.savedByProfileId }),
    }
  )
);
