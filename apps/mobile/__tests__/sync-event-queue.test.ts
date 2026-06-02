import { useEventQueueStore } from '../lib/sync/eventQueue';

beforeEach(() => {
  useEventQueueStore.setState({ pending: [], nextClientSequence: 1 });
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
