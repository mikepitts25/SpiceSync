import type { GameCard } from '../data/gameCards';
import { GROUP_CARDS } from '../data/game_cards_group';
import { hasGameCardSpanishTranslation } from '../data/gameCardTranslations';
import {
  filterCardsByPlayerCount,
  isCardAllowedForPlayerCount,
} from '../lib/gamePlayerFilter';
import { filterCardsBySelectedLevels } from '../lib/gameLevelFilter';

const card = (
  id: string,
  category: GameCard['category'],
  flags: Partial<Pick<GameCard, 'minPlayers' | 'maxPlayers'>> = {}
): GameCard => ({
  id,
  type: 'dare',
  content: id,
  intensity: 3,
  category,
  isPremium: false,
  estimatedTime: '30 sec',
  ...flags,
});

describe('filterCardsByPlayerCount', () => {
  const intimate = card('intimate', 'intimate');
  const physical = card('physical', 'physical');
  const playful = card('playful', 'playful');
  const communication = card('communication', 'communication');
  const emotional = card('emotional', 'emotional');
  const groupOnly = card('group-only', 'playful', { minPlayers: 3 });
  const coupleFlagged = card('couple-flagged', 'playful', { maxPlayers: 2 });
  const intimateGroupSafe = card('intimate-group-ok', 'intimate', {
    maxPlayers: 4,
  });
  const pool = [
    intimate,
    physical,
    playful,
    communication,
    emotional,
    groupOnly,
    coupleFlagged,
    intimateGroupSafe,
  ];

  it('keeps every couple card and hides group-only cards for two players', () => {
    expect(filterCardsByPlayerCount(pool, 2).map((item) => item.id)).toEqual([
      'intimate',
      'physical',
      'playful',
      'communication',
      'emotional',
      'couple-flagged',
      'intimate-group-ok',
    ]);
  });

  it('drops unflagged couple intimacy for group games via the category heuristic', () => {
    expect(filterCardsByPlayerCount(pool, 4).map((item) => item.id)).toEqual([
      'playful',
      'communication',
      'emotional',
      'group-only',
      'intimate-group-ok',
    ]);
  });

  it('lets explicit flags override the heuristic in both directions', () => {
    expect(isCardAllowedForPlayerCount(coupleFlagged, 3)).toBe(false);
    expect(isCardAllowedForPlayerCount(intimateGroupSafe, 4)).toBe(true);
    expect(isCardAllowedForPlayerCount(groupOnly, 2)).toBe(false);
  });
});

describe('group card pool', () => {
  it('marks every group card as 3+ players with a unique grp id', () => {
    const ids = GROUP_CARDS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const groupCard of GROUP_CARDS) {
      expect(groupCard.id.startsWith('grp-')).toBe(true);
      expect(groupCard.minPlayers).toBe(3);
    }
  });

  it('stocks both normal and intense group games', () => {
    expect(
      filterCardsBySelectedLevels(GROUP_CARDS, [1, 2, 3]).length
    ).toBeGreaterThanOrEqual(7);
    expect(
      filterCardsBySelectedLevels(GROUP_CARDS, [4, 5]).length
    ).toBeGreaterThanOrEqual(4);
  });

  it('ships every group card with a Spanish translation', () => {
    for (const groupCard of GROUP_CARDS) {
      expect(hasGameCardSpanishTranslation(groupCard.id)).toBe(true);
    }
  });
});
