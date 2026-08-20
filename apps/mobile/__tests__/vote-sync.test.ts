import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { useEventQueueStore } from '../lib/sync/eventQueue';
import {
  _resetCacheForTests,
  getOrCreateIdentity,
  setIdentityDeps,
} from '../lib/sync/identity';
import {
  _resetForTests,
  startVoteSync,
  useVoteSyncStore,
} from '../lib/sync/voteSync';
import { useVotesStore } from '../src/stores/votes';

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
        myDeviceId: identity.deviceId,
        partnerDeviceId: 'dev_partner',
        partnerSigningPublicKey: 'partner_signing_key',
        partnerEncryptionPublicKey: 'partner_encryption_key',
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: null,
        status: 'active',
      },
    });
    useVoteSyncStore.getState().setLocalProfileId('profile-1');
  });

  afterEach(() => {
    _resetForTests();
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

    await startVoteSync();

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
    await startVoteSync();
    expect(useEventQueueStore.getState().pending).toHaveLength(queuedCount);
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

  it('bootstraps the active profile again when profiles change within a couple', async () => {
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
    ).toBe(true);
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
