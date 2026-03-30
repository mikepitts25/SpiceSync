const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../apps/mobile/data');

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

// Parse TypeScript array export from file content
function parseTypeScriptArray(content, arrayName) {
  const regex = new RegExp(`export\\s+const\\s+${arrayName}\\s*:\\s*\\w+\\[\\]\\s*=\\s*([\\s\\S]*?);\\s*(?:\\n|export|\\/\\/|$)`, 'm');
  const match = content.match(regex);
  
  if (!match) {
    return [];
  }
  
  let arrayText = match[1].trim();
  
  // Remove TypeScript type annotations from objects
  arrayText = arrayText.replace(/(\w+):\s*\w+(\[\])?\s*=>?/g, '$1:');
  arrayText = arrayText.replace(/as\s+\w+(\[\])?/g, '');
  
  // Convert single quotes to double quotes for JSON parsing
  arrayText = arrayText.replace(/'/g, '"');
  
  // Handle trailing commas
  arrayText = arrayText.replace(/,\s*([}\]])/g, '$1');
  
  try {
    return JSON.parse(arrayText);
  } catch (e) {
    console.error(`Failed to parse ${arrayName}:`, e.message);
    return [];
  }
}

// Serialize array back to TypeScript format
function serializeTypeScriptArray(arrayName, data, typeAnnotation = 'any[]') {
  const items = data.map(item => {
    const fields = Object.entries(item).map(([key, value]) => {
      let formattedValue;
      
      if (value === null || value === undefined) {
        formattedValue = 'undefined';
      } else if (typeof value === 'string') {
        // Escape single quotes and newlines
        const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
        formattedValue = `'${escaped}'`;
      } else if (typeof value === 'boolean') {
        formattedValue = value ? 'true' : 'false';
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          formattedValue = '[]';
        } else if (typeof value[0] === 'string') {
          formattedValue = `[${value.map(v => `'${v.replace(/'/g, "\\'")}'`).join(', ')}]`;
        } else {
          formattedValue = JSON.stringify(value);
        }
      } else {
        formattedValue = JSON.stringify(value);
      }
      
      return `    ${key}: ${formattedValue}`;
    }).join(',\n');
    
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
      card._source = 'main';
      card._arrayName = 'FREE_CARDS';
      cards.push(card);
    });
    
    // Parse PREMIUM_CARDS
    const premiumCards = parseTypeScriptArray(mainContent, 'PREMIUM_CARDS');
    premiumCards.forEach(card => {
      card._source = 'main';
      card._arrayName = 'PREMIUM_CARDS';
      cards.push(card);
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
        card._source = file;
        card._arrayName = array;
        cards.push(card);
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
  FILE_PATHS
};