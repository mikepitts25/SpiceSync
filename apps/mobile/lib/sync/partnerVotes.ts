import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PairPreference, Readiness } from '../votes/rolePreferences';

export type PartnerVoteValue = 'yes' | 'maybe' | 'no';

export type PartnerVoteRecord = {
  cardId: string;
  vote: PartnerVoteValue;
  pairPreference?: PairPreference;
  readiness?: Readiness;
  updatedAt: number;
  receivedAt: number;
};

type PartnerVotesState = {
  byCardId: Record<string, PartnerVoteRecord>;
  answeredCount: number;
  lastSnapshotVersion: number;
  lastSnapshotAuthorDeviceId: string | null;
  lastSnapshotReceivedAt: number | null;
  applyVote: (record: PartnerVoteRecord) => void;
  setAnsweredCount: (count: number, updatedAt: number) => void;
  replaceSnapshot: (snapshot: {
    authorDeviceId: string;
    snapshotVersion: number;
    answeredCount: number;
    votes: Record<string, PartnerVoteRecord>;
    receivedAt: number;
  }) => void;
  reset: () => void;
};

export const usePartnerVotesStore = create<PartnerVotesState>()(
  persist(
    (set, get) => ({
      byCardId: {},
      answeredCount: 0,
      lastSnapshotVersion: 0,
      lastSnapshotAuthorDeviceId: null,
      lastSnapshotReceivedAt: null,
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
      replaceSnapshot: (snapshot) =>
        set({
          byCardId: snapshot.votes,
          answeredCount: snapshot.answeredCount,
          lastSnapshotVersion: snapshot.snapshotVersion,
          lastSnapshotAuthorDeviceId: snapshot.authorDeviceId,
          lastSnapshotReceivedAt: snapshot.receivedAt,
        }),
      reset: () =>
        set({
          byCardId: {},
          answeredCount: 0,
          lastSnapshotVersion: 0,
          lastSnapshotAuthorDeviceId: null,
          lastSnapshotReceivedAt: null,
        }),
    }),
    {
      name: 'spicesync-partner-votes',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
