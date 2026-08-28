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
import {
  getActiveRemoteSyncOwnership,
  type ActiveRemoteSyncOwnership,
  useCoupleLinkStore,
} from './coupleLink';
import { useEventQueueStore } from './eventQueue';
import { getIdentityIfExists } from './identity';
import { syncNow, type SyncResult } from './syncLoop';

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
  /** @deprecated Confirmation must be completed before any enqueue. */
  allowPendingProfileConfirmation?: boolean;
  /** @deprecated Confirmation must be completed before any enqueue. */
  revalidateRecoveredBootstrap?: boolean;
};

type VoteEnqueueContext = {
  profileId: string;
  ownership: ActiveRemoteSyncOwnership;
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
  options?: VoteSyncStartOptions,
  expectedContext?: VoteEnqueueContext
): Promise<boolean> {
  if (changes.length === 0 && answeredCount === undefined) return false;
  const context =
    expectedContext ??
    captureVoteEnqueueContext(
      useVoteSyncStore.getState().localProfileId,
      options
    );
  if (!context) {
    return false;
  }
  const id = await getIdentityIfExists();
  if (
    !id ||
    id.identity.deviceId !== context.ownership.authorDeviceId ||
    !isCurrentVoteEnqueueContext(context, options)
  ) {
    return false;
  }
  // The recovery state can change while identity material is loading. Check
  // it again before mutating the durable event queue.
  const queue = useEventQueueStore.getState();
  const queuedEventIds: string[] = [];
  const rollbackQueuedEvents = () => {
    for (const eventId of queuedEventIds) {
      queue.removeEvent(eventId);
    }
  };
  const updatedAt = Date.now();
  for (const change of changes) {
    const queued = queue.enqueue({
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: context.ownership.authorDeviceId,
      cardId: change.cardId,
      vote: change.vote,
      pairPreference: change.pairPreference,
      readiness: change.readiness,
      updatedAt,
    });
    if (!queued) {
      rollbackQueuedEvents();
      return false;
    }
    queuedEventIds.push(queued.eventId);
  }
  if (answeredCount !== undefined) {
    const queued = queue.enqueue({
      schemaVersion: 1,
      eventType: 'progress.snapshot',
      authorDeviceId: context.ownership.authorDeviceId,
      answeredCount,
      updatedAt,
    });
    if (!queued) {
      rollbackQueuedEvents();
      return false;
    }
    queuedEventIds.push(queued.eventId);
  }
  if (!isCurrentVoteEnqueueContext(context, options)) {
    rollbackQueuedEvents();
    return false;
  }
  return true;
}

function sameOwnership(
  left: ActiveRemoteSyncOwnership,
  right: ActiveRemoteSyncOwnership
): boolean {
  return (
    left.ownerUserId === right.ownerUserId &&
    left.coupleId === right.coupleId &&
    left.authorDeviceId === right.authorDeviceId &&
    left.recipientDeviceId === right.recipientDeviceId
  );
}

function captureVoteEnqueueContext(
  profileId: string | null,
  options?: VoteSyncStartOptions
): VoteEnqueueContext | null {
  if (
    !canEnqueueVotes(useCoupleLinkStore.getState().link, profileId, options)
  ) {
    return null;
  }
  const ownership = getActiveRemoteSyncOwnership();
  return ownership && profileId ? { profileId, ownership } : null;
}

function isCurrentVoteEnqueueContext(
  expected: VoteEnqueueContext,
  options?: VoteSyncStartOptions
): boolean {
  if (useVoteSyncStore.getState().localProfileId !== expected.profileId) {
    return false;
  }
  const current = captureVoteEnqueueContext(expected.profileId, options);
  return (
    current !== null && sameOwnership(current.ownership, expected.ownership)
  );
}

function canEnqueueVotes(
  link: ReturnType<typeof useCoupleLinkStore.getState>['link'],
  profileId: string | null,
  _options?: VoteSyncStartOptions
): boolean {
  if (!link || !profileId) return false;
  return getActiveRemoteSyncOwnership() !== null;
}

let unsubscribe: (() => void) | null = null;
let lastSnapshot: VotesByProfile = {};
let snapshotPublishTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAuthoritativeVoteSnapshot(profileId: string): void {
  if (snapshotPublishTimer) clearTimeout(snapshotPublishTimer);
  snapshotPublishTimer = setTimeout(() => {
    snapshotPublishTimer = null;
    if (
      useVoteSyncStore.getState().localProfileId !== profileId ||
      !canEnqueueVotes(useCoupleLinkStore.getState().link, profileId)
    ) {
      return;
    }
    syncNow(profileId).catch(() => undefined);
  }, 300);
}

export async function bootstrapCurrentVotes(
  options?: VoteSyncStartOptions
): Promise<boolean> {
  const link = useCoupleLinkStore.getState().link;
  const syncState = useVoteSyncStore.getState();
  const profileId = syncState.localProfileId;
  const context = captureVoteEnqueueContext(profileId, options);
  const hasCurrentBootstrapMarker =
    syncState.bootstrappedCoupleId === link?.coupleId &&
    syncState.bootstrappedProfileId === profileId &&
    syncState.bootstrapVersion === CURRENT_BOOTSTRAP_VERSION;
  if (!link || !profileId || !context || hasCurrentBootstrapMarker) {
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
    options,
    context
  );
  if (queued && isCurrentVoteEnqueueContext(context, options)) {
    useVoteSyncStore
      .getState()
      .markBootstrapped(context.ownership.coupleId, profileId);
  }
  return queued;
}

/**
 * Rebuilds a complete outgoing snapshot from the active profile's persisted
 * votes. Unlike bootstrapCurrentVotes, this intentionally ignores the
 * one-time bootstrap marker so a manual refresh can repair a lost or expired
 * relay delivery.
 */
export async function enqueueCurrentVoteSnapshot(
  localProfileId?: string | null
): Promise<boolean> {
  const profileId =
    localProfileId === undefined
      ? useVoteSyncStore.getState().localProfileId
      : localProfileId;
  if (!profileId || useVoteSyncStore.getState().localProfileId !== profileId) {
    return false;
  }
  const context = captureVoteEnqueueContext(profileId);
  if (!context) {
    return false;
  }
  return enqueueVoteSnapshotForContext(context);
}

async function enqueueVoteSnapshotForContext(
  context: VoteEnqueueContext
): Promise<boolean> {
  if (!isCurrentVoteEnqueueContext(context)) {
    return false;
  }
  const votes =
    useVotesStore.getState().votesByProfile[context.profileId] ?? {};
  if (Object.keys(votes).length === 0) {
    return false;
  }
  return enqueueVoteChanges(
    diffVotes(undefined, votes),
    Object.keys(votes).length,
    undefined,
    context
  );
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
      // Full snapshots are authoritative and cover removals that the legacy
      // upsert-only stream cannot express. Coalesce rapid swipes into one run.
      scheduleAuthoritativeVoteSnapshot(localProfileId);
    });
  }
  const bootstrapped = await bootstrapCurrentVotes(options);
  if (bootstrapped) return true;

  return false;
}

/** Sends the current local vote snapshot first, then pulls partner events. */
export async function refreshVoteSync(
  localProfileId: string
): Promise<SyncResult> {
  if (!canEnqueueVotes(useCoupleLinkStore.getState().link, localProfileId)) {
    throw new Error('Partner vote sync is unavailable');
  }
  useVoteSyncStore.getState().setLocalProfileId(localProfileId);
  const refreshContext = captureVoteEnqueueContext(localProfileId);
  if (!refreshContext) {
    throw new Error('Partner vote sync is unavailable');
  }
  let snapshotQueued = await startVoteSync(localProfileId);
  if (!isCurrentVoteEnqueueContext(refreshContext)) {
    throw new Error('Vote sync context changed during refresh');
  }
  if (!snapshotQueued) {
    snapshotQueued = await enqueueVoteSnapshotForContext(refreshContext);
  }
  if (!isCurrentVoteEnqueueContext(refreshContext)) {
    throw new Error('Vote sync context changed during refresh');
  }
  // The event queue remains a best-effort compatibility path for older app
  // versions. The authoritative encrypted snapshot below must still run when
  // that legacy queue is unavailable, otherwise refresh can never self-heal.
  return syncNow(localProfileId);
}

export function stopVoteSync(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (snapshotPublishTimer) {
    clearTimeout(snapshotPublishTimer);
    snapshotPublishTimer = null;
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
