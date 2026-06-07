import type { ConversationStarter } from './conversationStarters';
import {
  LOVE_LANGUAGE_EMOJIS,
  LOVE_LANGUAGE_NAMES,
  type LoveLanguage,
} from './loveLanguages';
import type { ProfileLoveLanguage } from '../src/stores/loveLanguages';

export const LOVE_LANGUAGE_PROMPT_CATEGORY = 'love_languages' as const;
export const LOVE_LANGUAGE_HUB_ROUTE =
  '/(conversation)/love-languages' as const;
export const LOVE_LANGUAGE_QUIZ_ROUTE =
  '/(conversation)/love-languages-quiz' as const;

export const CONVERSATION_CATEGORY_FILTERS: {
  id: ConversationStarter['category'];
  label: string;
}[] = [
  { id: 'date_night', label: 'Date Night' },
  { id: 'getting_to_know', label: 'Getting to Know' },
  { id: 'relationship', label: 'Relationship' },
  { id: 'spicy', label: 'Spicy' },
  { id: LOVE_LANGUAGE_PROMPT_CATEGORY, label: 'Love Languages' },
];

export type ConversationTopicTile = {
  id: ConversationStarter['category'];
  label: string;
  subtitle: string;
  mark: string;
  route: string;
  type: 'prompts' | 'love_languages';
  accent: {
    gradient: readonly [string, string];
    border: string;
    glow: string;
    badge: string;
  };
  motion: {
    pressTilt: '-1deg' | '1deg';
  };
};

function getPromptTopicRoute(
  category: ConversationStarter['category']
): string {
  return `/(conversation)/topic/${category}`;
}

export const CONVERSATION_TOPIC_TILES: ConversationTopicTile[] = [
  {
    id: 'date_night',
    label: 'Date Night',
    subtitle: 'Playful prompts for time together',
    mark: 'DATE',
    route: getPromptTopicRoute('date_night'),
    type: 'prompts',
    accent: {
      gradient: ['#C2185B', '#FF2D92'],
      border: 'rgba(255,45,146,0.42)',
      glow: 'rgba(255,45,146,0.22)',
      badge: 'rgba(255,45,146,0.18)',
    },
    motion: {
      pressTilt: '-1deg',
    },
  },
  {
    id: 'getting_to_know',
    label: 'Getting to Know',
    subtitle: 'Fresh angles on familiar stories',
    mark: 'KNOW',
    route: getPromptTopicRoute('getting_to_know'),
    type: 'prompts',
    accent: {
      gradient: ['#A78BFA', '#8B5CF6'],
      border: 'rgba(167,139,250,0.42)',
      glow: 'rgba(139,92,246,0.22)',
      badge: 'rgba(167,139,250,0.18)',
    },
    motion: {
      pressTilt: '1deg',
    },
  },
  {
    id: 'relationship',
    label: 'Relationship',
    subtitle: 'Check in on patterns and needs',
    mark: 'TALK',
    route: getPromptTopicRoute('relationship'),
    type: 'prompts',
    accent: {
      gradient: ['#F59E0B', '#FF2D92'],
      border: 'rgba(245,158,11,0.42)',
      glow: 'rgba(245,158,11,0.2)',
      badge: 'rgba(245,158,11,0.18)',
    },
    motion: {
      pressTilt: '-1deg',
    },
  },
  {
    id: 'spicy',
    label: 'Spicy',
    subtitle: 'Warm up curiosity and desire',
    mark: 'HEAT',
    route: getPromptTopicRoute('spicy'),
    type: 'prompts',
    accent: {
      gradient: ['#EF4444', '#C2185B'],
      border: 'rgba(239,68,68,0.44)',
      glow: 'rgba(239,68,68,0.22)',
      badge: 'rgba(239,68,68,0.18)',
    },
    motion: {
      pressTilt: '1deg',
    },
  },
  {
    id: LOVE_LANGUAGE_PROMPT_CATEGORY,
    label: 'Love Languages',
    subtitle: 'Use prompts or take the quiz',
    mark: 'CARE',
    route: LOVE_LANGUAGE_HUB_ROUTE,
    type: 'love_languages',
    accent: {
      gradient: ['#8B5CF6', '#FF2D92'],
      border: 'rgba(139,92,246,0.44)',
      glow: 'rgba(139,92,246,0.22)',
      badge: 'rgba(139,92,246,0.18)',
    },
    motion: {
      pressTilt: '-1deg',
    },
  },
];

export function getConversationTopicTile(
  category?: string | string[]
): ConversationTopicTile | undefined {
  const categoryId = Array.isArray(category) ? category[0] : category;
  return CONVERSATION_TOPIC_TILES.find((topic) => topic.id === categoryId);
}

type PartnerLoveLanguageResult = {
  name: string;
  result?: ProfileLoveLanguage;
};

export type LoveLanguageModuleCopy = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  promptLabel: string;
  activePrimary?: string;
  activeSecondary?: string;
  partnerSummary?: string;
};

function formatLoveLanguage(language: LoveLanguage): string {
  return `${LOVE_LANGUAGE_EMOJIS[language]} ${LOVE_LANGUAGE_NAMES[language]}`;
}

export function getLoveLanguageModuleCopy(
  activeResult?: ProfileLoveLanguage,
  partnerResults: PartnerLoveLanguageResult[] = []
): LoveLanguageModuleCopy {
  const partnerWithResult = partnerResults.find((partner) => partner.result);

  if (!activeResult) {
    return {
      eyebrow: 'LOVE LANGUAGES',
      title: 'Make care easier to read',
      description:
        'Take a short quiz, then use guided prompts to turn the result into a real conversation.',
      ctaLabel: 'Take quiz',
      promptLabel: 'Use prompts',
      partnerSummary: partnerWithResult
        ? `${partnerWithResult.name} has a result ready`
        : undefined,
    };
  }

  return {
    eyebrow: 'LOVE LANGUAGES',
    title: 'Talk through how love lands',
    description:
      'Use your results as a shortcut into clearer appreciation, repair, and everyday care.',
    ctaLabel: 'View results',
    promptLabel: 'Use prompts',
    activePrimary: formatLoveLanguage(activeResult.result.primary),
    activeSecondary: formatLoveLanguage(activeResult.result.secondary),
    partnerSummary: partnerWithResult?.result
      ? `${partnerWithResult.name}: ${formatLoveLanguage(
          partnerWithResult.result.result.primary
        )}`
      : undefined,
  };
}
