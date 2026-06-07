const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA_DIR = path.join(__dirname, '..', '..', 'apps', 'mobile', 'data');

// File paths for each content type
const FILE_PATHS = {
  gameCards: {
    main: path.join(DATA_DIR, 'gameCards.ts'),
    level1: path.join(DATA_DIR, 'game_cards_level1.ts'),
    level2: path.join(DATA_DIR, 'game_cards_level2.ts'),
    level3: path.join(DATA_DIR, 'game_cards_level3.ts'),
    level4: path.join(DATA_DIR, 'game_cards_level4.ts'),
    level5: path.join(DATA_DIR, 'game_cards_level5.ts'),
    expansion: path.join(DATA_DIR, 'game_cards_expansion.ts')
  },
  kinks: {
    en: path.join(DATA_DIR, 'kinks.en.json'),
    es: path.join(DATA_DIR, 'kinks.es.json')
  },
  conversationStarters: {
    dateNight: path.join(DATA_DIR, 'conversation_starters_date_night.ts'),
    gettingToKnow: path.join(DATA_DIR, 'conversation_starters_getting_to_know.ts'),
    loveLanguages: path.join(DATA_DIR, 'conversation_starters_love_languages.ts'),
    relationship: path.join(DATA_DIR, 'conversation_starters_relationship.ts'),
    spicy: path.join(DATA_DIR, 'conversation_starters_spicy.ts')
  }
};

function findTypeScriptArrayLiteral(content, arrayName) {
  const marker = new RegExp(`export\\s+const\\s+${arrayName}\\b`).exec(content);
  if (!marker) return null;

  const equalsIndex = content.indexOf('=', marker.index);
  if (equalsIndex === -1) return null;

  const startIndex = content.indexOf('[', equalsIndex);
  if (startIndex === -1) return null;

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = startIndex; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      blockComment = true;
      i += 1;
      continue;
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }

    if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return content.slice(startIndex, i + 1);
      }
    }
  }

  return null;
}

// Parse TypeScript array exports that use normal object literal syntax.
function parseTypeScriptArray(content, arrayName) {
  const arrayText = findTypeScriptArrayLiteral(content, arrayName);
  if (!arrayText) return [];

  try {
    return vm.runInNewContext(`(${arrayText})`, {}, { timeout: 1000 });
  } catch (e) {
    console.error(`Failed to parse ${arrayName}:`, e.message);
    return [];
  }
}

function gameModeForIntensity(intensity) {
  const value = Number(intensity);
  if (value >= 4) return 'Intense';
  if (value >= 1) return 'Normal';
  return '';
}

function annotateGameCard(card, source, arrayName) {
  card._source = source;
  card._arrayName = arrayName;
  card._gameMode = gameModeForIntensity(card.intensity);
  return card;
}

function formatTypeScriptValue(value) {
  if (value === null) return 'null';

  if (typeof value === 'string') {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, '\\n');
    return `'${escaped}'`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[${value.map(formatTypeScriptValue).join(', ')}]`;
  }

  return JSON.stringify(value, null, 2);
}

// Serialize array back to TypeScript format
function serializeTypeScriptArray(arrayName, data, typeAnnotation = 'any[]') {
  const items = data.map(item => {
    const fields = Object.entries(item)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `    ${key}: ${formatTypeScriptValue(value)}`)
      .join(',\n');
    
    return `  {\n${fields}\n  }`;
  }).join(',\n');
  
  return `export const ${arrayName}: ${typeAnnotation} = [\n${items}\n];`;
}

// Load Game Cards from all files
function loadGameCards() {
  const cards = [];
  
  // Load main gameCards.ts
  try {
    const mainContent = fs.readFileSync(FILE_PATHS.gameCards.main, 'utf8');
    
    // Parse FREE_CARDS
    const freeCards = parseTypeScriptArray(mainContent, 'FREE_CARDS');
    freeCards.forEach(card => {
      cards.push(annotateGameCard(card, 'main', 'FREE_CARDS'));
    });
    
    // Parse PREMIUM_CARDS
    const premiumCards = parseTypeScriptArray(mainContent, 'PREMIUM_CARDS');
    premiumCards.forEach(card => {
      cards.push(annotateGameCard(card, 'main', 'PREMIUM_CARDS'));
    });
  } catch (e) {
    console.error('Error loading main gameCards:', e.message);
  }
  
  // Load level files
  const levelFiles = [
    { file: 'level1', array: 'LEVEL1_CARDS' },
    { file: 'level2', array: 'LEVEL2_CARDS' },
    { file: 'level3', array: 'LEVEL3_CARDS' },
    { file: 'level4', array: 'LEVEL4_CARDS' },
    { file: 'level5', array: 'LEVEL5_CARDS' }
  ];
  
  for (const { file, array } of levelFiles) {
    try {
      const content = fs.readFileSync(FILE_PATHS.gameCards[file], 'utf8');
      const levelCards = parseTypeScriptArray(content, array);
      levelCards.forEach(card => {
        cards.push(annotateGameCard(card, file, array));
      });
    } catch (e) {
      console.error(`Error loading ${file}:`, e.message);
    }
  }
  
  return cards;
}

// Load Kinks from JSON files
function loadKinks() {
  const kinks = [];
  
  try {
    const enContent = fs.readFileSync(FILE_PATHS.kinks.en, 'utf8');
    const enKinks = JSON.parse(enContent);
    enKinks.forEach(kink => {
      kink._source = 'en';
      kinks.push(kink);
    });
  } catch (e) {
    console.error('Error loading English kinks:', e.message);
  }
  
  return kinks;
}

// Load Conversation Starters from all files
function loadConversationStarters() {
  const starters = [];
  
  const starterFiles = [
    { file: 'dateNight', array: 'dateNightStarters' },
    { file: 'gettingToKnow', array: 'gettingToKnowStarters' },
    { file: 'loveLanguages', array: 'loveLanguageStarters' },
    { file: 'relationship', array: 'relationshipStarters' },
    { file: 'spicy', array: 'spicyStarters' }
  ];
  
  for (const { file, array } of starterFiles) {
    try {
      const content = fs.readFileSync(FILE_PATHS.conversationStarters[file], 'utf8');
      const fileStarters = parseTypeScriptArray(content, array);
      fileStarters.forEach(starter => {
        starter._source = file;
        starter._arrayName = array;
        starters.push(starter);
      });
    } catch (e) {
      console.error(`Error loading ${file}:`, e.message);
    }
  }
  
  return starters;
}

// Save Game Cards back to files
function saveGameCards(cards) {
  // Group cards by source file
  const bySource = {};
  cards.forEach(card => {
    const source = card._source || 'main';
    const arrayName = card._arrayName || 'FREE_CARDS';
    
    if (!bySource[source]) {
      bySource[source] = {};
    }
    if (!bySource[source][arrayName]) {
      bySource[source][arrayName] = [];
    }
    
    // Remove internal tracking fields
    const cleanCard = { ...card };
    delete cleanCard._source;
    delete cleanCard._arrayName;
    delete cleanCard._gameMode;
    bySource[source][arrayName].push(cleanCard);
  });
  
  // Save to main file
  if (bySource.main) {
    let mainContent = fs.readFileSync(FILE_PATHS.gameCards.main, 'utf8');
    
    // Get the type definitions and imports from the original file
    const typeMatch = mainContent.match(/([\s\S]*?)(?=export const FREE_CARDS)/);
    const header = typeMatch ? typeMatch[1] : '';
    
    const freeCardsStr = serializeTypeScriptArray('FREE_CARDS', bySource.main.FREE_CARDS || [], 'GameCard[]');;
    const premiumCardsStr = serializeTypeScriptArray('PREMIUM_CARDS', bySource.main.PREMIUM_CARDS || [], 'GameCard[]');
    
    // Reconstruct file with all the other exports
    const footerMatch = mainContent.match(/export const ALL_CARDS[\s\S]*$/);
    const footer = footerMatch ? footerMatch[0] : '';
    
    const newContent = `${header}${freeCardsStr}\n\n${premiumCardsStr}\n\n${footer}`;
    fs.writeFileSync(FILE_PATHS.gameCards.main, newContent, 'utf8');
  }
  
  // Save level files
  const levelMap = {
    level1: { path: FILE_PATHS.gameCards.level1, array: 'LEVEL1_CARDS', import: `import { GameCard } from './gameCards';` },
    level2: { path: FILE_PATHS.gameCards.level2, array: 'LEVEL2_CARDS', import: `import { GameCard } from './gameCards';` },
    level3: { path: FILE_PATHS.gameCards.level3, array: 'LEVEL3_CARDS', import: `import { GameCard } from './gameCards';` },
    level4: { path: FILE_PATHS.gameCards.level4, array: 'LEVEL4_CARDS', import: `import { GameCard } from './gameCards';` },
    level5: { path: FILE_PATHS.gameCards.level5, array: 'LEVEL5_CARDS', import: `import { GameCard } from './gameCards';` }
  };
  
  for (const [source, config] of Object.entries(levelMap)) {
    if (bySource[source]) {
      const cards = bySource[source][config.array] || [];
      const cardsStr = serializeTypeScriptArray(config.array, cards, 'GameCard[]');
      const content = `${config.import}\n\n${cardsStr}\n`;
      fs.writeFileSync(config.path, content, 'utf8');
    }
  }
}

// Save Kinks back to JSON file
function saveKinks(kinks) {
  // Group by source (en/es)
  const enKinks = kinks.filter(k => k._source === 'en' || !k._source).map(k => {
    const clean = { ...k };
    delete clean._source;
    return clean;
  });
  
  fs.writeFileSync(FILE_PATHS.kinks.en, JSON.stringify(enKinks, null, 2), 'utf8');
}

// Save Conversation Starters back to files
function saveConversationStarters(starters) {
  // Group by source file
  const bySource = {};
  starters.forEach(starter => {
    const source = starter._source || 'dateNight';
    const arrayName = starter._arrayName || 'dateNightStarters';
    
    if (!bySource[source]) {
      bySource[source] = { arrayName, items: [] };
    }
    
    const cleanStarter = { ...starter };
    delete cleanStarter._source;
    delete cleanStarter._arrayName;
    bySource[source].items.push(cleanStarter);
  });
  
  // File configurations
  const fileConfigs = {
    dateNight: {
      path: FILE_PATHS.conversationStarters.dateNight,
      array: 'dateNightStarters',
      comment: 'Date Night Fun - 50 conversation prompts',
      importType: 'ConversationStarter'
    },
    gettingToKnow: {
      path: FILE_PATHS.conversationStarters.gettingToKnow,
      array: 'gettingToKnowStarters',
      comment: 'Getting to Know You - Deep questions for new couples',
      importType: 'ConversationStarter'
    },
    loveLanguages: {
      path: FILE_PATHS.conversationStarters.loveLanguages,
      array: 'loveLanguageStarters',
      comment: 'Love Languages - Understanding how you give and receive love',
      importType: 'ConversationStarter'
    },
    relationship: {
      path: FILE_PATHS.conversationStarters.relationship,
      array: 'relationshipStarters',
      comment: 'Relationship Deep Dive - Questions for established couples',
      importType: 'ConversationStarter'
    },
    spicy: {
      path: FILE_PATHS.conversationStarters.spicy,
      array: 'spicyStarters',
      comment: 'Spicy Questions - Turn up the heat',
      importType: 'ConversationStarter'
    }
  };
  
  for (const [source, data] of Object.entries(bySource)) {
    const config = fileConfigs[source];
    if (config) {
      const cardsStr = serializeTypeScriptArray(data.arrayName, data.items, 'ConversationStarter[]');
      const content = `// apps/mobile/data/${path.basename(config.path)}\n// ${config.comment}\n\nimport { ${config.importType} } from '../lib/conversationStarters';\n\n${cardsStr}\n`;
      fs.writeFileSync(config.path, content, 'utf8');
    }
  }
}

module.exports = {
  loadGameCards,
  loadKinks,
  loadConversationStarters,
  saveGameCards,
  saveKinks,
  saveConversationStarters,
  FILE_PATHS,
  gameModeForIntensity
};
