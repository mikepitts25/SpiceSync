import type { GameCard } from '../data/gameCards';
import {
  MATCH_INSPIRED_ID_PREFIX,
  computeMutualYesKinks,
  createMatchInspiredCards,
  getFavoredCardCategories,
  interleaveMatchInspiredCards,
  isMatchInspiredCard,
  type MatchSourceKink,
} from '../lib/gameMatchDeck';

const kink = (
  id: string,
  category = 'sensory',
  title = `Kink ${id}`
): MatchSourceKink => ({ id, title, category });

const card = (id: string): GameCard => ({
  id,
  type: 'truth',
  content: id,
  intensity: 2,
  category: 'playful',
  isPremium: false,
  estimatedTime: 'N/A',
});

describe('computeMutualYesKinks', () => {
  const kinks = [kink('a'), kink('b'), kink('c'), kink('d')];

  it('keeps only kinks both partners voted yes on', () => {
    const result = computeMutualYesKinks(
      kinks,
      { a: 'yes', b: 'yes', c: 'maybe', d: 'yes' },
      { a: 'yes', b: 'maybe', c: 'yes', d: 'no' }
    );
    expect(result.map((item) => item.id)).toEqual(['a']);
  });

  it('drops role-incompatible pairs even when both said yes', () => {
    const result = computeMutualYesKinks(
      kinks,
      {
        a: { value: 'yes', pairPreference: 'give' },
        b: { value: 'yes', pairPreference: 'give' },
      },
      {
        a: { value: 'yes', pairPreference: 'receive' },
        b: { value: 'yes', pairPreference: 'give' },
      }
    );
    expect(result.map((item) => item.id)).toEqual(['a']);
  });

  it('never surfaces hard-no or not-now readiness as a match', () => {
    const result = computeMutualYesKinks(
      kinks,
      {
        a: { value: 'yes', readiness: 'yes' },
        b: { value: 'yes', readiness: 'yes' },
      },
      {
        a: { value: 'no', readiness: 'hard_no' },
        b: { value: 'no', readiness: 'not_now' },
      }
    );
    expect(result).toEqual([]);
  });

  it('returns nothing when either side has no votes', () => {
    expect(computeMutualYesKinks(kinks, { a: 'yes' }, undefined)).toEqual([]);
    expect(computeMutualYesKinks(kinks, undefined, { a: 'yes' })).toEqual([]);
  });
});

describe('getFavoredCardCategories', () => {
  it('maps kink categories onto game card categories', () => {
    const favored = getFavoredCardCategories([
      kink('a', 'sensory'),
      kink('b', 'aftercare'),
    ]);
    expect(favored).toEqual(new Set(['physical', 'intimate', 'emotional']));
  });

  it('ignores unknown or missing kink categories', () => {
    expect(getFavoredCardCategories([kink('a', 'mystery')])).toEqual(new Set());
    expect(getFavoredCardCategories([{ id: 'a', title: 'A' }])).toEqual(
      new Set()
    );
  });
});

describe('createMatchInspiredCards', () => {
  const matches = [
    kink('a', 'sensory', 'Blindfolds'),
    kink('b', 'communication', 'Fantasy sharing'),
    kink('c', 'roleplay', 'Strangers scene'),
    kink('d', 'sensory', 'Ice play'),
  ];

  it('caps the number of cards and references match titles', () => {
    const cards = createMatchInspiredCards(matches, {
      maxCards: 2,
      random: () => 0.5,
    });

    expect(cards).toHaveLength(2);
    for (const inspired of cards) {
      expect(isMatchInspiredCard(inspired)).toBe(true);
      expect(inspired.content).toContain('Inspired by your matches');
      const source = matches.find(
        (match) => `${MATCH_INSPIRED_ID_PREFIX}${match.id}` === inspired.id
      );
      expect(source).toBeDefined();
      expect(inspired.content).toContain(source!.title);
    }
  });

  it('writes Spanish content when asked', () => {
    const cards = createMatchInspiredCards(matches, {
      language: 'es',
      maxCards: 1,
      random: () => 0.5,
    });
    expect(cards[0].content).toContain('Inspirado en sus matches');
  });

  it('uses the requested intensity and returns nothing without matches', () => {
    const cards = createMatchInspiredCards(matches, {
      maxCards: 1,
      intensity: 4,
      random: () => 0.5,
    });
    expect(cards[0].intensity).toBe(4);
    expect(createMatchInspiredCards([], { maxCards: 3 })).toEqual([]);
  });
});

describe('interleaveMatchInspiredCards', () => {
  it('spreads inspired cards through the deck without leading with one', () => {
    const deck = Array.from({ length: 12 }, (_, index) => card(`c${index}`));
    const inspired = createMatchInspiredCards(
      [kink('a'), kink('b'), kink('c')],
      { random: () => 0.5 }
    );

    const combined = interleaveMatchInspiredCards(deck, inspired, () => 0.5);

    expect(combined).toHaveLength(deck.length + inspired.length);
    expect(isMatchInspiredCard(combined[0])).toBe(false);
    for (const inspiredCard of inspired) {
      expect(combined.some((item) => item.id === inspiredCard.id)).toBe(true);
    }
  });

  it('passes the deck through untouched when there are no inspired cards', () => {
    const deck = [card('x'), card('y')];
    expect(interleaveMatchInspiredCards(deck, [])).toEqual(deck);
  });
});
