import type { GameCard } from '../data/gameCards';

export type GameCustomDeckMode = 'include' | 'customOnly';

type ShuffleOptions = {
  previousOrderIds?: readonly string[];
  avoidFirstCardId?: string | null;
  random?: () => number;
  // Sort the shuffled deck into a warm-up → build → peak ramp instead of a
  // flat shuffle, so intense sessions don't open on a level-5 card cold.
  intensityArc?: boolean;
  // Card categories the couple has shown mutual interest in; matching cards
  // are pulled earlier in the deck.
  favoredCategories?: ReadonlySet<string>;
};

// Jitter keeps the ramp organic: cards can locally trade places, but the
// overall order still climbs from low to high intensity.
const ARC_JITTER = 2.4;
const FAVORED_CATEGORY_BOOST = 0.8;

const applyDealOrderBias = (
  deck: GameCard[],
  intensityArc: boolean,
  favoredCategories: ReadonlySet<string> | undefined,
  random: () => number
): GameCard[] => {
  if (!intensityArc && !favoredCategories?.size) {
    return deck;
  }

  return deck
    .map((card) => ({
      card,
      key:
        (intensityArc ? card.intensity : 0) +
        (random() - 0.5) * ARC_JITTER -
        (favoredCategories?.has(card.category) ? FAVORED_CATEGORY_BOOST : 0),
    }))
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.card);
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
    intensityArc = false,
    favoredCategories,
  }: ShuffleOptions = {}
) {
  let deck = [...cards];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  deck = applyDealOrderBias(deck, intensityArc, favoredCategories, random);

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

export function selectGameCardsForCustomMode(
  cards: readonly GameCard[],
  customCards: readonly GameCard[],
  mode: GameCustomDeckMode
): GameCard[] {
  if (mode === 'customOnly') {
    return [...customCards];
  }

  return appendCustomGameCards(cards, customCards);
}
