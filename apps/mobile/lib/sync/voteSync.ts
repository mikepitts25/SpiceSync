import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import {
  useVotesStore,
  VoteValue,
  VotesByProfile,
} from '../../src/stores/votes';
import { useCoupleLinkStore } from './coupleLink';
import { useEventQueueStore } from './eventQueue';
import { getIdentityIfExists } from './identity';

type VoteSyncState = {
  localProfileId: string | null;
  setLocalProfileId: (id: string | null) => void;
};

export const useVoteSyncStore = create<VoteSyncState>()(
  persist(
    (set) => ({
      localProfileId: null,
      setLocalProfileId: (id) => set({ localProfileId: id }),
    }),
    {
      name: 'spicesync-vote-sync',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

function diffVotes(
  previous: Record<string, VoteValue> | undefined,
  next: Record<string, VoteValue> | undefined
): { cardId: string; vote: VoteValue }[] {
  const changes: { cardId: string; vote: VoteValue }[] = [];
  if (!next) return changes;
  const prev = previous || {};
  for (const [cardId, vote] of Object.entries(next)) {
    if (prev[cardId] !== vote) changes.push({ cardId, vote });
  }
  return changes;
}

async function enqueueVoteChanges(
  changes: { cardId: string; vote: VoteValue }[]
): Promise<void> {
  if (changes.length === 0) return;
  const link = useCoupleLinkStore.getState().link;
  if (!link || link.status !== 'active') return;
  const id = await getIdentityIfExists();
  if (!id) return;
  const queue = useEventQueueStore.getState();
  const updatedAt = Date.now();
  for (const change of changes) {
    queue.enqueue({
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: id.identity.deviceId,
      cardId: change.cardId,
      vote: change.vote,
      updatedAt,
    });
  }
}

let unsubscribe: (() => void) | null = null;
let lastSnapshot: VotesByProfile = {};

export function startVoteSync(): void {
  if (unsubscribe) return;
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
    if (changes.length > 0) void enqueueVoteChanges(changes);
  });
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
  useVoteSyncStore.setState({ localProfileId: null });
}
