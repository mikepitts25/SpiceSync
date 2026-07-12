// Match-aware game deck helpers.
//
// The game can lean into what the couple already agreed on. Privacy rule:
// only mutual-yes votes feed the deck — both partners have already revealed
// those to each other, the same visibility rule the matches screen uses.
// Nothing gated behind reveal consent (partial or mutual-maybe buckets) and
// nothing private (not-now / hard-no / legacy no) ever reaches the game.
import type { GameCard, GameCardCategory } from '../data/gameCards';
import {
  normalizeVoteRecord,
  preferencesCompatible,
  type KinkVote,
} from './votes/rolePreferences';

export type MatchSourceKink = {
  id: string;
  title: string;
  category?: string;
};

export const MATCH_INSPIRED_ID_PREFIX = 'match-inspired-';

export function isMatchInspiredCard(card: Pick<GameCard, 'id'>): boolean {
  return card.id.startsWith(MATCH_INSPIRED_ID_PREFIX);
}

export function computeMutualYesKinks(
  kinks: readonly MatchSourceKink[],
  mine: Record<string, KinkVote> | undefined,
  theirs: Record<string, KinkVote> | undefined
): MatchSourceKink[] {
  if (!mine || !theirs) return [];

  const mutualYes: MatchSourceKink[] = [];
  for (const kink of kinks) {
    const myRecord = normalizeVoteRecord(mine[kink.id]);
    const theirRecord = normalizeVoteRecord(theirs[kink.id]);
    if (!myRecord || !theirRecord) continue;
    if (myRecord.value !== 'yes' || theirRecord.value !== 'yes') continue;
    if (
      !preferencesCompatible(
        myRecord.pairPreference,
        theirRecord.pairPreference
      )
    ) {
      continue;
    }
    mutualYes.push(kink);
  }
  return mutualYes;
}

const KINK_TO_CARD_CATEGORIES: Record<string, GameCardCategory[]> = {
  sensory: ['physical', 'intimate'],
  communication: ['communication', 'emotional'],
  roleplay: ['playful', 'intimate'],
  paired_play: ['intimate', 'physical'],
  environment: ['playful'],
  light_restraint: ['physical', 'intimate'],
  props_and_toys: ['physical', 'playful'],
  aftercare: ['emotional'],
  group: ['playful'],
};

export function getFavoredCardCategories(
  matches: readonly MatchSourceKink[]
): Set<GameCardCategory> {
  const favored = new Set<GameCardCategory>();
  for (const match of matches) {
    const mapped = KINK_TO_CARD_CATEGORIES[match.category ?? ''];
    if (!mapped) continue;
    for (const category of mapped) {
      favored.add(category);
    }
  }
  return favored;
}

type InspiredTemplate = (title: string) => string;

const INSPIRED_TEMPLATES: Record<'en' | 'es', InspiredTemplate[]> = {
  en: [
    (title) =>
      `Inspired by your matches: "${title}". Each of you shares one thing about it that excites you — then act out the tamest version for 60 seconds.`,
    (title) =>
      `Inspired by your matches: "${title}". Describe to your partner exactly how you would want it to start. Then make that first move now.`,
    (title) =>
      `Inspired by your matches: "${title}". Whisper to your partner when and where you want to try it next.`,
  ],
  es: [
    (title) =>
      `Inspirado en sus matches: "${title}". Cada uno comparte algo que le emociona de eso — luego actúen la versión más suave por 60 segundos.`,
    (title) =>
      `Inspirado en sus matches: "${title}". Describe a tu pareja exactamente cómo querrías que empiece. Da ese primer paso ahora.`,
    (title) =>
      `Inspirado en sus matches: "${title}". Susúrrale a tu pareja cuándo y dónde quieres probarlo.`,
  ],
};

type CreateMatchInspiredCardsOptions = {
  language?: 'en' | 'es';
  maxCards?: number;
  intensity?: GameCard['intensity'];
  random?: () => number;
};

export function createMatchInspiredCards(
  matches: readonly MatchSourceKink[],
  {
    language = 'en',
    maxCards = 3,
    intensity = 3,
    random = Math.random,
  }: CreateMatchInspiredCardsOptions = {}
): GameCard[] {
  if (!matches.length || maxCards <= 0) return [];

  const pool = [...matches];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  const templates = INSPIRED_TEMPLATES[language] ?? INSPIRED_TEMPLATES.en;
  return pool.slice(0, maxCards).map((kink, index) => ({
    id: `${MATCH_INSPIRED_ID_PREFIX}${kink.id}`,
    type: 'challenge',
    content: templates[index % templates.length](kink.title),
    intensity,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
  }));
}

export function interleaveMatchInspiredCards(
  deck: readonly GameCard[],
  inspired: readonly GameCard[],
  random: () => number = Math.random
): GameCard[] {
  if (!inspired.length) return [...deck];
  if (!deck.length) return [...inspired];

  const result = [...deck];
  inspired.forEach((card, index) => {
    // Space the inspired cards evenly through the deck (never first, so a
    // session still opens on a regular warm-up card), with slight jitter.
    const fraction = (index + 1) / (inspired.length + 1);
    const base = Math.floor(fraction * result.length);
    const jitter = Math.round((random() - 0.5) * 2);
    const position = Math.min(result.length, Math.max(1, base + jitter));
    result.splice(position, 0, card);
  });
  return result;
}
