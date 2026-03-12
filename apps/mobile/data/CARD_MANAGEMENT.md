# SpiceSync Game Cards - Management Guide

## Quick Start

### Edit Cards Manually
Open `game_cards.json` in any text editor. It's a standard JSON file with all cards.

### Card Format
```json
{
  "id": "unique-id",
  "type": "truth|dare|challenge|fantasy|roleplay",
  "content": "The card text",
  "intensity": 1-5,
  "category": "communication|physical|emotional|playful|intimate",
  "isPremium": true|false,
  "estimatedTime": "5 min",
  "requires": ["ice", "blindfold"],
  "safetyNotes": "Optional safety warning"
}
```

### ID Naming Convention
- `f-*` = Free cards (original 25)
- `p-*` = Premium cards (original 100)
- `lvl1-*` = Level 1: Flirty & Playful (60 cards, FREE)
- `lvl2-*` = Level 2: Warm & Intimate (60 cards, PREMIUM)
- `lvl3-*` = Level 3: Spicy & Adventurous (60 cards, PREMIUM)
- `lvl4-*` = Level 4: Hot & Experimental (60 cards, PREMIUM)
- `lvl5-*` = Level 5: Intense & Extreme (60 cards, PREMIUM)

### To Add a New Card
1. Open `game_cards.json`
2. Add a new object to the `cards` array
3. Use a unique ID following the convention above
4. Save the file
5. Run `npm run build:cards` (or restart the app in dev mode)

### To Remove a Card
1. Find the card by ID in `game_cards.json`
2. Delete the entire object (including curly braces and comma)
3. Save the file

### To Edit a Card
1. Find the card by ID
2. Edit any field
3. Save

## Intensity Levels
- **1** = Flirty, playful, getting-to-know-you
- **2** = Warm, intimate, emotional connection
- **3** = Spicy, sexual tension, exploration
- **4** = Hot, kink introduction, power dynamics
- **5** = Intense, extreme, advanced kink

## Card Types
- **truth** = Questions to answer honestly
- **dare** = Actions to perform immediately
- **challenge** = Longer activities or games
- **fantasy** = Scenario descriptions to act out
- **roleplay** = Character-based scenarios

## Categories
- **communication** = Talking, sharing, discussing
- **physical** = Touch, movement, sensation
- **emotional** = Feelings, connection, intimacy
- **playful** = Fun, games, lighthearted
- **intimate** = Sexual, sensual, romantic

## Required Items (optional field)
Common items to list in `requires`:
- `ice` - For temperature play
- `blindfold` - For sensory deprivation
- `scarf` - For light bondage
- `oil` or `lotion` - For massages
- `food` or `fruit` - For feeding/sensory play
- `music` - For dancing/ambiance
- `candle` - For wax play (body-safe only)
- `vibrator` - For toy play
- `collar` or `leash` - For power dynamics
- `rope` - For bondage
- `marker` - For body writing (body-safe)

## Safety Notes
Add `safetyNotes` for any card involving:
- Impact play (spanking, flogging)
- Breath play/choking
- Bondage/restraint
- Wax play
- CNC (consensual non-consent)
- Edge play
- Any activity with physical risk

Example:
```json
"safetyNotes": "⚠️ IMPACT PLAY: Start light and build up. Avoid kidneys, tailbone, and joints. Check in frequently."
```

## Bulk Operations

### Export Current Cards to JSON
```bash
npm run export:cards
```

### Validate Card Database
```bash
npm run validate:cards
```

### Generate Statistics
```bash
npm run stats:cards
```

## File Structure
```
data/
├── game_cards.json          # ← EDIT THIS FILE
├── gameCards.ts             # Main TypeScript exports
├── game_cards_level1.ts     # Level 1 cards (source)
├── game_cards_level2.ts     # Level 2 cards (source)
├── game_cards_level3.ts     # Level 3 cards (source)
├── game_cards_level4.ts     # Level 4 cards (source)
├── game_cards_level5.ts     # Level 5 cards (source)
├── game_cards_expansion.ts  # Expansion pack imports
└── CARD_MANAGEMENT.md       # This file
```

## Migration from TypeScript Files
The original cards are in TypeScript files. To migrate all cards to JSON:

```bash
node scripts/migrate-cards-to-json.js
```

This will populate `game_cards.json` with all existing cards.

## Tips

1. **Use a JSON-aware editor** (VS Code, etc.) to catch syntax errors
2. **Back up before bulk edits** - copy the file first
3. **Test intensity levels** - make sure the content matches the intensity number
4. **Keep IDs unique** - duplicates will cause errors
5. **Use proper escaping** - quotes inside content need to be escaped: `\"`
6. **Validate after editing** - run the validation script before committing

## Example: Adding a New Card

```json
{
  "id": "lvl3-d-061",
  "type": "dare",
  "content": "New spicy dare text here",
  "intensity": 3,
  "category": "intimate",
  "isPremium": true,
  "estimatedTime": "5 min",
  "requires": ["ice"]
}
```

Add this after the last card in the array (before the closing `]`).
