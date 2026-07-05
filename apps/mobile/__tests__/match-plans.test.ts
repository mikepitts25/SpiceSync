import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  buildProposalText,
  selectCompleted,
  selectFavorites,
  selectNextSession,
  useMatchPlansStore,
} from '../lib/state/matchPlans';

beforeEach(() => {
  useMatchPlansStore.setState({ plansByKinkId: {} });
});

describe('match plans', () => {
  it('toggles favorite and next session independently', () => {
    const store = useMatchPlansStore.getState();
    store.toggleFavorite('k1');
    store.toggleNextSession('k1');
    store.toggleNextSession('k2');

    const plans = useMatchPlansStore.getState().plansByKinkId;
    expect(plans.k1).toMatchObject({ favorite: true, nextSession: true });
    expect(plans.k2).toMatchObject({ favorite: false, nextSession: true });

    useMatchPlansStore.getState().toggleFavorite('k1');
    expect(useMatchPlansStore.getState().plansByKinkId.k1.favorite).toBe(false);
  });

  it('marking completed records history and clears the next-session flag', () => {
    const store = useMatchPlansStore.getState();
    store.toggleNextSession('k1');
    store.markCompleted('k1', 1000);
    store.markCompleted('k1', 2000);

    const plan = useMatchPlansStore.getState().plansByKinkId.k1;
    expect(plan.nextSession).toBe(false);
    expect(plan.completedAt).toEqual([1000, 2000]);
  });

  it('stores and clears private notes', () => {
    const store = useMatchPlansStore.getState();
    store.setNote('k1', 'Bring the massage oil.');
    expect(useMatchPlansStore.getState().plansByKinkId.k1.note).toBe(
      'Bring the massage oil.'
    );

    useMatchPlansStore.getState().setNote('k1', '   ');
    expect(useMatchPlansStore.getState().plansByKinkId.k1).toBeUndefined();
  });

  it('removes plans that become empty', () => {
    const store = useMatchPlansStore.getState();
    store.toggleFavorite('k1');
    useMatchPlansStore.getState().toggleFavorite('k1');
    expect(useMatchPlansStore.getState().plansByKinkId.k1).toBeUndefined();

    useMatchPlansStore.getState().toggleFavorite('k2');
    useMatchPlansStore.getState().clearPlan('k2');
    expect(useMatchPlansStore.getState().plansByKinkId.k2).toBeUndefined();
  });

  it('selectors split favorites, next session, and completed', () => {
    const store = useMatchPlansStore.getState();
    store.toggleFavorite('fav');
    store.toggleNextSession('next');
    store.markCompleted('done');

    const plans = useMatchPlansStore.getState().plansByKinkId;
    expect(selectFavorites(plans).map((plan) => plan.kinkId)).toEqual(['fav']);
    expect(selectNextSession(plans).map((plan) => plan.kinkId)).toEqual([
      'next',
    ]);
    expect(selectCompleted(plans).map((plan) => plan.kinkId)).toEqual(['done']);
  });

  it('rehydrates persisted plans from local storage', async () => {
    await AsyncStorage.setItem(
      'match-plans',
      JSON.stringify({
        state: {
          plansByKinkId: {
            k1: {
              kinkId: 'k1',
              favorite: true,
              nextSession: false,
              completedAt: [],
              note: 'note',
              updatedAt: 1000,
            },
          },
        },
        version: 0,
      })
    );

    await useMatchPlansStore.persist.rehydrate();

    const plan = useMatchPlansStore.getState().plansByKinkId.k1;
    expect(plan).toMatchObject({ favorite: true, note: 'note' });

    await AsyncStorage.removeItem('match-plans');
  });

  it('builds neutral proposal text without private details', () => {
    const text = buildProposalText('Massage');
    expect(text).toContain('Massage');
    expect(text).toContain('talk through');
  });
});
