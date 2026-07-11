# Concrete Game Cards and Target Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace deferred discussion-style action cards with concrete Player up/Target challenges and rotate targets fairly in games with three or four players.

**Architecture:** Keep matchup selection as a pure deterministic calculation in `gameSession.ts`: an unbounded turn counter selects the acting player by modulo and selects a different target offset after every full pass through the players. Keep English TypeScript card data authoritative, then synchronize the legacy JSON mirror and EN/ES translation artifacts for every revised card.

**Tech Stack:** TypeScript 5.9, React Native/Expo, Jest 29, JSON, CSV, Node.js translation sync script.

## Global Constraints

- English card bodies use `Player up` and `Target`; Spanish cards use `Jugador activo` and `Objetivo`.
- Two-player target behavior must remain unchanged.
- Three- and four-player games must cover every directed non-self pairing before the pairing schedule repeats.
- Target selection must remain deterministic across saved-session restoration.
- No new random generator, matchup persistence field, or persistence schema version is introduced.
- Dare, challenge, and roleplay cards must produce an immediate, specific action rather than only discussion, negotiation, ranking, or planning for later.
- Truth and fantasy cards remain conversational.
- Cards remain non-graphic, preserve Pass / Risk as the opt-out, and retain prop requirements and safety notes.

---

## File Structure

- `apps/mobile/lib/gameSession.ts`: pure turn and target rotation logic.
- `apps/mobile/__tests__/game-session.test.ts`: two-, three-, and four-player matchup coverage and monotonic advancement.
- `apps/mobile/data/gameCards.ts`: revised base-deck roleplay card.
- `apps/mobile/data/game_cards_level2.ts`: revised immediate level-two challenge.
- `apps/mobile/data/game_cards_level3.ts`: revised lingerie dare.
- `apps/mobile/data/game_cards_level4.ts`: revised paddle challenges.
- `apps/mobile/data/game_cards_level5.ts`: revised paddle, collar, and lipstick cards.
- `apps/mobile/data/game_cards.json`: synchronized legacy mirror for revised IDs present in JSON.
- `apps/mobile/data/game_card_translations.csv`: English metadata and Spanish content source for revised cards.
- `apps/mobile/data/game_card_translations.es.json`: generated Spanish content map.
- `apps/mobile/__tests__/game-cards-content.test.ts`: exact content, action-policy, carry-over, safety, and JSON mirror checks.
- `apps/mobile/__tests__/game-card-translations.test.ts`: exact localized content and CSV synchronization checks.

### Task 1: Balanced deterministic target rotation

**Files:**
- Modify: `apps/mobile/__tests__/game-session.test.ts:32-51`
- Modify: `apps/mobile/lib/gameSession.ts:73-99`

**Interfaces:**
- Consumes: `getGameTurn(players: readonly string[], turnIndex: number): GameTurn` and `advanceGameTurnIndex(turnIndex: number, playerCount: number): number`.
- Produces: the same public signatures, with `turnIndex` interpreted as a monotonic completed-turn counter.

- [ ] **Step 1: Write failing matchup tests**

Replace the adjacent-target and wrapping assertions with:

```ts
it('keeps two-player turns paired with the only other player', () => {
  const players = ['Alex', 'Jordan'];

  expect(Array.from({ length: 4 }, (_, index) => getGameTurn(players, index))).toEqual([
    { player: 'Alex', target: 'Jordan', turnNumber: 1 },
    { player: 'Jordan', target: 'Alex', turnNumber: 2 },
    { player: 'Alex', target: 'Jordan', turnNumber: 1 },
    { player: 'Jordan', target: 'Alex', turnNumber: 2 },
  ]);
});

it('rotates every three-player actor through both possible targets', () => {
  const players = ['Alex', 'Jordan', 'Casey'];

  expect(Array.from({ length: 6 }, (_, index) => getGameTurn(players, index))).toEqual([
    { player: 'Alex', target: 'Jordan', turnNumber: 1 },
    { player: 'Jordan', target: 'Casey', turnNumber: 2 },
    { player: 'Casey', target: 'Alex', turnNumber: 3 },
    { player: 'Alex', target: 'Casey', turnNumber: 1 },
    { player: 'Jordan', target: 'Alex', turnNumber: 2 },
    { player: 'Casey', target: 'Jordan', turnNumber: 3 },
  ]);
});

it('rotates every four-player actor through all three possible targets', () => {
  const players = ['Alex', 'Jordan', 'Casey', 'Taylor'];
  const turns = Array.from({ length: 12 }, (_, index) =>
    getGameTurn(players, index)
  );

  for (const player of players) {
    expect(
      new Set(
        turns
          .filter((turn) => turn.player === player)
          .map((turn) => turn.target)
      )
    ).toEqual(new Set(players.filter((candidate) => candidate !== player)));
  }
});

it('advances a monotonic turn counter while player positions wrap', () => {
  expect(advanceGameTurnIndex(0, 4)).toBe(1);
  expect(advanceGameTurnIndex(3, 4)).toBe(4);
  expect(advanceGameTurnIndex(7, 4)).toBe(8);
  expect(getGameTurn(['Alex', 'Jordan', 'Casey', 'Taylor'], 4).turnNumber).toBe(1);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run from `apps/mobile`:

```bash
npm test -- --runInBand __tests__/game-session.test.ts
```

Expected: FAIL because later passes still choose the adjacent target and `advanceGameTurnIndex(3, 4)` returns `0`.

- [ ] **Step 3: Implement the minimal deterministic rotation**

Replace the two helpers with:

```ts
export function getGameTurn(
  players: readonly string[],
  turnIndex: number
): GameTurn {
  const normalizedPlayers = normalizeGamePlayers(players, players.length);
  const wholeTurnIndex = Math.floor(turnIndex);
  const safeIndex =
    ((wholeTurnIndex % normalizedPlayers.length) + normalizedPlayers.length) %
    normalizedPlayers.length;
  const completedPasses = Math.floor(
    Math.max(0, wholeTurnIndex) / normalizedPlayers.length
  );
  const targetOffset =
    normalizedPlayers.length === 2
      ? 1
      : (completedPasses % (normalizedPlayers.length - 1)) + 1;
  const targetIndex =
    (safeIndex + targetOffset) % normalizedPlayers.length;

  return {
    player: normalizedPlayers[safeIndex],
    target: normalizedPlayers[targetIndex],
    turnNumber: safeIndex + 1,
  };
}

export function advanceGameTurnIndex(
  turnIndex: number,
  _playerCount: number
): number {
  return Math.max(0, Math.floor(turnIndex)) + 1;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

```bash
npm test -- --runInBand __tests__/game-session.test.ts
```

Expected: PASS with all game-session helper tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/gameSession.ts apps/mobile/__tests__/game-session.test.ts
git commit -m "Rotate multiplayer game targets fairly"
```

### Task 2: Concrete English action cards and content policy

**Files:**
- Modify: `apps/mobile/__tests__/game-cards-content.test.ts:8-190`
- Modify: `apps/mobile/data/gameCards.ts:517-527`
- Modify: `apps/mobile/data/game_cards_level2.ts:266-275`
- Modify: `apps/mobile/data/game_cards_level3.ts:779-788`
- Modify: `apps/mobile/data/game_cards_level4.ts:202-213,697-708`
- Modify: `apps/mobile/data/game_cards_level5.ts:93-104,248-258,347-356,554-563`

**Interfaces:**
- Consumes: `MASTER_DECK: GameCard[]` and existing action-card content policy tests.
- Produces: nine exact concrete prompts keyed by stable card ID, with prop and safety metadata.

- [ ] **Step 1: Add exact expected English content and policy assertions**

Remove `EXPECTED_PROP_BOUNDARY_CONTENT` and `EXPECTED_PROP_BOUNDARY_SAFETY`, then add near the top of `game-cards-content.test.ts`:

```ts
const EXPECTED_CONCRETE_ACTIONS = {
  'f-i-r2':
    'Captive / Temptation: Player up blindfolds Target, circles them once, and directs one pose—kneel, stand, or turn. Target chooses one, holds it for 10 seconds, then Player up removes the blindfold.',
  'lvl2-c-009':
    'Future Snapshot: Player up poses with Target as if one shared dream just came true. Hold the celebration pose for 30 seconds and announce what happened.',
  'lvl3-qk-008':
    'Lingerie Styling: Player up chooses one clean lingerie, panties, bra, or underwear item for Target. Target holds it against their outfit while Player up directs one pose for 30 seconds.',
  'lvl4-c-005':
    "Paddle Balance: Player up balances the paddle across Target's open palms. Target holds still for 30 seconds; if it drops, Target gives Player up one wicked compliment.",
  'lvl4-qk-007':
    'Paddle Scepter: Target holds the paddle like a royal scepter while Player up directs one commanding pose. Target holds the pose for 30 seconds.',
  'lvl5-d-002':
    "Paddle Claim: Player up taps the paddle once against their own palm, lays it across Target's lap, and gives one pose command. Target holds the pose for 30 seconds.",
  'lvl5-c-004':
    "Paddle Signal: Player up places the paddle in Target's hands. Target presents it back, and Player up gives one featherlight tap over clothing.",
  'lvl5-c-007':
    'Collar Claim: Player up puts a collar on Target. Target wears it for the next two rounds, then Player up removes it slowly.',
  'lvl5-c-014':
    'Lipstick Mark: Player up puts lipstick on Target—one bold lip, cheek mark, or kiss print. Target keeps it for the next two rounds.',
} as const;

const DEFERRED_ACTION_PROMPT_PATTERN =
  /\b(discuss and write down|negotiate what happens next|names? one rule for (?:if|when) it is ever used|would be allowed later|describe the reveal without acting it out|rank these fantasies|prop boundary check)\b/i;

const ALLOWED_TWO_ROUND_CARD_IDS = new Set(['lvl5-c-007', 'lvl5-c-014']);
```

Replace the one-card prop-boundary assertion with:

```ts
it('uses exact concrete Player up and Target instructions for audited action cards', () => {
  const cardById = new Map(MASTER_DECK.map((card) => [card.id, card]));

  for (const [id, content] of Object.entries(EXPECTED_CONCRETE_ACTIONS)) {
    expect(cardById.get(id)?.content).toBe(content);
  }
});

it('does not defer action cards to discussion, negotiation, or later planning', () => {
  expect(
    ACTION_CARDS.filter((card) =>
      DEFERRED_ACTION_PROMPT_PATTERN.test(card.content)
    ).map(describeCard)
  ).toEqual([]);
});
```

Change the long-duration filter so only the approved prop effects may span two rounds:

```ts
ALL_PLAYABLE_CARDS.filter(
  (card) =>
    LONG_DURATION_PATTERN.test(card.content) &&
    !ALLOWED_TWO_ROUND_CARD_IDS.has(card.id)
).map(describeCard)
```

- [ ] **Step 2: Run the content test and verify RED**

```bash
npm test -- --runInBand __tests__/game-cards-content.test.ts
```

Expected: FAIL listing the nine old prompts.

- [ ] **Step 3: Replace the nine runtime cards**

Replace the corresponding objects with:

```ts
{
  id: 'f-i-r2',
  type: 'roleplay',
  content:
    'Captive / Temptation: Player up blindfolds Target, circles them once, and directs one pose—kneel, stand, or turn. Target chooses one, holds it for 10 seconds, then Player up removes the blindfold.',
  intensity: 5,
  category: 'intimate',
  isPremium: false,
  estimatedTime: '1 min',
  requires: ['blindfold'],
  safetyNotes:
    'Blindfold play stays brief. Keep the area clear and remove the blindfold immediately on request.',
},
{
  id: 'lvl2-c-009',
  type: 'challenge',
  content:
    'Future Snapshot: Player up poses with Target as if one shared dream just came true. Hold the celebration pose for 30 seconds and announce what happened.',
  intensity: 2,
  category: 'playful',
  isPremium: true,
  estimatedTime: '30 sec',
},
{
  id: 'lvl3-qk-008',
  type: 'dare',
  content:
    'Lingerie Styling: Player up chooses one clean lingerie, panties, bra, or underwear item for Target. Target holds it against their outfit while Player up directs one pose for 30 seconds.',
  intensity: 3,
  category: 'intimate',
  isPremium: true,
  estimatedTime: '1 min',
  requires: ['lingerie'],
},
{
  id: 'lvl4-c-005',
  type: 'challenge',
  content:
    "Paddle Balance: Player up balances the paddle across Target's open palms. Target holds still for 30 seconds; if it drops, Target gives Player up one wicked compliment.",
  intensity: 4,
  category: 'physical',
  isPremium: true,
  estimatedTime: '1 min',
  requires: ['paddle'],
  safetyNotes:
    'The paddle is a balance prop only. Do not swing it or use it for impact.',
},
{
  id: 'lvl4-qk-007',
  type: 'dare',
  content:
    'Paddle Scepter: Target holds the paddle like a royal scepter while Player up directs one commanding pose. Target holds the pose for 30 seconds.',
  intensity: 4,
  category: 'intimate',
  isPremium: true,
  estimatedTime: '1 min',
  requires: ['paddle'],
  safetyNotes:
    'The paddle is a posing prop only. Do not swing it or use it for impact.',
},
{
  id: 'lvl5-d-002',
  type: 'dare',
  content:
    "Paddle Claim: Player up taps the paddle once against their own palm, lays it across Target's lap, and gives one pose command. Target holds the pose for 30 seconds.",
  intensity: 5,
  category: 'physical',
  isPremium: true,
  estimatedTime: '1 min',
  requires: ['paddle'],
  safetyNotes:
    'One self-tap and presentation only. Do not strike Target with the paddle.',
},
{
  id: 'lvl5-c-004',
  type: 'challenge',
  content:
    "Paddle Signal: Player up places the paddle in Target's hands. Target presents it back, and Player up gives one featherlight tap over clothing.",
  intensity: 5,
  category: 'physical',
  isPremium: true,
  estimatedTime: '1 min',
  requires: ['paddle'],
  safetyNotes:
    'One featherlight tap over clothing only. Avoid the neck, spine, joints, kidneys, and any sore area.',
},
{
  id: 'lvl5-c-007',
  type: 'challenge',
  content:
    'Collar Claim: Player up puts a collar on Target. Target wears it for the next two rounds, then Player up removes it slowly.',
  intensity: 5,
  category: 'intimate',
  isPremium: true,
  estimatedTime: '1 min',
  requires: ['collar'],
  safetyNotes:
    'Keep the collar loose and decorative, never restrictive. Remove it immediately on request or discomfort.',
},
{
  id: 'lvl5-c-014',
  type: 'challenge',
  content:
    'Lipstick Mark: Player up puts lipstick on Target—one bold lip, cheek mark, or kiss print. Target keeps it for the next two rounds.',
  intensity: 5,
  category: 'playful',
  isPremium: true,
  estimatedTime: '1 min',
  requires: ['lipstick'],
  safetyNotes:
    'Use skin-safe lipstick. Target may choose a visible or discreet placement and remove it at any time.',
},
```

- [ ] **Step 4: Run the content test and verify GREEN**

```bash
npm test -- --runInBand __tests__/game-cards-content.test.ts
```

Expected: PASS; the JSON-specific synchronization test is added separately in Task 3.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/data/gameCards.ts apps/mobile/data/game_cards_level2.ts apps/mobile/data/game_cards_level3.ts apps/mobile/data/game_cards_level4.ts apps/mobile/data/game_cards_level5.ts apps/mobile/__tests__/game-cards-content.test.ts
git commit -m "Make game action cards concrete"
```

### Task 3: Synchronize the legacy JSON card mirror

**Files:**
- Modify: `apps/mobile/__tests__/game-cards-content.test.ts:150-190`
- Modify: `apps/mobile/data/game_cards.json` entries `lvl2-c-009`, `lvl4-c-005`, `lvl5-d-002`, `lvl5-c-004`, `lvl5-c-007`, and `lvl5-c-014`

**Interfaces:**
- Consumes: revised `MASTER_DECK` cards from Task 2 and `ALL_CARDS_FROM_JSON`.
- Produces: matching content and metadata for all revised IDs that exist in the legacy JSON file.

- [ ] **Step 1: Write the failing JSON synchronization test**

Add:

```ts
it('keeps revised cards synchronized with the legacy JSON mirror', () => {
  const mirroredIds = [
    'lvl2-c-009',
    'lvl4-c-005',
    'lvl5-d-002',
    'lvl5-c-004',
    'lvl5-c-007',
    'lvl5-c-014',
  ];
  const runtimeById = new Map(MASTER_DECK.map((card) => [card.id, card]));
  const jsonById = new Map(
    ALL_CARDS_FROM_JSON.map((card) => [card.id, card])
  );

  for (const id of mirroredIds) {
    const runtimeCard = runtimeById.get(id);
    const jsonCard = jsonById.get(id);

    expect(jsonCard).toBeDefined();
    expect(jsonCard?.content).toBe(runtimeCard?.content);
    expect(jsonCard?.category).toBe(runtimeCard?.category);
    expect(jsonCard?.estimatedTime).toBe(runtimeCard?.estimatedTime);
    expect(jsonCard?.requires).toEqual(runtimeCard?.requires);
    expect(jsonCard?.safetyNotes).toBe(runtimeCard?.safetyNotes);
  }
});
```

- [ ] **Step 2: Run the content test and verify RED**

```bash
npm test -- --runInBand __tests__/game-cards-content.test.ts
```

Expected: FAIL because the JSON mirror contains older content and metadata.

- [ ] **Step 3: Update the six JSON objects**

Replace the six matching objects with:

```json
{
  "id": "lvl2-c-009",
  "type": "challenge",
  "content": "Future Snapshot: Player up poses with Target as if one shared dream just came true. Hold the celebration pose for 30 seconds and announce what happened.",
  "intensity": 2,
  "category": "playful",
  "isPremium": true,
  "estimatedTime": "30 sec"
},
{
  "id": "lvl4-c-005",
  "type": "challenge",
  "content": "Paddle Balance: Player up balances the paddle across Target's open palms. Target holds still for 30 seconds; if it drops, Target gives Player up one wicked compliment.",
  "intensity": 4,
  "category": "physical",
  "isPremium": true,
  "estimatedTime": "1 min",
  "requires": ["paddle"],
  "safetyNotes": "The paddle is a balance prop only. Do not swing it or use it for impact."
},
{
  "id": "lvl5-d-002",
  "type": "dare",
  "content": "Paddle Claim: Player up taps the paddle once against their own palm, lays it across Target's lap, and gives one pose command. Target holds the pose for 30 seconds.",
  "intensity": 5,
  "category": "physical",
  "isPremium": true,
  "estimatedTime": "1 min",
  "requires": ["paddle"],
  "safetyNotes": "One self-tap and presentation only. Do not strike Target with the paddle."
},
{
  "id": "lvl5-c-004",
  "type": "challenge",
  "content": "Paddle Signal: Player up places the paddle in Target's hands. Target presents it back, and Player up gives one featherlight tap over clothing.",
  "intensity": 5,
  "category": "physical",
  "isPremium": true,
  "estimatedTime": "1 min",
  "requires": ["paddle"],
  "safetyNotes": "One featherlight tap over clothing only. Avoid the neck, spine, joints, kidneys, and any sore area."
},
{
  "id": "lvl5-c-007",
  "type": "challenge",
  "content": "Collar Claim: Player up puts a collar on Target. Target wears it for the next two rounds, then Player up removes it slowly.",
  "intensity": 5,
  "category": "intimate",
  "isPremium": true,
  "estimatedTime": "1 min",
  "requires": ["collar"],
  "safetyNotes": "Keep the collar loose and decorative, never restrictive. Remove it immediately on request or discomfort."
},
{
  "id": "lvl5-c-014",
  "type": "challenge",
  "content": "Lipstick Mark: Player up puts lipstick on Target—one bold lip, cheek mark, or kiss print. Target keeps it for the next two rounds.",
  "intensity": 5,
  "category": "playful",
  "isPremium": true,
  "estimatedTime": "1 min",
  "requires": ["lipstick"],
  "safetyNotes": "Use skin-safe lipstick. Target may choose a visible or discreet placement and remove it at any time."
}
```

- [ ] **Step 4: Run the content test and verify GREEN**

```bash
npm test -- --runInBand __tests__/game-cards-content.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/data/game_cards.json apps/mobile/__tests__/game-cards-content.test.ts
git commit -m "Sync revised game cards to JSON"
```

### Task 4: Synchronize Spanish card translations

**Files:**
- Modify: `apps/mobile/__tests__/game-card-translations.test.ts:9-105`
- Modify: `apps/mobile/data/game_card_translations.csv` rows for the nine revised IDs
- Regenerate: `apps/mobile/data/game_card_translations.es.json`

**Interfaces:**
- Consumes: `getGameCardDisplayContent(card, 'es')`, `MASTER_DECK`, and `scripts/sync-game-card-translations.js`.
- Produces: exact Spanish role-label translations and CSV/generated-JSON agreement.

- [ ] **Step 1: Add failing table-driven translation assertions**

Remove `EXPECTED_PROP_BOUNDARY_CONTENT_EN`, `EXPECTED_PROP_BOUNDARY_CONTENT_ES`, the `propBoundaryCard` local, and their individual expectations. Replace the one-card constants with:

```ts
const EXPECTED_REVISED_CONTENT_ES = {
  'f-i-r2':
    'Cautivo / Tentación: Jugador activo venda a Objetivo, lo rodea una vez y dirige una pose—arrodillarse, ponerse de pie o girar. Objetivo elige una, la mantiene 10 segundos y Jugador activo retira la venda.',
  'lvl2-c-009':
    'Foto del futuro: Jugador activo posa con Objetivo como si un sueño compartido acabara de cumplirse. Mantengan la pose de celebración durante 30 segundos y anuncien qué ocurrió.',
  'lvl3-qk-008':
    'Estilo de lencería: Jugador activo elige una prenda limpia de lencería, pantaletas, sostén o ropa interior para Objetivo. Objetivo la sostiene sobre su conjunto mientras Jugador activo dirige una pose durante 30 segundos.',
  'lvl4-c-005':
    'Equilibrio con la pala: Jugador activo equilibra la pala sobre las palmas abiertas de Objetivo. Objetivo se queda quieto durante 30 segundos; si se cae, Objetivo le da a Jugador activo un cumplido pícaro.',
  'lvl4-qk-007':
    'Cetro de pala: Objetivo sostiene la pala como un cetro real mientras Jugador activo dirige una pose autoritaria. Objetivo mantiene la pose durante 30 segundos.',
  'lvl5-d-002':
    'Reclamo con la pala: Jugador activo golpea una vez la pala contra su propia palma, la coloca sobre el regazo de Objetivo y da una orden de pose. Objetivo mantiene la pose durante 30 segundos.',
  'lvl5-c-004':
    'Señal con la pala: Jugador activo coloca la pala en las manos de Objetivo. Objetivo la presenta de vuelta y Jugador activo da un golpecito suavísimo sobre la ropa.',
  'lvl5-c-007':
    'Reclamo con collar: Jugador activo le pone un collar a Objetivo. Objetivo lo lleva durante las próximas dos rondas y luego Jugador activo se lo quita lentamente.',
  'lvl5-c-014':
    'Marca de labial: Jugador activo le pone labial a Objetivo—labios llamativos, una marca en la mejilla o la huella de un beso. Objetivo lo conserva durante las próximas dos rondas.',
} as const;
```

In the display-content test, loop through the map:

```ts
for (const [id, expectedContent] of Object.entries(
  EXPECTED_REVISED_CONTENT_ES
)) {
  const card = MASTER_DECK.find((candidate) => candidate.id === id) as GameCard;

  expect(hasGameCardSpanishTranslation(id)).toBe(true);
  expect(getGameCardDisplayContent(card, 'es')).toBe(expectedContent);
  expect(getGameCardDisplayContent(card, 'en')).toBe(card.content);
}
```

In the CSV test, replace the `propBoundaryRow` assertions with:

```ts
const masterCardById = new Map(MASTER_DECK.map((card) => [card.id, card]));

for (const [id, expectedContent] of Object.entries(
  EXPECTED_REVISED_CONTENT_ES
)) {
  const row = rowById.get(id);

  expect(row?.[englishIndex]).toBe(masterCardById.get(id)?.content);
  expect(row?.[spanishIndex]).toBe(expectedContent);
}
```

- [ ] **Step 2: Run the translation test and verify RED**

```bash
npm test -- --runInBand __tests__/game-card-translations.test.ts
```

Expected: FAIL because CSV and generated translations still contain the previous prompts.

- [ ] **Step 3: Update the nine CSV rows**

Replace the nine rows with these exact twelve-column rows:

```csv
f-i-r2,roleplay,5,intimate,false,1 min,blindfold,Blindfold play stays brief. Keep the area clear and remove the blindfold immediately on request.,"Captive / Temptation: Player up blindfolds Target, circles them once, and directs one pose—kneel, stand, or turn. Target chooses one, holds it for 10 seconds, then Player up removes the blindfold.","Cautivo / Tentación: Jugador activo venda a Objetivo, lo rodea una vez y dirige una pose—arrodillarse, ponerse de pie o girar. Objetivo elige una, la mantiene 10 segundos y Jugador activo retira la venda.",translated,
lvl2-c-009,challenge,2,playful,true,30 sec,,,Future Snapshot: Player up poses with Target as if one shared dream just came true. Hold the celebration pose for 30 seconds and announce what happened.,Foto del futuro: Jugador activo posa con Objetivo como si un sueño compartido acabara de cumplirse. Mantengan la pose de celebración durante 30 segundos y anuncien qué ocurrió.,translated,
lvl3-qk-008,dare,3,intimate,true,1 min,lingerie,,"Lingerie Styling: Player up chooses one clean lingerie, panties, bra, or underwear item for Target. Target holds it against their outfit while Player up directs one pose for 30 seconds.","Estilo de lencería: Jugador activo elige una prenda limpia de lencería, pantaletas, sostén o ropa interior para Objetivo. Objetivo la sostiene sobre su conjunto mientras Jugador activo dirige una pose durante 30 segundos.",translated,
lvl4-c-005,challenge,4,physical,true,1 min,paddle,The paddle is a balance prop only. Do not swing it or use it for impact.,"Paddle Balance: Player up balances the paddle across Target's open palms. Target holds still for 30 seconds; if it drops, Target gives Player up one wicked compliment.","Equilibrio con la pala: Jugador activo equilibra la pala sobre las palmas abiertas de Objetivo. Objetivo se queda quieto durante 30 segundos; si se cae, Objetivo le da a Jugador activo un cumplido pícaro.",translated,
lvl4-qk-007,dare,4,intimate,true,1 min,paddle,The paddle is a posing prop only. Do not swing it or use it for impact.,Paddle Scepter: Target holds the paddle like a royal scepter while Player up directs one commanding pose. Target holds the pose for 30 seconds.,Cetro de pala: Objetivo sostiene la pala como un cetro real mientras Jugador activo dirige una pose autoritaria. Objetivo mantiene la pose durante 30 segundos.,translated,
lvl5-d-002,dare,5,physical,true,1 min,paddle,One self-tap and presentation only. Do not strike Target with the paddle.,"Paddle Claim: Player up taps the paddle once against their own palm, lays it across Target's lap, and gives one pose command. Target holds the pose for 30 seconds.","Reclamo con la pala: Jugador activo golpea una vez la pala contra su propia palma, la coloca sobre el regazo de Objetivo y da una orden de pose. Objetivo mantiene la pose durante 30 segundos.",translated,
lvl5-c-004,challenge,5,physical,true,1 min,paddle,"One featherlight tap over clothing only. Avoid the neck, spine, joints, kidneys, and any sore area.","Paddle Signal: Player up places the paddle in Target's hands. Target presents it back, and Player up gives one featherlight tap over clothing.",Señal con la pala: Jugador activo coloca la pala en las manos de Objetivo. Objetivo la presenta de vuelta y Jugador activo da un golpecito suavísimo sobre la ropa.,translated,
lvl5-c-007,challenge,5,intimate,true,1 min,collar,"Keep the collar loose and decorative, never restrictive. Remove it immediately on request or discomfort.","Collar Claim: Player up puts a collar on Target. Target wears it for the next two rounds, then Player up removes it slowly.",Reclamo con collar: Jugador activo le pone un collar a Objetivo. Objetivo lo lleva durante las próximas dos rondas y luego Jugador activo se lo quita lentamente.,translated,
lvl5-c-014,challenge,5,playful,true,1 min,lipstick,Use skin-safe lipstick. Target may choose a visible or discreet placement and remove it at any time.,"Lipstick Mark: Player up puts lipstick on Target—one bold lip, cheek mark, or kiss print. Target keeps it for the next two rounds.","Marca de labial: Jugador activo le pone labial a Objetivo—labios llamativos, una marca en la mejilla o la huella de un beso. Objetivo lo conserva durante las próximas dos rondas.",translated,
```

- [ ] **Step 4: Regenerate the Spanish JSON map**

Run from the repository root:

```bash
node scripts/sync-game-card-translations.js
```

Expected: `game_card_translations.es.json` is rewritten and reports the translated entry count.

- [ ] **Step 5: Run the translation and content tests and verify GREEN**

```bash
npm test -- --runInBand __tests__/game-card-translations.test.ts __tests__/game-cards-content.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/data/game_card_translations.csv apps/mobile/data/game_card_translations.es.json apps/mobile/__tests__/game-card-translations.test.ts
git commit -m "Translate revised concrete game cards"
```

### Task 5: Full verification

**Files:**
- Verify only; no planned modifications.

**Interfaces:**
- Consumes: all changes from Tasks 1-4.
- Produces: evidence that tests, static typing, lint, and repository formatting checks pass.

- [ ] **Step 1: Run all mobile tests**

```bash
cd apps/mobile
npm test -- --runInBand
```

Expected: all Jest suites PASS with no test failures.

- [ ] **Step 2: Run TypeScript checking**

```bash
npx tsc --noEmit
```

Expected: exit code 0 with no type errors.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: exit code 0 with no lint errors.

- [ ] **Step 4: Check the final diff**

```bash
cd ../..
git diff --check
git status --short
```

Expected: `git diff --check` prints nothing; status contains only intentional implementation changes if any verification fix was required.

- [ ] **Step 5: Commit any verification-only fix**

If verification required a source fix, repeat the failing command until green, stage only that fix, and commit it with a message naming the corrected behavior. If no fix was required, do not create an empty commit.
