import type { GameCard } from './gameCards';
import spanishTranslations from './game_card_translations.es.json';

export type GameCardDisplayLanguage = 'en' | 'es';

const spanishCardContentById = spanishTranslations as Record<string, string>;

export function hasGameCardSpanishTranslation(cardId: string): boolean {
  return Boolean(spanishCardContentById[cardId]?.trim());
}

export function getGameCardDisplayContent(
  card: GameCard,
  language: GameCardDisplayLanguage
): string {
  if (language !== 'es') return card.content;

  return spanishCardContentById[card.id]?.trim() || card.content;
}
