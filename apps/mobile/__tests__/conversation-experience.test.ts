import {
  CONVERSATION_CATEGORY_FILTERS,
  CONVERSATION_TOPIC_TILES,
  LOVE_LANGUAGE_HUB_ROUTE,
  LOVE_LANGUAGE_PROMPT_CATEGORY,
  LOVE_LANGUAGE_QUIZ_ROUTE,
  getConversationTopicTile,
  getConversationTopicTiles,
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

  it('routes love language hub and quiz entry through the conversation area', () => {
    expect(LOVE_LANGUAGE_HUB_ROUTE).toBe('/(conversation)/love-languages');
    expect(LOVE_LANGUAGE_QUIZ_ROUTE).toBe(
      '/(conversation)/love-languages-quiz'
    );
    expect(LOVE_LANGUAGE_PROMPT_CATEGORY).toBe('love_languages');
  });

  it('describes square topic tiles for the conversation grid', () => {
    expect(CONVERSATION_TOPIC_TILES).toHaveLength(5);
    expect(CONVERSATION_TOPIC_TILES.map((item) => item.id)).toEqual(
      CONVERSATION_CATEGORY_FILTERS.map((item) => item.id)
    );
    expect(CONVERSATION_TOPIC_TILES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'date_night',
          label: 'Date Night',
          route: '/(conversation)/topic/date_night',
          type: 'prompts',
        }),
        expect.objectContaining({
          id: 'love_languages',
          label: 'Love Languages',
          route: LOVE_LANGUAGE_HUB_ROUTE,
          type: 'love_languages',
        }),
      ])
    );
  });

  it('gives each topic tile a themed visual accent', () => {
    expect(
      CONVERSATION_TOPIC_TILES.every(
        (item) =>
          item.accent.gradient.length === 2 &&
          item.accent.border.startsWith('rgba(') &&
          item.accent.glow.startsWith('rgba(') &&
          item.accent.badge.startsWith('rgba(')
      )
    ).toBe(true);

    const uniqueGradients = new Set(
      CONVERSATION_TOPIC_TILES.map((item) => item.accent.gradient.join('|'))
    );
    expect(uniqueGradients.size).toBeGreaterThanOrEqual(4);
  });

  it('gives topic tiles subtle press motion metadata', () => {
    expect(
      CONVERSATION_TOPIC_TILES.every((item) =>
        /^-?1deg$/.test(item.motion.pressTilt)
      )
    ).toBe(true);

    expect(
      new Set(CONVERSATION_TOPIC_TILES.map((item) => item.motion.pressTilt))
    ).toEqual(new Set(['-1deg', '1deg']));
  });

  it('looks up topic metadata by route category', () => {
    expect(getConversationTopicTile('relationship')).toMatchObject({
      id: 'relationship',
      route: '/(conversation)/topic/relationship',
    });
    expect(getConversationTopicTile('missing-topic')).toBeUndefined();
  });

  it('returns Spanish presentation copy for every conversation topic', () => {
    expect(
      getConversationTopicTiles('es').map(({ mark, label, subtitle }) => ({
        mark,
        label,
        subtitle,
      }))
    ).toEqual([
      {
        mark: 'CITA',
        label: 'Noche de cita',
        subtitle: 'Preguntas divertidas para compartir',
      },
      {
        mark: 'CONOCE',
        label: 'Conocerse mejor',
        subtitle: 'Nuevas perspectivas sobre historias conocidas',
      },
      {
        mark: 'HABLEN',
        label: 'Relación',
        subtitle: 'Conecten sobre sus hábitos y necesidades',
      },
      {
        mark: 'PASIÓN',
        label: 'Picante',
        subtitle: 'Aviven la curiosidad y el deseo',
      },
      {
        mark: 'CARIÑO',
        label: 'Lenguajes del amor',
        subtitle: 'Usen preguntas o hagan el quiz',
      },
    ]);

    expect(getConversationTopicTile('date_night', 'es')).toMatchObject({
      label: 'Noche de cita',
      mark: 'CITA',
    });
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

    expect(
      getLoveLanguageModuleCopy(
        activeResult,
        [{ name: 'Taylor', result: partnerResult }],
        'es'
      )
    ).toMatchObject({
      eyebrow: 'LENGUAJES DEL AMOR',
      title: 'Hablen de cómo reciben el amor',
      ctaLabel: 'Ver resultados',
      promptLabel: 'Usar preguntas',
      activePrimary: '💬 Palabras de afirmación',
      activeSecondary: '⏰ Tiempo de calidad',
      partnerSummary: 'Taylor: 🤝 Actos de servicio',
    });
  });
});
