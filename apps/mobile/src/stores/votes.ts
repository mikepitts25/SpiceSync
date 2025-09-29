import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../../lib/storage/mmkv';

export type VoteValue = 'yes' | 'maybe' | 'no';

export type VotesByProfile = Record<string, Record<string, VoteValue>>;

export type MutualBuckets = {
  mutualYes: string[];
  partialYesMaybe: string[];
  mutualMaybe: string[];
};

type VotesState = {
  votesByProfile: VotesByProfile;
  setVote: (profileId: string, kinkId: string, value: VoteValue) => void;
  clearVote: (profileId: string, kinkId: string) => void;
  clearProfile: (profileId: string) => void;
  getVote: (profileId: string, kinkId: string) => VoteValue | undefined;
  getProfileVotes: (profileId: string) => Record<string, VoteValue>;
  getMutuals: (aId: string | undefined | null, bId: string | undefined | null) => MutualBuckets;
};

type PersistedVotes = {
  votesByProfile?: unknown;
  byUser?: unknown;
};

const EMPTY_BUCKETS: MutualBuckets = {
  mutualYes: [],
  partialYesMaybe: [],
  mutualMaybe: [],
};

const normalizeKey = (value: string | number | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length ? str : null;
};

const normalizeVotesByProfile = (persisted: unknown): VotesByProfile => {
  const output: VotesByProfile = {};
  if (!persisted || typeof persisted !== 'object') return output;

  for (const [profileKey, votes] of Object.entries(persisted as Record<string, unknown>)) {
    const normalizedProfileKey = normalizeKey(profileKey);
    if (!normalizedProfileKey) continue;

    if (!votes || typeof votes !== 'object') {
      continue;
    }

    const nextVotes: Record<string, VoteValue> = {};
    for (const [kinkKey, rawValue] of Object.entries(votes as Record<string, unknown>)) {
      const normalizedKinkKey = normalizeKey(kinkKey);
      if (!normalizedKinkKey) continue;

      const value = String(rawValue) as VoteValue;
      if (value === 'yes' || value === 'maybe' || value === 'no') {
        nextVotes[normalizedKinkKey] = value;
      }
    }

    if (Object.keys(nextVotes).length) {
      output[normalizedProfileKey] = nextVotes;
    }
  }

  return output;
};

const migrateLegacyVotes = (persisted: PersistedVotes): VotesByProfile => {
  if (!persisted || typeof persisted !== 'object') {
    return {};
  }

  if (persisted.votesByProfile) {
    return normalizeVotesByProfile(persisted.votesByProfile);
  }

  if (persisted.byUser && typeof persisted.byUser === 'object') {
    const mapped: Record<string, Record<string, unknown>> = {};
    for (const [profileKey, votes] of Object.entries(persisted.byUser as Record<string, unknown>)) {
      if (!votes || typeof votes !== 'object') continue;
      const normalizedProfileKey = normalizeKey(profileKey);
      if (!normalizedProfileKey) continue;

      const nextVotes: Record<string, VoteValue> = {};
      for (const [kinkKey, voteRecord] of Object.entries(votes as Record<string, any>)) {
        const normalizedKinkKey = normalizeKey(kinkKey);
        if (!normalizedKinkKey) continue;

        const value = voteRecord?.value;
        if (value === 'yes' || value === 'maybe' || value === 'no') {
          nextVotes[normalizedKinkKey] = value;
        }
      }

      if (Object.keys(nextVotes).length) {
        mapped[normalizedProfileKey] = nextVotes;
      }
    }
    return mapped;
  }

  return {};
};

export const useVotesStore = create<VotesState>()(
  persist(
    (set, get) => ({
      votesByProfile: {},

      setVote: (profileId, kinkId, value) => {
        const normalizedProfile = normalizeKey(profileId);
        const normalizedKink = normalizeKey(kinkId);
        if (!normalizedProfile || !normalizedKink) return;

        set((state) => {
          const currentVotes = state.votesByProfile[normalizedProfile] || {};
          const nextVotes = { ...currentVotes, [normalizedKink]: value };
          return {
            votesByProfile: {
              ...state.votesByProfile,
              [normalizedProfile]: nextVotes,
            },
          };
        });
      },

      clearVote: (profileId, kinkId) => {
        const normalizedProfile = normalizeKey(profileId);
        const normalizedKink = normalizeKey(kinkId);
        if (!normalizedProfile || !normalizedKink) return;

        set((state) => {
          const currentVotes = state.votesByProfile[normalizedProfile];
          if (!currentVotes) return state;

          const { [normalizedKink]: _removed, ...rest } = currentVotes;
          const nextState: VotesByProfile = { ...state.votesByProfile };
          if (Object.keys(rest).length === 0) {
            delete nextState[normalizedProfile];
          } else {
            nextState[normalizedProfile] = rest;
          }

          return { votesByProfile: nextState };
        });
      },

      clearProfile: (profileId) => {
        const normalizedProfile = normalizeKey(profileId);
        if (!normalizedProfile) return;

        set((state) => {
          if (!(normalizedProfile in state.votesByProfile)) {
            return state;
          }

          const nextState: VotesByProfile = { ...state.votesByProfile };
          delete nextState[normalizedProfile];
          return { votesByProfile: nextState };
        });
      },

      getVote: (profileId, kinkId) => {
        const normalizedProfile = normalizeKey(profileId);
        const normalizedKink = normalizeKey(kinkId);
        if (!normalizedProfile || !normalizedKink) return undefined;

        return get().votesByProfile[normalizedProfile]?.[normalizedKink];
      },

      getProfileVotes: (profileId) => {
        const normalizedProfile = normalizeKey(profileId);
        if (!normalizedProfile) return {};
        const votes = get().votesByProfile[normalizedProfile] || {};
        return { ...votes };
      },

      getMutuals: (aId, bId) => {
        const idA = normalizeKey(aId as any);
        const idB = normalizeKey(bId as any);
        if (!idA || !idB || idA === idB) {
          return EMPTY_BUCKETS;
        }

        const aVotes = get().votesByProfile[idA] || {};
        const bVotes = get().votesByProfile[idB] || {};

        if (!aVotes || !bVotes) {
          return EMPTY_BUCKETS;
        }

        const mutualYes: string[] = [];
        const partialYesMaybe: string[] = [];
        const mutualMaybe: string[] = [];

        const kinkIds = new Set<string>([
          ...Object.keys(aVotes),
          ...Object.keys(bVotes),
        ]);

        kinkIds.forEach((kinkId) => {
          const aVote = aVotes[kinkId];
          const bVote = bVotes[kinkId];
          if (!aVote || !bVote) return;
          if (aVote === 'no' || bVote === 'no') return;

          if (aVote === 'yes' && bVote === 'yes') {
            mutualYes.push(kinkId);
            return;
          }

          const hasYes = aVote === 'yes' || bVote === 'yes';
          const hasMaybe = aVote === 'maybe' || bVote === 'maybe';

          if (hasYes && hasMaybe) {
            partialYesMaybe.push(kinkId);
            return;
          }

          if (aVote === 'maybe' && bVote === 'maybe') {
            mutualMaybe.push(kinkId);
          }
        });

        return {
          mutualYes,
          partialYesMaybe,
          mutualMaybe,
        };
      },
    }),
    {
      name: 'votes',
      storage: createJSONStorage(() => mmkvStorage),
      version: 2,
      migrate: (persistedState: PersistedVotes | undefined) => ({
        votesByProfile: migrateLegacyVotes(persistedState || {}),
      }),
      partialize: (state) => ({ votesByProfile: state.votesByProfile }),
    }
  )
);

export const useVotes = useVotesStore;

export function getProfileVotes(profileId: string): Record<string, VoteValue> {
  return useVotesStore.getState().getProfileVotes(profileId);
}

export function getMutualVotes(aId: string, bId: string): MutualBuckets {
  return useVotesStore.getState().getMutuals(aId, bId);
}

export function clearVotesForProfile(profileId: string): void {
  useVotesStore.getState().clearProfile(profileId);
}
