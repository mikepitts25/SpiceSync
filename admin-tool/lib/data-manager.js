const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CARD_LEVELS = [1, 2, 3, 4, 5];

const CONVERSATION_SOURCES = [
  {
    category: 'getting_to_know',
    fileBase: 'conversation_starters_getting_to_know',
    arrayName: 'gettingToKnowStarters',
    comment: 'Getting to Know You - Deep questions for new couples',
  },
  {
    category: 'relationship',
    fileBase: 'conversation_starters_relationship',
    arrayName: 'relationshipStarters',
    comment: 'Relationship Deep Dive - Questions for established couples',
  },
  {
    category: 'date_night',
    fileBase: 'conversation_starters_date_night',
    arrayName: 'dateNightStarters',
    comment: 'Date Night Fun - 50 conversation prompts',
  },
  {
    category: 'spicy',
    fileBase: 'conversation_starters_spicy',
    arrayName: 'spicyStarters',
    comment: 'Spicy Questions - Turn up the heat',
  },
  {
    category: 'love_languages',
    fileBase: 'conversation_starters_love_languages',
    arrayName: 'loveLanguagesStarters',
    comment: 'Love Languages - Understanding how you give and receive love',
  },
];

function findTypeScriptArrayLiteralRange(content, arrayName) {
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
        return {
          declarationStart: marker.index,
          start: startIndex,
          end: i + 1,
        };
      }
    }
  }

  return null;
}

function parseTypeScriptArray(content, arrayName) {
  const range = findTypeScriptArrayLiteralRange(content, arrayName);
  if (!range) return [];

  try {
    return vm.runInNewContext(`(${content.slice(range.start, range.end)})`, {}, { timeout: 1000 });
  } catch (error) {
    console.error(`Failed to parse ${arrayName}:`, error.message);
    return [];
  }
}

function formatTypeScriptValue(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') {
    return `'${value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, '\\n')}'`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(formatTypeScriptValue).join(', ')}]`;
  return JSON.stringify(value, null, 2);
}

function serializeTypeScriptArray(arrayName, data, typeAnnotation) {
  const items = data.map((item) => {
    const fields = Object.entries(item)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `    ${key}: ${formatTypeScriptValue(value)}`)
      .join(',\n');

    return `  {\n${fields}\n  }`;
  });

  return `export const ${arrayName}: ${typeAnnotation} = [\n${items.join(',\n')}\n];`;
}

function replaceExportedArray(content, arrayName, data, typeAnnotation) {
  const serialized = serializeTypeScriptArray(arrayName, data, typeAnnotation);
  const range = findTypeScriptArrayLiteralRange(content, arrayName);

  if (!range) {
    return `${content.trimEnd()}\n\n${serialized}\n`;
  }

  const semicolonIndex = content.indexOf(';', range.end);
  const replaceEnd = semicolonIndex === -1 ? range.end : semicolonIndex + 1;

  return `${content.slice(0, range.declarationStart)}${serialized}${content.slice(replaceEnd)}`;
}

function cleanInternalFields(item) {
  const clean = { ...item };
  delete clean.sourceFile;
  return clean;
}

function conversationFileName(source, lang) {
  return `${source.fileBase}${lang === 'es' ? '.es' : ''}.ts`;
}

function conversationArrayName(source, lang) {
  return `${source.arrayName}${lang === 'es' ? 'ES' : ''}`;
}

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
    this.cards = [];

    // Load main gameCards.ts
    const gameCardsPath = path.join(this.dataDir, 'gameCards.ts');
    const gameCardsContent = fs.readFileSync(gameCardsPath, 'utf-8');

    const freeCards = parseTypeScriptArray(gameCardsContent, 'FREE_CARDS');
    freeCards.forEach((card) => {
      this.cards.push({ ...card, isPremium: false, sourceFile: 'gameCards.ts' });
    });

    const premiumCards = parseTypeScriptArray(gameCardsContent, 'PREMIUM_CARDS');
    premiumCards.forEach((card) => {
      this.cards.push({ ...card, isPremium: true, sourceFile: 'gameCards.ts' });
    });

    // Load expansion files
    for (const level of CARD_LEVELS) {
      const filePath = path.join(this.dataDir, `game_cards_level${level}.ts`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const cards = parseTypeScriptArray(content, `LEVEL${level}_CARDS`);
        cards.forEach((card) => {
          this.cards.push({ ...card, sourceFile: `game_cards_level${level}.ts` });
        });
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
    this.conversationStarters[lang] = [];
    
    for (const source of CONVERSATION_SOURCES) {
      const fileName = conversationFileName(source, lang);
      const filePath = path.join(this.dataDir, fileName);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const starters = parseTypeScriptArray(content, conversationArrayName(source, lang));
        starters.forEach((starter) => {
          this.conversationStarters[lang].push({ ...starter, sourceFile: fileName });
        });
      }
    }
  }

  parseConversationStartersFromTs(content, defaultCategory, sourceFile) {
    const starters = [];
    
    // Match complete conversation starter objects
    // Use a simpler approach - find each object's boundaries first
    const lines = content.split('\n');
    let inObject = false;
    let currentObject = [];
    let braceCount = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('{') && !inObject) {
        inObject = true;
        braceCount = 1;
        currentObject = [line];
        continue;
      }
      
      if (inObject) {
        currentObject.push(line);
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        
        if (braceCount === 0) {
          // Object complete
          const objText = currentObject.join('\n');
          
          // Check if this is a conversation starter (has id: 'conv-')
          if (objText.includes("id: 'conv-") || objText.includes('id: "conv-')) {
            const idMatch = objText.match(/id:\s*['"](conv-[\w-]+)['"]/);
            const categoryMatch = objText.match(/category:\s*['"]([^'"]+)['"]/);
            const intensityMatch = objText.match(/intensity:\s*(\d)/);
            
            // Extract question - handle both single and double quotes
            let question = '';
            const questionMatch = objText.match(/question:\s*["']([\s\S]*?)["']\s*,\s*$/m);
            if (questionMatch) {
              question = questionMatch[1].trim();
            }
            
            // Extract followUps
            let followUps = [];
            const followUpsStart = objText.indexOf('followUps:');
            if (followUpsStart !== -1) {
              const followUpsEnd = objText.indexOf(']', followUpsStart);
              const followUpsText = objText.substring(followUpsStart, followUpsEnd + 1);
              const followUpsMatches = followUpsText.match(/["']([^"']+)["']/g);
              if (followUpsMatches) {
                followUps = followUpsMatches.map(s => s.replace(/["']/g, ''));
              }
            }
            
            // Extract context
            let context = '';
            const contextMatch = objText.match(/context:\s*["']([\s\S]*?)["']\s*,?\s*$/m);
            if (contextMatch) {
              context = contextMatch[1].trim();
            }
            
            // Extract tags
            let tags = [];
            const tagsStart = objText.indexOf('tags:');
            if (tagsStart !== -1) {
              const tagsEnd = objText.indexOf(']', tagsStart);
              const tagsText = objText.substring(tagsStart, tagsEnd + 1);
              const tagsMatches = tagsText.match(/["']([^"']+)["']/g);
              if (tagsMatches) {
                tags = tagsMatches.map(s => s.replace(/["']/g, ''));
              }
            }
            
            if (idMatch && question) {
              starters.push({
                id: idMatch[1],
                category: categoryMatch ? categoryMatch[1] : defaultCategory,
                intensity: intensityMatch ? parseInt(intensityMatch[1]) : 1,
                question: question,
                followUps: followUps,
                context: context,
                tags: tags,
                sourceFile: sourceFile
              });
            }
          }
          
          inObject = false;
          currentObject = [];
        }
      }
    }
    
    return starters;
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
      safetyNotes: data.safetyNotes !== undefined ? data.safetyNotes : this.cards[index].safetyNotes,
      sourceFile: data.sourceFile || this.cards[index].sourceFile
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
    const newId = this.generateConversationStarterId(data.category, lang);
    const starter = {
      id: newId,
      category: data.category || 'getting_to_know',
      question: data.question,
      intensity: parseInt(data.intensity) || 1,
      followUps: Array.isArray(data.followUps) ? data.followUps : (data.followUps ? data.followUps.split('\n').filter(Boolean) : []),
      context: data.context || '',
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(s => s.trim()) : []),
      sourceFile: data.sourceFile || `conversation_starters_${data.category || 'getting_to_know'}${lang === 'es' ? '.es' : ''}.ts`
    };
    this.conversationStarters[lang].push(starter);
    return starter;
  }

  updateConversationStarter(id, data, lang) {
    const index = this.conversationStarters[lang]?.findIndex(s => s.id === id);
    if (index === -1 || index === undefined) return null;

    this.conversationStarters[lang][index] = {
      ...this.conversationStarters[lang][index],
      category: data.category || this.conversationStarters[lang][index].category,
      question: data.question || this.conversationStarters[lang][index].question,
      intensity: parseInt(data.intensity) || this.conversationStarters[lang][index].intensity,
      followUps: Array.isArray(data.followUps) ? data.followUps : (data.followUps ? data.followUps.split('\n').filter(Boolean) : this.conversationStarters[lang][index].followUps),
      context: data.context !== undefined ? data.context : this.conversationStarters[lang][index].context,
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(s => s.trim()) : this.conversationStarters[lang][index].tags),
      sourceFile: data.sourceFile || this.conversationStarters[lang][index].sourceFile
    };
    return this.conversationStarters[lang][index];
  }

  deleteConversationStarter(id, lang) {
    const index = this.conversationStarters[lang]?.findIndex(s => s.id === id);
    if (index === -1 || index === undefined) return false;
    this.conversationStarters[lang].splice(index, 1);
    return true;
  }

  generateConversationStarterId(category, lang) {
    const prefix = `conv-${category?.substring(0, 3) || 'get'}`;
    const existing = this.conversationStarters[lang].filter(s => s.id.startsWith(prefix));
    const maxNum = existing.reduce((max, s) => {
      const match = s.id.match(/(\d+)$/);
      return Math.max(max, match ? parseInt(match[1]) : 0);
    }, 0);
    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  }

  // ===== SAVE OPERATIONS =====

  async saveCards() {
    const mainPath = path.join(this.dataDir, 'gameCards.ts');
    let mainContent = fs.readFileSync(mainPath, 'utf-8');
    const mainCards = this.cards.filter((card) => (card.sourceFile || 'gameCards.ts') === 'gameCards.ts');
    const freeCards = mainCards.filter((card) => !card.isPremium).map(cleanInternalFields);
    const premiumCards = mainCards.filter((card) => card.isPremium).map(cleanInternalFields);

    mainContent = replaceExportedArray(mainContent, 'FREE_CARDS', freeCards, 'GameCard[]');
    mainContent = replaceExportedArray(mainContent, 'PREMIUM_CARDS', premiumCards, 'GameCard[]');
    fs.writeFileSync(mainPath, mainContent, 'utf-8');

    for (const level of CARD_LEVELS) {
      const fileName = `game_cards_level${level}.ts`;
      const filePath = path.join(this.dataDir, fileName);
      const cards = this.cards
        .filter((card) => card.sourceFile === fileName)
        .map(cleanInternalFields);

      const existing = fs.existsSync(filePath)
        ? fs.readFileSync(filePath, 'utf-8')
        : `import { GameCard } from './gameCards';\n\n`;
      const content = replaceExportedArray(existing, `LEVEL${level}_CARDS`, cards, 'GameCard[]');
      fs.writeFileSync(filePath, content, 'utf-8');
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
    for (const source of CONVERSATION_SOURCES) {
      const fileName = conversationFileName(source, lang);
      const filePath = path.join(this.dataDir, fileName);
      const arrayName = conversationArrayName(source, lang);
      const starters = this.conversationStarters[lang]
        .filter((starter) => {
          if (starter.sourceFile) return starter.sourceFile === fileName;
          return starter.category === source.category;
        })
        .map(cleanInternalFields);

      const existing = fs.existsSync(filePath)
        ? fs.readFileSync(filePath, 'utf-8')
        : `// apps/mobile/data/${fileName}\n// ${source.comment}\n\nimport { ConversationStarter } from '../lib/conversationStarters';\n\n`;
      const content = replaceExportedArray(existing, arrayName, starters, 'ConversationStarter[]');
      fs.writeFileSync(filePath, content, 'utf-8');
    }
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
