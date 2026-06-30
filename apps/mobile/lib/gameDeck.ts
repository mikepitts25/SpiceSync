import type { GameCard } from '../data/gameCards';

type ShuffleOptions = {
  previousOrderIds?: readonly string[];
  avoidFirstCardId?: string | null;
  random?: () => number;
};

const idsFor = (cards: readonly GameCard[]) => cards.map((card) => card.id);

const hasSameOrder = (
  cards: readonly GameCard[],
  previousOrderIds: readonly string[]
) => {
  const ids = idsFor(cards);
  return (
    ids.length === previousOrderIds.length &&
    ids.every((id, index) => id === previousOrderIds[index])
  );
};

const rotateFirstCardAway = (
  cards: GameCard[],
  avoidFirstCardId: string | null | undefined
) => {
  if (
    !avoidFirstCardId ||
    cards.length <= 1 ||
    cards[0]?.id !== avoidFirstCardId
  ) {
    return cards;
  }

  const replacementIndex = cards.findIndex(
    (card) => card.id !== avoidFirstCardId
  );
  if (replacementIndex <= 0) {
    return cards;
  }

  const [replacement] = cards.splice(replacementIndex, 1);
  cards.unshift(replacement);
  return cards;
};

export function createShuffledGameDeck(
  cards: readonly GameCard[],
  {
    previousOrderIds = [],
    avoidFirstCardId = null,
    random = Math.random,
  }: ShuffleOptions = {}
) {
  const deck = [...cards];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  if (deck.length > 1 && hasSameOrder(deck, previousOrderIds)) {
    deck.push(deck.shift() as GameCard);
  }

  return rotateFirstCardAway(deck, avoidFirstCardId);
}

export function appendCustomGameCards(
  cards: readonly GameCard[],
  customCards: readonly GameCard[]
): GameCard[] {
  const seen = new Set(cards.map((card) => card.id));
  return [
    ...cards,
    ...customCards.filter((card) => {
      if (seen.has(card.id)) return false;
      seen.add(card.id);
      return true;
    }),
  ];
}
