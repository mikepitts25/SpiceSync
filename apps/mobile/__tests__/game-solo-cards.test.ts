import { SOLO_CARDS, getSoloGameCards } from '../data/game_cards_solo';
import { hasGameCardSpanishTranslation } from '../data/gameCardTranslations';
import { filterCardsBySelectedLevels } from '../lib/gameLevelFilter';

const ALLOWED_TIMES = new Set(['N/A', '10 sec', '30 sec', '1 min']);

describe('solo game cards', () => {
  it('uses unique solo-prefixed ids', () => {
    const ids = SOLO_CARDS.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('solo-'))).toBe(true);
  });

  it('keeps discussion prompts untimed and actions quick', () => {
    for (const card of SOLO_CARDS) {
      expect(ALLOWED_TIMES.has(card.estimatedTime)).toBe(true);
      if (card.type === 'truth' || card.type === 'fantasy') {
        expect(card.estimatedTime).toBe('N/A');
      }
    }
  });

  it('stocks both normal and intense modes', () => {
    expect(
      filterCardsBySelectedLevels(SOLO_CARDS, [1, 2, 3]).length
    ).toBeGreaterThanOrEqual(10);
    expect(
      filterCardsBySelectedLevels(SOLO_CARDS, [4, 5]).length
    ).toBeGreaterThanOrEqual(6);
  });

  it('ships every solo card with a Spanish translation', () => {
    for (const card of SOLO_CARDS) {
      expect(hasGameCardSpanishTranslation(card.id)).toBe(true);
    }
  });

  it('offers the full solo pool regardless of premium status', () => {
    expect(getSoloGameCards(false)).toEqual(SOLO_CARDS);
    expect(getSoloGameCards(true)).toEqual(SOLO_CARDS);
  });
});
