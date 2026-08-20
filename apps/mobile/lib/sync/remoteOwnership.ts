import { useCoupleLinkStore, type RemoteStateNotice } from './coupleLink';
import { useEventQueueStore, type QuarantineReason } from './eventQueue';
import { usePartnerVotesStore } from './partnerVotes';
import { useRevealConsentStore } from './revealConsent';
import { stopVoteSync, useVoteSyncStore } from './voteSync';

type RemoteResetReason = Extract<
  RemoteStateNotice['kind'],
  'account-switched' | 'no-couple' | 'couple-changed'
>;

/**
 * Removes data derived from a previous remote relationship while preserving
 * local profiles, local votes, and settings. Pending plaintext is represented
 * only by non-sensitive quarantine metadata after the reset.
 */
export function clearRemoteOwnedState(
  reason: RemoteResetReason,
  nextOwnerUserId: string | null = null
): number {
  stopVoteSync();
  const discardedPendingCount = useEventQueueStore
    .getState()
    .quarantineAll(reason as QuarantineReason);
  usePartnerVotesStore.getState().reset();
  useRevealConsentStore.getState().reset();
  useVoteSyncStore.getState().reset();
  useCoupleLinkStore.getState().clearRemoteState(
    {
      kind: reason,
      discardedPendingCount,
      occurredAt: Date.now(),
    },
    nextOwnerUserId
  );
  return discardedPendingCount;
}
