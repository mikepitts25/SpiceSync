import { decodeBase64, encodeBase64 } from './base64';
import { refreshCoupleMetadata, useCoupleLinkStore } from './coupleLink';
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

async function uploadPending(pending: PendingEvent): Promise<void> {
  const link = useCoupleLinkStore.getState().link;
  if (!link || link.status !== 'active') return;
  const id = await getIdentityIfExists();
  if (!id) return;
  const recipientDeviceId =
    pending.recipientDeviceId === null ||
    pending.recipientDeviceId === undefined
      ? undefined
      : link.partnerDeviceId;
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
  await getRelayClient().appendEvent(link.coupleId, {
    eventId: pending.eventId,
    authorDeviceId: id.identity.deviceId,
    recipientDeviceId,
    clientSequence: pending.clientSequence,
    encryptedPayload,
    payloadHash,
    signature: encodeBase64(signature),
  });
}

function isRecipientKeyChanged(error: unknown): error is RelayHttpError {
  return (
    error instanceof RelayHttpError && error.code === 'RECIPIENT_KEY_CHANGED'
  );
}

async function uploadPendingWithRecipientRefresh(
  pending: PendingEvent
): Promise<void> {
  try {
    await uploadPending(pending);
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
    await uploadPending(pending);
  }
}

export async function flushPending(
  now: number = Date.now(),
  metadataWasRefreshed: boolean = false
): Promise<{ uploaded: number; failed: number }> {
  const link = useCoupleLinkStore.getState().link;
  if (!link || link.status !== 'active') return { uploaded: 0, failed: 0 };
  const queue = useEventQueueStore.getState();
  const due = queue.dueEvents(now);
  if (due.length > 0 && !metadataWasRefreshed) {
    // An unavailable metadata endpoint must not alter the established queue
    // scheduling semantics. The append path still has its one safe retry.
    await refreshCoupleMetadata().catch(() => undefined);
  }
  let uploaded = 0;
  let failed = 0;
  for (const pending of due) {
    try {
      await uploadPendingWithRecipientRefresh(pending);
      queue.markAttempted(pending.eventId, true);
      uploaded += 1;
    } catch (err) {
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
  myDeviceId: string
): Promise<{ applied: number; lastSequence: number }> {
  const link = useCoupleLinkStore.getState().link;
  if (!link) {
    return { applied: 0, lastSequence: 0 };
  }
  const id = await getIdentityIfExists();
  if (!id) {
    return { applied: 0, lastSequence: link.lastPulledServerSequence };
  }
  const partnerEncryptionPublic = decodeBase64(link.partnerEncryptionPublicKey);
  let lastSequence = link.lastPulledServerSequence;
  let applied = 0;
  for (const event of events) {
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
  if (!link || link.status !== 'active') return { applied: 0 };
  const id = await getIdentityIfExists();
  if (!id) return { applied: 0 };
  const response = await getRelayClient().listEvents(
    link.coupleId,
    link.lastPulledServerSequence
  );
  if (response.events.length === 0) return { applied: 0 };
  const { applied, lastSequence } = await applyServerEvents(
    response.events,
    id.identity.deviceId
  );
  useCoupleLinkStore.getState().updateCursor(lastSequence);
  useCoupleLinkStore.getState().markSynced(Date.now());
  return { applied };
}

export async function syncOnce(): Promise<{
  uploaded: number;
  failed: number;
  applied: number;
}> {
  // syncOnce is also called by the foreground lifecycle, so refresh even
  // when the queue is empty. Preserve flush-before-pull ordering afterward.
  await refreshCoupleMetadata().catch(() => undefined);
  const flushResult = await flushPending(Date.now(), true);
  const pullResult = await pullPartnerEvents();
  return { ...flushResult, applied: pullResult.applied };
}

export { refreshCoupleMetadata } from './coupleLink';

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let scheduledSync: Promise<unknown> | null = null;
let loopGeneration = 0;

function runScheduledSync(generation: number): void {
  if (generation !== loopGeneration || scheduledSync) return;

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
