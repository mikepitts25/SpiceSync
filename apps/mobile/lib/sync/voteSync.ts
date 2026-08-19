import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import {
  KinkVote,
  useVotesStore,
  VoteValue,
  VotesByProfile,
} from '../../src/stores/votes';
import {
  normalizeVoteRecord,
  sameVoteRecord,
  type PairPreference,
  type Readiness,
} from '../votes/rolePreferences';
import { useCoupleLinkStore } from './coupleLink';
import { useEventQueueStore } from './eventQueue';
import { getIdentityIfExists } from './identity';

const CURRENT_BOOTSTRAP_VERSION = 2;

type VoteSyncState = {
  localProfileId: string | null;
  bootstrappedCoupleId: string | null;
  bootstrappedProfileId: string | null;
  bootstrapVersion: number;
  setLocalProfileId: (id: string | null) => void;
  markBootstrapped: (coupleId: string, profileId: string) => void;
  reset: () => void;
};

export const useVoteSyncStore = create<VoteSyncState>()(
  persist(
    (set) => ({
      localProfileId: null,
      bootstrappedCoupleId: null,
      bootstrappedProfileId: null,
      bootstrapVersion: 0,
      setLocalProfileId: (id) => set({ localProfileId: id }),
      markBootstrapped: (coupleId, profileId) =>
        set({
          bootstrappedCoupleId: coupleId,
          bootstrappedProfileId: profileId,
          bootstrapVersion: CURRENT_BOOTSTRAP_VERSION,
        }),
      reset: () =>
        set({
          localProfileId: null,
          bootstrappedCoupleId: null,
          bootstrappedProfileId: null,
          bootstrapVersion: 0,
        }),
    }),
    {
      name: 'spicesync-vote-sync',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

function diffVotes(
  previous: Record<string, KinkVote> | undefined,
  next: Record<string, KinkVote> | undefined
): {
  cardId: string;
  vote: VoteValue;
  pairPreference?: PairPreference;
  readiness?: Readiness;
}[] {
  const changes: {
    cardId: string;
    vote: VoteValue;
    pairPreference?: PairPreference;
    readiness?: Readiness;
  }[] = [];
  if (!next) return changes;
  const prev = previous || {};
  for (const [cardId, rawVote] of Object.entries(next)) {
    const vote = normalizeVoteRecord(rawVote);
    if (!vote || sameVoteRecord(prev[cardId], rawVote)) continue;
    changes.push({
      cardId,
      vote: vote.value,
      pairPreference: vote.pairPreference,
      readiness: vote.readiness,
    });
  }
  return changes;
}

async function enqueueVoteChanges(
  changes: {
    cardId: string;
    vote: VoteValue;
    pairPreference?: PairPreference;
    readiness?: Readiness;
  }[],
  answeredCount?: number
): Promise<boolean> {
  if (changes.length === 0 && answeredCount === undefined) return false;
  const link = useCoupleLinkStore.getState().link;
  if (!link || link.status !== 'active') return false;
  const id = await getIdentityIfExists();
  if (!id) return false;
  const queue = useEventQueueStore.getState();
  const updatedAt = Date.now();
  for (const change of changes) {
    queue.enqueue({
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: id.identity.deviceId,
      cardId: change.cardId,
      vote: change.vote,
      pairPreference: change.pairPreference,
      readiness: change.readiness,
      updatedAt,
    });
  }
  if (answeredCount !== undefined) {
    queue.enqueue({
      schemaVersion: 1,
      eventType: 'progress.snapshot',
      authorDeviceId: id.identity.deviceId,
      answeredCount,
      updatedAt,
    });
  }
  return true;
}

let unsubscribe: (() => void) | null = null;
let lastSnapshot: VotesByProfile = {};

export async function bootstrapCurrentVotes(): Promise<boolean> {
  const link = useCoupleLinkStore.getState().link;
  const syncState = useVoteSyncStore.getState();
  if (
    !link ||
    link.status !== 'active' ||
    !syncState.localProfileId ||
    (syncState.bootstrappedCoupleId === link.coupleId &&
      syncState.bootstrappedProfileId === syncState.localProfileId &&
      syncState.bootstrapVersion === CURRENT_BOOTSTRAP_VERSION)
  ) {
    return false;
  }

  const votes =
    useVotesStore.getState().votesByProfile[syncState.localProfileId] ?? {};
  if (Object.keys(votes).length === 0) {
    return false;
  }
  const queued = await enqueueVoteChanges(
    diffVotes(undefined, votes),
    Object.keys(votes).length
  );
  if (queued) {
    useVoteSyncStore
      .getState()
      .markBootstrapped(link.coupleId, syncState.localProfileId);
  }
  return queued;
}

export function startVoteSync(
  localProfileId?: string | null
): Promise<boolean> {
  if (localProfileId !== undefined) {
    useVoteSyncStore.getState().setLocalProfileId(localProfileId);
  }
  if (!unsubscribe) {
    lastSnapshot = useVotesStore.getState().votesByProfile;
    unsubscribe = useVotesStore.subscribe((state) => {
      const localProfileId = useVoteSyncStore.getState().localProfileId;
      if (!localProfileId) {
        lastSnapshot = state.votesByProfile;
        return;
      }
      const previous = lastSnapshot[localProfileId];
      const next = state.votesByProfile[localProfileId];
      lastSnapshot = state.votesByProfile;
      if (previous === next) return;
      const changes = diffVotes(previous, next);
      if (changes.length > 0) {
        void enqueueVoteChanges(changes, Object.keys(next ?? {}).length);
      }
    });
  }
  return bootstrapCurrentVotes();
}

export function stopVoteSync(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export function _resetForTests(): void {
  stopVoteSync();
  lastSnapshot = {};
  useVoteSyncStore.setState({
    localProfileId: null,
    bootstrappedCoupleId: null,
    bootstrappedProfileId: null,
    bootstrapVersion: 0,
  });
}
