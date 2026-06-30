import {
  DEFAULT_GAME_PLAYER_NAMES,
  MAX_GAME_PLAYERS,
  MIN_GAME_PLAYERS,
  advanceGameTurnIndex,
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
});
