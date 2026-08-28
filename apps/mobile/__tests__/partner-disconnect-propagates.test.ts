import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { useEventQueueStore } from '../lib/sync/eventQueue';
import { usePartnerVotesStore } from '../lib/sync/partnerVotes';
import { useRevealConsentStore } from '../lib/sync/revealConsent';
import { disconnectRemotePartner } from '../lib/safety/localDataControls';

const mockFlushPending = jest.fn();
const mockRevokeCouple = jest.fn();

jest.mock('../lib/sync/syncLoop', () => ({
  flushPending: (...args: unknown[]) => mockFlushPending(...args),
}));

jest.mock('../lib/sync/relayConfig', () => ({
  getRelayClient: () => ({
    revokeCouple: (...args: unknown[]) => mockRevokeCouple(...args),
  }),
}));

function setActiveLink() {
  useCoupleLinkStore.setState({
    link: {
      coupleId: 'couple-1',
      ownerUserId: 'user-me',
      myDeviceId: 'dev_me',
      partnerDeviceId: 'dev_partner',
      partnerSigningPublicKey: 'partner-signing-key',
      partnerEncryptionPublicKey: 'partner-encryption-key',
      linkedAt: 1,
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      status: 'active',
    },
    authenticatedUserId: 'user-me',
    remoteSyncPauseReason: null,
    pendingProfileConfirmationOwnerUserId: null,
  });
}

const capturedUnlinkPayloads: { eventType: string; authorDeviceId: string }[] =
  [];
const baseEnqueue = useEventQueueStore.getState().enqueue;

beforeEach(() => {
  jest.clearAllMocks();
  useCoupleLinkStore.setState({
    link: null,
    authenticatedUserId: null,
    remoteSyncPauseReason: null,
    pendingProfileConfirmationOwnerUserId: null,
  });
  useEventQueueStore.setState({
    pending: [],
    quarantined: [],
    nextClientSequence: 1,
  });
  usePartnerVotesStore.getState().reset();
  useRevealConsentStore.getState().reset();

  // Record what gets enqueued: the disconnect tears the queue down on its way
  // out, so the payload cannot be inspected afterwards.
  capturedUnlinkPayloads.length = 0;
  const realEnqueue = baseEnqueue;
  useEventQueueStore.setState({
    enqueue: (payload) => {
      if (payload.eventType === 'couple.unlink') {
        capturedUnlinkPayloads.push(payload);
      }
      return realEnqueue(payload);
    },
  });

  // The default relay is reachable; the offline cases override these.
  mockRevokeCouple.mockResolvedValue({ coupleId: 'couple-1', revokedAt: 1 });
  // A successful flush is modelled the way the real one behaves: the delivered
  // event is removed from the queue.
  mockFlushPending.mockImplementation(async () => {
    useEventQueueStore.setState({ pending: [] });
    return { uploaded: 1, failed: 0 };
  });
});

describe('disconnecting a remote partner', () => {
  it('sends a couple.unlink event so the partner device stops showing connected', async () => {
    setActiveLink();

    const outcome = await disconnectRemotePartner();

    // The event must be queued and flushed before teardown, or the partner is
    // never told and keeps rendering an active connection.
    expect(mockFlushPending).toHaveBeenCalledTimes(1);
    expect(capturedUnlinkPayloads).toEqual([
      expect.objectContaining({
        eventType: 'couple.unlink',
        authorDeviceId: 'dev_me',
      }),
    ]);
    expect(outcome.notifiedPartner).toBe(true);
  });

  it('revokes the couple so an offline partner still learns on next sync', async () => {
    setActiveLink();

    const outcome = await disconnectRemotePartner();

    expect(mockRevokeCouple).toHaveBeenCalledWith('couple-1');
    expect(outcome.revokedCouple).toBe(true);
  });

  it('notifies the partner before clearing local state', async () => {
    setActiveLink();
    let linkAtFlush: unknown = 'never-flushed';
    mockFlushPending.mockImplementation(async () => {
      // enqueue requires ownership and flush requires a syncable link, so the
      // link must still be active at this point.
      linkAtFlush = useCoupleLinkStore.getState().link?.status ?? null;
      useEventQueueStore.setState({ pending: [] });
      return { uploaded: 1, failed: 0 };
    });

    await disconnectRemotePartner();

    expect(linkAtFlush).toBe('active');
  });

  it('clears local partner state after disconnecting', async () => {
    setActiveLink();
    usePartnerVotesStore.getState().applyVote({
      cardId: 'card-1',
      vote: 'yes',
      updatedAt: 1,
      receivedAt: 1,
    });

    await disconnectRemotePartner();

    expect(useCoupleLinkStore.getState().link).toBeNull();
    expect(usePartnerVotesStore.getState().byCardId).toEqual({});
    expect(useEventQueueStore.getState().pending).toEqual([]);
  });

  it('still disconnects locally when the relay is unreachable', async () => {
    setActiveLink();
    mockFlushPending.mockRejectedValue(new Error('offline'));
    mockRevokeCouple.mockRejectedValue(new Error('offline'));

    const outcome = await disconnectRemotePartner();

    // The user asked to disconnect; a dead network must not trap them in the
    // connection. But the outcome must not claim the partner was told.
    expect(useCoupleLinkStore.getState().link).toBeNull();
    expect(outcome.notifiedPartner).toBe(false);
    expect(outcome.revokedCouple).toBe(false);
  });

  it('reports the partner as un-notified when the event fails to upload', async () => {
    setActiveLink();
    // Upload failed: the real flushPending leaves the event pending for retry.
    mockFlushPending.mockResolvedValue({ uploaded: 0, failed: 1 });

    const outcome = await disconnectRemotePartner();

    expect(outcome.notifiedPartner).toBe(false);
    // The server-side revoke is the durable fallback and still ran.
    expect(outcome.revokedCouple).toBe(true);
  });

  it('does nothing remote when there is no active link', async () => {
    const outcome = await disconnectRemotePartner();

    expect(mockFlushPending).not.toHaveBeenCalled();
    expect(mockRevokeCouple).not.toHaveBeenCalled();
    expect(outcome).toEqual({ notifiedPartner: false, revokedCouple: false });
  });
});
