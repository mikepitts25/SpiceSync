const fs = require('fs');
const path = require('path');

class DataManager {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.cards = [];
    this.kinks = { en: [], es: [] };
    this.conversationStarters = { en: [], es: [] };
    this.loadAllData();
  }

  // ===== LOAD DATA =====

  loadAllData() {
    this.loadCards();
    this.loadKinks('en');
    this.loadKinks('es');
    this.loadConversationStarters('en');
    this.loadConversationStarters('es');
  }

  loadCards() {
    // Load main gameCards.ts
    const gameCardsPath = path.join(this.dataDir, 'gameCards.ts');
    const gameCardsContent = fs.readFileSync(gameCardsPath, 'utf-8');
    
    // Parse FREE_CARDS
    const freeMatch = gameCardsContent.match(/export const FREE_CARDS: GameCard\[\] = ([\s\S]*?);\n\n\/\/ ─── PREMIUM/);
    if (freeMatch) {
      this.cards.push(...this.parseCardsFromTs(freeMatch[1], false, 'gameCards.ts'));
    }
    
    // Parse PREMIUM_CARDS
    const premiumMatch = gameCardsContent.match(/export const PREMIUM_CARDS: GameCard\[\] = ([\s\S]*?);\n\n\/\/ ─── COMBINED/);
    if (premiumMatch) {
      this.cards.push(...this.parseCardsFromTs(premiumMatch[1], true, 'gameCards.ts'));
    }

    // Load expansion files
    const levels = [1, 2, 3, 4, 5];
    for (const level of levels) {
      const filePath = path.join(this.dataDir, `game_cards_level${level}.ts`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const match = content.match(/export const LEVEL\d+_CARDS: GameCard\[\] = ([\s\S]*?);\s*$/);
        if (match) {
          this.cards.push(...this.parseCardsFromTs(match[1], level >= 2, `game_cards_level${level}.ts`));
        }
      }
    }
  }

  parseCardsFromTs(content, isPremium, sourceFile) {
    const cards = [];
    
    // Match single-line cards
    const singleLinePattern = /\{\s*id:\s*['"]([^'"]+)['"]\s*,\s*type:\s*['"]([^'"]+)['"]\s*,\s*content:\s*["']([^"']+)["']\s*,\s*intensity:\s*(\d)\s*,\s*category:\s*['"]([^'"]+)['"]\s*,\s*isPremium:\s*(true|false)\s*,\s*estimatedTime:\s*['"]([^'"]+)['"](?:\s*,\s*requires:\s*(\[[^\]]*\]))?(?:\s*,\s*safetyNotes:\s*["']([^"']*)["'])?\s*\}/g;
    
    let match;
    while ((match = singleLinePattern.exec(content)) !== null) {
      cards.push({
        id: match[1],
        type: match[2],
        content: match[3],
        intensity: parseInt(match[4]),
        category: match[5],
        isPremium: match[6] === 'true',
        estimatedTime: match[7],
        requires: match[8] ? this.parseArray(match[8]) : [],
        safetyNotes: match[9] || '',
        sourceFile: sourceFile
      });
    }

    // Match multiline cards
    const multilinePattern = /\{\s*\n\s*id:\s*['"]([^'"]+)['"]\s*,\s*\n\s*type:\s*['"]([^'"]+)['"]\s*,\s*\n\s*content:\s*["']([\s\S]*?)["']\s*,\s*\n\s*intensity:\s*(\d)\s*,\s*\n\s*category:\s*['"]([^'"]+)['"]\s*,\s*\n\s*isPremium:\s*(true|false)\s*,\s*\n\s*estimatedTime:\s*['"]([^'"]+)['"](?:\s*,\s*\n\s*requires:\s*(\[[^\]]*\]))?(?:\s*,\s*\n\s*safetyNotes:\s*["']([\s\S]*?)["'])?\s*\n\s*\}/g;
    
    while ((match = multilinePattern.exec(content)) !== null) {
      // Check if card already exists (avoid duplicates)
      if (!cards.find(c => c.id === match[1])) {
        cards.push({
          id: match[1],
          type: match[2],
          content: match[3].replace(/\\n/g, ' ').trim(),
          intensity: parseInt(match[4]),
          category: match[5],
          isPremium: match[6] === 'true',
          estimatedTime: match[7],
          requires: match[8] ? this.parseArray(match[8]) : [],
          safetyNotes: (match[9] || '').replace(/\\n/g, ' ').trim(),
          sourceFile: sourceFile
        });
      }
    }

    return cards;
  }

  parseArray(arrStr) {
    return arrStr
      .replace(/[\[\]'"\s]/g, '')
      .split(',')
      .filter(Boolean);
  }

  loadKinks(lang) {
    const filePath = path.join(this.dataDir, `kinks.${lang}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      this.kinks[lang] = JSON.parse(content);
    }
  }

  loadConversationStarters(lang) {
    // This would parse conversation starter files
    // For now, placeholder
    this.conversationStarters[lang] = [];
  }

  // ===== CARD OPERATIONS =====

  getAllCards() {
    return this.cards;
  }

  getCardById(id) {
    return this.cards.find(c => c.id === id);
  }

  createCard(data) {
    const newId = this.generateCardId(data.type, data.isPremium);
    const card = {
      id: newId,
      type: data.type,
      content: data.content,
      intensity: parseInt(data.intensity) || 3,
      category: data.category || 'intimate',
      isPremium: data.isPremium === true || data.isPremium === 'true',
      estimatedTime: data.estimatedTime || '5 min',
      requires: Array.isArray(data.requires) ? data.requires : (data.requires ? data.requires.split(',').map(s => s.trim()) : []),
      safetyNotes: data.safetyNotes || '',
      sourceFile: data.sourceFile || 'gameCards.ts'
    };
    this.cards.push(card);
    return card;
  }

  updateCard(id, data) {
    const index = this.cards.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.cards[index] = {
      ...this.cards[index],
      type: data.type || this.cards[index].type,
      content: data.content || this.cards[index].content,
      intensity: parseInt(data.intensity) || this.cards[index].intensity,
      category: data.category || this.cards[index].category,
      isPremium: data.isPremium !== undefined ? (data.isPremium === true || data.isPremium === 'true') : this.cards[index].isPremium,
      estimatedTime: data.estimatedTime || this.cards[index].estimatedTime,
      requires: Array.isArray(data.requires) ? data.requires : (data.requires ? data.requires.split(',').map(s => s.trim()) : this.cards[index].requires),
      safetyNotes: data.safetyNotes !== undefined ? data.safetyNotes : this.cards[index].safetyNotes
    };
    return this.cards[index];
  }

  deleteCard(id) {
    const index = this.cards.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.cards.splice(index, 1);
    return true;
  }

  generateCardId(type, isPremium) {
    const prefix = isPremium ? 'p' : 'f';
    const typeCode = type.substring(0, 2);
    const existing = this.cards.filter(c => c.id.startsWith(`${prefix}-${typeCode}`));
    const maxNum = existing.reduce((max, c) => {
      const num = parseInt(c.id.match(/\d+$/)?.[0] || 0);
      return Math.max(max, num);
    }, 0);
    return `${prefix}-${typeCode}${maxNum + 1}`;
  }

  // ===== KINK OPERATIONS =====

  getAllKinks(lang) {
    return this.kinks[lang] || [];
  }

  getKinkById(id, lang) {
    return this.kinks[lang]?.find(k => k.id === id);
  }

  createKink(data, lang) {
    const newId = this.generateKinkId(lang);
    const kink = {
      id: newId,
      slug: data.slug || this.slugify(data.title),
      title: data.title,
      titleEs: data.titleEs || data.title,
      description: data.description,
      descriptionEs: data.descriptionEs || data.description,
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(s => s.trim()) : []),
      category: data.category || 'intimate',
      intensityScale: parseInt(data.intensityScale) || 1,
      tier: data.tier || 'soft',
      aliases: Array.isArray(data.aliases) ? data.aliases : (data.aliases ? data.aliases.split(',').map(s => s.trim()) : [])
    };
    this.kinks[lang].push(kink);
    return kink;
  }

  updateKink(id, data, lang) {
    const index = this.kinks[lang]?.findIndex(k => k.id === id);
    if (index === -1 || index === undefined) return null;

    this.kinks[lang][index] = {
      ...this.kinks[lang][index],
      ...data,
      id: this.kinks[lang][index].id // Prevent ID change
    };
    return this.kinks[lang][index];
  }

  deleteKink(id, lang) {
    const index = this.kinks[lang]?.findIndex(k => k.id === id);
    if (index === -1 || index === undefined) return false;
    this.kinks[lang].splice(index, 1);
    return true;
  }

  generateKinkId(lang) {
    const existing = this.kinks[lang];
    const maxNum = existing.reduce((max, k) => {
      const num = parseInt(k.id);
      return Math.max(max, isNaN(num) ? 0 : num);
    }, 0);
    return String(maxNum + 1).padStart(4, '0');
  }

  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  // ===== CONVERSATION STARTER OPERATIONS =====

  getAllConversationStarters(lang) {
    return this.conversationStarters[lang] || [];
  }

  getConversationStarterById(id, lang) {
    return this.conversationStarters[lang]?.find(s => s.id === id);
  }

  createConversationStarter(data, lang) {
    const starter = {
      id: data.id || `cs-${Date.now()}`,
      category: data.category,
      question: data.question,
      intensity: parseInt(data.intensity) || 1
    };
    this.conversationStarters[lang].push(starter);
    return starter;
  }

  updateConversationStarter(id, data, lang) {
    const index = this.conversationStarters[lang]?.findIndex(s => s.id === id);
    if (index === -1 || index === undefined) return null;

    this.conversationStarters[lang][index] = {
      ...this.conversationStarters[lang][index],
      ...data
    };
    return this.conversationStarters[lang][index];
  }

  deleteConversationStarter(id, lang) {
    const index = this.conversationStarters[lang]?.findIndex(s => s.id === id);
    if (index === -1 || index === undefined) return false;
    this.conversationStarters[lang].splice(index, 1);
    return true;
  }

  // ===== SAVE OPERATIONS =====

  async saveCards() {
    // Group cards by source file
    const byFile = {};
    for (const card of this.cards) {
      const file = card.sourceFile || 'gameCards.ts';
      if (!byFile[file]) byFile[file] = [];
      byFile[file].push(card);
    }

    // Save main gameCards.ts
    if (byFile['gameCards.ts']) {
      const freeCards = byFile['gameCards.ts'].filter(c => !c.isPremium);
      const premiumCards = byFile['gameCards.ts'].filter(c => c.isPremium);
      
      const content = this.generateGameCardsTs(freeCards, premiumCards);
      fs.writeFileSync(path.join(this.dataDir, 'gameCards.ts'), content, 'utf-8');
    }

    // Save expansion files
    for (let level = 1; level <= 5; level++) {
      const fileName = `game_cards_level${level}.ts`;
      if (byFile[fileName]) {
        const content = this.generateLevelTs(byFile[fileName], level);
        fs.writeFileSync(path.join(this.dataDir, fileName), content, 'utf-8');
      }
    }
  }

  generateGameCardsTs(freeCards, premiumCards) {
    const cardToString = (c) => {
      const requires = c.requires?.length ? `, requires: [${c.requires.map(r => `'${r}'`).join(', ')}]` : '';
      const safety = c.safetyNotes ? `, safetyNotes: "${c.safetyNotes.replace(/"/g, '\\"')}"` : '';
      return `  { id: '${c.id}', type: '${c.type}', content: "${c.content.replace(/"/g, '\\"')}", intensity: ${c.intensity}, category: '${c.category}', isPremium: ${c.isPremium}, estimatedTime: '${c.estimatedTime}'${requires}${safety} }`;
    };

    return `// Spice Dice - Couples Game Cards (REVAMPED)
// Philosophy: Every card is playable RIGHT NOW. No "plan for later". No "do this tonight".
// If it can't be acted on in the next 15 minutes, it's cut.

export type GameCardType = 'truth' | 'dare' | 'challenge' | 'fantasy' | 'roleplay';
export type GameCardCategory = 'communication' | 'physical' | 'emotional' | 'playful' | 'intimate';

export interface GameCard {
  id: string;
  type: GameCardType;
  content: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  category: GameCardCategory;
  isPremium: boolean;
  estimatedTime: string;
  requires?: string[];
  safetyNotes?: string;
}

// ─── FREE TIER ─────────────────────────────────────────────
export const FREE_CARDS: GameCard[] = [
${freeCards.map(cardToString).join(',\n')}
];

// ─── PREMIUM TIER ──────────────────────────────────────────
export const PREMIUM_CARDS: GameCard[] = [
${premiumCards.map(cardToString).join(',\n')}
];

// ─── COMBINED ──────────────────────────────────────────────
export const ALL_CARDS: GameCard[] = [...FREE_CARDS, ...PREMIUM_CARDS];

export const getCardsByType = (type: GameCardType, unlocked: boolean): GameCard[] => {
  const pool = unlocked ? ALL_CARDS : FREE_CARDS;
  return pool.filter((c) => c.type === type);
};

export const getRandomCard = (type: GameCardType | 'all', unlocked: boolean): GameCard | null => {
  const cards = type === 'all' ? (unlocked ? ALL_CARDS : FREE_CARDS) : getCardsByType(type, unlocked);
  if (!cards.length) return null;
  return cards[Math.floor(Math.random() * cards.length)];
};

export const getCardsByIntensity = (min: number, max: number, unlocked: boolean): GameCard[] => {
  const cards = unlocked ? ALL_CARDS : FREE_CARDS;
  return cards.filter((c) => c.intensity >= min && c.intensity <= max);
};
`;
  }

  generateLevelTs(cards, level) {
    const cardToString = (c) => {
      const requires = c.requires?.length ? `,\n    requires: [${c.requires.map(r => `'${r}'`).join(', ')}]` : '';
      const safety = c.safetyNotes ? `,\n    safetyNotes: '${c.safetyNotes.replace(/'/g, "\\'")}'` : '';
      return `  {\n    id: '${c.id}',\n    type: '${c.type}',\n    content: "${c.content.replace(/"/g, '\\"')}",\n    intensity: ${c.intensity},\n    category: '${c.category}',\n    isPremium: ${c.isPremium},\n    estimatedTime: '${c.estimatedTime}'${requires}${safety}\n  }`;
    };

    return `// SpiceSync - Level ${level} Cards
import { GameCard } from './gameCards';

export const LEVEL${level}_CARDS: GameCard[] = [
${cards.map(cardToString).join(',\n')}
];
`;
  }

  async saveKinks(lang) {
    const filePath = path.join(this.dataDir, `kinks.${lang}.json`);
    fs.writeFileSync(filePath, JSON.stringify(this.kinks[lang], null, 2), 'utf-8');
  }

  async saveConversationStarters(lang) {
    // Implement when conversation starters are fully defined
  }

  // ===== STATS =====

  getStats() {
    return {
      cards: {
        total: this.cards.length,
        free: this.cards.filter(c => !c.isPremium).length,
        premium: this.cards.filter(c => c.isPremium).length,
        byType: this.cards.reduce((acc, c) => {
          acc[c.type] = (acc[c.type] || 0) + 1;
          return acc;
        }, {}),
        byIntensity: this.cards.reduce((acc, c) => {
          acc[c.intensity] = (acc[c.intensity] || 0) + 1;
          return acc;
        }, {}),
        withSafetyNotes: this.cards.filter(c => c.safetyNotes).length,
        withRequires: this.cards.filter(c => c.requires?.length).length
      },
      kinks: {
        en: this.kinks.en.length,
        es: this.kinks.es.length
      },
      conversationStarters: {
        en: this.conversationStarters.en.length,
        es: this.conversationStarters.es.length
      }
    };
  }
}

module.exports = DataManager;