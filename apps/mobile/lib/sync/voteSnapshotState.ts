import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type VoteSnapshotState = {
  versionByAuthor: Record<string, number>;
  reserveVersion: (coupleId: string, authorDeviceId: string) => number;
  reset: () => void;
};

export const useVoteSnapshotState = create<VoteSnapshotState>()(
  persist(
    (set) => ({
      versionByAuthor: {},
      reserveVersion: (coupleId, authorDeviceId) => {
        const key = `${coupleId}:${authorDeviceId}`;
        let reserved = Date.now();
        set((state) => {
          reserved = Math.max(reserved, (state.versionByAuthor[key] ?? 0) + 1);
          return {
            versionByAuthor: {
              ...state.versionByAuthor,
              [key]: reserved,
            },
          };
        });
        return reserved;
      },
      reset: () => set({ versionByAuthor: {} }),
    }),
    {
      name: 'spicesync-vote-snapshot-sync',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
