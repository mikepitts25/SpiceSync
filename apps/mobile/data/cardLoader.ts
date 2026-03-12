// Card loader - loads cards from JSON file
// This allows editing cards in game_cards.json without touching TypeScript

import { GameCard, GameCardType } from './gameCards';

// Import the JSON file
import cardData from './game_cards.json';

// Export all cards from JSON
export const ALL_CARDS_FROM_JSON: GameCard[] = cardData.cards;

// Filter by level
export const FREE_CARDS_JSON = ALL_CARDS_FROM_JSON.filter(c => !c.isPremium);
export const PREMIUM_CARDS_JSON = ALL_CARDS_FROM_JSON.filter(c => c.isPremium);

// Level-based exports
export const LEVEL1_CARDS_JSON = ALL_CARDS_FROM_JSON.filter(c => c.id.startsWith('lvl1-'));
export const LEVEL2_CARDS_JSON = ALL_CARDS_FROM_JSON.filter(c => c.id.startsWith('lvl2-'));
export const LEVEL3_CARDS_JSON = ALL_CARDS_FROM_JSON.filter(c => c.id.startsWith('lvl3-'));
export const LEVEL4_CARDS_JSON = ALL_CARDS_FROM_JSON.filter(c => c.id.startsWith('lvl4-'));
export const LEVEL5_CARDS_JSON = ALL_CARDS_FROM_JSON.filter(c => c.id.startsWith('lvl5-'));

// Original cards (f-* and p-* IDs)
export const ORIGINAL_FREE_CARDS_JSON = ALL_CARDS_FROM_JSON.filter(c => c.id.startsWith('f-'));
export const ORIGINAL_PREMIUM_CARDS_JSON = ALL_CARDS_FROM_JSON.filter(c => c.id.startsWith('p-') || c.id.startsWith('k-'));

// Helper functions
export const getCardsByTypeFromJSON = (type: GameCardType): GameCard[] => {
  return ALL_CARDS_FROM_JSON.filter(c => c.type === type);
};

export const getCardsByIntensityFromJSON = (min: number, max: number): GameCard[] => {
  return ALL_CARDS_FROM_JSON.filter(c => c.intensity >= min && c.intensity <= max);
};

export const getRandomCardFromJSON = (type?: GameCardType): GameCard | null => {
  const cards = type ? getCardsByTypeFromJSON(type) : ALL_CARDS_FROM_JSON;
  if (!cards.length) return null;
  return cards[Math.floor(Math.random() * cards.length)];
};

// Statistics
export const getJSONDeckStatistics = () => {
  return {
    total: ALL_CARDS_FROM_JSON.length,
    free: FREE_CARDS_JSON.length,
    premium: PREMIUM_CARDS_JSON.length,
    byType: {
      truth: getCardsByTypeFromJSON('truth').length,
      dare: getCardsByTypeFromJSON('dare').length,
      challenge: getCardsByTypeFromJSON('challenge').length,
      fantasy: getCardsByTypeFromJSON('fantasy').length,
      roleplay: getCardsByTypeFromJSON('roleplay').length,
    },
    byLevel: {
      original: ORIGINAL_FREE_CARDS_JSON.length + ORIGINAL_PREMIUM_CARDS_JSON.length,
      level1: LEVEL1_CARDS_JSON.length,
      level2: LEVEL2_CARDS_JSON.length,
      level3: LEVEL3_CARDS_JSON.length,
      level4: LEVEL4_CARDS_JSON.length,
      level5: LEVEL5_CARDS_JSON.length,
    }
  };
};

// Re-export for backward compatibility
export { GameCard, GameCardType };
