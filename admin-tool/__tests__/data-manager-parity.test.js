const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DataManager = require('../lib/data-manager');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeGameCardsFixture(dataDir) {
  writeFile(
    path.join(dataDir, 'gameCards.ts'),
    `import { Something } from './somewhere';

export type GameCard = any;

export const FREE_CARDS: GameCard[] = [
  {
    id: 'f-t1',
    type: 'truth',
    content: 'Main free card',
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A'
  }
];

export const PREMIUM_CARDS: GameCard[] = [
  {
    id: 'p-d1',
    type: 'dare',
    content: 'Main premium card',
    intensity: 2,
    category: 'physical',
    isPremium: true,
    estimatedTime: '1 min'
  }
];

export const ALL_CARDS: GameCard[] = [...FREE_CARDS, ...PREMIUM_CARDS];
`
  );

  for (let level = 1; level <= 5; level += 1) {
    writeFile(
      path.join(dataDir, `game_cards_level${level}.ts`),
      `import { GameCard } from './gameCards';

export const LEVEL${level}_CARDS: GameCard[] = [
  {
    id: 'lvl${level}-truth-001',
    type: 'truth',
    content: 'Level ${level} card',
    intensity: ${level},
    category: 'communication',
    isPremium: ${level > 1},
    estimatedTime: 'N/A'
  }
];
`
    );
  }
}

function writeKinkFixtures(dataDir) {
  writeFile(path.join(dataDir, 'kinks.en.json'), '[]\n');
  writeFile(path.join(dataDir, 'kinks.es.json'), '[]\n');
}

const conversationSources = [
  ['getting_to_know', 'gettingToKnowStarters'],
  ['relationship', 'relationshipStarters'],
  ['date_night', 'dateNightStarters'],
  ['spicy', 'spicyStarters'],
  ['love_languages', 'loveLanguagesStarters'],
];

function writeConversationFixtures(dataDir) {
  for (const [category, arrayName] of conversationSources) {
    for (const lang of ['en', 'es']) {
      const suffix = lang === 'es' ? '.es' : '';
      const exportName = lang === 'es' ? `${arrayName}ES` : arrayName;
      writeFile(
        path.join(dataDir, `conversation_starters_${category}${suffix}.ts`),
        `import { ConversationStarter } from '../lib/conversationStarters';

export const ${exportName}: ConversationStarter[] = [
  {
    id: 'conv-${category}-001',
    category: '${category}',
    intensity: 1,
    question: '${category} question',
    followUps: ['follow up'],
    context: 'context',
    tags: ['tag']
  }
];
`
      );
    }
  }
}

function createFixtureDataDir() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spicesync-admin-'));
  writeGameCardsFixture(dataDir);
  writeKinkFixtures(dataDir);
  writeConversationFixtures(dataDir);
  return dataDir;
}

const dataDir = createFixtureDataDir();
const manager = new DataManager(dataDir);

assert.deepStrictEqual(
  Array.from(new Set(manager.cards.map((card) => card.sourceFile))).sort(),
  [
    'gameCards.ts',
    'game_cards_level1.ts',
    'game_cards_level2.ts',
    'game_cards_level3.ts',
    'game_cards_level4.ts',
    'game_cards_level5.ts',
  ]
);

assert.strictEqual(
  manager.cards.filter((card) => card.sourceFile === 'gameCards.ts').length,
  2
);

const dateNight = manager.conversationStarters.en.find(
  (starter) => starter.category === 'date_night'
);
dateNight.question = 'Updated date night question';

manager.saveConversationStarters('en');

const savedDateNight = fs.readFileSync(
  path.join(dataDir, 'conversation_starters_date_night.ts'),
  'utf8'
);

assert.match(savedDateNight, /Updated date night question/);
assert.match(savedDateNight, /export const dateNightStarters: ConversationStarter\[\]/);
