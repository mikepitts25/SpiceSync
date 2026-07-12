import {
  DEFAULT_GAME_PLAYER_NAMES,
  MAX_GAME_PLAYERS,
  MIN_GAME_PLAYERS,
  advanceGameTurnIndex,
  buildGameConsequence,
  buildGameShareMessage,
  buildDrinkConsequence,
  resolveGameRoundOutcome,
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

  it('keeps two-player turns paired with the only other player', () => {
    const players = ['Alex', 'Jordan'];

    expect(
      Array.from({ length: 4 }, (_, index) => getGameTurn(players, index))
    ).toEqual([
      { player: 'Alex', target: 'Jordan', turnNumber: 1 },
      { player: 'Jordan', target: 'Alex', turnNumber: 2 },
      { player: 'Alex', target: 'Jordan', turnNumber: 1 },
      { player: 'Jordan', target: 'Alex', turnNumber: 2 },
    ]);
  });

  it('rotates every three-player actor through both possible targets', () => {
    const players = ['Alex', 'Jordan', 'Casey'];

    expect(
      Array.from({ length: 6 }, (_, index) => getGameTurn(players, index))
    ).toEqual([
      { player: 'Alex', target: 'Jordan', turnNumber: 1 },
      { player: 'Jordan', target: 'Casey', turnNumber: 2 },
      { player: 'Casey', target: 'Alex', turnNumber: 3 },
      { player: 'Alex', target: 'Casey', turnNumber: 1 },
      { player: 'Jordan', target: 'Alex', turnNumber: 2 },
      { player: 'Casey', target: 'Jordan', turnNumber: 3 },
    ]);
  });

  it('rotates every four-player actor through all three possible targets', () => {
    const players = ['Alex', 'Jordan', 'Casey', 'Taylor'];
    const turns = Array.from({ length: 12 }, (_, index) =>
      getGameTurn(players, index)
    );

    for (const player of players) {
      expect(
        new Set(
          turns
            .filter((turn) => turn.player === player)
            .map((turn) => turn.target)
        )
      ).toEqual(new Set(players.filter((candidate) => candidate !== player)));
    }
  });

  it('advances a monotonic turn counter while player positions wrap', () => {
    expect(advanceGameTurnIndex(0, 4)).toBe(1);
    expect(advanceGameTurnIndex(3, 4)).toBe(4);
    expect(advanceGameTurnIndex(7, 4)).toBe(8);
    expect(
      getGameTurn(['Alex', 'Jordan', 'Casey', 'Taylor'], 4).turnNumber
    ).toBe(1);
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

  it('completes a revealed card by advancing to the next player without an acknowledgement', () => {
    const outcome = resolveGameRoundOutcome({
      turnIndex: 0,
      playerCount: 2,
      turn: { player: 'Alex', target: 'Jordan', turnNumber: 1 },
      passed: false,
      drinkingMode: false,
    });

    expect(outcome).toEqual({
      nextTurnIndex: 1,
      consequence: null,
      requiresAcknowledgement: false,
    });
  });

  it('requires acknowledgement before continuing after a pass or risk', () => {
    const outcome = resolveGameRoundOutcome({
      turnIndex: 0,
      playerCount: 2,
      turn: { player: 'Alex', target: 'Jordan', turnNumber: 1 },
      passed: true,
      drinkingMode: false,
      random: () => 0,
    });

    expect(outcome).toEqual({
      nextTurnIndex: 1,
      consequence: {
        id: 'no-passes',
        text: 'Alex cannot pass for the next 2 turns.',
        includesDrink: false,
      },
      requiresAcknowledgement: true,
    });
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
