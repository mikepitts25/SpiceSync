// apps/mobile/lib/conversationStarters.ts
// Deep Dives - Conversation Starters Feature
// Main library for managing conversation prompts for couples

import gettingToKnowStarters from '../data/conversation_starters_getting_to_know';
import relationshipStarters from '../data/conversation_starters_relationship';
import dateNightStarters from '../data/conversation_starters_date_night';
import spicyStarters from '../data/conversation_starters_spicy';
import loveLanguagesStarters from '../data/conversation_starters_love_languages';

import { gettingToKnowStartersES } from '../data/conversation_starters_getting_to_know.es';
import { relationshipStartersES } from '../data/conversation_starters_relationship.es';
import { dateNightStartersES } from '../data/conversation_starters_date_night.es';
import { spicyStartersES } from '../data/conversation_starters_spicy.es';
import { loveLanguagesStartersES } from '../data/conversation_starters_love_languages.es';

// Export the interface for TypeScript
export interface ConversationStarter {
  id: string;
  category: 'getting_to_know' | 'relationship' | 'date_night' | 'spicy' | 'love_languages';
  intensity: 1 | 2 | 3 | 4;
  question: string;
  followUps?: string[];
  context?: string;
  tags: string[];
}

// Category metadata for UI display
export interface CategoryInfo {
  id: 'getting_to_know' | 'relationship' | 'date_night' | 'spicy' | 'love_languages';
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  gradient: [string, string];
  count: number;
}

// Intensity levels for filtering
export const INTENSITY_LABELS: Record<number, { label: string; description: string; color: string }> = {
  1: { 
    label: 'Light', 
    description: 'Easy, fun conversation starters',
    color: '#22C55E'
  },
  2: { 
    label: 'Warm', 
    description: 'Getting to know each other better',
    color: '#F59E0B'
  },
  3: { 
    label: 'Deep', 
    description: 'Meaningful, vulnerable conversations',
    color: '#F472B6'
  },
  4: { 
    label: 'Intimate', 
    description: 'Close, personal, and spicy topics',
    color: '#EF4444'
  },
};

// All conversation starters combined (English)
export const allConversationStarters: ConversationStarter[] = [
  ...gettingToKnowStarters,
  ...relationshipStarters,
  ...dateNightStarters,
  ...spicyStarters,
  ...loveLanguagesStarters,
];

// All conversation starters combined (Spanish)
export const allConversationStartersES: ConversationStarter[] = [
  ...gettingToKnowStartersES,
  ...relationshipStartersES,
  ...dateNightStartersES,
  ...spicyStartersES,
  ...loveLanguagesStartersES,
];

// Get the pool for a given language
export function getPoolByLanguage(lang: 'en' | 'es'): ConversationStarter[] {
  return lang === 'es' ? allConversationStartersES : allConversationStarters;
}

// Get starters by category for a given language
export function getStartersByCategoryAndLanguage(
  category: ConversationStarter['category'],
  lang: 'en' | 'es'
): ConversationStarter[] {
  const pool = getPoolByLanguage(lang);
  return pool.filter((s) => s.category === category);
}

// Get a random starter for a given language
export function getRandomStarterByLanguage(
  lang: 'en' | 'es',
  options?: FilterOptions
): ConversationStarter | null {
  let pool = getPoolByLanguage(lang);
  if (options) {
    if (options.category) pool = pool.filter((s) => s.category === options.category);
    if (options.intensity !== undefined) {
      const intensities = Array.isArray(options.intensity) ? options.intensity : [options.intensity];
      pool = pool.filter((s) => intensities.includes(s.intensity));
    }
    if (options.tags && options.tags.length > 0) {
      pool = pool.filter((s) =>
        options.tags!.some((tag) => s.tags.some((t) => t.toLowerCase() === tag.toLowerCase()))
      );
    }
    if (options.excludeIds && options.excludeIds.length > 0) {
      pool = pool.filter((s) => !options.excludeIds!.includes(s.id));
    }
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Get daily starter for a given language
export function getDailyStarterByLanguage(lang: 'en' | 'es', date?: Date): ConversationStarter {
  const pool = getPoolByLanguage(lang);
  const targetDate = date || new Date();
  const startOfYear = new Date(targetDate.getFullYear(), 0, 0);
  const diff = targetDate.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return pool[dayOfYear % pool.length];
}

// Create a date night deck for a given language
export function createDateNightDeckByLanguage(
  lang: 'en' | 'es',
  includeSpicy: boolean = true,
  count: number = 10
): ConversationStarter[] {
  const pool = getPoolByLanguage(lang);
  const categories: ConversationStarter['category'][] = includeSpicy
    ? ['date_night', 'spicy']
    : ['date_night'];
  const filtered = pool.filter((s) => categories.includes(s.category));

  const light = filtered.filter((s) => s.intensity === 1);
  const warm = filtered.filter((s) => s.intensity === 2);
  const deep = filtered.filter((s) => s.intensity === 3);
  const intimate = filtered.filter((s) => s.intensity === 4);

  const counts = {
    1: Math.floor(count * 0.4),
    2: Math.floor(count * 0.3),
    3: Math.floor(count * 0.2),
    4: Math.floor(count * 0.1),
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total < count) counts[1] += count - total;

  const getRandomFromArr = <T>(arr: T[], n: number): T[] =>
    [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));

  const deck: ConversationStarter[] = [];
  if (light.length) deck.push(...getRandomFromArr(light, counts[1]));
  if (warm.length) deck.push(...getRandomFromArr(warm, counts[2]));
  if (deep.length) deck.push(...getRandomFromArr(deep, counts[3]));
  if (intimate.length && includeSpicy) deck.push(...getRandomFromArr(intimate, counts[4]));

  return deck.sort(() => Math.random() - 0.5);
}

// Category information for UI
export const categoryInfo: CategoryInfo[] = [
  {
    id: 'getting_to_know',
    title: 'Getting to Know You',
    subtitle: 'Deep Dives',
    description: 'Childhood memories, values, dreams, and discoveries',
    icon: 'heart',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#C084FC'],
    count: gettingToKnowStarters.length,
  },
  {
    id: 'relationship',
    title: 'Relationship Deep Dives',
    subtitle: 'Us',
    description: 'Memories, conflict, future visions, and appreciation',
    icon: 'users',
    color: '#F472B6',
    gradient: ['#F472B6', '#EF4444'],
    count: relationshipStarters.length,
  },
  {
    id: 'date_night',
    title: 'Date Night Fun',
    subtitle: 'Play',
    description: 'Flirty questions, hypotheticals, and playful debates',
    icon: 'sparkles',
    color: '#00D9FF',
    gradient: ['#00D9FF', '#8B5CF6'],
    count: dateNightStarters.length,
  },
  {
    id: 'spicy',
    title: 'Intimate Conversations',
    subtitle: 'Spicy',
    description: 'Desires, fantasies, and exploring together',
    icon: 'flame',
    color: '#FF2D92',
    gradient: ['#FF2D92', '#EF4444'],
    count: spicyStarters.length,
  },
  {
    id: 'love_languages',
    title: 'Love Languages',
    subtitle: '5 Languages',
    description: 'Discover how you and your partner give and receive love',
    icon: 'heart-handshake',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#EF4444'],
    count: loveLanguagesStarters.length,
  },
];

// Get starters by category
export function getStartersByCategory(
  category: ConversationStarter['category']
): ConversationStarter[] {
  switch (category) {
    case 'getting_to_know':
      return gettingToKnowStarters;
    case 'relationship':
      return relationshipStarters;
    case 'date_night':
      return dateNightStarters;
    case 'spicy':
      return spicyStarters;
    case 'love_languages':
      return loveLanguagesStarters;
    default:
      return [];
  }
}

// Get starters by intensity level
export function getStartersByIntensity(
  intensity: number
): ConversationStarter[] {
  return allConversationStarters.filter((s) => s.intensity === intensity);
}

// Get starters by tag
export function getStartersByTag(tag: string): ConversationStarter[] {
  return allConversationStarters.filter((s) =>
    s.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

// Filter starters with multiple criteria
export interface FilterOptions {
  category?: ConversationStarter['category'];
  intensity?: number | number[];
  tags?: string[];
  excludeIds?: string[];
}

export function filterStarters(options: FilterOptions): ConversationStarter[] {
  let results = allConversationStarters;

  if (options.category) {
    results = results.filter((s) => s.category === options.category);
  }

  if (options.intensity !== undefined) {
    const intensities = Array.isArray(options.intensity)
      ? options.intensity
      : [options.intensity];
    results = results.filter((s) => intensities.includes(s.intensity));
  }

  if (options.tags && options.tags.length > 0) {
    results = results.filter((s) =>
      options.tags!.some((tag) =>
        s.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      )
    );
  }

  if (options.excludeIds && options.excludeIds.length > 0) {
    results = results.filter((s) => !options.excludeIds!.includes(s.id));
  }

  return results;
}

// Get a random starter
export function getRandomStarter(
  options?: FilterOptions
): ConversationStarter | null {
  const pool = options ? filterStarters(options) : allConversationStarters;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Get multiple random starters
export function getRandomStarters(
  count: number,
  options?: FilterOptions
): ConversationStarter[] {
  const pool = options ? filterStarters(options) : allConversationStarters;
  if (pool.length === 0) return [];
  
  // Shuffle and take requested count
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Get daily conversation starter (deterministic based on date)
export function getDailyStarter(date?: Date): ConversationStarter {
  const targetDate = date || new Date();
  const startOfYear = new Date(targetDate.getFullYear(), 0, 0);
  const diff = targetDate.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Use day of year to pick a starter (cycles through all)
  const index = dayOfYear % allConversationStarters.length;
  return allConversationStarters[index];
}

// Get daily starter for a specific category
export function getDailyStarterByCategory(
  category: ConversationStarter['category'],
  date?: Date
): ConversationStarter {
  const targetDate = date || new Date();
  const starters = getStartersByCategory(category);
  const startOfYear = new Date(targetDate.getFullYear(), 0, 0);
  const diff = targetDate.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const index = dayOfYear % starters.length;
  return starters[index];
}

// Search starters by keyword
export function searchStarters(query: string): ConversationStarter[] {
  const lowerQuery = query.toLowerCase();
  return allConversationStarters.filter(
    (s) =>
      s.question.toLowerCase().includes(lowerQuery) ||
      s.tags.some((t) => t.toLowerCase().includes(lowerQuery)) ||
      (s.context && s.context.toLowerCase().includes(lowerQuery))
  );
}

// Get all unique tags
export function getAllTags(): string[] {
  const tags = new Set<string>();
  allConversationStarters.forEach((s) => s.tags.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

// Get tags by category
export function getTagsByCategory(
  category: ConversationStarter['category']
): string[] {
  const tags = new Set<string>();
  getStartersByCategory(category).forEach((s) =>
    s.tags.forEach((t) => tags.add(t))
  );
  return Array.from(tags).sort();
}

// Get starter by ID
export function getStarterById(id: string): ConversationStarter | undefined {
  return allConversationStarters.find((s) => s.id === id);
}

// Get related starters (same category or shared tags)
export function getRelatedStarters(
  starter: ConversationStarter,
  count: number = 3
): ConversationStarter[] {
  const sameCategory = getStartersByCategory(starter.category).filter(
    (s) => s.id !== starter.id
  );
  
  // Score by tag overlap
  const scored = sameCategory.map((s) => {
    const sharedTags = s.tags.filter((t) => starter.tags.includes(t));
    return { starter: s, score: sharedTags.length };
  });
  
  // Sort by score and return top matches
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.starter);
}

// Create a date night deck (curated selection)
export function createDateNightDeck(
  includeSpicy: boolean = true,
  count: number = 10
): ConversationStarter[] {
  const categories: ConversationStarter['category'][] = includeSpicy
    ? ['date_night', 'spicy']
    : ['date_night'];
  
  const pool = allConversationStarters.filter((s) =>
    categories.includes(s.category)
  );
  
  // Mix of intensities: 40% light, 30% warm, 20% deep, 10% intimate (if included)
  const light = pool.filter((s) => s.intensity === 1);
  const warm = pool.filter((s) => s.intensity === 2);
  const deep = pool.filter((s) => s.intensity === 3);
  const intimate = pool.filter((s) => s.intensity === 4);
  
  const deck: ConversationStarter[] = [];
  const counts = {
    1: Math.floor(count * 0.4),
    2: Math.floor(count * 0.3),
    3: Math.floor(count * 0.2),
    4: Math.floor(count * 0.1),
  };
  
  // Adjust for rounding
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total < count) counts[1] += count - total;
  
  if (light.length) deck.push(...getRandomFromArray(light, counts[1]));
  if (warm.length) deck.push(...getRandomFromArray(warm, counts[2]));
  if (deep.length) deck.push(...getRandomFromArray(deep, counts[3]));
  if (intimate.length && includeSpicy) deck.push(...getRandomFromArray(intimate, counts[4]));
  
  // Shuffle the deck
  return deck.sort(() => Math.random() - 0.5);
}

// Helper: Get random items from array
function getRandomFromArray<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Export individual category arrays for direct import
export {
  gettingToKnowStarters,
  relationshipStarters,
  dateNightStarters,
  spicyStarters,
  loveLanguagesStarters,
};

// Default export
export default {
  allConversationStarters,
  categoryInfo,
  INTENSITY_LABELS,
  gettingToKnowStarters,
  relationshipStarters,
  dateNightStarters,
  spicyStarters,
  loveLanguagesStarters,
  getStartersByCategory,
  getStartersByIntensity,
  getStartersByTag,
  filterStarters,
  getRandomStarter,
  getRandomStarters,
  getDailyStarter,
  getDailyStarterByCategory,
  searchStarters,
  getAllTags,
  getTagsByCategory,
  getStarterById,
  getRelatedStarters,
  createDateNightDeck,
};
