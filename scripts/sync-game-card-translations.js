const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(REPO_ROOT, 'apps/mobile/data');
const CSV_FILE = path.join(DATA_DIR, 'game_card_translations.csv');
const OUTPUT_FILE = path.join(DATA_DIR, 'game_card_translations.es.json');

function parseCsvLine(line) {
  const fields = [];
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

function syncTranslations() {
  const lines = fs.readFileSync(CSV_FILE, 'utf8').trimEnd().split('\n');
  const headers = parseCsvLine(lines[0]);
  const idIndex = headers.indexOf('id');
  const spanishIndex = headers.indexOf('content_es');

  if (idIndex === -1 || spanishIndex === -1) {
    throw new Error('CSV must include id and content_es columns.');
  }

  const translations = {};

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;

    const fields = parseCsvLine(line);
    const id = fields[idIndex]?.trim();
    const contentEs = fields[spanishIndex]?.trim();

    if (!id || !contentEs) continue;
    translations[id] = contentEs;
  }

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(translations, null, 2)}\n`);
  console.log(
    `Synced ${Object.keys(translations).length} Spanish card translations.`
  );
}

syncTranslations();
