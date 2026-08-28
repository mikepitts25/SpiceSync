import { isCoupleLinkSyncable, useCoupleLinkStore } from './coupleLink';
import { useEventQueueStore } from './eventQueue';
import { getRelayClient } from './relayConfig';
import { flushPending } from './syncLoop';

/**
 * Why a disconnect is more than a local clear.
 *
 * Tearing down this device's link is the easy half. The partner is a separate
 * installation that only ever learns anything through the relay, so a purely
 * local disconnect leaves them showing an active connection forever. Two
 * independent mechanisms carry the news, because either one alone has a hole:
 *
 *  - A `couple.unlink` event is the fast path. The partner already applies it
 *    on receipt, so an online partner updates on their next pull.
 *  - `revokeCouple` is the durable path. It marks the couple revoked on the
 *    relay, so a partner who is offline now still finds out later. Without it
 *    an undelivered event would simply be lost.
 *
 * Ordering is load-bearing. `enqueue` requires active sync ownership and
 * `flushPending` requires a syncable link, so both must run before any local
 * teardown; and the queue reset in teardown would discard the very event we
 * just queued. Hence: notify, then clear.
 */

export type RemoteDisconnectOutcome = {
  /** The unlink event reached the relay, so an online partner sees it now. */
  notifiedPartner: boolean;
  /** The couple is revoked server-side, so an offline partner finds out later. */
  revokedCouple: boolean;
};

/**
 * Tell the relay and the partner that this link is over.
 *
 * Never throws. A disconnect the user asked for must always complete locally,
 * so an unreachable relay degrades to a local-only disconnect rather than
 * trapping the user in a connection they have already left. The returned
 * outcome lets the caller say honestly whether the partner was reached.
 */
export async function notifyPartnerOfDisconnect(): Promise<RemoteDisconnectOutcome> {
  const outcome: RemoteDisconnectOutcome = {
    notifiedPartner: false,
    revokedCouple: false,
  };

  const link = useCoupleLinkStore.getState().link;
  if (!isCoupleLinkSyncable(link)) return outcome;
  const coupleId = link.coupleId;

  const queued = useEventQueueStore.getState().enqueue({
    schemaVersion: 1,
    eventType: 'couple.unlink',
    authorDeviceId: link.myDeviceId,
    updatedAt: Date.now(),
  });

  if (queued) {
    try {
      // Force the event past its backoff schedule: this is the last flush this
      // link will ever get, so waiting for a retry window is waiting forever.
      await flushPending(Date.now(), false, true);
      outcome.notifiedPartner = !useEventQueueStore
        .getState()
        .pending.some((pending) => pending.eventId === queued.eventId);
    } catch {
      outcome.notifiedPartner = false;
    }
  }

  try {
    await getRelayClient().revokeCouple(coupleId);
    outcome.revokedCouple = true;
  } catch {
    outcome.revokedCouple = false;
  }

  return outcome;
}
