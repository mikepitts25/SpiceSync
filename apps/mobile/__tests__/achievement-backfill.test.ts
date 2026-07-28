import {
  BACKFILL_VERSION,
  computeBackfill,
  shouldRunBackfill,
} from '../lib/achievementBackfill';
import { useStreakStore } from '../lib/achievements';

const EMPTY_COUNTERS = {
  gameModesPlayed: [],
  diceRollCount: 0,
  missionsCompleted: 0,
  matchCount: 0,
};

const NO_HISTORY = {
  savedDiceRolls: 0,
  completedMissions: 0,
  completedActivities: 0,
  matchCount: 0,
};

describe('shouldRunBackfill', () => {
  it('runs for a user who has never been backfilled', () => {
    expect(shouldRunBackfill(undefined)).toBe(true);
    expect(shouldRunBackfill(0)).toBe(true);
  });

  it('does not run again at the current version', () => {
    expect(shouldRunBackfill(BACKFILL_VERSION)).toBe(false);
  });
});

describe('computeBackfill', () => {
  it('credits saved dice rolls and infers the mode was played', () => {
    const result = computeBackfill(
      { ...NO_HISTORY, savedDiceRolls: 12 },
      EMPTY_COUNTERS
    );
    expect(result.diceRollCount).toBe(12);
    expect(result.gameModesPlayed).toContain('couple-dice');
  });

  it('credits completed missions and infers the mode was played', () => {
    const result = computeBackfill(
      { ...NO_HISTORY, completedMissions: 3 },
      EMPTY_COUNTERS
    );
    expect(result.missionsCompleted).toBe(3);
    expect(result.gameModesPlayed).toContain('match-missions');
  });

  it('never demotes a counter that is already higher', () => {
    const result = computeBackfill(
      { ...NO_HISTORY, savedDiceRolls: 2, completedMissions: 1 },
      {
        gameModesPlayed: ['spice-deck'],
        diceRollCount: 40,
        missionsCompleted: 9,
        matchCount: 5,
      }
    );
    expect(result.diceRollCount).toBe(40);
    expect(result.missionsCompleted).toBe(9);
    expect(result.matchCount).toBe(5);
  });

  it('preserves modes already recorded', () => {
    const result = computeBackfill(
      { ...NO_HISTORY, savedDiceRolls: 1 },
      { ...EMPTY_COUNTERS, gameModesPlayed: ['spice-deck', 'know-me-better'] }
    );
    expect(result.gameModesPlayed).toEqual(
      expect.arrayContaining(['spice-deck', 'know-me-better', 'couple-dice'])
    );
  });

  it('does not duplicate a mode already present', () => {
    const result = computeBackfill(
      { ...NO_HISTORY, savedDiceRolls: 5 },
      { ...EMPTY_COUNTERS, gameModesPlayed: ['couple-dice'] }
    );
    expect(
      result.gameModesPlayed.filter((mode) => mode === 'couple-dice')
    ).toHaveLength(1);
  });

  it('credits nothing for a user with no history', () => {
    expect(computeBackfill(NO_HISTORY, EMPTY_COUNTERS)).toEqual(EMPTY_COUNTERS);
  });

  it('tolerates counters missing from legacy persisted state', () => {
    const result = computeBackfill({ ...NO_HISTORY, savedDiceRolls: 4 }, {
      gameModesPlayed: undefined,
      diceRollCount: undefined,
      missionsCompleted: undefined,
      matchCount: undefined,
    } as never);
    expect(result.diceRollCount).toBe(4);
    expect(result.gameModesPlayed).toEqual(['couple-dice']);
  });
});

describe('applyBackfill', () => {
  beforeEach(() => {
    useStreakStore.setState({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      daysActive: [],
      activitiesCompleted: [],
      categoriesCompleted: {},
      matchCount: 0,
      gameModesPlayed: [],
      diceRollCount: 0,
      missionsCompleted: 0,
      knowMeBetterMatches: 0,
      unlockedAchievements: [],
      backfillVersion: 0,
    });
  });

  it('unlocks achievements earned by past play', () => {
    const applied = useStreakStore.getState().applyBackfill({
      ...NO_HISTORY,
      savedDiceRolls: 10,
      completedMissions: 1,
    });

    expect(applied).toBe(true);
    const unlocked = useStreakStore.getState().unlockedAchievements;
    expect(unlocked).toContain('dice_roller');
    expect(unlocked).toContain('mission_complete');
    expect(unlocked).toContain('first_game');
  });

  it('is a one-shot: a second call credits nothing further', () => {
    const store = useStreakStore.getState();
    expect(store.applyBackfill({ ...NO_HISTORY, savedDiceRolls: 6 })).toBe(true);
    expect(useStreakStore.getState().diceRollCount).toBe(6);

    // A second run with richer history must not apply — the version stamp
    // is what prevents repeated credit on every app launch.
    expect(
      useStreakStore.getState().applyBackfill({
        ...NO_HISTORY,
        savedDiceRolls: 999,
      })
    ).toBe(false);
    expect(useStreakStore.getState().diceRollCount).toBe(6);
  });

  it('stamps the version even when there is nothing to credit', () => {
    expect(useStreakStore.getState().applyBackfill(NO_HISTORY)).toBe(true);
    expect(useStreakStore.getState().backfillVersion).toBe(BACKFILL_VERSION);
    expect(useStreakStore.getState().applyBackfill(NO_HISTORY)).toBe(false);
  });

  it('does not overwrite progress made since tracking began', () => {
    useStreakStore.setState({
      diceRollCount: 25,
      gameModesPlayed: ['spice-deck'],
    });

    useStreakStore.getState().applyBackfill({
      ...NO_HISTORY,
      savedDiceRolls: 3,
    });

    expect(useStreakStore.getState().diceRollCount).toBe(25);
    expect(useStreakStore.getState().gameModesPlayed).toEqual(
      expect.arrayContaining(['spice-deck', 'couple-dice'])
    );
  });
});
