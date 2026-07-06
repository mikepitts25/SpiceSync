import fs from 'fs';
import path from 'path';

import {
  getGameCardDisplayContent,
  hasGameCardSpanishTranslation,
} from '../data/gameCardTranslations';
import { MASTER_DECK, type GameCard } from '../data/gameCards';

const appRoot = path.resolve(__dirname, '..');
const translationCsvPath = path.join(
  appRoot,
  'data/game_card_translations.csv'
);
const EXPECTED_PROP_BOUNDARY_CONTENT_EN =
  'Prop Boundary Check: Player up picks one prop—collar, leash, whip, paddle, lingerie, or makeup. Both players answer yes, maybe, or no. Use that prop later only if both say yes or maybe.';
const EXPECTED_PROP_BOUNDARY_CONTENT_ES =
  'Chequeo de objetos: El jugador activo elige un objeto: collar, correa, látigo, pala, lencería o maquillaje. Ambos dicen sí, quizás o no. Usen ese objeto más tarde solo si ambos dicen sí o quizás.';

function parseCsvLine(line: string) {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  fields.push(current);
  return fields;
}

describe('game card translations', () => {
  it('uses Spanish card text by id and falls back to English when missing', () => {
    const translatedCard = MASTER_DECK.find(
      (card) => card.id === 'lvl4-c-014'
    ) as GameCard;
    const propBoundaryCard = MASTER_DECK.find(
      (card) => card.id === 'lvl5-c-007'
    ) as GameCard;

    expect(hasGameCardSpanishTranslation(translatedCard.id)).toBe(true);
    expect(getGameCardDisplayContent(translatedCard, 'es')).toBe(
      'Toque misterioso: Véndame los ojos durante 1 minuto. Toca mi antebrazo o mi hombro una vez con un objeto o una parte del cuerpo. Yo adivino qué me tocó; si fallo, me quito una prenda, y si acierto, te la quitas tú.'
    );
    expect(getGameCardDisplayContent(translatedCard, 'en')).toBe(
      translatedCard.content
    );
    expect(getGameCardDisplayContent(propBoundaryCard, 'es')).toBe(
      EXPECTED_PROP_BOUNDARY_CONTENT_ES
    );
    expect(getGameCardDisplayContent(propBoundaryCard, 'en')).toBe(
      EXPECTED_PROP_BOUNDARY_CONTENT_EN
    );

    // A card whose id has no Spanish entry falls back to its English content.
    const untranslatedCard = {
      ...translatedCard,
      id: 'nonexistent-card-id',
      content: 'English fallback content.',
    } as GameCard;

    expect(hasGameCardSpanishTranslation(untranslatedCard.id)).toBe(false);
    expect(getGameCardDisplayContent(untranslatedCard, 'es')).toBe(
      untranslatedCard.content
    );
  });

  it('keeps a spreadsheet-friendly translation row for every master deck card', () => {
    const lines = fs.readFileSync(translationCsvPath, 'utf8').trimEnd().split('\n');
    const [headerLine, ...rows] = lines;
    const headers = parseCsvLine(headerLine);
    const idIndex = headers.indexOf('id');
    const englishIndex = headers.indexOf('content_en');
    const spanishIndex = headers.indexOf('content_es');

    expect(headers).toEqual([
      'id',
      'type',
      'intensity',
      'category',
      'isPremium',
      'estimatedTime',
      'requires',
      'safetyNotes',
      'content_en',
      'content_es',
      'translationStatus',
      'notes',
    ]);
    expect(rows).toHaveLength(MASTER_DECK.length);

    const rowById = new Map(
      rows.map((row) => {
        const fields = parseCsvLine(row);
        expect(fields).toHaveLength(headers.length);
        return [fields[idIndex], fields];
      })
    );
    const mysteryTouchRow = rowById.get('lvl4-c-014');

    expect(mysteryTouchRow?.[englishIndex]).toBe(
      'Mystery Touch: Blindfold me for 1 minute. Touch my forearm or shoulder once with one object or one body part. I guess what touched me; wrong guess means I remove one clothing item, right guess means you remove one.'
    );
    expect(mysteryTouchRow?.[spanishIndex]).toBe(
      'Toque misterioso: Véndame los ojos durante 1 minuto. Toca mi antebrazo o mi hombro una vez con un objeto o una parte del cuerpo. Yo adivino qué me tocó; si fallo, me quito una prenda, y si acierto, te la quitas tú.'
    );

    const propBoundaryRow = rowById.get('lvl5-c-007');

    expect(propBoundaryRow?.[englishIndex]).toBe(
      EXPECTED_PROP_BOUNDARY_CONTENT_EN
    );
    expect(propBoundaryRow?.[spanishIndex]).toBe(
      EXPECTED_PROP_BOUNDARY_CONTENT_ES
    );
  });
});
