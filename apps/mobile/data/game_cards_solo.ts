// Solo mode card pool (1 player).
//
// Three styles, per the app improvement plan:
//   - anticipation dares: tease texts and voice notes sent to a partner
//   - self-discovery truths: reflective prompts that can be saved into the
//     private fantasy journal (sharing into matching stays a separate,
//     explicit action)
//   - confidence / prep challenges: quick actions that build up to the next
//     date night
//
// Content stays neutral and non-graphic per CONTRIBUTING.md.
import type { GameCard } from './gameCards';

export const SOLO_CARDS: GameCard[] = [
  // ─── Self-discovery truths (journalable) ─────────────────────────────
  {
    id: 'solo-t1',
    type: 'truth',
    content:
      'Name the last moment you felt completely desired. What made it work so well?',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: 'N/A',
  },
  {
    id: 'solo-t2',
    type: 'truth',
    content:
      'What is one desire you have hinted at but never said plainly? Practice saying it out loud in one clear sentence.',
    intensity: 2,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A',
  },
  {
    id: 'solo-t3',
    type: 'truth',
    content:
      'Which compliment do you secretly wish you heard more often? Say it to yourself now, out loud.',
    intensity: 2,
    category: 'emotional',
    isPremium: false,
    estimatedTime: 'N/A',
  },
  {
    id: 'solo-t4',
    type: 'truth',
    content:
      'Picture the boldest version of yourself on a great date. What is one thing that version does that you usually hold back?',
    intensity: 3,
    category: 'emotional',
    isPremium: false,
    estimatedTime: 'N/A',
  },
  {
    id: 'solo-t5',
    type: 'truth',
    content:
      'What is one fantasy you have never written down? Put it into a single sentence — save it to your journal if you want to keep it.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
  },
  {
    id: 'solo-t6',
    type: 'truth',
    content:
      'What do you most want to be asked for? What would make it easy to say yes?',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
  },
  {
    id: 'solo-t7',
    type: 'truth',
    content:
      'What made you feel most confident this week? How could your next date start with that feeling?',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: 'N/A',
  },
  {
    id: 'solo-t8',
    type: 'truth',
    content:
      'Which boundary of yours deserves to be said more clearly? Practice the exact sentence until it sounds calm.',
    intensity: 4,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A',
  },
  // ─── Anticipation dares (tease your partner from afar) ───────────────
  {
    id: 'solo-d1',
    type: 'dare',
    content:
      'Send your partner a text with exactly three words that will make them smile.',
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'solo-d2',
    type: 'dare',
    content:
      'Text your partner one specific compliment about the last time you were together.',
    intensity: 2,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'solo-d3',
    type: 'dare',
    content:
      'Send your partner a tease: one sentence about something you are looking forward to doing together. No emojis allowed.',
    intensity: 3,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'solo-d4',
    type: 'dare',
    content:
      'Text your partner the first move you want them to make the next time you are alone together.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'solo-d5',
    type: 'dare',
    content:
      'Send your partner a voice note: three sentences about what you want more of, said slowly.',
    intensity: 5,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'solo-d6',
    type: 'dare',
    content:
      'Put on the one item that makes you feel most attractive. Take 30 seconds to appreciate the result.',
    intensity: 2,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  // ─── Confidence / prep challenges ─────────────────────────────────────
  {
    id: 'solo-c1',
    type: 'challenge',
    content:
      'Stand tall, shoulders back, and hold eye contact with yourself in the mirror for 30 seconds.',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'solo-c2',
    type: 'challenge',
    content:
      'Write down two things you want to ask for on your next date. Keep the note somewhere you will find it.',
    intensity: 2,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'solo-c3',
    type: 'challenge',
    content:
      'Practice saying one desire out loud three times, until it sounds relaxed instead of nervous.',
    intensity: 3,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'solo-c4',
    type: 'challenge',
    content:
      'Pick the soundtrack for your next evening together. Choose the opening song right now.',
    intensity: 2,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'solo-c5',
    type: 'challenge',
    content:
      'Plan the first five minutes of your next evening together — one line for each minute.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: '1 min',
  },
  // ─── Solo fantasy prompts ─────────────────────────────────────────────
  {
    id: 'solo-f1',
    type: 'fantasy',
    content:
      'Build a fantasy scene in your head: the place, the pace, the first touch. Say the opening line out loud.',
    intensity: 4,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
  },
  {
    id: 'solo-f2',
    type: 'fantasy',
    content:
      'Pick a fantasy you have never shared. Decide which detail you would keep and which you would change in real life. Save it to your journal if you want.',
    intensity: 5,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
  },
  {
    id: 'solo-f3',
    type: 'fantasy',
    content:
      'Imagine your partner just said yes to anything within your shared boundaries. What do you ask for first?',
    intensity: 5,
    category: 'intimate',
    isPremium: false,
    estimatedTime: 'N/A',
  },
];

export function getSoloGameCards(_unlocked: boolean): GameCard[] {
  // The whole solo pool ships free: solo play is the habit loop that brings
  // players back to the paired experience.
  return SOLO_CARDS;
}
