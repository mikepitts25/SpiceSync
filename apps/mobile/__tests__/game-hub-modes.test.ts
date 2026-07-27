import { GAME_HUB_MODES, getGameHubMode } from '../lib/gameHubModes';

describe('game hub modes', () => {
  it('enables every implemented game mode', () => {
    expect(GAME_HUB_MODES.map(({ id, available }) => [id, available])).toEqual([
      ['spice-deck', true],
      ['match-missions', true],
      ['know-me-better', true],
      ['couple-dice', true],
    ]);
  });

  it('uses stable game-group routes', () => {
    expect(getGameHubMode('spice-deck').route).toBe('/(game)/spice-deck');
    expect(getGameHubMode('couple-dice').route).toBe('/(game)/couple-dice');
  });
});
