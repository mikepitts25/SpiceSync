// SpiceSync - Combined Card Export
// All 300 expansion cards organized by level

import type { GameCard } from './gameCards';
import { LEVEL1_CARDS } from './game_cards_level1';
import { LEVEL2_CARDS } from './game_cards_level2';
import { LEVEL3_CARDS } from './game_cards_level3';
import { LEVEL4_CARDS } from './game_cards_level4';
import { LEVEL5_CARDS } from './game_cards_level5';

// Export individual level arrays
export { LEVEL1_CARDS, LEVEL2_CARDS, LEVEL3_CARDS, LEVEL4_CARDS, LEVEL5_CARDS };

// Combined expansion cards (300 total)
export const EXPANSION_CARDS: GameCard[] = [
  ...LEVEL1_CARDS,
  ...LEVEL2_CARDS,
  ...LEVEL3_CARDS,
  ...LEVEL4_CARDS,
  ...LEVEL5_CARDS
];

// Statistics helper
export const getExpansionStats = () => {
  const stats = {
    total: EXPANSION_CARDS.length,
    byLevel: {
      1: LEVEL1_CARDS.length,
      2: LEVEL2_CARDS.length,
      3: LEVEL3_CARDS.length,
      4: LEVEL4_CARDS.length,
      5: LEVEL5_CARDS.length
    },
    byType: {
      truth: EXPANSION_CARDS.filter(c => c.type === 'truth').length,
      dare: EXPANSION_CARDS.filter(c => c.type === 'dare').length,
      challenge: EXPANSION_CARDS.filter(c => c.type === 'challenge').length,
      fantasy: EXPANSION_CARDS.filter(c => c.type === 'fantasy').length,
      roleplay: EXPANSION_CARDS.filter(c => c.type === 'roleplay').length
    },
    byCategory: {
      communication: EXPANSION_CARDS.filter(c => c.category === 'communication').length,
      physical: EXPANSION_CARDS.filter(c => c.category === 'physical').length,
      emotional: EXPANSION_CARDS.filter(c => c.category === 'emotional').length,
      playful: EXPANSION_CARDS.filter(c => c.category === 'playful').length,
      intimate: EXPANSION_CARDS.filter(c => c.category === 'intimate').length
    },
    free: EXPANSION_CARDS.filter(c => !c.isPremium).length,
    premium: EXPANSION_CARDS.filter(c => c.isPremium).length,
    withSafetyNotes: EXPANSION_CARDS.filter(c => c.safetyNotes).length
  };
  return stats;
};

// Get cards by level
export const getCardsByLevel = (level: 1 | 2 | 3 | 4 | 5): GameCard[] => {
  switch (level) {
    case 1: return LEVEL1_CARDS;
    case 2: return LEVEL2_CARDS;
    case 3: return LEVEL3_CARDS;
    case 4: return LEVEL4_CARDS;
    case 5: return LEVEL5_CARDS;
    default: return [];
  }
};

// Get cards by intensity range
export const getCardsByIntensityRange = (min: 1 | 2 | 3 | 4 | 5, max: 1 | 2 | 3 | 4 | 5): GameCard[] => {
  return EXPANSION_CARDS.filter(c => c.intensity >= min && c.intensity <= max);
};

// Get random card from expansion
export const getRandomExpansionCard = (level?: 1 | 2 | 3 | 4 | 5): GameCard | null => {
  const pool = level ? getCardsByLevel(level) : EXPANSION_CARDS;
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

// Get cards requiring specific props
export const getCardsByProp = (prop: string): GameCard[] => {
  return EXPANSION_CARDS.filter(c => c.requires?.includes(prop));
};

// Get all unique props used in expansion
export const getAllProps = (): string[] => {
  const props = new Set<string>();
  EXPANSION_CARDS.forEach(c => {
    c.requires?.forEach(r => props.add(r));
  });
  return Array.from(props).sort();
};

// Safety check - get all cards with safety notes
export const getCardsWithSafetyNotes = (): GameCard[] => {
  return EXPANSION_CARDS.filter(c => c.safetyNotes);
};

// Print statistics to console (for development)
export const printExpansionStats = () => {
  const stats = getExpansionStats();
  console.log('=== SpiceSync Expansion Pack Statistics ===');
  console.log(`Total Cards: ${stats.total}`);
  console.log('\nBy Level:');
  Object.entries(stats.byLevel).forEach(([level, count]) => {
    console.log(`  Level ${level}: ${count} cards`);
  });
  console.log('\nBy Type:');
  Object.entries(stats.byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} cards`);
  });
  console.log('\nBy Category:');
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} cards`);
  });
  console.log(`\nFree Cards: ${stats.free}`);
  console.log(`Premium Cards: ${stats.premium}`);
  console.log(`Cards with Safety Notes: ${stats.withSafetyNotes}`);
  console.log('\nAll Props Used:', getAllProps().join(', '));
};
