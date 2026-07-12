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
const EXPECTED_REVISED_CONTENT_ES = {
  'f-i-r2':
    'Cautivo / Tentación: Jugador activo venda a Objetivo, lo rodea una vez y dirige una pose—arrodillarse, ponerse de pie o girar. Objetivo elige una, la mantiene 10 segundos y Jugador activo retira la venda.',
  'lvl2-c-009':
    'Foto del futuro: Jugador activo posa con Objetivo como si un sueño compartido acabara de cumplirse. Mantengan la pose de celebración durante 30 segundos y anuncien qué ocurrió.',
  'lvl3-qk-008':
    'Estilo de lencería: Jugador activo elige una prenda limpia de lencería, pantaletas, sostén o ropa interior para Objetivo. Objetivo la sostiene sobre su conjunto mientras Jugador activo dirige una pose durante 30 segundos.',
  'lvl4-c-005':
    'Equilibrio con la pala: Jugador activo equilibra la pala sobre las palmas abiertas de Objetivo. Objetivo se queda quieto durante 30 segundos; si se cae, Objetivo le da a Jugador activo un cumplido pícaro.',
  'lvl4-qk-007':
    'Cetro de pala: Objetivo sostiene la pala como un cetro real mientras Jugador activo dirige una pose autoritaria. Objetivo mantiene la pose durante 30 segundos.',
  'lvl5-d-002':
    'Reclamo con la pala: Jugador activo golpea una vez la pala contra su propia palma, la coloca sobre el regazo de Objetivo y da una orden de pose. Objetivo mantiene la pose durante 30 segundos.',
  'lvl5-c-004':
    'Señal con la pala: Jugador activo coloca la pala en las manos de Objetivo. Objetivo la presenta de vuelta y Jugador activo da un golpecito suavísimo sobre la ropa.',
  'lvl5-c-007':
    'Reclamo con collar: Jugador activo le pone un collar a Objetivo. Objetivo lo lleva durante las próximas dos rondas y luego Jugador activo se lo quita lentamente.',
  'lvl5-c-014':
    'Marca de labial: Jugador activo le pone labial a Objetivo—labios llamativos, una marca en la mejilla o la huella de un beso. Objetivo lo conserva durante las próximas dos rondas.',
} as const;

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
    expect(hasGameCardSpanishTranslation(translatedCard.id)).toBe(true);
    expect(getGameCardDisplayContent(translatedCard, 'es')).toBe(
      'Toque misterioso: Véndame los ojos durante 1 minuto. Toca mi antebrazo o mi hombro una vez con un objeto o una parte del cuerpo. Yo adivino qué me tocó; si fallo, me quito una prenda, y si acierto, te la quitas tú.'
    );
    expect(getGameCardDisplayContent(translatedCard, 'en')).toBe(
      translatedCard.content
    );

    for (const [id, expectedContent] of Object.entries(
      EXPECTED_REVISED_CONTENT_ES
    )) {
      const card = MASTER_DECK.find((candidate) => candidate.id === id) as GameCard;

      expect(hasGameCardSpanishTranslation(id)).toBe(true);
      expect(getGameCardDisplayContent(card, 'es')).toBe(expectedContent);
      expect(getGameCardDisplayContent(card, 'en')).toBe(card.content);
    }

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

    const masterCardById = new Map(MASTER_DECK.map((card) => [card.id, card]));

    for (const [id, expectedContent] of Object.entries(
      EXPECTED_REVISED_CONTENT_ES
    )) {
      const row = rowById.get(id);

      expect(row?.[englishIndex]).toBe(masterCardById.get(id)?.content);
      expect(row?.[spanishIndex]).toBe(expectedContent);
    }
  });
});
