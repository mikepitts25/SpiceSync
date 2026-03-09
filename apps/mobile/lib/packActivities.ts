// Pack activity definitions
// Activities organized by pack for à la carte unlocking

import { GameCard, GameCardType, GameCardCategory } from '../../data/gameCards';

// ─── VACATION PACK ─────────────────────────────────────────
// Travel & adventure themed activities
export const VACATION_CARDS: GameCard[] = [
  // TRUTH
  { id: 'vac-t1', type: 'truth', content: "What's the wildest place you'd want me on vacation? Be specific.", intensity: 3, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'vac-t2', type: 'truth', content: "Have you ever fantasized about joining the mile high club? With me?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'vac-t3', type: 'truth', content: "What's the most adventurous place you've ever done it? Would you go further with me?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'vac-t4', type: 'truth', content: "If we had a hotel room with a balcony overlooking the ocean—what would you want to do?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  
  // DARE
  { id: 'vac-d1', type: 'dare', content: "Beach strip: Remove one item like we're on a completely private beach. Make it dramatic.", intensity: 3, category: 'playful', isPremium: true, estimatedTime: '1 min' },
  { id: 'vac-d2', type: 'dare', content: "Pretend we're in a hot tub at a resort. Give me a 'underwater' massage with your hands.", intensity: 3, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'vac-d3', type: 'dare', content: "Whisper something dirty in my ear like you're trying to turn me on in a crowded tourist spot.", intensity: 3, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'vac-d4', type: 'dare', content: "Pretend we're camping and need to stay quiet. Show me how you'd keep me silent.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  
  // ROLEPLAY
  { id: 'vac-r1', type: 'roleplay', content: "Hotel strangers: We just met at the hotel bar. You're trying to convince me to come to your room.", intensity: 4, category: 'playful', isPremium: true, estimatedTime: '10 min' },
  { id: 'vac-r2', type: 'roleplay', content: "Tour guide: You're showing me the 'hidden spots' of the city. The tour gets increasingly intimate.", intensity: 3, category: 'playful', isPremium: true, estimatedTime: '10 min' },
  { id: 'vac-r3', type: 'roleplay', content: "Beach massage: I'm sunbathing. You offer to apply sunscreen. Things escalate.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'vac-r4', type: 'roleplay', content: "Cruise ship romance: We're on a balcony at night. The ocean is the only witness.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  
  // CHALLENGE
  { id: 'vac-c1', type: 'challenge', content: "Mile high simulation: Pretend we're in a tiny airplane bathroom. 3 minutes, no noise, no stopping.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'vac-c2', type: 'challenge', content: "Packing challenge: We have 2 minutes before 'checkout'. How much can we fit in?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'vac-c3', type: 'challenge', content: "Road trip game: Every red light, one item comes off. Every green light, one kiss.", intensity: 3, category: 'playful', isPremium: true, estimatedTime: '5 min' },
  
  // FANTASY
  { id: 'vac-fn1', type: 'fantasy', content: "Describe our ideal vacation hookup scenario. Location, build-up, and what happens.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'vac-fn2', type: 'fantasy', content: "Tell me about a travel fantasy involving us and a stranger or another couple.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
];

// ─── KINKY 201 PACK ────────────────────────────────────────
// Advanced & experimental activities
export const KINKY201_CARDS: GameCard[] = [
  // TRUTH
  { id: 'k201-t1', type: 'truth', content: "What's a kink you've been curious about but never tried? Would you try it with me?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'k201-t2', type: 'truth', content: "How do you feel about light bondage? Being tied up or doing the tying?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'k201-t3', type: 'truth', content: "What's something 'taboo' that secretly turns you on? No judgment.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'k201-t4', type: 'truth', content: "Have you ever wanted to be completely dominated? Or to dominate me? Tell me the fantasy.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'k201-t5', type: 'truth', content: "What's the most intense pain-to-pleasure ratio you'd be willing to explore?", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  
  // DARE
  { id: 'k201-d1', type: 'dare', content: "Light bondage: Use a necktie to gently bind my wrists. Take control for 5 minutes.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['necktie'] },
  { id: 'k201-d2', type: 'dare', content: "Sensory deprivation: Blindfold me. You have 5 minutes to do anything except penetrate.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['blindfold'] },
  { id: 'k201-d3', type: 'dare', content: "Temperature play: Use ice on my skin, then warm breath, then your mouth. Alternate.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['ice'] },
  { id: 'k201-d4', type: 'dare', content: "Spanking session: 15 spanks, alternating intensity. I count and thank you after each.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'k201-d5', type: 'dare', content: "Orgasm denial: Bring me to the edge 3 times. I beg each time. You decide if I finish.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'k201-d6', type: 'dare', content: "Choke and kiss: Light pressure on my neck while you kiss me deeply. Control my breath.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  
  // ROLEPLAY
  { id: 'k201-r1', type: 'roleplay', content: "Master/servant: Full command scene. I serve your every desire for 10 minutes. No speaking unless spoken to.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'k201-r2', type: 'roleplay', content: "Interrogation: You need information. Pleasure and denial are your tools. Break me.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'k201-r3', type: 'roleplay', content: "Pet play: I'm your obedient pet. You pet me, reward me, discipline me. Use a collar if available.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min', requires: ['collar'] },
  
  // CHALLENGE
  { id: 'k201-c1', type: 'challenge', content: "Submission challenge: For 10 minutes, I cannot move without permission. You tease me relentlessly.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'k201-c2', type: 'challenge', content: "Impact play: Use your hand, a paddle, or flogger. 20 strikes. I choose the intensity progression.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  
  // FANTASY
  { id: 'k201-fn1', type: 'fantasy', content: "Describe your darkest fantasy you want to try with me. Don't hold back.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'k201-fn2', type: 'fantasy', content: "Tell me about a CNC (consensual non-consent) scenario you'd want to explore. Safewords required.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
];

// ─── DATE NIGHT PACK ───────────────────────────────────────
// Romantic evening focused activities
export const DATENIGHT_CARDS: GameCard[] = [
  // TRUTH
  { id: 'dn-t1', type: 'truth', content: "What's one thing I do that makes you feel truly loved? Not just attracted—loved.", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '3 min' },
  { id: 'dn-t2', type: 'truth', content: "When did you first realize you were falling for me? Tell me the moment.", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '3 min' },
  { id: 'dn-t3', type: 'truth', content: "What's a memory of us that always makes you smile, no matter what?", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '3 min' },
  { id: 'dn-t4', type: 'truth', content: "How do you want to be held when you're feeling vulnerable? Show me.", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '2 min' },
  { id: 'dn-t5', type: 'truth', content: "What's something you appreciate about me that you've never said out loud?", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '2 min' },
  
  // DARE
  { id: 'dn-d1', type: 'dare', content: "Slow dance: No music, just us moving together. Hold me like the world has stopped.", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '3 min' },
  { id: 'dn-d2', type: 'dare', content: "Forehead to forehead: Touch nowhere else for 2 minutes. Just breathe together.", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '2 min' },
  { id: 'dn-d3', type: 'dare', content: "Kiss every scar or imperfection on my body. Tell me each one is beautiful.", intensity: 3, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'dn-d4', type: 'dare', content: "Write 'I love you' on my body with your finger. Do it 10 times in different places.", intensity: 3, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'dn-d5', type: 'dare', content: "Feed me something sweet. No hands allowed—only your mouth to guide it to mine.", intensity: 3, category: 'playful', isPremium: true, estimatedTime: '2 min' },
  
  // ROLEPLAY
  { id: 'dn-r1', type: 'roleplay', content: "First date redo: Pick me up at the door. Take me somewhere in the house. Court me again.", intensity: 2, category: 'playful', isPremium: true, estimatedTime: '15 min' },
  { id: 'dn-r2', type: 'roleplay', content: "Proposal night: Pretend you're proposing to me all over again. Make me feel chosen.", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '10 min' },
  { id: 'dn-r3', type: 'roleplay', content: "Wedding night: We're newlyweds. Nervous, excited, ready to consummate. Take it slow.", intensity: 3, category: 'intimate', isPremium: true, estimatedTime: '15 min' },
  
  // CHALLENGE
  { id: 'dn-c1', type: 'challenge', content: "Eye gazing: 5 minutes of silent eye contact. No looking away, no talking. See what happens.", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '5 min' },
  { id: 'dn-c2', type: 'challenge', content: "Compliment marathon: Take turns giving genuine compliments. First one to repeat or hesitate loses.", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '5 min' },
  { id: 'dn-c3', type: 'challenge', content: "Massage exchange: 10 minutes each. Focus on relaxation and connection, not just arousal.", intensity: 2, category: 'physical', isPremium: true, estimatedTime: '20 min' },
  { id: 'dn-c4', type: 'challenge', content: "Love letter: Write a 3-sentence love note. Read it aloud. Then burn it or keep it forever.", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '5 min' },
  
  // FANTASY
  { id: 'dn-fn1', type: 'fantasy', content: "Describe our perfect anniversary night 10 years from now. Where are we? What are we doing?", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '3 min' },
  { id: 'dn-fn2', type: 'fantasy', content: "Tell me about growing old together. What do you see? What do you hope never changes?", intensity: 2, category: 'emotional', isPremium: true, estimatedTime: '3 min' },
];

// ─── COMBINED PACK CARDS ───────────────────────────────────
export const ALL_PACK_CARDS: GameCard[] = [
  ...VACATION_CARDS,
  ...KINKY201_CARDS,
  ...DATENIGHT_CARDS,
];

// Map pack IDs to their cards
export const PACK_CARDS_MAP: Record<string, GameCard[]> = {
  'pack_vacation': VACATION_CARDS,
  'pack_kinky201': KINKY201_CARDS,
  'pack_datenight': DATENIGHT_CARDS,
};

// Helper to check if a card belongs to a specific pack
export function getCardPackId(cardId: string): string | null {
  if (VACATION_CARDS.some(c => c.id === cardId)) return 'pack_vacation';
  if (KINKY201_CARDS.some(c => c.id === cardId)) return 'pack_kinky201';
  if (DATENIGHT_CARDS.some(c => c.id === cardId)) return 'pack_datenight';
  return null;
}

// Helper to get all cards for a pack
export function getPackCards(packId: string): GameCard[] {
  return PACK_CARDS_MAP[packId] || [];
}
