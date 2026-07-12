// Group-night card pool (3-4 players).
//
// These cards are written for a room, not a couple: flirty, party-energy
// prompts that work between any player→target pair, including two guests.
// Every card carries minPlayers: 3 so couples never see them.
// Content stays neutral and non-graphic per CONTRIBUTING.md.
import type { GameCard } from './gameCards';

export const GROUP_CARDS: GameCard[] = [
  {
    id: 'grp-t1',
    type: 'truth',
    content:
      'Player up names the best compliment they ever received. Everyone else tops it with a better one about them, and Player up crowns the winner.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    minPlayers: 3,
  },
  {
    id: 'grp-t2',
    type: 'truth',
    content:
      'Player up tells the group the story of their best-ever date. The group votes: charming or chaotic?',
    intensity: 2,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A',
    minPlayers: 3,
  },
  {
    id: 'grp-t3',
    type: 'truth',
    content:
      'Player up answers: what is the most attractive non-physical trait a person can have? The group gets one round to argue.',
    intensity: 3,
    category: 'emotional',
    isPremium: false,
    estimatedTime: 'N/A',
    minPlayers: 3,
  },
  {
    id: 'grp-t4',
    type: 'truth',
    content:
      'Player up describes their most confident flirting move and the last time it actually worked.',
    intensity: 4,
    category: 'playful',
    isPremium: false,
    estimatedTime: 'N/A',
    minPlayers: 3,
  },
  {
    id: 'grp-t5',
    type: 'truth',
    content:
      'Player up answers honestly: which two people here would survive a reality dating show as a team, and why?',
    intensity: 5,
    category: 'communication',
    isPremium: false,
    estimatedTime: 'N/A',
    minPlayers: 3,
  },
  {
    id: 'grp-d1',
    type: 'dare',
    content:
      'Player up gives Target their smoothest wink and one-liner. Target rates it out of ten, no mercy.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
    minPlayers: 3,
  },
  {
    id: 'grp-d2',
    type: 'dare',
    content:
      'Player up teaches the group their signature dance move. Everyone performs it together for 30 seconds.',
    intensity: 2,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
    minPlayers: 3,
  },
  {
    id: 'grp-d3',
    type: 'dare',
    content:
      'Player up serenades Target with 15 seconds of any song, full commitment, no laughing.',
    intensity: 3,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
    minPlayers: 3,
  },
  {
    id: 'grp-d4',
    type: 'dare',
    content:
      'Player up locks eyes with Target for 15 seconds. First to blink or laugh owes the group a dramatic bow.',
    intensity: 4,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
    minPlayers: 3,
  },
  {
    id: 'grp-c1',
    type: 'challenge',
    content:
      'Compliment battle: Player up and Target alternate compliments about anyone in the room until one of them cracks up.',
    intensity: 2,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
    minPlayers: 3,
  },
  {
    id: 'grp-c2',
    type: 'challenge',
    content:
      'The group invents a toast in honor of Target. Player up delivers it with full ceremony.',
    intensity: 3,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
    minPlayers: 3,
  },
  {
    id: 'grp-c3',
    type: 'challenge',
    content:
      'Player up strikes a runway pose. The group directs two adjustments, then Target announces the final look like a fashion host.',
    intensity: 4,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
    minPlayers: 3,
  },
  {
    id: 'grp-c4',
    type: 'challenge',
    content:
      'Player up and Target improvise a 20-second scene: two strangers who clearly find each other charming, meeting at a bus stop.',
    intensity: 5,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
    minPlayers: 3,
  },
];
