// Spice Dice - Couples Game Cards (REVAMPED)
// Philosophy: Every card is playable RIGHT NOW. No "plan for later". No "do this tonight".
// If it can't be acted on in the next 1 minute, it's cut.

// ─── IMPORTS (all at top to avoid Metro initialization issues) ─────────────
import { FREE_CARDS_ES, ALL_CARDS_ES } from './gameCards.es';
import { EXPANSION_CARDS, LEVEL1_CARDS, LEVEL2_CARDS, LEVEL3_CARDS, LEVEL4_CARDS, LEVEL5_CARDS } from './game_cards_expansion';

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
  {
    id: 'f-t1',
    type: 'truth',
    content: 'Tell me one thing you want me to do to you RIGHT NOW.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A'
  },
  {
    id: 'f-t2',
    type: 'truth',
    content: 'Name the exact thing I can do (or that I already do) that makes you lose control. Show me where.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A'
  },
  {
    id: 'f-t3',
    type: 'truth',
    content: 'If you had 60 seconds to turn me on as fast as possible, what would you do?',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A'
  },
  {
    id: 'f-t5',
    type: 'truth',
    content: 'Tell me exactly how you want to be kissed right now.',
    intensity: 2,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A'
  },
  {
    id: 'f-d1',
    type: 'dare',
    content: 'Kiss me somewhere unexpected—not my lips.',
    intensity: 2,
    category: 'physical',
    isPremium: false,
    estimatedTime: 'N/A'
  },
  {
    id: 'f-d2',
    type: 'dare',
    content: 'Take off one piece of my clothing using only your teeth.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A'
  },
  {
    id: 'f-d3',
    type: 'dare',
    content: 'Whisper the dirtiest thing you want to do to me right now.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A'
  },
  {
    id: 'f-d5',
    type: 'dare',
    content: 'Put both hands in my hair and kiss me like you mean it for 30 seconds.',
    intensity: 2,
    category: 'physical',
    isPremium: false,
    estimatedTime: '30 sec'
  },
  {
    id: 'f-c1',
    type: 'challenge',
    content: '1 Minute in Heaven: You have 1 minute to have your way with me, anywhere above the waist. No stopping, no talking. GO.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'f-c2',
    type: 'challenge',
    content: 'Staring Contest: Eyes locked. First one to blink removes a piece of clothing.',
    intensity: 2,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-c3',
    type: 'challenge',
    content: 'No Hands: Touch me for 30 seconds without using your hands. Mouth, body, anything else.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '30 sec',
    requires: []
  },
  {
    id: 'f-c4',
    type: 'challenge',
    content: 'Ice Cube: Kiss me with an ice cube in your mouth. Pass it back and forth. Last one to melt it loses a piece of clothing.',
    intensity: 2,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: ['ice']
  },
  {
    id: 'f-fn3',
    type: 'fantasy',
    content: 'Act like we just met and give me your best line.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-fn4',
    type: 'fantasy',
    content: 'You walk in and catch me touching myself. What do you do?',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-r2',
    type: 'roleplay',
    content: 'Doctor / Patient: Give me a full examination. Be very thorough.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-r3',
    type: 'roleplay',
    content: 'Personal Trainer: Put me through your most intense session. Get me sweating.',
    intensity: 3,
    category: 'physical',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-r4',
    type: 'roleplay',
    content: 'Vampire: You want me. Bite my neck. Take what you need.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-r5',
    type: 'roleplay',
    content: 'Yoga Instructor: Adjust my position. Use your hands. Make sure my form is perfect.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-t1',
    type: 'truth',
    content: 'Tell me one small touch from me that instantly gets your attention.',
    intensity: 2,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-t2',
    type: 'truth',
    content: 'What is one compliment from me that would make you blush right now?',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-t3',
    type: 'truth',
    content: 'Where do you want me to kiss you when you want things to build slowly?',
    intensity: 2,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-d1',
    type: 'dare',
    content: 'Give me your slowest 30 second kiss without using your hands.',
    intensity: 2,
    category: 'physical',
    isPremium: false,
    estimatedTime: '30 sec',
    requires: []
  },
  {
    id: 'f-n-d2',
    type: 'dare',
    content: 'Trace a path from my wrist to my shoulder with your fingertips.',
    intensity: 2,
    category: 'physical',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-d3',
    type: 'dare',
    content: 'Stand behind me and whisper three things you like about my body.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-c1',
    type: 'challenge',
    content: 'No Words: Use only touch and eye contact to tell me what you want for 1 minute.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'f-n-c2',
    type: 'challenge',
    content: 'Compliment Ladder: Take turns giving compliments for 1 minute. No repeats.',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'f-n-c3',
    type: 'challenge',
    content: 'Slow Dance: Hold me close and move together for 1 minute, with or without music.',
    intensity: 2,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'f-n-f1',
    type: 'fantasy',
    content: 'Describe the perfect first move I could make if we were starting over tonight.',
    intensity: 2,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-f2',
    type: 'fantasy',
    content: 'Pick a room in the house and tell me how you would turn it into a date-night scene.',
    intensity: 3,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-r1',
    type: 'roleplay',
    content: 'Strangers at a bar: Start a flirtation with me like we have never met.',
    intensity: 2,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-r2',
    type: 'roleplay',
    content: 'Photographer / Muse: Pose me and tell me exactly what makes me look irresistible.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-t1',
    type: 'truth',
    content: 'Do you like taking control, giving up control, or switching between both with me?',
    intensity: 4,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-t2',
    type: 'truth',
    content: 'What is one kink or power-play idea you would want to explore with clear limits?',
    intensity: 4,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-t3',
    type: 'truth',
    content: 'What words from me make you feel wanted, claimed, or completely focused?',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-t4',
    type: 'truth',
    content: 'Name one boundary that should stay firm even when the game gets intense.',
    intensity: 5,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-d1',
    type: 'dare',
    content: 'Blindfold me with a soft cloth and tease my senses for 1 minute. Check in first.',
    intensity: 4,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
    requires: ['blindfold'],
    safetyNotes: 'Agree on a safeword or pause word before starting.'
  },
  {
    id: 'f-i-d2',
    type: 'dare',
    content: 'Pin my wrists gently above my head for 30 seconds while you kiss me.',
    intensity: 4,
    category: 'physical',
    isPremium: false,
    estimatedTime: '30 sec',
    requires: [],
    safetyNotes: 'Keep pressure light and release immediately if asked.'
  },
  {
    id: 'f-i-d3',
    type: 'dare',
    content: 'Give me a command in your most confident voice. I follow it if it is within our limits.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-d4',
    type: 'dare',
    content: 'Choose one piece of clothing and remove it slowly while keeping eye contact.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-d5',
    type: 'dare',
    content: 'Use only your mouth near my neck and shoulders for 1 minute. No rushing.',
    intensity: 5,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'f-i-c1',
    type: 'challenge',
    content: 'Control Challenge: One partner gives gentle instructions for 1 minute; the other follows within agreed limits.',
    intensity: 4,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
    requires: [],
    safetyNotes: 'Agree on limits and a pause word before starting.'
  },
  {
    id: 'f-i-c2',
    type: 'challenge',
    content: 'No Hands Intense: Make me react for 30 seconds without using your hands.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '30 sec',
    requires: []
  },
  {
    id: 'f-i-c3',
    type: 'challenge',
    content: 'Edge of Control: Get close to breaking composure for 1 minute, then stop and switch roles.',
    intensity: 5,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'f-i-c4',
    type: 'challenge',
    content: 'Permission Game: For 1 minute, ask permission before every touch. The answer can be yes, no, or slower.',
    intensity: 4,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'f-i-f1',
    type: 'fantasy',
    content: 'Describe a scene where one of us is fully in charge and the other happily follows.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-f2',
    type: 'fantasy',
    content: 'Tell me an intense private fantasy that would still feel safe, wanted, and consensual.',
    intensity: 5,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-f3',
    type: 'fantasy',
    content: 'Pick a forbidden place in the house and describe the version of us that meets there.',
    intensity: 4,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-r1',
    type: 'roleplay',
    content: 'Boss / Assistant: One of us is in charge. Give a private instruction and see if it is followed.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-r2',
    type: 'roleplay',
    content: 'Captive / Temptation: Use a blindfold or pretend restraint, then negotiate what happens next.',
    intensity: 5,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: [],
    safetyNotes: 'Keep restraint pretend or easy-release unless both partners explicitly agree.'
  },
  {
    id: 'f-i-r3',
    type: 'roleplay',
    content: 'Royal / Servant: One partner gives elegant, teasing orders. The other obeys within limits.',
    intensity: 4,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-t4',
    type: 'truth',
    content: 'Tell me one place you want more playful attention from me.',
    intensity: 2,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-t5',
    type: 'truth',
    content: 'What is one flirty thing I do that you wish I would do more often?',
    intensity: 2,
    category: 'emotional',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-t6',
    type: 'truth',
    content: 'If I gave you a private signal from across the room, what should it mean?',
    intensity: 3,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-d4',
    type: 'dare',
    content: 'Kiss three different spots and tell me why you chose each one.',
    intensity: 2,
    category: 'physical',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-d5',
    type: 'dare',
    content: 'Guide my hand to exactly where you want it for 30 seconds.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '30 sec',
    requires: []
  },
  {
    id: 'f-n-d6',
    type: 'dare',
    content: 'Give me a neck and shoulder massage for 1 minute while keeping close.',
    intensity: 2,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'f-n-c4',
    type: 'challenge',
    content: 'Temptation Timer: Try to make me smile, blush, or laugh in 1 minute.',
    intensity: 2,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'f-n-c5',
    type: 'challenge',
    content: 'Touch Map: Take turns naming one spot to touch for 30 seconds.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '30 sec',
    requires: []
  },
  {
    id: 'f-n-f3',
    type: 'fantasy',
    content: 'Describe a version of tonight where we are playful, bold, and completely unrushed.',
    intensity: 3,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-r3',
    type: 'roleplay',
    content: 'Massage Therapist / Client: Ask what I need, then give your most attentive treatment.',
    intensity: 2,
    category: 'physical',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-n-r4',
    type: 'roleplay',
    content: 'Secret Admirer: Leave me one whispered clue about what you want next.',
    intensity: 3,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-t5',
    type: 'truth',
    content: 'What kind of teasing makes you feel most wanted without crossing a line?',
    intensity: 4,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-t6',
    type: 'truth',
    content: 'Name one command you would enjoy hearing from me tonight.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-t7',
    type: 'truth',
    content: 'What is one intense scenario that sounds exciting only if we agree on limits first?',
    intensity: 5,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-t8',
    type: 'truth',
    content: 'Tell me one aftercare gesture that would help you feel safe after intense play.',
    intensity: 5,
    category: 'emotional',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-d6',
    type: 'dare',
    content: 'Hold my wrists gently and tell me exactly what you want for 30 seconds.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '30 sec',
    requires: [],
    safetyNotes: 'Keep the hold gentle and release immediately if asked.'
  },
  {
    id: 'f-i-d7',
    type: 'dare',
    content: 'Blindfold yourself or close your eyes while I guide one touch for 1 minute.',
    intensity: 4,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
    requires: [],
    safetyNotes: 'Keep the play area clear and use a pause word.'
  },
  {
    id: 'f-i-d8',
    type: 'dare',
    content: 'Give me one firm instruction and one soft instruction. I choose which to follow.',
    intensity: 4,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-d9',
    type: 'dare',
    content: 'Tease one chosen spot for 1 minute without moving anywhere else.',
    intensity: 5,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'f-i-d10',
    type: 'dare',
    content: 'Put me in a pose that makes me feel desired, then hold eye contact for 30 seconds.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '30 sec',
    requires: []
  },
  {
    id: 'f-i-c5',
    type: 'challenge',
    content: 'Safeword Check: Set a pause word, then play with confident instructions for 1 minute.',
    intensity: 4,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
    requires: [],
    safetyNotes: 'Stop immediately if the pause word is used.'
  },
  {
    id: 'f-i-c6',
    type: 'challenge',
    content: 'Stillness Game: One partner stays still for 30 seconds while the other teases within limits.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '30 sec',
    requires: [],
    safetyNotes: 'Stillness is a game, not a rule. Anyone can pause.'
  },
  {
    id: 'f-i-c7',
    type: 'challenge',
    content: 'Switch Control: One partner leads for 30 seconds, then switch roles.',
    intensity: 4,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
    requires: []
  },
  {
    id: 'f-i-c8',
    type: 'challenge',
    content: 'Permission Only: For 1 minute, every touch needs a yes, no, or slower answer.',
    intensity: 5,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'f-i-c9',
    type: 'challenge',
    content: 'Almost Too Much: Build anticipation for 1 minute, then stop and ask what should happen next.',
    intensity: 5,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'f-i-f4',
    type: 'fantasy',
    content: 'Describe a private scene where we use a safeword and both feel completely trusted.',
    intensity: 5,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-f5',
    type: 'fantasy',
    content: 'Tell me what kind of power dynamic sounds hottest when it stays loving and consensual.',
    intensity: 4,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-f6',
    type: 'fantasy',
    content: 'Pick a word, look, or signal that would tell me you want the intense version of us.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-f7',
    type: 'fantasy',
    content: 'Describe a scene where one of us gives up control and still feels completely cared for.',
    intensity: 5,
    category: 'emotional',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'f-i-r4',
    type: 'roleplay',
    content: 'Interrogation Lite: Ask three tempting questions. I can answer, resist, or bargain.',
    intensity: 4,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    requires: []
  }
];

export const PREMIUM_CARDS: GameCard[] = [
  {
    id: 'p-t2',
    type: 'truth',
    content: 'If I told you to get on your knees right now—would you? Would you want to?',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'p-t3',
    type: 'truth',
    content: 'The last time you touched yourself thinking about me—what was happening in your head?',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A',
    requires: []
  },
  {
    id: 'p-t4',
    type: 'truth',
    content: 'Tell me the one thing I do in bed that makes you lose control. Describe it in detail.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-t6',
    type: 'truth',
    content: 'Describe your ideal quickie with me. Location, how it starts, and how it ends.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-t10',
    type: 'truth',
    content: 'Describe a fantasy involving me and one other person. Who, what, and who does what to whom.',
    intensity: 5,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-t11',
    type: 'truth',
    content: 'What would you do if I walked over, grabbed your hand, and put it exactly where I wanted it?',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-t12',
    type: 'truth',
    content: 'How do you want me to undress you right now? Walk me through it.',
    intensity: 3,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-t14',
    type: 'truth',
    content: 'If I only had 30 seconds and one body part to work with—what would you choose and why?',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-d2',
    type: 'dare',
    content: 'Undress me completely using only your mouth. No hands. Figure it out.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-d3',
    type: 'dare',
    content: 'Tie my wrists with a scarf. 1 minute. Do whatever you want to me.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: '1 min',
    requires: ['scarf']
  },
  {
    id: 'p-d5',
    type: 'dare',
    content: 'Lap dance. 1 minute. Use me like a chair. Make me want you.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: '1 min'
  },
  {
    id: 'p-d7',
    type: 'dare',
    content: 'Pin both my wrists above my head and kiss me until I squirm.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-d8',
    type: 'dare',
    content: 'Spank me 10 times. Alternate soft and hard. I count every one out loud.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A',
    safetyNotes: '⚠️ IMPACT PLAY: Start light and build up. Avoid kidneys, tailbone, and joints. Check in frequently.'
  },
  {
    id: 'p-d9',
    type: 'dare',
    content: 'Drizzle something sweet on my body and lick off every drop.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A',
    requires: ['honey/syrup']
  },
  {
    id: 'p-d10',
    type: 'dare',
    content: 'Kiss every inch of me—everywhere EXCEPT my lips. Stop only when I beg for your mouth.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-d12',
    type: 'dare',
    content: 'Put an ice cube in your mouth and go down on me. Cold and heat at the same time.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A',
    requires: ['ice']
  },
  {
    id: 'p-d14',
    type: 'dare',
    content: 'Put my hand exactly where you want it and show me how you want to be touched.',
    intensity: 5,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-d16',
    type: 'dare',
    content: 'Choke me lightly while you kiss me. Just pressure. Control.',
    intensity: 5,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A',
    safetyNotes: '⚠️ BREATH PLAY: Never restrict airflow. Light pressure on sides only. Establish clear safeword before starting.'
  },
  {
    id: 'p-d18',
    type: 'dare',
    content: '69. Right now. First one to stop has to do whatever the other wants next round.',
    intensity: 5,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-d19',
    type: 'dare',
    content: 'Bite a hickey somewhere only I will see it. Claim your territory.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-d20',
    type: 'dare',
    content: 'Trace every outline of my body with your tongue from shoulder to inner knee.',
    intensity: 5,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-c8',
    type: 'challenge',
    content: 'Body Map: I touch 5 spots on you in order. You have to touch them back on me in reverse. Miss one—lose an item.',
    intensity: 3,
    category: 'physical',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-c10',
    type: 'challenge',
    content: 'Hold Still: I do whatever I want to you for 1 minute. You are not allowed to move or make noise. If you do—you have to start over.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: '1 min'
  },
  {
    id: 'p-c12',
    type: 'challenge',
    content: 'Kiss Marathon: 1 minute. Kiss every part of my body you can reach. I count spots. Beat my record next round.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: '1 min'
  },
  {
    id: 'p-c14',
    type: 'challenge',
    content: 'No Talking: For the next 1 minute, no words. Only touch. Communicate entirely with your body.',
    intensity: 3,
    category: 'intimate',
    isPremium: true,
    estimatedTime: '1 min'
  },
  {
    id: 'p-c15',
    type: 'challenge',
    content: 'Copy Cat: You do something to me. I copy it exactly back on you. We keep going until someone escalates too far.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-r2',
    type: 'roleplay',
    content: 'Casting Director: I need the part. You have very specific requirements. What do I have to do?',
    intensity: 4,
    category: 'playful',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-r7',
    type: 'roleplay',
    content: 'Teacher / Student: I need extra credit. You have very creative requirements.',
    intensity: 4,
    category: 'playful',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-r11',
    type: 'roleplay',
    content: 'Royal / Servant: You exist to serve my every desire. You will not speak unless spoken to.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-fn3',
    type: 'fantasy',
    content: 'Threesome scenario: who joins us, what they look like, who does what. Make it vivid.',
    intensity: 5,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-fn4',
    type: 'fantasy',
    content: 'Describe your ultimate dominant move on me—right now, in this room, with what we have.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'p-fn5',
    type: 'fantasy',
    content: 'Tell me a public scenario where we almost got caught. Real or imagined. I want all the details.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'k-ch3',
    type: 'truth',
    content: 'Chastity truth: How long could you last being denied by me? What would you do to earn your release?',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'k-i1',
    type: 'dare',
    content: 'Put me over your lap. 10 spanks—count them. Alternate cheeks. I thank you after each one.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'k-i2',
    type: 'dare',
    content: 'Trace an ice cube down my spine, over my nipples, between my thighs. Watch me react.',
    intensity: 3,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A',
    requires: ['ice']
  },
  {
    id: 'k-i3',
    type: 'dare',
    content: 'Drip warm wax on my skin (use a candle). The sting. The heat. The next drop landing somewhere new.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A',
    requires: ['candle'],
    safetyNotes: '⚠️ WAX PLAY: Use only body-safe candles (soy or paraffin, NOT beeswax). Test temperature on wrist first. Avoid face and genitals.'
  },
  {
    id: 'k-p2',
    type: 'dare',
    content: 'Collar and lead: Put it on me. Lead me wherever you want. Use the leash to guide my head.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A',
    requires: ['collar']
  },
  {
    id: 'k-t2',
    type: 'dare',
    content: 'Insert the butt plug. I wear it while you do other things to me. Every movement is a reminder.',
    intensity: 5,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A',
    requires: ['buttplug']
  },
  {
    id: 'k-t3',
    type: 'dare',
    content: 'Nipple clamps on. Let me adjust. Then tug the chain while you kiss me.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A',
    requires: ['nippleclamps']
  },
  {
    id: 'k-o1',
    type: 'dare',
    content: 'Tease me everywhere EXCEPT where I want it most. 1 minute. Make me beg before you give in.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: '1 min'
  },
  {
    id: 'k-o3',
    type: 'dare',
    content: 'Sit on my face. Grind. Use me exactly how you need it. Take what you want.',
    intensity: 4,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'k-o4',
    type: 'challenge',
    content: 'Rimming dare: Use your tongue where they never admit they want it. Soft, firm, then deep.',
    intensity: 5,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'k-h1',
    type: 'dare',
    content: 'Write one word on my body somewhere hidden. Your word. Your choice. I wear it for the next 3 turns.',
    intensity: 5,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A',
    requires: ['body-safemarker'],
    safetyNotes: '⚠️ MARKING: Use only body-safe markers. Test for allergies first. Avoid sensitive areas and broken skin.'
  },
  {
    id: 'k-g1',
    type: 'fantasy',
    content: 'Cuckold / Hotwife: Would you want to watch me with someone? Or be watched? Tell me exactly what the scene looks like.',
    intensity: 5,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  },
  {
    id: 'k-g2',
    type: 'fantasy',
    content: 'Group scenario: Multiple people. Being passed around. Completely used. Describe your ideal version in detail.',
    intensity: 5,
    category: 'intimate',
    isPremium: true,
    estimatedTime: 'N/A'
  }
];

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

// ─── EXPANSION + MASTER DECK ───────────────────────────────────────────────
export { EXPANSION_CARDS, LEVEL1_CARDS, LEVEL2_CARDS, LEVEL3_CARDS, LEVEL4_CARDS, LEVEL5_CARDS };

export const MASTER_DECK: GameCard[] = [...ALL_CARDS, ...EXPANSION_CARDS];

// ─── LANGUAGE HELPERS ──────────────────────────────────────────────────────
export const getCardsByLanguage = (lang: 'en' | 'es', unlocked: boolean): GameCard[] => {
  if (lang === 'es') return unlocked ? ALL_CARDS_ES : FREE_CARDS_ES;
  return unlocked ? MASTER_DECK : FREE_CARDS;
};

export const getRandomCardByLang = (
  type: GameCardType | 'all',
  unlocked: boolean,
  lang: 'en' | 'es'
): GameCard | null => {
  const pool = getCardsByLanguage(lang, unlocked);
  const cards = type === 'all' ? pool : pool.filter((c) => c.type === type);
  if (!cards.length) return null;
  return cards[Math.floor(Math.random() * cards.length)];
};
