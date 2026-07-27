import { GAME_HUB_MODES, getGameHubMode } from '../lib/gameHubModes';

describe('game hub modes', () => {
  it('keeps Spice Deck as the only playable mode', () => {
    expect(GAME_HUB_MODES.map(({ id, available }) => [id, available])).toEqual([
      ['spice-deck', true],
      ['match-missions', false],
      ['know-me-better', false],
      ['couple-dice', false],
    ]);
  });

  it('uses stable game-group routes', () => {
    expect(getGameHubMode('spice-deck').route).toBe('/(game)/spice-deck');
    expect(getGameHubMode('couple-dice').route).toBe('/(game)/couple-dice');
  });
});
