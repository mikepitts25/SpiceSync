import { FREE_CARDS } from '../data/gameCards';
import { filterCardsBySelectedLevels } from '../lib/gameLevelFilter';

describe('game mode card pools', () => {
  it('keeps both free game modes stocked with enough cards', () => {
    const normalCards = filterCardsBySelectedLevels(FREE_CARDS, [1, 2, 3]);
    const intenseCards = filterCardsBySelectedLevels(FREE_CARDS, [4, 5]);

    expect(normalCards.length).toBeGreaterThanOrEqual(40);
    expect(intenseCards.length).toBeGreaterThanOrEqual(40);
  });
});
