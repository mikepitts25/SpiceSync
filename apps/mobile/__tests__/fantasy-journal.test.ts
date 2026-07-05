import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  isShareableStatus,
  statusToReadiness,
  useFantasyJournalStore,
} from '../lib/state/fantasyJournal';
import { useVotesStore } from '../src/stores/votes';

beforeEach(() => {
  useFantasyJournalStore.setState({ entries: {} });
  useVotesStore.setState({ votesByProfile: {} });
});

describe('fantasy journal', () => {
  it('saves entries privately without touching votes', () => {
    const entry = useFantasyJournalStore.getState().addEntry({
      profileId: 'p1',
      title: 'A private fantasy',
      status: 'fantasy_only',
      linkedKinkId: 'k1',
    });

    expect(entry).not.toBeNull();
    expect(
      useFantasyJournalStore.getState().getEntriesForProfile('p1')
    ).toHaveLength(1);
    expect(useVotesStore.getState().votesByProfile).toEqual({});
  });

  it('only curious and want_to_try are shareable statuses', () => {
    expect(isShareableStatus('fantasy_only')).toBe(false);
    expect(isShareableStatus('curious')).toBe(true);
    expect(isShareableStatus('want_to_try')).toBe(true);

    expect(statusToReadiness('fantasy_only')).toBeNull();
    expect(statusToReadiness('curious')).toBe('curious');
    expect(statusToReadiness('want_to_try')).toBe('yes');
  });

  it('never shares fantasy_only entries into matching', () => {
    const entry = useFantasyJournalStore.getState().addEntry({
      profileId: 'p1',
      title: 'Keep this private',
      status: 'fantasy_only',
      linkedKinkId: 'k1',
    })!;

    const shared = useFantasyJournalStore
      .getState()
      .shareEntryToMatching(entry.id);

    expect(shared).toBe(false);
    expect(useVotesStore.getState().getVote('p1', 'k1')).toBeUndefined();
    expect(
      useFantasyJournalStore.getState().entries[entry.id].sharedToMatchingAt
    ).toBeUndefined();
  });

  it('shares want_to_try as a yes vote only on explicit action', () => {
    const entry = useFantasyJournalStore.getState().addEntry({
      profileId: 'p1',
      title: 'Want to try this',
      status: 'want_to_try',
      linkedKinkId: 'k1',
    })!;

    // Saving alone must not create a vote.
    expect(useVotesStore.getState().getVote('p1', 'k1')).toBeUndefined();

    const shared = useFantasyJournalStore
      .getState()
      .shareEntryToMatching(entry.id);

    expect(shared).toBe(true);
    expect(useVotesStore.getState().getVote('p1', 'k1')).toBe('yes');
    expect(useVotesStore.getState().getReadiness('p1', 'k1')).toBe('yes');
    expect(
      useFantasyJournalStore.getState().entries[entry.id].sharedToMatchingAt
    ).toBeGreaterThan(0);
  });

  it('shares curious as a curious readiness (maybe vote)', () => {
    const entry = useFantasyJournalStore.getState().addEntry({
      profileId: 'p1',
      title: 'Curious about this',
      status: 'curious',
      linkedKinkId: 'k2',
    })!;

    useFantasyJournalStore.getState().shareEntryToMatching(entry.id);

    expect(useVotesStore.getState().getVote('p1', 'k2')).toBe('maybe');
    expect(useVotesStore.getState().getReadiness('p1', 'k2')).toBe('curious');
  });

  it('refuses to share entries without a linked kink', () => {
    const entry = useFantasyJournalStore.getState().addEntry({
      profileId: 'p1',
      title: 'Unlinked fantasy',
      status: 'want_to_try',
    })!;

    expect(
      useFantasyJournalStore.getState().shareEntryToMatching(entry.id)
    ).toBe(false);
    expect(useVotesStore.getState().votesByProfile).toEqual({});
  });

  it('downgrading to fantasy_only withdraws the share marker', () => {
    const store = useFantasyJournalStore.getState();
    const entry = store.addEntry({
      profileId: 'p1',
      title: 'Changed my mind',
      status: 'curious',
      linkedKinkId: 'k1',
    })!;
    store.shareEntryToMatching(entry.id);

    useFantasyJournalStore
      .getState()
      .updateEntry(entry.id, { status: 'fantasy_only' });

    const updated = useFantasyJournalStore.getState().entries[entry.id];
    expect(updated.status).toBe('fantasy_only');
    expect(updated.sharedToMatchingAt).toBeUndefined();
  });

  it('rehydrates persisted entries from local storage', async () => {
    await AsyncStorage.setItem(
      'fantasy-journal',
      JSON.stringify({
        state: {
          entries: {
            'fantasy-1': {
              id: 'fantasy-1',
              profileId: 'p1',
              title: 'Persisted fantasy',
              status: 'fantasy_only',
              createdAt: 1000,
              updatedAt: 1000,
            },
          },
        },
        version: 0,
      })
    );

    await useFantasyJournalStore.persist.rehydrate();

    expect(
      useFantasyJournalStore.getState().getEntriesForProfile('p1')
    ).toHaveLength(1);

    await AsyncStorage.removeItem('fantasy-journal');
  });
});
