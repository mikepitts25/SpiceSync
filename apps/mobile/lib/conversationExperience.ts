import type { ConversationStarter } from './conversationStarters';
import {
  LOVE_LANGUAGE_EMOJIS,
  LOVE_LANGUAGE_NAMES,
  type LoveLanguage,
} from './loveLanguages';
import type { ProfileLoveLanguage } from '../src/stores/loveLanguages';

export const LOVE_LANGUAGE_PROMPT_CATEGORY = 'love_languages' as const;
export const LOVE_LANGUAGE_QUIZ_ROUTE = '/(conversation)/love-languages' as const;

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
