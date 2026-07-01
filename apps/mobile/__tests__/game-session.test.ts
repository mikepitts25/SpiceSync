import {
  DEFAULT_GAME_PLAYER_NAMES,
  MAX_GAME_PLAYERS,
  MIN_GAME_PLAYERS,
  advanceGameTurnIndex,
  buildGameConsequence,
  buildGameShareMessage,
  buildDrinkConsequence,
  getGameTurn,
  normalizeGamePlayerCount,
  normalizeGamePlayers,
} from '../lib/gameSession';

describe('game session helpers', () => {
  it('limits the player count to the supported two-to-four player range', () => {
    expect(MIN_GAME_PLAYERS).toBe(2);
    expect(MAX_GAME_PLAYERS).toBe(4);
    expect(normalizeGamePlayerCount(1)).toBe(2);
    expect(normalizeGamePlayerCount(3)).toBe(3);
    expect(normalizeGamePlayerCount(8)).toBe(4);
  });

  it('normalizes player names and fills missing names with stable defaults', () => {
    expect(normalizeGamePlayers([' Alex ', '', 'Riley'], 3)).toEqual([
      'Alex',
      DEFAULT_GAME_PLAYER_NAMES[1],
      'Riley',
    ]);
  });

  it('assigns the current player and the next player as the target', () => {
    const players = ['Alex', 'Jordan', 'Casey', 'Taylor'];

    expect(getGameTurn(players, 0)).toEqual({
      player: 'Alex',
      target: 'Jordan',
      turnNumber: 1,
    });
    expect(getGameTurn(players, 3)).toEqual({
      player: 'Taylor',
      target: 'Alex',
      turnNumber: 4,
    });
  });

  it('advances turns around the table without exceeding the player list', () => {
    expect(advanceGameTurnIndex(0, 4)).toBe(1);
    expect(advanceGameTurnIndex(3, 4)).toBe(0);
    expect(advanceGameTurnIndex(7, 4)).toBe(0);
  });

  it('builds a clear drinking consequence when a player passes', () => {
    expect(buildDrinkConsequence('Alex')).toBe('Alex takes a drink.');
  });

  it('randomizes non-drinking consequences without requiring the drinking toggle', () => {
    const consequence = buildGameConsequence(
      { player: 'Alex', target: 'Jordan', turnNumber: 1 },
      false,
      () => 0
    );

    expect(consequence).toEqual({
      id: 'no-passes',
      text: 'Alex cannot pass for the next 2 turns.',
      includesDrink: false,
    });
  });

  it('adds drinking outcomes to the consequence pool when drinking mode is enabled', () => {
    const consequence = buildGameConsequence(
      { player: 'Alex', target: 'Jordan', turnNumber: 1 },
      true,
      () => 0.99
    );

    expect(consequence.includesDrink).toBe(true);
    expect(consequence.text).toBe('Alex takes a shot.');
  });

  it('formats shared game prompts with the acting player and target', () => {
    expect(
      buildGameShareMessage(
        'SpiceSync Game Night: {{content}}',
        'Tell a secret.',
        { player: 'Alex', target: 'Jordan', turnNumber: 1 }
      )
    ).toBe('SpiceSync Game Night: Alex → Jordan\nTell a secret.');
  });
});
