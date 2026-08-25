import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKUP_ALLOWLIST } from '../lib/backup/snapshot';
import { rehydrateRestoredStores } from '../lib/backup/rehydrate';
import { useProfilesStore } from '../lib/state/profiles';
import { useScreenToursStore } from '../src/stores/screenTours';
import { useVotesStore } from '../src/stores/votes';

const persisted = (state: unknown) => JSON.stringify({ state, version: 0 });

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('rehydrateRestoredStores', () => {
  it('re-reads a restored store into live in-memory state', async () => {
    useScreenToursStore.setState({ dismissedTourScreens: {} });
    await AsyncStorage.setItem(
      'spicesync-screen-tours-v1',
      persisted({ dismissedTourScreens: { deck: true } })
    );

    const result = await rehydrateRestoredStores(['spicesync-screen-tours-v1']);

    expect(useScreenToursStore.getState().dismissedTourScreens).toEqual({
      deck: true,
    });
    expect(result.rehydrated).toEqual(['spicesync-screen-tours-v1']);
    expect(result.failed).toEqual([]);
  });

  it('reloads profiles despite the hydrated early-return', async () => {
    // Simulate a running app: profiles already hydrated from an older value.
    useProfilesStore.setState({
      profiles: [],
      activeProfileId: null,
      currentUserId: null,
      hydrated: true,
    });
    await AsyncStorage.setItem(
      'profiles',
      JSON.stringify([
        { id: 'p1', name: 'Restored', emoji: '🦊', createdAt: 1, updatedAt: 2 },
      ])
    );

    const result = await rehydrateRestoredStores(['profiles']);

    expect(useProfilesStore.getState().profiles).toHaveLength(1);
    expect(useProfilesStore.getState().profiles[0].name).toBe('Restored');
    expect(result.rehydrated).toEqual(['profiles']);
  });

  it('ignores keys with no corresponding store', async () => {
    const result = await rehydrateRestoredStores([
      'spicesync-premium-v3',
      'totally-unknown-key',
    ]);

    expect(result.rehydrated).toEqual([]);
    expect(result.failed).toEqual([]);
  });

  it('rehydrates several stores in one pass', async () => {
    useScreenToursStore.setState({ dismissedTourScreens: {} });
    await AsyncStorage.multiSet([
      [
        'spicesync-screen-tours-v1',
        persisted({ dismissedTourScreens: { deck: true } }),
      ],
      [
        'votes',
        // The votes store is at version 4; an older version would be routed
        // through `migrate` and normalized, which is not what this asserts.
        JSON.stringify({
          state: { votesByProfile: { p1: { k1: { vote: 'yes', at: 1 } } } },
          version: 4,
        }),
      ],
    ]);

    const result = await rehydrateRestoredStores([
      'spicesync-screen-tours-v1',
      'votes',
    ]);

    expect(result.rehydrated.sort()).toEqual(
      ['spicesync-screen-tours-v1', 'votes'].sort()
    );
    expect(useScreenToursStore.getState().dismissedTourScreens).toEqual({
      deck: true,
    });
    expect(useVotesStore.getState().votesByProfile).toHaveProperty('p1');
  });

  it('collects a failure instead of abandoning the rest of the restore', async () => {
    useScreenToursStore.setState({ dismissedTourScreens: {} });
    await AsyncStorage.setItem(
      'spicesync-screen-tours-v1',
      persisted({ dismissedTourScreens: { deck: true } })
    );

    const spy = jest
      .spyOn(useVotesStore.persist, 'rehydrate')
      .mockRejectedValueOnce(new Error('corrupt store'));

    const result = await rehydrateRestoredStores([
      'votes',
      'spicesync-screen-tours-v1',
    ]);

    expect(result.failed).toEqual([{ key: 'votes', error: 'corrupt store' }]);
    // The healthy store still got restored.
    expect(result.rehydrated).toEqual(['spicesync-screen-tours-v1']);
    expect(useScreenToursStore.getState().dismissedTourScreens).toEqual({
      deck: true,
    });

    spy.mockRestore();
  });

  it('covers every allowlisted key, so a restore is never partly invisible', async () => {
    // If a key can be written by a restore but has no store wired up here, the
    // user sees stale data with no error. Assert the two lists agree.
    const uncovered: string[] = [];
    for (const key of BACKUP_ALLOWLIST) {
      const result = await rehydrateRestoredStores([key]);
      if (result.rehydrated.length === 0 && result.failed.length === 0) {
        uncovered.push(key);
      }
    }

    expect(uncovered).toEqual([]);
  });
});
