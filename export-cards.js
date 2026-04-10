// Script to export all SpiceSync game cards to CSV
// Handles both single-line and multiline card formats

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'apps', 'mobile', 'data');

function readFile(filename) {
  try {
    return fs.readFileSync(path.join(dataDir, filename), 'utf-8');
  } catch (e) {
    console.error(`Could not read ${filename}:`, e.message);
    return '';
  }
}

// Parse single-line cards (from gameCards.ts)
function parseSingleLineCards(content, filename) {
  const cards = [];
  
  // Match single-line card objects
  const pattern = /\{\s*id:\s*['"]([^'"]+)['"]\s*,\s*type:\s*['"]([^'"]+)['"]\s*,\s*content:\s*["']([^"']+)["']\s*,\s*intensity:\s*(\d)\s*,\s*category:\s*['"]([^'"]+)['"]\s*,\s*isPremium:\s*(true|false)\s*,\s*estimatedTime:\s*['"]([^'"]+)['"](?:\s*,\s*requires:\s*(\[[^\]]*\]))?(?:\s*,\s*safetyNotes:\s*["']([^"']*)["'])?\s*\}/g;
  
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const requires = match[8] ? match[8].replace(/[\[\]'"\s]/g, '').split(',').filter(Boolean).join(', ') : '';
    
    cards.push({
      id: match[1],
      type: match[2],
      content: match[3].replace(/\\n/g, ' ').trim(),
      intensity: match[4],
      category: match[5],
      isPremium: match[6] === 'true' ? 'Yes' : 'No',
      estimatedTime: match[7],
      requires: requires,
      safetyNotes: (match[9] || '').replace(/\\n/g, ' ').trim(),
      sourceFile: filename
    });
  }
  
  return cards;
}

// Parse multiline cards (from expansion files)
function parseMultilineCards(content, filename) {
  const cards = [];
  
  // Find all card blocks using a different approach
  // Look for patterns like: {\n  id: '...'
  const cardBlockPattern = /\{\s*\n\s*id:\s*['"]([^'"]+)['"]\s*,\s*\n([\s\S]*?)\n\s*\}(?:\s*,|\s*$)/g;
  
  let match;
  while ((match = cardBlockPattern.exec(content)) !== null) {
    const id = match[1];
    const blockContent = match[2];
    
    // Extract fields from block
    const type = extractFieldFromBlock(blockContent, 'type');
    const cardContent = extractContentFromBlock(blockContent, 'content');
    const intensity = extractFieldFromBlock(blockContent, 'intensity') || '3';
    const category = extractFieldFromBlock(blockContent, 'category') || 'intimate';
    const isPremium = extractFieldFromBlock(blockContent, 'isPremium') === 'true';
    const estimatedTime = extractFieldFromBlock(blockContent, 'estimatedTime') || '5 min';
    const requires = extractArrayFromBlock(blockContent, 'requires');
    const safetyNotes = extractContentFromBlock(blockContent, 'safetyNotes');
    
    if (id && type && cardContent) {
      cards.push({
        id,
        type,
        content: cardContent,
        intensity,
        category,
        isPremium: isPremium ? 'Yes' : 'No',
        estimatedTime,
        requires,
        safetyNotes,
        sourceFile: filename
      });
    }
  }
  
  return cards;
}

function extractFieldFromBlock(block, fieldName) {
  const pattern = new RegExp(`${fieldName}:\\s*(?:['"])?([^'"\\n,]+)(?:['"])?,?\\s*$`, 'm');
  const match = block.match(pattern);
  return match ? match[1].trim() : '';
}

function extractContentFromBlock(block, fieldName) {
  // Match content: "..." or content: '...' (multiline)
  // Try double quotes first, then single quotes
  const patterns = [
    new RegExp(`${fieldName}:\\s*"([\\s\\S]*?)"(?:,)?\\s*$`, 'm'),
    new RegExp(`${fieldName}:\\s*'([\\s\\S]*?)'(?:,)?\\s*$`, 'm')
  ];
  
  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match) {
      return match[1]
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
  return '';
}

function extractArrayFromBlock(block, fieldName) {
  const pattern = new RegExp(`${fieldName}:\\s*\\[([^\\]]*)\\]`, '');
  const match = block.match(pattern);
  if (match) {
    return match[1]
      .replace(/['"\s]/g, '')
      .split(',')
      .filter(Boolean)
      .join(', ');
  }
  return '';
}

// Collect all cards
console.log('Parsing game cards...\n');

const allCards = [];

// Parse main gameCards.ts (single-line format)
const mainContent = readFile('gameCards.ts');
const mainCards = parseSingleLineCards(mainContent, 'gameCards.ts');
console.log(`gameCards.ts: ${mainCards.length} cards (single-line format)`);
allCards.push(...mainCards);

// Parse expansion files (multiline format)
const expansionFiles = [
  'game_cards_level1.ts',
  'game_cards_level2.ts',
  'game_cards_level3.ts',
  'game_cards_level4.ts',
  'game_cards_level5.ts'
];

for (const file of expansionFiles) {
  const content = readFile(file);
  if (content) {
    const cards = parseMultilineCards(content, file);
    console.log(`${file}: ${cards.length} cards`);
    allCards.push(...cards);
  }
}

console.log(`\nTotal cards found: ${allCards.length}`);

if (allCards.length === 0) {
  console.log('\n⚠️ No cards found.');
  process.exit(1);
}

// Create CSV
const headers = ['ID', 'Type', 'Content', 'Intensity', 'Category', 'IsPremium', 'EstimatedTime', 'ToyRequirements', 'SafetyNotes', 'SourceFile'];

const csvRows = [headers.join(',')];

for (const card of allCards) {
  // Escape content for CSV
  const escape = (str) => {
    if (str === undefined || str === null) return '';
    str = String(str).replace(/"/g, '""');
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      str = `"${str}"`;
    }
    return str;
  };
  
  const row = [
    escape(card.id),
    escape(card.type),
    escape(card.content),
    escape(card.intensity),
    escape(card.category),
    escape(card.isPremium),
    escape(card.estimatedTime),
    escape(card.requires),
    escape(card.safetyNotes),
    escape(card.sourceFile)
  ];
  
  csvRows.push(row.join(','));
}

const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel
const outputPath = path.join(__dirname, 'spicesync_game_cards.csv');

fs.writeFileSync(outputPath, csvContent);

console.log(`\n✅ CSV exported to: ${outputPath}`);
console.log(`\nCard Summary:`);
console.log(`- Total: ${allCards.length}`);
console.log(`- Free: ${allCards.filter(c => c.isPremium === 'No').length}`);
console.log(`- Premium: ${allCards.filter(c => c.isPremium === 'Yes').length}`);
console.log(`- With Safety Notes: ${allCards.filter(c => c.safetyNotes && c.safetyNotes.length > 0).length}`);
console.log(`- With Toy Requirements: ${allCards.filter(c => c.requires && c.requires.length > 0).length}`);

// Type breakdown
const types = {};
for (const card of allCards) {
  types[card.type] = (types[card.type] || 0) + 1;
}
console.log(`\nBy Type:`);
for (const [type, count] of Object.entries(types).sort()) {
  console.log(`  ${type}: ${count}`);
}

// Category breakdown
const categories = {};
for (const card of allCards) {
  categories[card.category] = (categories[card.category] || 0) + 1;
}
console.log(`\nBy Category:`);
for (const [cat, count] of Object.entries(categories).sort()) {
  console.log(`  ${cat}: ${count}`);
}

// Intensity breakdown
const intensities = {};
for (const card of allCards) {
  intensities[card.intensity] = (intensities[card.intensity] || 0) + 1;
}
console.log(`\nBy Intensity:`);
for (let i = 1; i <= 5; i++) {
  console.log(`  Level ${i}: ${intensities[i] || 0}`);
}

// Source file breakdown
const sources = {};
for (const card of allCards) {
  sources[card.sourceFile] = (sources[card.sourceFile] || 0) + 1;
}
console.log(`\nBy Source File:`);
for (const [src, count] of Object.entries(sources).sort()) {
  console.log(`  ${src}: ${count}`);
}

// Sample cards with safety notes
const withSafety = allCards.filter(c => c.safetyNotes && c.safetyNotes.length > 0);
if (withSafety.length > 0) {
  console.log(`\nSample cards with safety notes:`);
  withSafety.slice(0, 5).forEach(c => {
    console.log(`  - ${c.id}: ${c.safetyNotes.substring(0, 60)}...`);
  });
}

// Sample cards with toy requirements
const withToys = allCards.filter(c => c.requires && c.requires.length > 0);
if (withToys.length > 0) {
  console.log(`\nSample cards with toy requirements:`);
  withToys.slice(0, 5).forEach(c => {
    console.log(`  - ${c.id}: ${c.requires}`);
  });
}