import {
  filterCardsBySelectedLevels,
  normalizeGameIntensityLevels,
} from '../lib/gameLevelFilter';
import { type GameCard } from '../data/gameCards';

const makeCard = (id: string, intensity: GameCard['intensity']): GameCard => ({
  id,
  intensity,
  type: 'truth',
  content: `Level ${intensity}`,
  category: 'playful',
  isPremium: false,
  estimatedTime: 'N/A',
});

describe('game level filtering', () => {
  const cards = [
    makeCard('level-1', 1),
    makeCard('level-2', 2),
    makeCard('level-3', 3),
    makeCard('level-4', 4),
    makeCard('level-5', 5),
  ];

  it('only includes explicitly selected intensity levels', () => {
    expect(
      filterCardsBySelectedLevels(cards, [5]).map((card) => card.id)
    ).toEqual(['level-5']);

    expect(
      filterCardsBySelectedLevels(cards, [2, 5]).map((card) => card.id)
    ).toEqual(['level-2', 'level-5']);
  });

  it('parses legacy route params as explicit selected levels', () => {
    expect(normalizeGameIntensityLevels('5')).toEqual([5]);
    expect(normalizeGameIntensityLevels('2,5')).toEqual([2, 5]);
  });
});
