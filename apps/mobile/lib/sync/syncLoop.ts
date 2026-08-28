import { decodeBase64, encodeBase64 } from './base64';
import {
  getActiveRemoteSyncOwnership,
  isCurrentSyncableCouple,
  isCoupleLinkSyncable,
  isCurrentSyncableCoupleLink,
  refreshCoupleMetadata,
  useCoupleLinkStore,
} from './coupleLink';
import {
  decryptFromPartner,
  encryptForPartner,
  sha256Base64,
  signEd25519,
  verifyEd25519,
} from './crypto';
import { PendingEvent, PlainSyncEvent, useEventQueueStore } from './eventQueue';
import { getIdentityIfExists } from './identity';
import { usePartnerVotesStore } from './partnerVotes';
import { RelayHttpError } from './relayClient';
import { getRelayClient } from './relayConfig';
import { useRevealConsentStore } from './revealConsent';
import type { SyncEventResponse } from './relayTypes';
import { isReadiness, readinessToVote } from '../votes/rolePreferences';
import { useVotesStore } from '../../src/stores/votes';
import { useProfilesStore } from '../state/profiles';
import {
  buildEncryptedVoteSnapshot,
  validateAndDecryptVoteSnapshot,
} from './voteSnapshot';
import { useVoteSnapshotState } from './voteSnapshotState';

function signaturePayload(
  eventId: string,
  clientSequence: number,
  payloadHash: string,
  recipientDeviceId?: string
): string {
  return recipientDeviceId
    ? `${eventId}:${clientSequence}:${payloadHash}:${recipientDeviceId}`
    : `${eventId}:${clientSequence}:${payloadHash}`;
}

function verifyEventSignature(
  partnerSigningPublicKey: string,
  event: SyncEventResponse
): boolean {
  if (!partnerSigningPublicKey || !event.signature) return false;
  try {
    const recipientDeviceId =
      event.recipientDeviceId === null || event.recipientDeviceId === undefined
        ? undefined
        : event.recipientDeviceId;
    return verifyEd25519(
      decodeBase64(partnerSigningPublicKey),
      decodeBase64(event.signature),
      new TextEncoder().encode(
        signaturePayload(
          event.eventId,
          event.clientSequence,
          event.payloadHash,
          recipientDeviceId
        )
      )
    );
  } catch {
    return false;
  }
}

function isPlainSyncEvent(value: unknown): value is PlainSyncEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<PlainSyncEvent>;
  if (
    event.schemaVersion !== 1 ||
    typeof event.eventId !== 'string' ||
    typeof event.authorDeviceId !== 'string' ||
    typeof event.updatedAt !== 'number'
  ) {
    return false;
  }

  if (event.eventType === 'vote.upsert') {
    const readinessValid =
      event.readiness === undefined ||
      (isReadiness(event.readiness) &&
        readinessToVote(event.readiness) === event.vote);
    return (
      typeof event.cardId === 'string' &&
      (event.vote === 'yes' || event.vote === 'maybe' || event.vote === 'no') &&
      readinessValid
    );
  }
  if (event.eventType === 'reveal.unlock') {
    return event.bucket === 'partialYesMaybe' || event.bucket === 'mutualMaybe';
  }
  if (event.eventType === 'progress.snapshot') {
    return typeof event.answeredCount === 'number';
  }
  return event.eventType === 'couple.unlink';
}

function eventClaimsMatchEnvelope(
  event: PlainSyncEvent,
  envelope: SyncEventResponse,
  partnerDeviceId: string
): boolean {
  return (
    envelope.authorDeviceId === partnerDeviceId &&
    event.authorDeviceId === envelope.authorDeviceId &&
    event.eventId === envelope.eventId
  );
}

async function uploadPending(pending: PendingEvent): Promise<boolean> {
  const link = useCoupleLinkStore.getState().link;
  if (!isCoupleLinkSyncable(link)) return false;
  const id = await getIdentityIfExists();
  if (!id || !isCurrentSyncableCoupleLink(link)) return false;
  const recipientDeviceId = link.partnerDeviceId;
  const partnerEncryptionPublic = decodeBase64(link.partnerEncryptionPublicKey);
  const { encryptedPayload, payloadHash } = encryptForPartner(
    id.encryptionPrivateKey,
    partnerEncryptionPublic,
    JSON.stringify(pending.payload)
  );
  const signature = signEd25519(
    id.signingPrivateKey,
    new TextEncoder().encode(
      signaturePayload(
        pending.eventId,
        pending.clientSequence,
        payloadHash,
        recipientDeviceId
      )
    )
  );
  // A recovery result can pause the link while key material is loading. Do
  // not make the relay request with a stale pre-recovery snapshot.
  if (!isCurrentSyncableCoupleLink(link)) return false;
  await getRelayClient().appendEvent(link.coupleId, {
    eventId: pending.eventId,
    authorDeviceId: id.identity.deviceId,
    recipientDeviceId,
    clientSequence: pending.clientSequence,
    encryptedPayload,
    payloadHash,
    signature: encodeBase64(signature),
  });
  return true;
}

function isRecipientKeyChanged(error: unknown): error is RelayHttpError {
  return (
    error instanceof RelayHttpError && error.code === 'RECIPIENT_KEY_CHANGED'
  );
}

function isClientUpgradeRequired(error: unknown): error is RelayHttpError {
  return (
    error instanceof RelayHttpError && error.code === 'CLIENT_UPGRADE_REQUIRED'
  );
}

function claimPendingForCurrentOwnership(
  pending: PendingEvent
): PendingEvent | null {
  const ownership = getActiveRemoteSyncOwnership();
  if (!ownership) return null;
  if (
    !pending.coupleId ||
    !pending.authorDeviceId ||
    (pending.envelopeVersion === 2 && !pending.ownerUserId)
  ) {
    useEventQueueStore
      .getState()
      .quarantineEvent(pending.eventId, 'legacy-unproven');
    return null;
  }
  const hasMismatch =
    (pending.ownerUserId !== undefined &&
      pending.ownerUserId !== ownership.ownerUserId) ||
    pending.coupleId !== ownership.coupleId ||
    pending.authorDeviceId !== ownership.authorDeviceId ||
    pending.payload.authorDeviceId !== ownership.authorDeviceId ||
    (pending.envelopeVersion === 2 &&
      pending.recipientDeviceId !== undefined &&
      pending.recipientDeviceId !== ownership.recipientDeviceId);
  if (hasMismatch) {
    useEventQueueStore
      .getState()
      .quarantineEvent(pending.eventId, 'ownership-mismatch');
    return null;
  }

  const claimed: PendingEvent = {
    ...pending,
    ownerUserId: ownership.ownerUserId,
    coupleId: ownership.coupleId,
    authorDeviceId: ownership.authorDeviceId,
    recipientDeviceId: ownership.recipientDeviceId,
    envelopeVersion: 2,
  };
  useEventQueueStore.getState().replaceEvent(pending.eventId, claimed);
  return claimed;
}

async function uploadPendingWithRecipientRefresh(
  pending: PendingEvent
): Promise<boolean> {
  try {
    return await uploadPending(pending);
  } catch (error) {
    if (
      !isRecipientKeyChanged(error) ||
      pending.recipientDeviceId === null ||
      pending.recipientDeviceId === undefined
    ) {
      throw error;
    }

    // Queue entries contain only plaintext. A single retry reconstructs the
    // ciphertext and signature from that immutable payload after refreshing
    // the recipient's current public material; it never calls this helper.
    await refreshCoupleMetadata();
    return uploadPending(pending);
  }
}

async function uploadPendingWithSafeUpgradeRetry(
  pending: PendingEvent
): Promise<boolean> {
  try {
    return await uploadPendingWithRecipientRefresh(pending);
  } catch (error) {
    if (!isClientUpgradeRequired(error)) throw error;
    const claimed = claimPendingForCurrentOwnership(pending);
    if (!claimed) return false;
    // This is deliberately the only retry for CLIENT_UPGRADE_REQUIRED. Any
    // repeated response is handled by the ordinary queue backoff path.
    return uploadPendingWithRecipientRefresh(claimed);
  }
}

export async function flushPending(
  now: number = Date.now(),
  metadataWasRefreshed: boolean = false,
  forcePending: boolean = false
): Promise<{ uploaded: number; failed: number }> {
  const link = useCoupleLinkStore.getState().link;
  if (!isCoupleLinkSyncable(link)) return { uploaded: 0, failed: 0 };
  const queue = useEventQueueStore.getState();
  const due = forcePending ? [...queue.pending] : queue.dueEvents(now);
  if (due.length > 0 && !metadataWasRefreshed) {
    // An unavailable metadata endpoint must not alter the established queue
    // scheduling semantics. The append path still has its one safe retry.
    await refreshCoupleMetadata().catch(() => undefined);
  }
  if (!isCoupleLinkSyncable(useCoupleLinkStore.getState().link)) {
    return { uploaded: 0, failed: 0 };
  }
  let uploaded = 0;
  let failed = 0;
  for (const pending of due) {
    const pendingLink = useCoupleLinkStore.getState().link;
    if (!isCoupleLinkSyncable(pendingLink)) break;
    const claimed = claimPendingForCurrentOwnership(pending);
    if (!claimed) continue;
    try {
      const uploadedPending = await uploadPendingWithSafeUpgradeRetry(claimed);
      if (!uploadedPending || !isCurrentSyncableCouple(pendingLink)) {
        break;
      }
      queue.markAttempted(pending.eventId, true);
      uploaded += 1;
    } catch (err) {
      if (!isCurrentSyncableCouple(pendingLink)) break;
      const message = err instanceof Error ? err.message : 'upload failed';
      if (err instanceof RelayHttpError && err.code === 'CONFLICT') {
        queue.markAttempted(pending.eventId, true);
        continue;
      }
      queue.markAttempted(pending.eventId, false, message);
      failed += 1;
    }
  }
  return { uploaded, failed };
}

function applyDecryptedEvent(event: PlainSyncEvent, receivedAt: number): void {
  if (event.eventType === 'vote.upsert') {
    usePartnerVotesStore.getState().applyVote({
      cardId: event.cardId,
      vote: event.vote,
      pairPreference: event.pairPreference,
      readiness: event.readiness,
      updatedAt: event.updatedAt,
      receivedAt,
    });
    return;
  }
  if (event.eventType === 'reveal.unlock') {
    useRevealConsentStore
      .getState()
      .applyPartnerConsent(event.bucket, event.updatedAt);
    return;
  }
  if (event.eventType === 'progress.snapshot') {
    usePartnerVotesStore
      .getState()
      .setAnsweredCount(event.answeredCount, event.updatedAt);
    return;
  }
  if (event.eventType === 'couple.unlink') {
    useCoupleLinkStore.getState().unlink();
  }
}

async function applyServerEvents(
  events: SyncEventResponse[],
  myDeviceId: string,
  linkSnapshot: NonNullable<
    ReturnType<typeof useCoupleLinkStore.getState>['link']
  >
): Promise<{ applied: number; lastSequence: number }> {
  const link = useCoupleLinkStore.getState().link;
  if (!link || !isCurrentSyncableCoupleLink(linkSnapshot)) {
    return { applied: 0, lastSequence: 0 };
  }
  const id = await getIdentityIfExists();
  if (!id || !isCurrentSyncableCoupleLink(linkSnapshot)) {
    return { applied: 0, lastSequence: link.lastPulledServerSequence };
  }
  const partnerEncryptionPublic = decodeBase64(link.partnerEncryptionPublicKey);
  let lastSequence = link.lastPulledServerSequence;
  let applied = 0;
  for (const event of events) {
    if (!isCurrentSyncableCoupleLink(linkSnapshot)) {
      return { applied: 0, lastSequence: link.lastPulledServerSequence };
    }
    if (event.serverSequence > lastSequence)
      lastSequence = event.serverSequence;
    if (event.authorDeviceId === myDeviceId) continue;
    if (
      event.recipientDeviceId !== null &&
      event.recipientDeviceId !== undefined &&
      event.recipientDeviceId !== myDeviceId
    ) {
      continue;
    }
    if (sha256Base64(event.encryptedPayload) !== event.payloadHash) continue;
    if (!verifyEventSignature(link.partnerSigningPublicKey, event)) continue;
    try {
      const plaintext = decryptFromPartner(
        id.encryptionPrivateKey,
        partnerEncryptionPublic,
        event.encryptedPayload
      );
      const decoded = JSON.parse(plaintext);
      if (!isPlainSyncEvent(decoded)) continue;
      if (!eventClaimsMatchEnvelope(decoded, event, link.partnerDeviceId))
        continue;
      applyDecryptedEvent(decoded, Date.now());
      applied += 1;
    } catch {
      continue;
    }
  }
  return { applied, lastSequence };
}

export async function pullPartnerEvents(): Promise<{ applied: number }> {
  const link = useCoupleLinkStore.getState().link;
  if (!isCoupleLinkSyncable(link)) return { applied: 0 };
  const id = await getIdentityIfExists();
  if (!id || !isCurrentSyncableCoupleLink(link)) return { applied: 0 };
  const response = await getRelayClient().listEvents(
    link.coupleId,
    link.lastPulledServerSequence
  );
  if (!isCurrentSyncableCoupleLink(link)) return { applied: 0 };
  if (response.events.length === 0) {
    useCoupleLinkStore.getState().markSynced(Date.now());
    return { applied: 0 };
  }
  const { applied, lastSequence } = await applyServerEvents(
    response.events,
    id.identity.deviceId,
    link
  );
  if (!isCurrentSyncableCoupleLink(link)) return { applied: 0 };
  useCoupleLinkStore.getState().updateCursor(lastSequence);
  useCoupleLinkStore.getState().markSynced(Date.now());
  return { applied };
}

export type VoteSnapshotSyncResult = {
  published: boolean;
  received: boolean;
  status: 'received' | 'unchanged' | 'waiting' | 'rejected' | 'unavailable';
  error?: string;
};

function isSnapshotRecipientChanged(error: unknown): boolean {
  return (
    error instanceof RelayHttpError &&
    (error.code === 'RECIPIENT_KEY_CHANGED' ||
      error.code === 'SNAPSHOT_REQUEST_CHANGED')
  );
}

async function publishVoteSnapshot(
  localProfileId: string,
  partnerRequestGeneration: number,
  minimumSnapshotVersion: number
): Promise<boolean> {
  const relay = getRelayClient();
  if (!relay.putVoteSnapshot) return false;
  const link = useCoupleLinkStore.getState().link;
  if (!isCoupleLinkSyncable(link)) return false;
  const id = await getIdentityIfExists();
  if (!id || !isCurrentSyncableCoupleLink(link)) return false;
  if (!useVoteSnapshotState.persist.hasHydrated()) {
    await useVoteSnapshotState.persist.rehydrate();
  }
  if (!isCurrentSyncableCoupleLink(link)) return false;
  const snapshotVersion = useVoteSnapshotState
    .getState()
    .reserveVersion(link.coupleId, link.myDeviceId, minimumSnapshotVersion);
  const body = buildEncryptedVoteSnapshot({
    coupleId: link.coupleId,
    authorDeviceId: link.myDeviceId,
    recipientDeviceId: link.partnerDeviceId,
    requestGeneration: partnerRequestGeneration,
    snapshotVersion,
    updatedAt: Date.now(),
    votes: useVotesStore.getState().votesByProfile[localProfileId] ?? {},
    authorEncryptionPrivateKey: id.encryptionPrivateKey,
    authorSigningPrivateKey: id.signingPrivateKey,
    recipientEncryptionPublicKey: decodeBase64(link.partnerEncryptionPublicKey),
  });
  if (!isCurrentSyncableCoupleLink(link)) return false;
  const stored = await relay.putVoteSnapshot(link.coupleId, body);
  return (
    isCurrentSyncableCoupleLink(link) &&
    stored.authorDeviceId === body.authorDeviceId &&
    stored.recipientDeviceId === body.recipientDeviceId &&
    stored.requestGeneration === body.requestGeneration &&
    stored.snapshotVersion === body.snapshotVersion
  );
}

export async function syncVoteSnapshots(
  localProfileId: string
): Promise<VoteSnapshotSyncResult> {
  const relay = getRelayClient();
  if (
    typeof relay.getVoteSnapshot !== 'function' ||
    typeof relay.putVoteSnapshot !== 'function'
  ) {
    return { published: false, received: false, status: 'unavailable' };
  }
  let link = useCoupleLinkStore.getState().link;
  if (!isCoupleLinkSyncable(link)) {
    return { published: false, received: false, status: 'unavailable' };
  }

  let preflight = await relay.getVoteSnapshot(link.coupleId);
  let published = false;
  try {
    published = await publishVoteSnapshot(
      localProfileId,
      preflight.partnerRequestGeneration,
      preflight.mySnapshotVersion ?? 0
    );
  } catch (error) {
    if (!isSnapshotRecipientChanged(error)) throw error;
    await refreshCoupleMetadata();
    link = useCoupleLinkStore.getState().link;
    if (!isCoupleLinkSyncable(link)) {
      return { published: false, received: false, status: 'unavailable' };
    }
    preflight = await relay.getVoteSnapshot(link.coupleId);
    published = await publishVoteSnapshot(
      localProfileId,
      preflight.partnerRequestGeneration,
      preflight.mySnapshotVersion ?? 0
    );
  }

  link = useCoupleLinkStore.getState().link;
  if (!isCoupleLinkSyncable(link)) {
    return { published, received: false, status: 'unavailable' };
  }
  const incoming = await relay.getVoteSnapshot(link.coupleId);
  if (!incoming.snapshot) {
    if (!published) {
      return {
        published: false,
        received: false,
        status: 'unavailable',
        error: 'Your vote snapshot was not accepted',
      };
    }
    useCoupleLinkStore.getState().markSynced(Date.now());
    return { published, received: false, status: 'waiting' };
  }
  const id = await getIdentityIfExists();
  if (!id || !isCurrentSyncableCoupleLink(link)) {
    return { published, received: false, status: 'unavailable' };
  }
  try {
    const decoded = validateAndDecryptVoteSnapshot({
      coupleId: link.coupleId,
      myDeviceId: link.myDeviceId,
      partnerDeviceId: link.partnerDeviceId,
      snapshot: incoming.snapshot,
      myEncryptionPrivateKey: id.encryptionPrivateKey,
      partnerEncryptionPublicKey: decodeBase64(link.partnerEncryptionPublicKey),
      partnerSigningPublicKey: decodeBase64(link.partnerSigningPublicKey),
      receivedAt: Date.now(),
    });
    if (!isCurrentSyncableCoupleLink(link)) {
      return { published, received: false, status: 'unavailable' };
    }
    const replaced = usePartnerVotesStore.getState().replaceSnapshot({
      ...decoded,
      receivedAt: Date.now(),
    });
    if (!published) {
      return {
        published: false,
        received: true,
        status: 'unavailable',
        error: 'Partner votes were received, but your votes were not sent',
      };
    }
    useCoupleLinkStore.getState().markSynced(Date.now());
    return {
      published,
      received: replaced,
      status: replaced ? 'received' : 'unchanged',
    };
  } catch (error) {
    return {
      published,
      received: false,
      status: 'rejected',
      error: error instanceof Error ? error.message : 'Snapshot rejected',
    };
  }
}

export type SyncResult = {
  uploaded: number;
  failed: number;
  applied: number;
  snapshot?: VoteSnapshotSyncResult;
};

export async function syncOnce(options?: {
  forcePending?: boolean;
  localProfileId?: string | null;
}): Promise<SyncResult> {
  if (!isCoupleLinkSyncable(useCoupleLinkStore.getState().link)) {
    return { uploaded: 0, failed: 0, applied: 0 };
  }
  // syncOnce is also called by the foreground lifecycle, so refresh even
  // when the queue is empty. Preserve flush-before-pull ordering afterward.
  await refreshCoupleMetadata().catch(() => undefined);
  if (!isCoupleLinkSyncable(useCoupleLinkStore.getState().link)) {
    return { uploaded: 0, failed: 0, applied: 0 };
  }
  const localProfileId =
    options?.localProfileId ??
    useProfilesStore.getState().getActiveProfileId() ??
    null;
  let snapshot: VoteSnapshotSyncResult | undefined;
  if (localProfileId) {
    try {
      const snapshotResult = await syncVoteSnapshots(localProfileId);
      // Test transports and rolling-release legacy transports may not expose
      // the new mailbox yet. Preserve the established result shape until the
      // capability is actually available.
      if (snapshotResult.status !== 'unavailable' || snapshotResult.error) {
        snapshot = snapshotResult;
      }
    } catch (error) {
      snapshot = {
        published: false,
        received: false,
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Snapshot unavailable',
      };
    }
  }
  const flushResult = await flushPending(
    Date.now(),
    true,
    options?.forcePending === true
  );
  if (!isCoupleLinkSyncable(useCoupleLinkStore.getState().link)) {
    return { uploaded: 0, failed: 0, applied: 0 };
  }
  const pullResult = await pullPartnerEvents();
  return { ...flushResult, applied: pullResult.applied, snapshot };
}

export { refreshCoupleMetadata } from './coupleLink';

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let scheduledSync: Promise<unknown> | null = null;
let loopGeneration = 0;

export async function syncNow(
  localProfileId?: string | null
): Promise<SyncResult> {
  const activeSync = scheduledSync;
  if (activeSync) {
    await activeSync.catch(() => undefined);
  }

  const run = syncOnce({ forcePending: true, localProfileId });
  scheduledSync = run;
  try {
    return await run;
  } finally {
    if (scheduledSync === run) {
      scheduledSync = null;
    }
  }
}

function runScheduledSync(generation: number): void {
  if (
    generation !== loopGeneration ||
    scheduledSync ||
    !isCoupleLinkSyncable(useCoupleLinkStore.getState().link)
  ) {
    return;
  }

  const run = syncOnce().catch(() => undefined);
  scheduledSync = run;
  run
    .finally(() => {
      if (generation === loopGeneration && scheduledSync === run) {
        scheduledSync = null;
      }
    })
    .catch(() => undefined);
}

export function startSyncLoop(intervalMs: number = 45000): void {
  stopSyncLoop();
  if (!isCoupleLinkSyncable(useCoupleLinkStore.getState().link)) return;
  const generation = loopGeneration;
  runScheduledSync(generation);
  intervalHandle = setInterval(() => {
    runScheduledSync(generation);
  }, intervalMs);
}

export function stopSyncLoop(): void {
  loopGeneration += 1;
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  scheduledSync = null;
}
