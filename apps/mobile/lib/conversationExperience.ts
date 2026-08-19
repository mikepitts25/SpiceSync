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

type ConversationLanguage = 'en' | 'es';
type ConversationTopicCopy = Pick<
  ConversationTopicTile,
  'label' | 'subtitle' | 'mark'
>;

const CONVERSATION_TOPIC_COPY: Record<
  ConversationLanguage,
  Record<ConversationStarter['category'], ConversationTopicCopy>
> = {
  en: {
    date_night: {
      label: 'Date Night',
      subtitle: 'Playful prompts for time together',
      mark: 'DATE',
    },
    getting_to_know: {
      label: 'Getting to Know',
      subtitle: 'Fresh angles on familiar stories',
      mark: 'KNOW',
    },
    relationship: {
      label: 'Relationship',
      subtitle: 'Check in on patterns and needs',
      mark: 'TALK',
    },
    spicy: {
      label: 'Spicy',
      subtitle: 'Warm up curiosity and desire',
      mark: 'HEAT',
    },
    love_languages: {
      label: 'Love Languages',
      subtitle: 'Use prompts or take the quiz',
      mark: 'CARE',
    },
  },
  es: {
    date_night: {
      label: 'Noche de cita',
      subtitle: 'Preguntas divertidas para compartir',
      mark: 'CITA',
    },
    getting_to_know: {
      label: 'Conocerse mejor',
      subtitle: 'Nuevas perspectivas sobre historias conocidas',
      mark: 'CONOCE',
    },
    relationship: {
      label: 'Relación',
      subtitle: 'Conecten sobre sus hábitos y necesidades',
      mark: 'HABLEN',
    },
    spicy: {
      label: 'Picante',
      subtitle: 'Aviven la curiosidad y el deseo',
      mark: 'PASIÓN',
    },
    love_languages: {
      label: 'Lenguajes del amor',
      subtitle: 'Usen preguntas o hagan el quiz',
      mark: 'CARIÑO',
    },
  },
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

const conversationTopicTilesByLanguage: Partial<
  Record<ConversationLanguage, ConversationTopicTile[]>
> = { en: CONVERSATION_TOPIC_TILES };

export function getConversationTopicTiles(
  language: ConversationLanguage = 'en'
): ConversationTopicTile[] {
  const cached = conversationTopicTilesByLanguage[language];
  if (cached) return cached;

  const copy = CONVERSATION_TOPIC_COPY[language] ?? CONVERSATION_TOPIC_COPY.en;
  const localized = CONVERSATION_TOPIC_TILES.map((topic) => ({
    ...topic,
    ...copy[topic.id],
  }));
  conversationTopicTilesByLanguage[language] = localized;
  return localized;
}

export function getConversationTopicTile(
  category?: string | string[],
  language: ConversationLanguage = 'en'
): ConversationTopicTile | undefined {
  const categoryId = Array.isArray(category) ? category[0] : category;
  return getConversationTopicTiles(language).find(
    (topic) => topic.id === categoryId
  );
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

const LOVE_LANGUAGE_NAMES_ES: Record<LoveLanguage, string> = {
  words: 'Palabras de afirmación',
  time: 'Tiempo de calidad',
  gifts: 'Recibir regalos',
  acts: 'Actos de servicio',
  touch: 'Contacto físico',
};

function formatLoveLanguage(
  loveLanguage: LoveLanguage,
  language: ConversationLanguage
): string {
  const names =
    language === 'es' ? LOVE_LANGUAGE_NAMES_ES : LOVE_LANGUAGE_NAMES;
  return `${LOVE_LANGUAGE_EMOJIS[loveLanguage]} ${names[loveLanguage]}`;
}

export function getLoveLanguageModuleCopy(
  activeResult?: ProfileLoveLanguage,
  partnerResults: PartnerLoveLanguageResult[] = [],
  language: ConversationLanguage = 'en'
): LoveLanguageModuleCopy {
  const partnerWithResult = partnerResults.find((partner) => partner.result);

  if (language === 'es') {
    if (!activeResult) {
      return {
        eyebrow: 'LENGUAJES DEL AMOR',
        title: 'Entiendan mejor cómo se cuidan',
        description:
          'Hagan un quiz breve y usen preguntas guiadas para convertir el resultado en una conversación real.',
        ctaLabel: 'Hacer el quiz',
        promptLabel: 'Usar preguntas',
        partnerSummary: partnerWithResult
          ? `${partnerWithResult.name} ya tiene un resultado`
          : undefined,
      };
    }

    return {
      eyebrow: 'LENGUAJES DEL AMOR',
      title: 'Hablen de cómo reciben el amor',
      description:
        'Usen sus resultados para expresar con más claridad el aprecio, la reconciliación y el cuidado cotidiano.',
      ctaLabel: 'Ver resultados',
      promptLabel: 'Usar preguntas',
      activePrimary: formatLoveLanguage(activeResult.result.primary, language),
      activeSecondary: formatLoveLanguage(
        activeResult.result.secondary,
        language
      ),
      partnerSummary: partnerWithResult?.result
        ? `${partnerWithResult.name}: ${formatLoveLanguage(
            partnerWithResult.result.result.primary,
            language
          )}`
        : undefined,
    };
  }

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
    activePrimary: formatLoveLanguage(activeResult.result.primary, language),
    activeSecondary: formatLoveLanguage(
      activeResult.result.secondary,
      language
    ),
    partnerSummary: partnerWithResult?.result
      ? `${partnerWithResult.name}: ${formatLoveLanguage(
          partnerWithResult.result.result.primary,
          language
        )}`
      : undefined,
  };
}
