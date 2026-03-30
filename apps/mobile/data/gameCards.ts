// Spice Dice - Couples Game Cards (REVAMPED)
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
  { id: 'f-t1', type: 'truth', content: "Tell me one thing you want me to do to you RIGHT NOW.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: 'N/A' },
  { id: 'f-t2', type: 'truth', content: "Name the exact thing I can do (or that I already do) that makes you lose control. Show me where.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: 'N/A' },
  { id: 'f-t3', type: 'truth', content: "If you had 60 seconds to turn me on as fast as possible, what would you do?", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '1 min' },
  { id: 'f-t5', type: 'truth', content: "Tell me exactly how you want to be kissed right now.", intensity: 2, category: 'intimate', isPremium: false, estimatedTime: '1 min' },
  { id: 'f-d1', type: 'dare', content: "Kiss me somewhere unexpected—not my lips. Take your time.", intensity: 2, category: 'physical', isPremium: false, estimatedTime: '30 sec' },
  { id: 'f-d2', type: 'dare', content: "Take off one piece of my clothing using only your teeth.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '1 min' },
  { id: 'f-d3', type: 'dare', content: "Whisper the dirtiest thing you want to do to me right now.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '30 sec' },
  { id: 'f-d5', type: 'dare', content: "Put both hands in my hair and kiss me like you mean it for 30 seconds.", intensity: 2, category: 'physical', isPremium: false, estimatedTime: '30 sec' },
  { id: 'f-c1', type: 'challenge', content: "7 Minutes in Heaven: You have 7 minutes. Hands, mouth, anywhere above the waist. No stopping, no talking. GO.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '7 min' },
  { id: 'f-c2', type: 'challenge', content: "Staring Contest: Eyes locked. First one to blink removes a piece of clothing.", intensity: 2, category: 'playful', isPremium: false, estimatedTime: '2 min' },
  { id: 'f-c3', type: 'challenge', content: "No Hands: Touch me for 5 minutes without using your hands. Mouth, body, anything else.", intensity: 4, category: 'intimate', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-c4', type: 'challenge', content: "Ice Cube: Kiss me with an ice cube in your mouth. Pass it back and forth. Last one to melt it loses a piece of clothing.", intensity: 2, category: 'playful', isPremium: false, estimatedTime: '2 min', requires: ['ice'] },
  { id: 'f-fn3', type: 'fantasy', content: "First date: Act like we just met and can barely keep your hands to yourself.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-fn4', type: 'fantasy', content: "You walk in and catch me touching myself. What do you do? Act it out.", intensity: 4, category: 'intimate', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-r2', type: 'roleplay', content: "Doctor / Patient: Give me a full examination. Be very thorough.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-r3', type: 'roleplay', content: "Personal Trainer: Put me through your most intense session. Get me sweating.", intensity: 3, category: 'physical', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-r4', type: 'roleplay', content: "Vampire: You want me. Bite my neck. Take what you need.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-r5', type: 'roleplay', content: "Yoga Instructor: Adjust my position. Use your hands. Make sure my form is perfect.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '5 min' }
];

// ─── PREMIUM TIER ──────────────────────────────────────────
export const PREMIUM_CARDS: GameCard[] = [
  { id: 'p-t2', type: 'truth', content: "If I told you to get on your knees right now—would you? Would you want to?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-t3', type: 'truth', content: "The last time you touched yourself thinking about me—what was happening in your head?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-t4', type: 'truth', content: "Tell me the one thing I do in bed that makes you lose control. Describe it in detail.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-t6', type: 'truth', content: "Describe your ideal quickie with me. Location, how it starts, and how it ends.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-t10', type: 'truth', content: "Describe a fantasy involving me and one other person. Who, what, and who does what to whom.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'p-t11', type: 'truth', content: "What would you do if I walked over, grabbed your hand, and put it exactly where I wanted it?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-t12', type: 'truth', content: "How do you want me to undress you right now? Walk me through it.", intensity: 3, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-t14', type: 'truth', content: "If I only had 10 minutes and one body part to work with—what would you choose and why?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-d2', type: 'dare', content: "Undress me completely using only your mouth. No hands. Figure it out.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'p-d3', type: 'dare', content: "Tie my wrists with a scarf. 5 minutes. Do whatever you want to me.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['scarf'] },
  { id: 'p-d5', type: 'dare', content: "Lap dance. 2 minutes. Use me like a chair. Make me want you.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-d7', type: 'dare', content: "Pin both my wrists above my head and kiss me until I squirm.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-d8', type: 'dare', content: "Spank me 10 times. Alternate soft and hard. I count every one out loud.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min', safetyNotes: "⚠️ IMPACT PLAY: Start light and build up. Avoid kidneys, tailbone, and joints. Check in frequently." },
  { id: 'p-d9', type: 'dare', content: "Drizzle something sweet on my body and lick off every drop.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['honey/syrup'] },
  { id: 'p-d10', type: 'dare', content: "Kiss every inch of me—everywhere EXCEPT my lips. Stop only when I beg for your mouth.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-d12', type: 'dare', content: "Put an ice cube in your mouth and go down on me. Cold and heat at the same time.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['ice'] },
  { id: 'p-d14', type: 'dare', content: "Put my hand exactly where you want it and show me how you want to be touched.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'p-d15', type: 'dare', content: "Bring me to the edge with your mouth—then stop right before I finish.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-d16', type: 'dare', content: "Choke me lightly while you kiss me. Just pressure. Control.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '1 min', safetyNotes: "⚠️ BREATH PLAY: Never restrict airflow. Light pressure on sides only. Establish clear safeword before starting." },
  { id: 'p-d18', type: 'dare', content: "69. Right now. First one to stop has to do whatever the other wants next round.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-d19', type: 'dare', content: "Bite a hickey somewhere only I will see it. Claim your territory.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-d20', type: 'dare', content: "Trace every outline of my body with your tongue from shoulder to inner knee.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c4', type: 'challenge', content: "Torture Timer: Set 5 minutes. You have to keep me at the edge without letting me finish until it goes off.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c5', type: 'challenge', content: "Orgasm Race: We both touch ourselves. First to finish wins. Loser gives the winner oral right now.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c7', type: 'challenge', content: "Edging x3: Bring me right to the edge—then stop. 30 second wait. Do it 3 times. Then finish me.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-c8', type: 'challenge', content: "Body Map: I touch 5 spots on you in order. You have to touch them back on me in reverse. Miss one—lose an item.", intensity: 3, category: 'physical', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c10', type: 'challenge', content: "Hold Still: I do whatever I want to you for 2 minutes. You are not allowed to move or make noise. If you do—you have to start over.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-c12', type: 'challenge', content: "Kiss Marathon: 5 minutes. Kiss every part of my body you can reach. I count spots. Beat my record next round.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c14', type: 'challenge', content: "No Talking: For the next 5 minutes, no words. Only touch. Communicate entirely with your body.", intensity: 3, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c15', type: 'challenge', content: "Copy Cat: You do something to me. I copy it exactly back on you. We keep going until someone escalates too far.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-r2', type: 'roleplay', content: "Casting Director: I need the part. You have very specific requirements. What do I have to do?", intensity: 4, category: 'playful', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r7', type: 'roleplay', content: "Teacher / Student: I need extra credit. You have very creative requirements.", intensity: 4, category: 'playful', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r11', type: 'roleplay', content: "Royal / Servant: You exist to serve my every desire. You will not speak unless spoken to.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-fn3', type: 'fantasy', content: "Threesome scenario: who joins us, what they look like, who does what. Make it vivid.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'p-fn4', type: 'fantasy', content: "Describe your ultimate dominant move on me—right now, in this room, with what we have.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-fn5', type: 'fantasy', content: "Tell me a public scenario where we almost got caught. Real or imagined. I want all the details.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'k-ch3', type: 'truth', content: "Chastity truth: How long could you last being denied by me? What would you do to earn your release?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'k-i1', type: 'dare', content: "Put me over your lap. 10 spanks—count them. Alternate cheeks. I thank you after each one.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'k-i2', type: 'dare', content: "Trace an ice cube down my spine, over my nipples, between my thighs. Watch me react.", intensity: 3, category: 'intimate', isPremium: true, estimatedTime: '3 min', requires: ['ice'] },
  { id: 'k-i3', type: 'dare', content: "Drip warm wax on my skin (use a candle). The sting. The heat. The next drop landing somewhere new.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['candle'], safetyNotes: "⚠️ WAX PLAY: Use only body-safe candles (soy or paraffin, NOT beeswax). Test temperature on wrist first. Avoid face and genitals." },
  { id: 'k-p2', type: 'dare', content: "Collar and lead: Put it on me. Lead me wherever you want. Use the leash to guide my head.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min', requires: ['collar'] },
  { id: 'k-p3', type: 'dare', content: "Orgasm control: Decide when I get to finish. Bring me there—then deny me. I earn it.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'k-t2', type: 'dare', content: "Insert the butt plug. I wear it while you do other things to me. Every movement is a reminder.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min', requires: ['buttplug'] },
  { id: 'k-t3', type: 'dare', content: "Nipple clamps on. Let me adjust. Then tug the chain while you kiss me.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['nippleclamps'] },
  { id: 'k-o1', type: 'dare', content: "Tease me everywhere EXCEPT where I want it most. 3 minutes. Make me beg before you give in.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'k-o3', type: 'dare', content: "Sit on my face. Grind. Use me exactly how you need it. Take what you want.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'k-o4', type: 'challenge', content: "Rimming dare: Use your tongue where they never admit they want it. Soft, firm, then deep.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'k-h1', type: 'dare', content: "Write one word on my body somewhere hidden. Your word. Your choice. I wear it the rest of the night.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['body-safemarker'], safetyNotes: "⚠️ MARKING: Use only body-safe markers. Test for allergies first. Avoid sensitive areas and broken skin." },
  { id: 'k-g1', type: 'fantasy', content: "Cuckold / Hotwife: Would you want to watch me with someone? Or be watched? Tell me exactly what the scene looks like.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'k-g2', type: 'fantasy', content: "Group scenario: Multiple people. Being passed around. Completely used. Describe your ideal version in detail.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' }
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
