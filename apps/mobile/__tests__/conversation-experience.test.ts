import {
  CONVERSATION_CATEGORY_FILTERS,
  LOVE_LANGUAGE_PROMPT_CATEGORY,
  LOVE_LANGUAGE_QUIZ_ROUTE,
  getLoveLanguageModuleCopy,
} from '../lib/conversationExperience';
import type { ProfileLoveLanguage } from '../src/stores/loveLanguages';

const completedAt = new Date('2026-05-10T10:00:00Z').getTime();

describe('conversation experience metadata', () => {
  it('offers relationship and love language categories in the conversation area', () => {
    expect(CONVERSATION_CATEGORY_FILTERS.map((item) => item.id)).toEqual([
      'date_night',
      'getting_to_know',
      'relationship',
      'spicy',
      'love_languages',
    ]);
  });

  it('routes love language quiz entry through the conversation area', () => {
    expect(LOVE_LANGUAGE_QUIZ_ROUTE).toBe('/(conversation)/love-languages');
    expect(LOVE_LANGUAGE_PROMPT_CATEGORY).toBe('love_languages');
  });

  it('invites users without a quiz result to take the quiz', () => {
    expect(getLoveLanguageModuleCopy()).toMatchObject({
      eyebrow: 'LOVE LANGUAGES',
      title: 'Make care easier to read',
      ctaLabel: 'Take quiz',
      promptLabel: 'Use prompts',
    });
  });

  it('summarizes active and partner love language results when available', () => {
    const activeResult: ProfileLoveLanguage = {
      profileId: 'me',
      completedAt,
      result: {
        primary: 'words',
        secondary: 'time',
        scores: {
          words: 12,
          time: 8,
          gifts: 4,
          acts: 3,
          touch: 3,
        },
      },
    };

    const partnerResult: ProfileLoveLanguage = {
      profileId: 'partner',
      completedAt,
      result: {
        primary: 'acts',
        secondary: 'touch',
        scores: {
          words: 2,
          time: 4,
          gifts: 5,
          acts: 11,
          touch: 8,
        },
      },
    };

    expect(
      getLoveLanguageModuleCopy(activeResult, [
        { name: 'Taylor', result: partnerResult },
      ])
    ).toMatchObject({
      ctaLabel: 'View results',
      activePrimary: '💬 Words of Affirmation',
      activeSecondary: '⏰ Quality Time',
      partnerSummary: 'Taylor: 🤝 Acts of Service',
    });
  });
});
