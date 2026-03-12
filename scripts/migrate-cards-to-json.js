/**
 * Card Migration Script
 * Converts all TypeScript card files into a single JSON file
 * Run: node scripts/migrate-cards-to-json.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../apps/mobile/data');
const OUTPUT_FILE = path.join(DATA_DIR, 'game_cards.json');

// Parse TypeScript array from file content
function parseCardsFromTS(content, levelName) {
  const cards = [];
  
  // Match card objects in the array
  const cardRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*type:\s*['"]([^'"]+)['"],\s*content:\s*['"]([^'"]*(?:\\.[^'"]*)*)['"],/g;
  
  let match;
  while ((match = cardRegex.exec(content)) !== null) {
    const id = match[1];
    const type = match[2];
    let contentText = match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n');
    
    // Find the rest of the card properties
    const cardStart = match.index;
    const cardEnd = findCardEnd(content, cardStart);
    const cardBlock = content.substring(cardStart, cardEnd);
    
    const card = {
      id,
      type,
      content: contentText,
      intensity: parseInt(extractValue(cardBlock, 'intensity')) || 1,
      category: extractValue(cardBlock, 'category'),
      isPremium: extractValue(cardBlock, 'isPremium') === 'true',
      estimatedTime: extractValue(cardBlock, 'estimatedTime'),
    };
    
    // Optional fields
    const requires = extractArray(cardBlock, 'requires');
    if (requires.length > 0) card.requires = requires;
    
    const safetyNotes = extractValue(cardBlock, 'safetyNotes');
    if (safetyNotes) card.safetyNotes = safetyNotes;
    
    cards.push(card);
  }
  
  console.log(`  ✓ Parsed ${cards.length} cards from ${levelName}`);
  return cards;
}

function findCardEnd(content, start) {
  let braceCount = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = start; i < content.length; i++) {
    const char = content[i];
    const prevChar = content[i - 1];
    
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
    } else if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) return i + 1;
      }
    }
  }
  return content.length;
}

function extractValue(block, key) {
  const regex = new RegExp(`${key}:\\s*['"]?([^'"\\n,\}]+)['"]?`, 'i');
  const match = block.match(regex);
  return match ? match[1].trim() : null;
}

function extractArray(block, key) {
  const regex = new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`, 'i');
  const match = block.match(regex);
  if (!match) return [];
  
  return match[1]
    .split(',')
    .map(s => s.trim().replace(/['"]/g, ''))
    .filter(s => s.length > 0);
}

// Alternative: Simple line-by-line parser for more reliability
function parseCardsSimple(content, levelName) {
  const cards = [];
  const lines = content.split('\n');
  let currentCard = null;
  let inCard = false;
  let braceDepth = 0;
  let cardBuffer = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Start of a card
    if (line.match(/^\s*\{\s*$/)) {
      inCard = true;
      braceDepth = 1;
      cardBuffer = [line];
      currentCard = {};
      continue;
    }
    
    if (inCard) {
      cardBuffer.push(line);
      
      // Track brace depth
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceDepth += openBraces - closeBraces;
      
      // End of card
      if (braceDepth === 0) {
        const cardText = cardBuffer.join('\n');
        
        // Extract fields with regex
        const id = extractField(cardText, 'id');
        if (id) {
          const card = {
            id: cleanString(id),
            type: cleanString(extractField(cardText, 'type')),
            content: cleanString(extractField(cardText, 'content')),
            intensity: parseInt(extractField(cardText, 'intensity')) || 1,
            category: cleanString(extractField(cardText, 'category')),
            isPremium: extractField(cardText, 'isPremium') === 'true',
            estimatedTime: cleanString(extractField(cardText, 'estimatedTime')),
          };
          
          const requires = extractArrayField(cardText, 'requires');
          if (requires.length > 0) card.requires = requires;
          
          const safetyNotes = cleanString(extractField(cardText, 'safetyNotes'));
          if (safetyNotes) card.safetyNotes = safetyNotes;
          
          cards.push(card);
        }
        
        inCard = false;
        cardBuffer = [];
      }
    }
  }
  
  console.log(`  ✓ Parsed ${cards.length} cards from ${levelName}`);
  return cards;
}

function extractField(text, field) {
  // Match field: 'value' or field: "value" or field: value
  const regex = new RegExp(`${field}:\\s*['"\`]([^'"\`]*)['"\`]|[,\\s]${field}:\\s*(true|false|[0-9]+)`, 'i');
  const match = text.match(regex);
  if (match) {
    return match[1] || match[2];
  }
  return null;
}

function extractArrayField(text, field) {
  const regex = new RegExp(`${field}:\\s*\\[([^\\]]*)\\]`, 'i');
  const match = text.match(regex);
  if (!match) return [];
  
  return match[1]
    .split(',')
    .map(s => s.trim().replace(/['"]/g, ''))
    .filter(s => s.length > 0 && s !== '[]');
}

function cleanString(str) {
  if (!str) return '';
  return str
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\'/g, "'")
    .trim();
}

// Parse single-line card format: { id: '...', type: '...', ... }
function parseSingleLineCards(content, arrayName, levelName) {
  const cards = [];
  
  // Find the array
  const arrayRegex = new RegExp(`export const ${arrayName}: GameCard\\[\\] = \\[[\\s\\S]*?\\];`);
  const arrayMatch = content.match(arrayRegex);
  
  if (!arrayMatch) {
    console.log(`  ⚠️  Could not find ${arrayName}`);
    return cards;
  }
  
  const arrayContent = arrayMatch[0];
  
  // Match individual card objects - handle both single-line and multi-line
  const cardRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*type:\s*['"]([^'"]+)['"],\s*content:\s*['"]([^'"]*(?:\\.[^'"]*)*)['"],\s*intensity:\s*(\d),\s*category:\s*['"]([^'"]+)['"],\s*isPremium:\s*(true|false),\s*estimatedTime:\s*['"]([^'"]+)['"](?:,\s*requires:\s*(\[[^\]]*\]))?(?:,\s*safetyNotes:\s*['"]([^'"]*(?:\\.[^'"]*)*)['"])?\s*\}/g;
  
  let match;
  while ((match = cardRegex.exec(arrayContent)) !== null) {
    const card = {
      id: match[1],
      type: match[2],
      content: match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\'/g, "'"),
      intensity: parseInt(match[4]),
      category: match[5],
      isPremium: match[6] === 'true',
      estimatedTime: match[7]
    };
    
    // Parse requires array if present
    if (match[8] && match[8] !== '[]') {
      const requires = match[8]
        .replace(/\[|\]/g, '')
        .split(',')
        .map(s => s.trim().replace(/['"]/g, ''))
        .filter(s => s.length > 0);
      if (requires.length > 0) card.requires = requires;
    }
    
    // Add safety notes if present
    if (match[9]) {
      card.safetyNotes = match[9].replace(/\\"/g, '"').replace(/\\n/g, '\n');
    }
    
    cards.push(card);
  }
  
  console.log(`  ✓ Parsed ${cards.length} cards from ${levelName}`);
  return cards;
}

async function migrate() {
  console.log('🎴 SpiceSync Card Migration\n');
  
  const allCards = [];
  
  // Files to process in order
  const files = [
    { file: 'gameCards.ts', name: 'Original Free + Premium', useSimple: true },
    { file: 'game_cards_level1.ts', name: 'Level 1 (Flirty)', useSimple: true },
    { file: 'game_cards_level2.ts', name: 'Level 2 (Warm)', useSimple: true },
    { file: 'game_cards_level3.ts', name: 'Level 3 (Spicy)', useSimple: true },
    { file: 'game_cards_level4.ts', name: 'Level 4 (Hot)', useSimple: true },
    { file: 'game_cards_level5.ts', name: 'Level 5 (Intense)', useSimple: true },
  ];
  
  for (const { file, name, useSimple } of files) {
    const filePath = path.join(DATA_DIR, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  Skipping ${file} (not found)`);
      continue;
    }
    
    console.log(`📄 Processing ${name}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract just the FREE_CARDS and PREMIUM_CARDS from gameCards.ts
    if (file === 'gameCards.ts') {
      const freeCards = parseSingleLineCards(content, 'FREE_CARDS', 'Free Cards');
      const premiumCards = parseSingleLineCards(content, 'PREMIUM_CARDS', 'Premium Cards');
      allCards.push(...freeCards, ...premiumCards);
    } else {
      const cards = parseCardsSimple(content, name);
      allCards.push(...cards);
    }
  }
  
  // Create output
  const output = {
    _meta: {
      description: "SpiceSync Game Cards - Master Database",
      totalCards: allCards.length,
      lastUpdated: new Date().toISOString().split('T')[0],
      version: "1.0",
      editingGuide: {
        idFormat: "{level}-{type}-{number}",
        levels: {
          free: "Original 25 free cards",
          premium: "Original 100 premium cards",
          lvl1: "Level 1: Flirty & Playful (FREE)",
          lvl2: "Level 2: Warm & Intimate (PREMIUM)",
          lvl3: "Level 3: Spicy & Adventurous (PREMIUM)",
          lvl4: "Level 4: Hot & Experimental (PREMIUM)",
          lvl5: "Level 5: Intense & Extreme (PREMIUM)"
        },
        types: {
          truth: "Questions to answer honestly",
          dare: "Actions to perform",
          challenge: "Longer activities or games",
          fantasy: "Scenario descriptions to act out",
          roleplay: "Character-based scenarios"
        },
        categories: ["communication", "physical", "emotional", "playful", "intimate"],
        intensity: "1-5 scale (1=mild, 5=extreme)",
        fields: {
          id: "Unique identifier (required)",
          type: "Card type from types above (required)",
          content: "The card text (required)",
          intensity: "1-5 (required)",
          category: "From categories list (required)",
          isPremium: "true/false (required)",
          estimatedTime: "e.g., '5 min', '10 min' (required)",
          requires: "Array of required items (optional)",
          safetyNotes: "Safety warnings for intense cards (optional)"
        }
      }
    },
    cards: allCards
  };
  
  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  
  console.log(`\n✅ Migration complete!`);
  console.log(`   Total cards: ${allCards.length}`);
  console.log(`   Output: ${OUTPUT_FILE}`);
  
  // Stats
  const byType = {};
  const byLevel = {};
  const byPremium = { free: 0, premium: 0 };
  
  allCards.forEach(card => {
    byType[card.type] = (byType[card.type] || 0) + 1;
    byPremium[card.isPremium ? 'premium' : 'free']++;
    
    const level = card.id.split('-')[0];
    byLevel[level] = (byLevel[level] || 0) + 1;
  });
  
  console.log(`\n📊 Statistics:`);
  console.log(`   By Type:`, byType);
  console.log(`   By Level:`, byLevel);
  console.log(`   Free: ${byPremium.free}, Premium: ${byPremium.premium}`);
}

migrate().catch(console.error);
