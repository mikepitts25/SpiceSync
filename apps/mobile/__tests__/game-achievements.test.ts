import {
  ACHIEVEMENTS,
  TRACKED_GAME_MODES,
  useStreakStore,
} from '../lib/achievements';

const INITIAL = {
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
};

beforeEach(() => {
  useStreakStore.setState(INITIAL);
});

describe('game achievement definitions', () => {
  it('defines an achievement for every game tracking signal', () => {
    const gameIds = ACHIEVEMENTS.filter((a) => a.category === 'game').map(
      (a) => a.id
    );
    expect(gameIds).toEqual([
      'first_game',
      'dice_roller',
      'mission_complete',
      'mind_reader',
      'game_explorer',
    ]);
  });

  it('has unique ids and no empty copy', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const achievement of ACHIEVEMENTS) {
      expect(achievement.title.trim().length).toBeGreaterThan(0);
      expect(achievement.description.trim().length).toBeGreaterThan(0);
      expect(achievement.icon.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('recordGamePlayed', () => {
  it('unlocks first_game on the first mode played', () => {
    useStreakStore.getState().recordGamePlayed('couple-dice');
    expect(useStreakStore.getState().unlockedAchievements).toContain(
      'first_game'
    );
  });

  it('does not double-count the same mode', () => {
    const { recordGamePlayed } = useStreakStore.getState();
    recordGamePlayed('couple-dice');
    recordGamePlayed('couple-dice');
    recordGamePlayed('couple-dice');
    expect(useStreakStore.getState().gameModesPlayed).toEqual(['couple-dice']);
  });

  it('unlocks game_explorer only after all four modes are played', () => {
    const { recordGamePlayed } = useStreakStore.getState();
    for (const mode of TRACKED_GAME_MODES.slice(0, 3)) {
      recordGamePlayed(mode);
    }
    expect(useStreakStore.getState().unlockedAchievements).not.toContain(
      'game_explorer'
    );

    recordGamePlayed(TRACKED_GAME_MODES[3]);
    expect(useStreakStore.getState().unlockedAchievements).toContain(
      'game_explorer'
    );
  });
});

describe('recordDiceRoll', () => {
  it('unlocks dice_roller at exactly 10 rolls, not before', () => {
    const { recordDiceRoll } = useStreakStore.getState();
    for (let i = 0; i < 9; i += 1) recordDiceRoll();
    expect(useStreakStore.getState().unlockedAchievements).not.toContain(
      'dice_roller'
    );

    recordDiceRoll();
    expect(useStreakStore.getState().unlockedAchievements).toContain(
      'dice_roller'
    );
  });

  it('reports fractional progress before unlocking', () => {
    const { recordDiceRoll, getProgress } = useStreakStore.getState();
    for (let i = 0; i < 5; i += 1) recordDiceRoll();
    expect(getProgress('dice_roller')).toBeCloseTo(0.5);
  });
});

describe('recordMissionCompleted', () => {
  it('unlocks mission_complete on the first completion', () => {
    useStreakStore.getState().recordMissionCompleted();
    expect(useStreakStore.getState().unlockedAchievements).toContain(
      'mission_complete'
    );
  });
});

describe('recordKnowMeBetterMatches', () => {
  it('accumulates across sessions and unlocks at 10', () => {
    const { recordKnowMeBetterMatches } = useStreakStore.getState();
    recordKnowMeBetterMatches(4);
    recordKnowMeBetterMatches(3);
    expect(useStreakStore.getState().unlockedAchievements).not.toContain(
      'mind_reader'
    );

    recordKnowMeBetterMatches(3);
    expect(useStreakStore.getState().knowMeBetterMatches).toBe(10);
    expect(useStreakStore.getState().unlockedAchievements).toContain(
      'mind_reader'
    );
  });

  it('ignores a zero-match session', () => {
    useStreakStore.getState().recordKnowMeBetterMatches(0);
    expect(useStreakStore.getState().knowMeBetterMatches).toBe(0);
  });
});

describe('achievement stability', () => {
  it('never unlocks the same achievement twice', () => {
    const { recordMissionCompleted } = useStreakStore.getState();
    recordMissionCompleted();
    recordMissionCompleted();
    recordMissionCompleted();
    const unlocked = useStreakStore
      .getState()
      .unlockedAchievements.filter((id) => id === 'mission_complete');
    expect(unlocked).toHaveLength(1);
  });

  it('caps progress at 1 once the requirement is exceeded', () => {
    const { recordDiceRoll, getProgress } = useStreakStore.getState();
    for (let i = 0; i < 25; i += 1) recordDiceRoll();
    expect(getProgress('dice_roller')).toBe(1);
  });

  it('leaves unrelated achievements locked', () => {
    useStreakStore.getState().recordDiceRoll();
    const unlocked = useStreakStore.getState().unlockedAchievements;
    expect(unlocked).not.toContain('mind_reader');
    expect(unlocked).not.toContain('mission_complete');
    expect(unlocked).not.toContain('streak_3');
  });
});

describe('persisted state migration', () => {
  // Users who installed before game tracking existed have persisted state
  // with none of the game fields. Rehydrating must not produce undefined
  // counters, which would throw on .length / arithmetic.
  it('survives state saved before the game fields existed', () => {
    useStreakStore.setState({
      currentStreak: 4,
      longestStreak: 4,
      lastActiveDate: '2026-07-01',
      daysActive: ['2026-07-01'],
      activitiesCompleted: [],
      categoriesCompleted: {},
      matchCount: 2,
      unlockedAchievements: ['streak_3'],
      gameModesPlayed: undefined as never,
      diceRollCount: undefined as never,
      missionsCompleted: undefined as never,
      knowMeBetterMatches: undefined as never,
    });

    expect(() => useStreakStore.getState().checkAchievements()).not.toThrow();
  });
});
