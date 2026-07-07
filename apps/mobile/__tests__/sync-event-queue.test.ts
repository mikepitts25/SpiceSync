import { useEventQueueStore } from '../lib/sync/eventQueue';
import {
  _resetCacheForTests,
  getOrCreateIdentity,
  setIdentityDeps,
} from '../lib/sync/identity';
import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import {
  _resetForTests,
  startVoteSync,
  stopVoteSync,
  useVoteSyncStore,
} from '../lib/sync/voteSync';
import { useVotesStore } from '../src/stores/votes';

function memoryIdentityDeps() {
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

beforeEach(() => {
  useEventQueueStore.setState({ pending: [], nextClientSequence: 1 });
  useCoupleLinkStore.setState({ link: null });
  useVotesStore.setState({ votesByProfile: {} });
  _resetForTests();
  setIdentityDeps(memoryIdentityDeps());
  _resetCacheForTests();
});

afterEach(() => {
  stopVoteSync();
});

describe('event queue', () => {
  it('enqueues events with monotonic client sequence', () => {
    const queue = useEventQueueStore.getState();
    const a = queue.enqueue({
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: 'dev_a',
      cardId: 'card-1',
      vote: 'yes',
      updatedAt: 1,
    });
    const b = queue.enqueue({
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: 'dev_a',
      cardId: 'card-2',
      vote: 'no',
      updatedAt: 2,
    });
    expect(a.clientSequence).toBe(1);
    expect(b.clientSequence).toBe(2);
    expect(useEventQueueStore.getState().pending).toHaveLength(2);
  });

  it('keeps paired role preference on vote events', () => {
    const queue = useEventQueueStore.getState();
    const pending = queue.enqueue({
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: 'dev_a',
      cardId: 'pair:oral-pleasure',
      vote: 'yes',
      pairPreference: 'give',
      updatedAt: 1,
    });

    expect(pending.payload).toMatchObject({
      eventType: 'vote.upsert',
      cardId: 'pair:oral-pleasure',
      vote: 'yes',
      pairPreference: 'give',
    });
  });

  it('queues explicit readiness refinements from local vote sync', async () => {
    const { identity } = await getOrCreateIdentity();
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-1',
        myDeviceId: identity.deviceId,
        partnerDeviceId: 'dev_partner',
        partnerSigningPublicKey: 'sign',
        partnerEncryptionPublicKey: 'enc',
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: null,
        status: 'active',
      },
    });
    useVoteSyncStore.getState().setLocalProfileId('profile-a');
    startVoteSync();

    useVotesStore
      .getState()
      .setReadiness('profile-a', 'card-1', 'not_now', 'give');

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(useEventQueueStore.getState().pending[0]?.payload).toMatchObject({
      eventType: 'vote.upsert',
      cardId: 'card-1',
      vote: 'no',
      readiness: 'not_now',
      pairPreference: 'give',
    });
  });

  it('removes an event when marked as success', () => {
    const queue = useEventQueueStore.getState();
    const a = queue.enqueue({
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: 'dev_a',
      cardId: 'card-1',
      vote: 'yes',
      updatedAt: 1,
    });
    queue.markAttempted(a.eventId, true);
    expect(useEventQueueStore.getState().pending).toHaveLength(0);
  });

  it('schedules a retry on failure with growing backoff', () => {
    const queue = useEventQueueStore.getState();
    const a = queue.enqueue({
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: 'dev_a',
      cardId: 'card-1',
      vote: 'yes',
      updatedAt: 1,
    });
    const before = Date.now();
    queue.markAttempted(a.eventId, false, 'network');
    const after = useEventQueueStore.getState().pending[0];
    expect(after.attempts).toBe(1);
    expect(after.nextAttemptAt).toBeGreaterThanOrEqual(before);
    expect(after.lastError).toBe('network');

    queue.markAttempted(a.eventId, false, 'network');
    const afterTwo = useEventQueueStore.getState().pending[0];
    expect(afterTwo.attempts).toBe(2);
    expect(afterTwo.nextAttemptAt).toBeGreaterThan(after.nextAttemptAt);
  });

  it('dueEvents returns events past their nextAttemptAt', () => {
    const queue = useEventQueueStore.getState();
    queue.enqueue({
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: 'dev_a',
      cardId: 'card-1',
      vote: 'yes',
      updatedAt: 1,
    });
    expect(queue.dueEvents(Date.now())).toHaveLength(1);
    expect(queue.dueEvents(0)).toHaveLength(0);
  });
});
