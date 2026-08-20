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
  metadataWasRefreshed: boolean = false
): Promise<{ uploaded: number; failed: number }> {
  const link = useCoupleLinkStore.getState().link;
  if (!isCoupleLinkSyncable(link)) return { uploaded: 0, failed: 0 };
  const queue = useEventQueueStore.getState();
  const due = queue.dueEvents(now);
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
  if (response.events.length === 0) return { applied: 0 };
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

export async function syncOnce(): Promise<{
  uploaded: number;
  failed: number;
  applied: number;
}> {
  if (!isCoupleLinkSyncable(useCoupleLinkStore.getState().link)) {
    return { uploaded: 0, failed: 0, applied: 0 };
  }
  // syncOnce is also called by the foreground lifecycle, so refresh even
  // when the queue is empty. Preserve flush-before-pull ordering afterward.
  await refreshCoupleMetadata().catch(() => undefined);
  if (!isCoupleLinkSyncable(useCoupleLinkStore.getState().link)) {
    return { uploaded: 0, failed: 0, applied: 0 };
  }
  const flushResult = await flushPending(Date.now(), true);
  if (!isCoupleLinkSyncable(useCoupleLinkStore.getState().link)) {
    return { uploaded: 0, failed: 0, applied: 0 };
  }
  const pullResult = await pullPartnerEvents();
  return { ...flushResult, applied: pullResult.applied };
}

export { refreshCoupleMetadata } from './coupleLink';

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let scheduledSync: Promise<unknown> | null = null;
let loopGeneration = 0;

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
