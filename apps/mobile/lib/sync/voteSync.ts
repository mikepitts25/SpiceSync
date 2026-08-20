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

type VoteSyncStartOptions = {
  /**
   * Only the recovery confirmation screen may bootstrap while the persisted
   * recovery pause is still set. The store's runtime handoff token makes this
   * opt-in path impossible for regular sync subscribers to use accidentally.
   */
  allowPendingProfileConfirmation?: boolean;
  /**
   * Recovery may need to resend a locally retained profile after a local
   * disconnect cleared its link and queue, but left its persisted marker.
   * This is valid only while the matching confirmation handoff is active.
   */
  revalidateRecoveredBootstrap?: boolean;
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
  answeredCount?: number,
  options?: VoteSyncStartOptions
): Promise<boolean> {
  if (changes.length === 0 && answeredCount === undefined) return false;
  const link = useCoupleLinkStore.getState().link;
  const profileId = useVoteSyncStore.getState().localProfileId;
  if (!canEnqueueVotes(link, profileId, options)) {
    return false;
  }
  const id = await getIdentityIfExists();
  if (!id) return false;
  // The recovery state can change while identity material is loading. Check
  // it again before mutating the durable event queue.
  if (
    !canEnqueueVotes(
      useCoupleLinkStore.getState().link,
      useVoteSyncStore.getState().localProfileId,
      options
    )
  ) {
    return false;
  }
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

function canEnqueueVotes(
  link: ReturnType<typeof useCoupleLinkStore.getState>['link'],
  profileId: string | null,
  options?: VoteSyncStartOptions
): boolean {
  if (!link || link.status !== 'active') return false;
  if (link.requiresProfileConfirmation !== true) return true;
  return (
    options?.allowPendingProfileConfirmation === true &&
    !!profileId &&
    useCoupleLinkStore.getState().profileConfirmationInProgress === profileId
  );
}

function canRevalidateRecoveredBootstrap(
  link: ReturnType<typeof useCoupleLinkStore.getState>['link'],
  profileId: string | null,
  options?: VoteSyncStartOptions
): boolean {
  return (
    link?.status === 'active' &&
    link.requiresProfileConfirmation === true &&
    options?.allowPendingProfileConfirmation === true &&
    options.revalidateRecoveredBootstrap === true &&
    !!profileId &&
    useCoupleLinkStore.getState().profileConfirmationInProgress === profileId
  );
}

let unsubscribe: (() => void) | null = null;
let lastSnapshot: VotesByProfile = {};

export async function bootstrapCurrentVotes(
  options?: VoteSyncStartOptions
): Promise<boolean> {
  const link = useCoupleLinkStore.getState().link;
  const syncState = useVoteSyncStore.getState();
  const profileId = syncState.localProfileId;
  const hasCurrentBootstrapMarker =
    syncState.bootstrappedCoupleId === link?.coupleId &&
    syncState.bootstrappedProfileId === profileId &&
    syncState.bootstrapVersion === CURRENT_BOOTSTRAP_VERSION;
  if (
    !link ||
    !profileId ||
    !canEnqueueVotes(link, profileId, options) ||
    (hasCurrentBootstrapMarker &&
      !canRevalidateRecoveredBootstrap(link, profileId, options))
  ) {
    return false;
  }

  const votes = useVotesStore.getState().votesByProfile[profileId] ?? {};
  if (Object.keys(votes).length === 0) {
    // Profiles hydrate independently. Do not persist a bootstrap marker for
    // an empty snapshot, or a later hydration would permanently skip votes.
    return false;
  }
  const queued = await enqueueVoteChanges(
    diffVotes(undefined, votes),
    Object.keys(votes).length,
    options
  );
  if (queued) {
    useVoteSyncStore.getState().markBootstrapped(link.coupleId, profileId);
  }
  return queued;
}

export async function startVoteSync(
  localProfileId?: string | null,
  options?: VoteSyncStartOptions
): Promise<boolean> {
  const link = useCoupleLinkStore.getState().link;
  const profileId =
    localProfileId === undefined
      ? useVoteSyncStore.getState().localProfileId
      : localProfileId;
  if (!canEnqueueVotes(link, profileId, options)) {
    return false;
  }

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
        enqueueVoteChanges(changes, Object.keys(next ?? {}).length).catch(
          () => undefined
        );
      }
    });
  }
  const bootstrapped = await bootstrapCurrentVotes(options);
  if (bootstrapped) return true;

  if (options?.allowPendingProfileConfirmation !== true) return false;

  // An empty local snapshot is a valid confirmation bootstrap, but it must
  // remain unmarked so a subsequently hydrated profile still uploads votes.
  // Conversely, a non-empty snapshot that could not enqueue is a failure and
  // keeps the persisted recovery pause in place.
  const currentProfileId = useVoteSyncStore.getState().localProfileId;
  const currentLink = useCoupleLinkStore.getState().link;
  const hasNoVotes =
    !!currentProfileId &&
    Object.keys(useVotesStore.getState().votesByProfile[currentProfileId] ?? {})
      .length === 0;
  return hasNoVotes && canEnqueueVotes(currentLink, currentProfileId, options);
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
