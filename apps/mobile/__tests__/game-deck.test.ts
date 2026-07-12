import type { GameCard } from '../data/gameCards';
import {
  createShuffledGameDeck,
  selectGameCardsForCustomMode,
} from '../lib/gameDeck';

const card = (
  id: string,
  intensity: GameCard['intensity'] = 2,
  category: GameCard['category'] = 'playful'
): GameCard => ({
  id,
  type: 'truth',
  content: id,
  intensity,
  category,
  isPremium: false,
  estimatedTime: 'N/A',
});

const seededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

describe('game deck shuffling', () => {
  const cards = [card('a'), card('b'), card('c'), card('d')];

  it('returns every card exactly once per shuffled deck', () => {
    const deck = createShuffledGameDeck(cards, { random: () => 0.5 });

    expect(deck).toHaveLength(cards.length);
    expect(new Set(deck.map((item) => item.id))).toEqual(
      new Set(cards.map((item) => item.id))
    );
  });

  it('changes the order when a shuffle matches the previous full deck order', () => {
    const deck = createShuffledGameDeck(cards, {
      previousOrderIds: cards.map((item) => item.id),
      random: () => 0.999,
    });

    expect(deck.map((item) => item.id)).not.toEqual(
      cards.map((item) => item.id)
    );
  });

  it('avoids making the first card match the last seen card when possible', () => {
    const deck = createShuffledGameDeck(cards, {
      avoidFirstCardId: 'd',
      random: () => 0.999,
    });

    expect(deck[0].id).not.toBe('d');
    expect(new Set(deck.map((item) => item.id))).toEqual(
      new Set(cards.map((item) => item.id))
    );
  });

  it('sorts the deck into a non-decreasing intensity ramp without jitter', () => {
    const ramped = [
      card('i5', 5),
      card('i1', 1),
      card('i4', 4),
      card('i2', 2),
      card('i3', 3),
    ];
    const deck = createShuffledGameDeck(ramped, {
      random: () => 0.5,
      intensityArc: true,
    });

    const intensities = deck.map((item) => item.intensity);
    expect([...intensities].sort((a, b) => a - b)).toEqual(intensities);
    expect(deck).toHaveLength(ramped.length);
  });

  it('biases the intensity arc so early cards run cooler than late cards', () => {
    const bigDeck = Array.from({ length: 60 }, (_, index) =>
      card(`c${index}`, ((index % 5) + 1) as GameCard['intensity'])
    );
    const deck = createShuffledGameDeck(bigDeck, {
      random: seededRandom(7),
      intensityArc: true,
    });

    const third = Math.floor(deck.length / 3);
    const average = (cards: GameCard[]) =>
      cards.reduce((sum, item) => sum + item.intensity, 0) / cards.length;

    expect(average(deck.slice(0, third))).toBeLessThan(
      average(deck.slice(-third))
    );
    expect(new Set(deck.map((item) => item.id)).size).toBe(bigDeck.length);
  });

  it('pulls favored-category cards earlier in the deal', () => {
    const mixed = [
      card('p1', 3, 'playful'),
      card('m1', 3, 'intimate'),
      card('p2', 3, 'playful'),
      card('m2', 3, 'intimate'),
      card('p3', 3, 'playful'),
      card('m3', 3, 'intimate'),
    ];
    const deck = createShuffledGameDeck(mixed, {
      random: () => 0.5,
      favoredCategories: new Set(['intimate']),
    });

    expect(deck.slice(0, 3).every((item) => item.category === 'intimate')).toBe(
      true
    );
  });

  it('can include custom cards or play custom cards only', () => {
    const customCards = [card('custom-a'), card('custom-b')];

    expect(
      selectGameCardsForCustomMode(cards, customCards, 'include').map(
        (item) => item.id
      )
    ).toEqual(['a', 'b', 'c', 'd', 'custom-a', 'custom-b']);
    expect(
      selectGameCardsForCustomMode(cards, customCards, 'customOnly').map(
        (item) => item.id
      )
    ).toEqual(['custom-a', 'custom-b']);
  });
});
