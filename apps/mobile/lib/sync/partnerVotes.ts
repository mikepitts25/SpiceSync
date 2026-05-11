import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type PartnerVoteValue = 'yes' | 'maybe' | 'no';

export type PartnerVoteRecord = {
  cardId: string;
  vote: PartnerVoteValue;
  updatedAt: number;
  receivedAt: number;
};

type PartnerVotesState = {
  byCardId: Record<string, PartnerVoteRecord>;
  answeredCount: number;
  applyVote: (record: PartnerVoteRecord) => void;
  setAnsweredCount: (count: number, updatedAt: number) => void;
  reset: () => void;
};

export const usePartnerVotesStore = create<PartnerVotesState>()(
  persist(
    (set, get) => ({
      byCardId: {},
      answeredCount: 0,
      applyVote: (record) => {
        const existing = get().byCardId[record.cardId];
        if (existing && existing.updatedAt >= record.updatedAt) return;
        set((state) => ({
          byCardId: { ...state.byCardId, [record.cardId]: record },
        }));
      },
      setAnsweredCount: (count, _updatedAt) => {
        set((state) => ({
          answeredCount: Math.max(state.answeredCount, count),
        }));
      },
      reset: () => set({ byCardId: {}, answeredCount: 0 }),
    }),
    {
      name: 'spicesync-partner-votes',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
