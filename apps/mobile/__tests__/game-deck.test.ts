import type { GameCard } from '../data/gameCards';
import {
  createShuffledGameDeck,
  selectGameCardsForCustomMode,
} from '../lib/gameDeck';

const card = (id: string): GameCard => ({
  id,
  type: 'truth',
  content: id,
  intensity: 2,
  category: 'playful',
  isPremium: false,
  estimatedTime: 'N/A',
});

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
