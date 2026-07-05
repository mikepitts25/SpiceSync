import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  effectiveReadiness,
  makeReadinessRecord,
  makeVoteRecord,
  normalizeVoteRecord,
  readinessToVote,
  voteToReadiness,
} from '../lib/votes/rolePreferences';
import { useVotesStore } from '../src/stores/votes';

beforeEach(() => {
  useVotesStore.setState({ votesByProfile: {} });
});

describe('readiness mapping', () => {
  it('projects every readiness onto a legacy vote value', () => {
    expect(readinessToVote('yes')).toBe('yes');
    expect(readinessToVote('curious')).toBe('maybe');
    expect(readinessToVote('not_now')).toBe('no');
    expect(readinessToVote('hard_no')).toBe('no');
  });

  it('maps legacy votes conservatively: plain no stays private', () => {
    expect(voteToReadiness('yes')).toBe('yes');
    expect(voteToReadiness('maybe')).toBe('curious');
    expect(voteToReadiness('no')).toBeUndefined();
  });

  it('derives effective readiness from legacy votes without readiness', () => {
    expect(effectiveReadiness('yes')).toBe('yes');
    expect(effectiveReadiness({ value: 'maybe' })).toBe('curious');
    expect(effectiveReadiness('no')).toBeUndefined();
    expect(effectiveReadiness(undefined)).toBeUndefined();
  });

  it('prefers explicit readiness over the derived one', () => {
    expect(effectiveReadiness({ value: 'no', readiness: 'not_now' })).toBe(
      'not_now'
    );
    expect(effectiveReadiness({ value: 'no', readiness: 'hard_no' })).toBe(
      'hard_no'
    );
  });
});

describe('readiness normalization', () => {
  it('keeps readiness consistent with the vote projection', () => {
    expect(normalizeVoteRecord({ value: 'no', readiness: 'not_now' })).toEqual({
      value: 'no',
      readiness: 'not_now',
      pairPreference: undefined,
    });
  });

  it('drops corrupt readiness that disagrees with the vote value', () => {
    expect(
      normalizeVoteRecord({ value: 'yes', readiness: 'hard_no' })?.readiness
    ).toBeUndefined();
    expect(
      normalizeVoteRecord({ value: 'maybe', readiness: 'nonsense' })?.readiness
    ).toBeUndefined();
  });

  it('normalizes legacy shapes untouched (string and object)', () => {
    expect(normalizeVoteRecord('yes')).toEqual({ value: 'yes' });
    expect(
      normalizeVoteRecord({ value: 'yes', pairPreference: 'give' })
    ).toEqual({
      value: 'yes',
      pairPreference: 'give',
      readiness: undefined,
    });
  });

  it('makeVoteRecord keeps plain values compact and readiness records rich', () => {
    expect(makeVoteRecord('yes')).toBe('yes');
    expect(makeReadinessRecord('not_now')).toEqual({
      value: 'no',
      pairPreference: undefined,
      readiness: 'not_now',
    });
    expect(makeReadinessRecord('curious', 'give')).toEqual({
      value: 'maybe',
      pairPreference: 'give',
      readiness: 'curious',
    });
  });
});

describe('votes store readiness', () => {
  it('setReadiness stores the projected legacy value alongside readiness', () => {
    useVotesStore.getState().setReadiness('p1', 'k1', 'not_now');

    expect(useVotesStore.getState().getVote('p1', 'k1')).toBe('no');
    expect(useVotesStore.getState().getReadiness('p1', 'k1')).toBe('not_now');
  });

  it('legacy setVote leaves readiness derived, not persisted', () => {
    useVotesStore.getState().setVote('p1', 'k1', 'maybe');

    expect(
      useVotesStore.getState().getVoteRecord('p1', 'k1')?.readiness
    ).toBeUndefined();
    expect(useVotesStore.getState().getReadiness('p1', 'k1')).toBe('curious');
  });

  it('a fresh plain vote resets any previous readiness refinement', () => {
    const store = useVotesStore.getState();
    store.setReadiness('p1', 'k1', 'not_now');
    store.setVote('p1', 'k1', 'yes');

    expect(useVotesStore.getState().getReadiness('p1', 'k1')).toBe('yes');
    expect(
      useVotesStore.getState().getVoteRecord('p1', 'k1')?.readiness
    ).toBeUndefined();
  });
});

describe('votes store migration', () => {
  it('rehydrates legacy v3 payloads and preserves readiness records', async () => {
    await AsyncStorage.setItem(
      'votes',
      JSON.stringify({
        state: {
          votesByProfile: {
            p1: {
              'legacy-string': 'yes',
              'legacy-object': { value: 'yes', pairPreference: 'give' },
              'legacy-no': 'no',
              'new-readiness': { value: 'no', readiness: 'not_now' },
              'corrupt-readiness': { value: 'yes', readiness: 'hard_no' },
            },
          },
        },
        version: 3,
      })
    );

    await useVotesStore.persist.rehydrate();

    const state = useVotesStore.getState();
    expect(state.getVote('p1', 'legacy-string')).toBe('yes');
    expect(state.getVoteRecord('p1', 'legacy-object')).toEqual({
      value: 'yes',
      pairPreference: 'give',
      readiness: undefined,
    });
    expect(state.getVote('p1', 'legacy-no')).toBe('no');
    expect(state.getReadiness('p1', 'legacy-no')).toBeUndefined();
    expect(state.getReadiness('p1', 'new-readiness')).toBe('not_now');
    expect(state.getReadiness('p1', 'corrupt-readiness')).toBe('yes');

    await AsyncStorage.removeItem('votes');
  });

  it('migrates the oldest byUser shape without losing votes', async () => {
    await AsyncStorage.setItem(
      'votes',
      JSON.stringify({
        state: {
          byUser: {
            p1: { k1: 'maybe' },
          },
        },
        version: 0,
      })
    );

    await useVotesStore.persist.rehydrate();

    expect(useVotesStore.getState().getVote('p1', 'k1')).toBe('maybe');

    await AsyncStorage.removeItem('votes');
  });
});
