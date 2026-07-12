import { MASTER_DECK, type GameCard } from '../data/gameCards';
import { ALL_CARDS_ES } from '../data/gameCards.es';
import { ALL_CARDS_FROM_JSON } from '../data/cardLoader';

const ALL_PLAYABLE_CARDS: GameCard[] = [...MASTER_DECK, ...ALL_CARDS_ES];
const ACTION_TYPES = new Set(['dare', 'challenge', 'roleplay']);
const ACTION_CARDS = ALL_PLAYABLE_CARDS.filter((card) =>
  ACTION_TYPES.has(card.type)
);
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

// Explicit sex-act instructions are never allowed on action cards (dare,
// challenge, roleplay). Truth/fantasy cards may discuss desires in words,
// but action cards must stay quick, teasing, and playable in under a minute.
const BANNED_ACT_PATTERN =
  /\b(intercourse|penetrat\w*|blow ?job|go down on|oral sex|eat (?:me|you) out|rimming|\bfisting|\b69\b|sit on my face|make (?:me|you) (?:come|cum|climax|finish)|finish (?:me|you) off|edge (?:me|you)|edging|orgasm|sexo oral|penetra\w*|\ban(?:al|o)\b|orgasmo|correrse|c[oó]rrete|hasta que acabe)\b/i;

// High-risk activities are banned everywhere, including discussion prompts.
const HIGH_RISK_PATTERN =
  /\b(chok\w+|breath ?play|strangl\w+|asphyx\w+|knife|blade|razor|blood ?play|\bblood\b|needle|watersport\w*|golden shower|\bpiss\w*|\bscat\b|drip\w* (?:hot |warm )?wax|wax on|hot wax|TENS unit|violet wand|electro ?stim\w*|gag (?:me|you|them)|asfixi\w+|estrangul\w+|ahog\w+|cuchillo|navaja|sangre|aguja|orin\w+|\bmear\b|gotea\w* cera|cera caliente)\b/i;

// CNC belongs in boundary/fantasy discussion only, never as a dare.
const CNC_ACTION_PATTERN =
  /\b(pretend to say no|ignore (?:my|your|the) (?:no|safeword)|struggle against|fight back|don'?t stop no matter what|no matter what (?:I|you) say|aunque diga que no|ignora (?:mi|tu) no)\b/i;

// Long-duration or scheduled tasks break the quick-game format.
const LONG_DURATION_PATTERN =
  /\b(tonight|all day|all night|for the next hour|an hour|1 hour|24[- ]hours?|24\/7|weekend|this week|one week|for days|for the rest|rest of the (?:game|day|night|evening)|later today|before bed|future date|next (?:\d+|two|three|four|five) (?:turns?|rounds?)|\b(?:[2-9]|[1-9]\d)[- ]min(?:ute)?s?\b|esta noche|toda la noche|todo el d[ií]a|fin de semana|una hora|pr[oó]xim[oa]s? \d+ turnos)\b/i;

// Action cards should give the acting player a concrete action. Open-ended
// control language makes the game hard to play and pushes too much negotiation
// into the middle of a round.
const VAGUE_ACTION_PROMPT_PATTERN =
  /\b(do whatever (?:you|i) want|do anything except|various sensations|tease my senses|tease me relentlessly|control everything i experience|explore my body)\b/i;

// The game should not drift into broad party-game filler. Even the lowest
// levels should stay flirty, intimate, or kink-adjacent.
const GENERIC_PARTY_GAME_PATTERN =
  /\b(first impression|one type of cuisine|travel anywhere|any superpower|describe me to a stranger|silliest face|mental picture|talk about our day|gentleman\/lady from an old movie|piggyback ride|20 Questions: Think of something, and I have|shared playlist|5-song playlist|ridiculous story|favorite song that reminds you of us|romantic gesture from a movie|whole day with no interruptions)\b/i;

// Props must be simple, common household or bedroom items.
const ALLOWED_PROPS = new Set([
  'ice',
  'blindfold',
  'scarf',
  'candle',
  'collar',
  'leash',
  'paddle',
  'whip',
  'feather',
  'makeup',
  'lipstick',
  'mirror',
  'phone',
  'music',
  'paper',
  'pen',
  'food',
  'fruit',
  'honey',
  'oil',
  'dice',
  'headphones',
  'earplugs',
  'toy',
  'cuffs',
  'robe',
  'lingerie',
  'heels',
  'perfume',
  'clothing',
  'chair',
  'nail-polish',
  'warm-cloth',
  'body-safe-marker',
]);

// Action cards touching these themes must carry a safety note.
const SAFETY_REQUIRED_PATTERN =
  /\b(tie|tied|restrain\w*|cuff\w*|collar|leash|paddle|whip|degrad\w*|humiliat\w*|captive|property|belong to|esposas|correa|amarr\w*|propiedad)\b/i;

const describeCard = (card: GameCard) => `${card.id}: ${card.content}`;

describe('game card content policy', () => {
  it('has a substantial deck in both languages', () => {
    expect(MASTER_DECK.length).toBeGreaterThanOrEqual(400);
    expect(ALL_CARDS_ES.length).toBeGreaterThanOrEqual(80);
  });

  it('uses optional quick-play time estimates from ten seconds through one minute', () => {
    expect(
      ALL_PLAYABLE_CARDS.filter(
        (card) =>
          !['N/A', '10 sec', '30 sec', '1 min'].includes(card.estimatedTime)
      ).map(describeCard)
    ).toEqual([]);
  });

  it('leaves discussion cards untimed so players can talk naturally', () => {
    expect(
      MASTER_DECK.filter(
        (card) =>
          ['truth', 'fantasy'].includes(card.type) &&
          card.estimatedTime !== 'N/A'
      ).map(describeCard)
    ).toEqual([]);
  });

  it('uses more general wording for preference questions when no direct action is needed', () => {
    const card = MASTER_DECK.find((candidate) => candidate.id === 'f-n-t3');

    expect(card?.content).toBe(
      'Where do you like to be kissed when you want things to build slowly?'
    );
  });

  it('keeps early physical prompts short enough not to feel too intense', () => {
    const cardById = new Map(MASTER_DECK.map((card) => [card.id, card]));

    expect(cardById.get('f-n-c3')?.estimatedTime).toBe('30 sec');
    expect(cardById.get('lvl2-d-008')?.estimatedTime).toBe('30 sec');
    expect(cardById.get('lvl2-d-012')?.estimatedTime).toBe('30 sec');
  });

  it('never instructs sex acts on action cards', () => {
    expect(
      ACTION_CARDS.filter((card) => BANNED_ACT_PATTERN.test(card.content)).map(
        describeCard
      )
    ).toEqual([]);
  });

  it('never includes high-risk activities anywhere in the deck', () => {
    expect(
      ALL_PLAYABLE_CARDS.filter((card) =>
        HIGH_RISK_PATTERN.test(card.content)
      ).map(describeCard)
    ).toEqual([]);
  });

  it('never presents consent-override or CNC scenarios as action cards', () => {
    expect(
      ACTION_CARDS.filter((card) => CNC_ACTION_PATTERN.test(card.content)).map(
        describeCard
      )
    ).toEqual([]);
  });

  it('never assigns long-duration or scheduled tasks', () => {
    expect(
      ALL_PLAYABLE_CARDS.filter(
        (card) =>
          LONG_DURATION_PATTERN.test(card.content) &&
          !ALLOWED_TWO_ROUND_CARD_IDS.has(card.id)
      ).map(describeCard)
    ).toEqual([]);
  });

  it('makes action prompts specific instead of open-ended', () => {
    expect(
      ACTION_CARDS.filter((card) =>
        VAGUE_ACTION_PROMPT_PATTERN.test(card.content)
      ).map(describeCard)
    ).toEqual([]);
  });

  it('uses exact concrete Player up and Target instructions for audited action cards', () => {
    const cardById = new Map(MASTER_DECK.map((card) => [card.id, card]));

    for (const [id, content] of Object.entries(EXPECTED_CONCRETE_ACTIONS)) {
      expect(cardById.get(id)?.content).toBe(content);
    }
  });

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

  it('does not defer action cards to discussion, negotiation, or later planning', () => {
    expect(
      ACTION_CARDS.filter((card) =>
        DEFERRED_ACTION_PROMPT_PATTERN.test(card.content)
      ).map(describeCard)
    ).toEqual([]);
  });

  it('keeps the level 4 blindfold mystery challenge guess-based', () => {
    const card = MASTER_DECK.find((candidate) => candidate.id === 'lvl4-c-014');

    expect(card?.content).toBe(
      'Mystery Touch: Blindfold me for 1 minute. Touch my forearm or shoulder once with one object or one body part. I guess what touched me; wrong guess means I remove one clothing item, right guess means you remove one.'
    );
  });

  it('keeps prompts intimate or kink-adjacent instead of broad party-game filler', () => {
    expect(
      ALL_PLAYABLE_CARDS.filter((card) =>
        GENERIC_PARTY_GAME_PATTERN.test(card.content)
      ).map(describeCard)
    ).toEqual([]);
  });

  it('only requires simple, common props', () => {
    const badProps = ALL_PLAYABLE_CARDS.flatMap((card) =>
      (card.requires ?? [])
        .filter((prop) => !ALLOWED_PROPS.has(prop))
        .map((prop) => `${card.id}: ${prop}`)
    );
    expect(badProps).toEqual([]);
  });

  it('adds safety notes to restraint, collar/leash, impact, and control cards', () => {
    expect(
      ACTION_CARDS.filter(
        (card) =>
          SAFETY_REQUIRED_PATTERN.test(card.content) && !card.safetyNotes
      ).map(describeCard)
    ).toEqual([]);
  });

  it('keeps every intensity level stocked, including the new quick-kink cards', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      const cards = MASTER_DECK.filter((card) => card.intensity === level);
      expect({ level, count: cards.length }).toEqual({
        level,
        count: expect.any(Number),
      });
      expect(cards.length).toBeGreaterThanOrEqual(40);
    }
    const quickKink = MASTER_DECK.filter((card) => card.id.includes('-qk-'));
    expect(quickKink.length).toBeGreaterThanOrEqual(50);
  });

  it('keeps the requested clothing, swap, and prop themes represented', () => {
    const deckText = MASTER_DECK.map((card) => card.content).join(' ');
    for (const term of [
      'lingerie',
      'panties',
      'bra',
      'makeup',
      'collar',
      'leash',
      'whip',
      'paddle',
      'Clothes Swap',
      'Gender-Swap',
      'Role Reversal',
    ]) {
      expect(deckText).toContain(term);
    }
  });
});
