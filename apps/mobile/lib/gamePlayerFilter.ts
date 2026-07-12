import type { GameCard } from '../data/gameCards';

// Most of the catalog is written couple-to-couple ("Undress me…"), but the
// turn engine deals cards to ANY player→target pair — including two guests
// at a 4-player night. Unflagged cards therefore fall back to a category
// heuristic: flirty/party categories carry group games, while intimate and
// physical cards stay couple-only. Explicit minPlayers/maxPlayers flags on a
// card always win over the heuristic.
const DEFAULT_GROUP_SAFE_CATEGORIES: ReadonlySet<GameCard['category']> =
  new Set(['communication', 'emotional', 'playful']);

export const GROUP_PLAYER_THRESHOLD = 3;

export function isCardAllowedForPlayerCount(
  card: GameCard,
  playerCount: number
): boolean {
  const minPlayers = card.minPlayers ?? 1;
  if (playerCount < minPlayers) return false;

  if (card.maxPlayers !== undefined) {
    return playerCount <= card.maxPlayers;
  }

  if (playerCount >= GROUP_PLAYER_THRESHOLD) {
    return DEFAULT_GROUP_SAFE_CATEGORIES.has(card.category);
  }

  return true;
}

export function filterCardsByPlayerCount(
  cards: readonly GameCard[],
  playerCount: number
): GameCard[] {
  return cards.filter((card) => isCardAllowedForPlayerCount(card, playerCount));
}
