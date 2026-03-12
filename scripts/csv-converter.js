const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../apps/mobile/data');
const JSON_FILE = path.join(DATA_DIR, 'game_cards.json');
const CSV_FILE = path.join(DATA_DIR, 'game_cards.csv');

function jsonToCsv() {
  const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  const cards = jsonData.cards;
  
  // CSV Header
  const headers = ['id', 'type', 'content', 'intensity', 'category', 'isPremium', 'estimatedTime', 'requires', 'safetyNotes'];
  
  // Convert cards to CSV rows
  const rows = cards.map(card => {
    return [
      card.id,
      card.type,
      // Escape quotes and newlines in content
      `"${card.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      card.intensity,
      card.category,
      card.isPremium ? 'true' : 'false',
      card.estimatedTime,
      card.requires ? card.requires.join(';') : '',
      card.safetyNotes ? `"${card.safetyNotes.replace(/"/g, '""')}"` : ''
    ].join(',');
  });
  
  const csv = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(CSV_FILE, csv);
  
  console.log(`✅ Exported ${cards.length} cards to game_cards.csv`);
}

function csvToJson() {
  const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  const cards = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line handling quoted fields
    const fields = parseCsvLine(line);
    if (fields.length < 7) continue;
    
    const card = {
      id: fields[0],
      type: fields[1],
      content: fields[2].replace(/""/g, '"').trim(),
      intensity: parseInt(fields[3]) || 1,
      category: fields[4],
      isPremium: fields[5] === 'true',
      estimatedTime: fields[6],
    };
    
    // Optional fields
    if (fields[7]) card.requires = fields[7].split(';').filter(s => s.trim());
    if (fields[8]) card.safetyNotes = fields[8].replace(/""/g, '"').trim();
    
    cards.push(card);
  }
  
  // Read existing JSON to preserve metadata
  const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  jsonData.cards = cards;
  jsonData._meta.totalCards = cards.length;
  jsonData._meta.lastUpdated = new Date().toISOString().split('T')[0];
  
  fs.writeFileSync(JSON_FILE, JSON.stringify(jsonData, null, 2));
  
  console.log(`✅ Imported ${cards.length} cards from game_cards.csv to game_cards.json`);
}

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current.trim());
  return fields;
}

// CLI
const command = process.argv[2];

if (command === 'export' || command === 'to-csv') {
  jsonToCsv();
} else if (command === 'import' || command === 'to-json') {
  csvToJson();
} else {
  console.log(`
SpiceSync Card CSV Converter

Usage:
  node csv-converter.js export    Convert JSON to CSV (for editing)
  node csv-converter.js import    Convert CSV back to JSON (after editing)

The CSV file can be opened in Excel, Google Sheets, or any spreadsheet app.
Edit the cards, save as CSV, then run 'import' to update the JSON.
`);
}
