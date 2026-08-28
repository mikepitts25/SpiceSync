import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { useEventQueueStore } from '../lib/sync/eventQueue';
import {
  _resetCacheForTests,
  getOrCreateIdentity,
  setIdentityDeps,
} from '../lib/sync/identity';
import {
  _resetForTests,
  enqueueCurrentVoteSnapshot,
  refreshVoteSync,
  startVoteSync,
  useVoteSyncStore,
} from '../lib/sync/voteSync';
import { useVotesStore } from '../src/stores/votes';
import * as syncLoop from '../lib/sync/syncLoop';

function memoryDeps() {
  const secure = new Map<string, string>();
  const async = new Map<string, string>();
  return {
    secureStore: {
      getItemAsync: async (key: string) => secure.get(key) ?? null,
      setItemAsync: async (key: string, value: string) => {
        secure.set(key, value);
      },
      deleteItemAsync: async (key: string) => {
        secure.delete(key);
      },
    },
    asyncStorage: {
      getItem: async (key: string) => async.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        async.set(key, value);
      },
      removeItem: async (key: string) => {
        async.delete(key);
      },
    },
  };
}

async function settleAsyncWork(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('vote sync', () => {
  beforeEach(async () => {
    _resetForTests();
    _resetCacheForTests();
    setIdentityDeps(memoryDeps());
    const { identity } = await getOrCreateIdentity();
    useVotesStore.setState({ votesByProfile: {} });
    useEventQueueStore.setState({ pending: [], nextClientSequence: 1 });
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-1',
        ownerUserId: 'user-1',
        localProfileId: 'profile-1',
        myDeviceId: identity.deviceId,
        partnerDeviceId: 'dev_partner',
        partnerSigningPublicKey: 'partner_signing_key',
        partnerEncryptionPublicKey: 'partner_encryption_key',
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: null,
        status: 'active',
      },
      authenticatedUserId: 'user-1',
      remoteSyncPauseReason: null,
      pendingProfileConfirmationOwnerUserId: null,
      profileConfirmationInProgress: null,
    });
    useVoteSyncStore.getState().setLocalProfileId('profile-1');
  });

  afterEach(() => {
    _resetForTests();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('coalesces vote changes into an authoritative snapshot sync promptly', async () => {
    jest.useFakeTimers();
    const syncNow = jest
      .spyOn(syncLoop, 'syncNow')
      .mockResolvedValue({ uploaded: 0, failed: 0, applied: 0 });
    await startVoteSync('profile-1');

    useVotesStore.setState({
      votesByProfile: { 'profile-1': { card_1: 'yes' } },
    });
    useVotesStore.setState({
      votesByProfile: { 'profile-1': { card_1: 'maybe' } },
    });

    jest.advanceTimersByTime(299);
    await Promise.resolve();
    expect(syncNow).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(syncNow).toHaveBeenCalledTimes(1);
    expect(syncNow).toHaveBeenCalledWith('profile-1');
  });

  it('queues votes that already existed when the couple linked', async () => {
    useVotesStore.setState({
      votesByProfile: {
        'profile-1': {
          'card-yes': 'yes',
          'card-maybe': 'maybe',
        },
      },
    });

    await expect(startVoteSync()).resolves.toBe(true);

    const payloads = useEventQueueStore
      .getState()
      .pending.map((event) => event.payload);
    expect(payloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: 'vote.upsert',
          cardId: 'card-yes',
          vote: 'yes',
        }),
        expect.objectContaining({
          eventType: 'vote.upsert',
          cardId: 'card-maybe',
          vote: 'maybe',
        }),
        expect.objectContaining({
          eventType: 'progress.snapshot',
          answeredCount: 2,
        }),
      ])
    );

    const queuedCount = payloads.length;
    await expect(startVoteSync()).resolves.toBe(false);
    expect(useEventQueueStore.getState().pending).toHaveLength(queuedCount);
  });

  it('rebuilds the current vote snapshot when bootstrap is marked complete but the queue is empty', async () => {
    useVotesStore.setState({
      votesByProfile: {
        'profile-1': {
          'card-yes': 'yes',
          'card-maybe': 'maybe',
        },
      },
    });
    useVoteSyncStore.setState({
      localProfileId: 'profile-1',
      bootstrappedCoupleId: 'couple-1',
      bootstrappedProfileId: 'profile-1',
      bootstrapVersion: 2,
    });

    await expect(enqueueCurrentVoteSnapshot('profile-1')).resolves.toBe(true);

    expect(
      useEventQueueStore.getState().pending.map((event) => event.payload)
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: 'vote.upsert',
          cardId: 'card-yes',
          vote: 'yes',
        }),
        expect.objectContaining({
          eventType: 'vote.upsert',
          cardId: 'card-maybe',
          vote: 'maybe',
        }),
        expect.objectContaining({
          eventType: 'progress.snapshot',
          answeredCount: 2,
        }),
      ])
    );
    expect(useEventQueueStore.getState().pending).toHaveLength(3);
  });

  it('does not rebuild a vote snapshot while partner sync is awaiting profile confirmation', async () => {
    useVotesStore.setState({
      votesByProfile: {
        'profile-1': { 'card-private': 'yes' },
      },
    });
    useCoupleLinkStore.setState({
      link: {
        ...useCoupleLinkStore.getState().link!,
        requiresProfileConfirmation: true,
      },
    });

    await expect(enqueueCurrentVoteSnapshot('profile-1')).resolves.toBe(false);
    expect(useEventQueueStore.getState().pending).toEqual([]);
  });

  it('does not refresh a stale snapshot after the active profile and couple change while identity loads', async () => {
    const persistedIdentity = memoryDeps();
    _resetCacheForTests();
    setIdentityDeps(persistedIdentity);
    const { identity } = await getOrCreateIdentity();
    useCoupleLinkStore.getState().setLink({
      ...useCoupleLinkStore.getState().link!,
      myDeviceId: identity.deviceId,
    });
    _resetCacheForTests();

    let releaseIdentityReads: () => void = () => undefined;
    const identityReadGate = new Promise<void>((resolve) => {
      releaseIdentityReads = resolve;
    });
    setIdentityDeps({
      secureStore: {
        ...persistedIdentity.secureStore,
        getItemAsync: async (key: string) => {
          await identityReadGate;
          return persistedIdentity.secureStore.getItemAsync(key);
        },
      },
      asyncStorage: {
        ...persistedIdentity.asyncStorage,
        getItem: async (key: string) => {
          await identityReadGate;
          return persistedIdentity.asyncStorage.getItem(key);
        },
      },
    });
    useVotesStore.setState({
      votesByProfile: {
        'profile-1': { 'card-from-old-profile': 'yes' },
        'profile-2': { 'card-from-new-profile': 'maybe' },
      },
    });

    const refreshing = refreshVoteSync('profile-1');
    await Promise.resolve();
    useCoupleLinkStore.getState().setLink({
      ...useCoupleLinkStore.getState().link!,
      coupleId: 'couple-2',
      ownerUserId: 'user-2',
      partnerDeviceId: 'dev_partner_2',
    });
    useVoteSyncStore.getState().setLocalProfileId('profile-2');
    releaseIdentityReads();

    await expect(refreshing).rejects.toThrow();
    expect(useEventQueueStore.getState().pending).toEqual([]);
    expect(useVoteSyncStore.getState().localProfileId).toBe('profile-2');
  });

  it('reports failure when the persisted identity cannot enqueue for the active device', async () => {
    useVotesStore.setState({
      votesByProfile: {
        'profile-1': { 'card-device-mismatch': 'yes' },
      },
    });
    useCoupleLinkStore.getState().setLink({
      ...useCoupleLinkStore.getState().link!,
      myDeviceId: 'dev_replaced',
    });

    await expect(enqueueCurrentVoteSnapshot('profile-1')).resolves.toBe(false);
    expect(useEventQueueStore.getState().pending).toEqual([]);
  });

  it('never revalidates matching persisted votes during a paused recovery handoff', async () => {
    useVotesStore.setState({
      votesByProfile: {
        'profile-1': { 'card-recovered': 'yes' },
      },
    });
    useVoteSyncStore.setState({
      localProfileId: 'profile-1',
      bootstrappedCoupleId: 'couple-1',
      bootstrappedProfileId: 'profile-1',
      bootstrapVersion: 2,
    });
    useCoupleLinkStore.setState({
      link: {
        ...useCoupleLinkStore.getState().link!,
        requiresProfileConfirmation: true,
      },
    });
    await expect(
      startVoteSync('profile-1', {
        allowPendingProfileConfirmation: true,
        revalidateRecoveredBootstrap: true,
      })
    ).resolves.toBe(false);
    expect(useEventQueueStore.getState().pending).toHaveLength(0);
    expect(
      useCoupleLinkStore.getState().beginProfileConfirmation('profile-1')
    ).toBe(true);

    await expect(
      startVoteSync('profile-1', {
        allowPendingProfileConfirmation: true,
        revalidateRecoveredBootstrap: true,
      })
    ).resolves.toBe(false);

    expect(useEventQueueStore.getState().pending).toEqual([]);
    expect(
      useCoupleLinkStore.getState().link?.requiresProfileConfirmation
    ).toBe(true);
  });

  it('keeps the recovery pause and marker when revalidation cannot enqueue', async () => {
    _resetCacheForTests();
    setIdentityDeps(memoryDeps());
    useVotesStore.setState({
      votesByProfile: {
        'profile-1': { 'card-retry': 'maybe' },
      },
    });
    useVoteSyncStore.setState({
      localProfileId: 'profile-1',
      bootstrappedCoupleId: 'couple-1',
      bootstrappedProfileId: 'profile-1',
      bootstrapVersion: 2,
    });
    useCoupleLinkStore.setState({
      link: {
        ...useCoupleLinkStore.getState().link!,
        requiresProfileConfirmation: true,
      },
    });
    useCoupleLinkStore.getState().beginProfileConfirmation('profile-1');

    await expect(
      startVoteSync('profile-1', {
        allowPendingProfileConfirmation: true,
        revalidateRecoveredBootstrap: true,
      })
    ).resolves.toBe(false);

    expect(useEventQueueStore.getState().pending).toHaveLength(0);
    expect(
      useCoupleLinkStore.getState().link?.requiresProfileConfirmation
    ).toBe(true);
    expect(useVoteSyncStore.getState()).toMatchObject({
      bootstrappedCoupleId: 'couple-1',
      bootstrappedProfileId: 'profile-1',
      bootstrapVersion: 2,
    });
  });

  it('queues updated progress whenever a linked profile casts a vote', async () => {
    startVoteSync();
    useVotesStore.getState().setVote('profile-1', 'card-yes', 'yes');
    await settleAsyncWork();

    const payloads = useEventQueueStore
      .getState()
      .pending.map((event) => event.payload);
    expect(payloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: 'vote.upsert',
          cardId: 'card-yes',
          vote: 'yes',
        }),
        expect.objectContaining({
          eventType: 'progress.snapshot',
          answeredCount: 1,
        }),
      ])
    );
  });

  it('re-sends existing votes when a legacy bootstrap marker falsely says they were sent', async () => {
    useVotesStore.setState({
      votesByProfile: {
        'profile-1': {
          'card-yes': 'yes',
        },
      },
    });
    useVoteSyncStore.setState({
      localProfileId: 'profile-1',
      bootstrappedCoupleId: 'couple-1',
      bootstrappedProfileId: 'profile-1',
      bootstrapVersion: 1,
    });

    await startVoteSync();

    expect(
      useEventQueueStore
        .getState()
        .pending.some(
          (event) =>
            event.payload.eventType === 'vote.upsert' &&
            event.payload.cardId === 'card-yes'
        )
    ).toBe(true);
  });

  it('does not mark an empty unhydrated profile as bootstrapped', async () => {
    await startVoteSync();

    expect(useVoteSyncStore.getState().bootstrappedCoupleId).toBeNull();
  });

  it('does not bootstrap another local profile into the bound relationship', async () => {
    useVotesStore.setState({
      votesByProfile: {
        'profile-1': { 'card-one': 'yes' },
        'profile-2': { 'card-two': 'maybe' },
      },
    });

    await startVoteSync();
    useEventQueueStore.setState({ pending: [], nextClientSequence: 1 });
    useVoteSyncStore.getState().setLocalProfileId('profile-2');

    await startVoteSync();

    expect(
      useEventQueueStore
        .getState()
        .pending.some(
          (event) =>
            event.payload.eventType === 'vote.upsert' &&
            event.payload.cardId === 'card-two'
        )
    ).toBe(false);
  });

  it('can initialize the local profile while starting vote sync', async () => {
    useVoteSyncStore.getState().setLocalProfileId(null);
    useVotesStore.setState({
      votesByProfile: {
        'profile-1': { 'card-ready': 'yes' },
      },
    });

    await startVoteSync('profile-1');

    expect(useVoteSyncStore.getState().localProfileId).toBe('profile-1');
    expect(useEventQueueStore.getState().pending).toHaveLength(2);
  });

  it('does not enqueue or start vote sync before profile confirmation', async () => {
    useVotesStore.setState({
      votesByProfile: {
        'profile-1': { 'card-yes': 'yes' },
      },
    });
    useCoupleLinkStore.setState({
      link: {
        ...useCoupleLinkStore.getState().link!,
        requiresProfileConfirmation: true,
      },
    });

    await expect(startVoteSync('profile-1')).resolves.toBe(false);
    expect(useEventQueueStore.getState().pending).toHaveLength(0);

    useCoupleLinkStore.setState({
      link: {
        ...useCoupleLinkStore.getState().link!,
        requiresProfileConfirmation: false,
      },
    });
    useVotesStore.getState().setVote('profile-1', 'card-later', 'maybe');
    await settleAsyncWork();

    expect(useEventQueueStore.getState().pending).toHaveLength(0);
  });
});
