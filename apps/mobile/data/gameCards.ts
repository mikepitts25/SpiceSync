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
  // TRUTH (5)
  { id: 'f-t1', type: 'truth', content: "Tell me one thing you want me to do to you RIGHT NOW.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '1 min' },
  { id: 'f-t2', type: 'truth', content: "Name the exact thing I do that makes you lose control. Show me where.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '1 min' },
  { id: 'f-t3', type: 'truth', content: "If you had 60 seconds to turn me on as fast as possible, what would you do?", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '1 min' },
  { id: 'f-t4', type: 'truth', content: "What's something you want me to do to you that you've never asked for?", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '1 min' },
  { id: 'f-t5', type: 'truth', content: "Tell me exactly how you want to be kissed right now.", intensity: 2, category: 'intimate', isPremium: false, estimatedTime: '1 min' },

  // DARE (5)
  { id: 'f-d1', type: 'dare', content: "Kiss me somewhere unexpected—not my lips. Take your time.", intensity: 2, category: 'physical', isPremium: false, estimatedTime: '30 sec' },
  { id: 'f-d2', type: 'dare', content: "Take off one piece of my clothing using only your teeth.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '1 min' },
  { id: 'f-d3', type: 'dare', content: "Whisper the dirtiest thing you want to do to me right now.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '30 sec' },
  { id: 'f-d4', type: 'dare', content: "Bite my neck and hold it. Don't let go until I say so.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '30 sec' },
  { id: 'f-d5', type: 'dare', content: "Put both hands in my hair and kiss me like you mean it for 30 seconds.", intensity: 2, category: 'physical', isPremium: false, estimatedTime: '30 sec' },

  // CHALLENGE (5)
  { id: 'f-c1', type: 'challenge', content: "7 Minutes in Heaven: You have 7 minutes. Hands, mouth, anywhere above the waist. No stopping, no talking. GO.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '7 min' },
  { id: 'f-c2', type: 'challenge', content: "Staring Contest: Eyes locked. First one to blink removes a piece of clothing.", intensity: 2, category: 'playful', isPremium: false, estimatedTime: '2 min' },
  { id: 'f-c3', type: 'challenge', content: "No Hands: Touch me for 5 minutes without using your hands. Mouth, body, anything else.", intensity: 4, category: 'intimate', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-c4', type: 'challenge', content: "Ice Cube: Kiss me with an ice cube in your mouth. Pass it back and forth. Last one to melt it loses a piece of clothing.", intensity: 2, category: 'playful', isPremium: false, estimatedTime: '2 min', requires: ['ice'] },
  { id: 'f-c5', type: 'challenge', content: "Mirror: Whatever I do to you, you copy back instantly. Don't stop until neither of us can keep up.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '5 min' },

  // FANTASY (5)
  { id: 'f-fn1', type: 'fantasy', content: "Strangers at a bar: You don't know me. Use your best line. Pick me up. Right now.", intensity: 3, category: 'playful', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-fn2', type: 'fantasy', content: "Masseuse: You're giving me a professional massage that gets increasingly unprofessional. Start now.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '10 min' },
  { id: 'f-fn3', type: 'fantasy', content: "First date: Act like we just met and can barely keep your hands to yourself.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-fn4', type: 'fantasy', content: "You walk in and catch me touching myself. What do you do? Act it out.", intensity: 4, category: 'intimate', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-fn5', type: 'fantasy', content: "Photographer: I'm your nude model. Direct me. Tell me exactly what position you want me in.", intensity: 3, category: 'playful', isPremium: false, estimatedTime: '5 min' },

  // ROLEPLAY (5)
  { id: 'f-r1', type: 'roleplay', content: "Boss / Employee: I'm here for my performance review. What exactly am I being graded on?", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-r2', type: 'roleplay', content: "Doctor / Patient: Give me a full examination. Be very thorough.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-r3', type: 'roleplay', content: "Personal Trainer: Put me through your most intense session. Get me sweating.", intensity: 3, category: 'physical', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-r4', type: 'roleplay', content: "Vampire: You want me. Bite my neck. Take what you need.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '5 min' },
  { id: 'f-r5', type: 'roleplay', content: "Yoga Instructor: Adjust my position. Use your hands. Make sure my form is perfect.", intensity: 3, category: 'intimate', isPremium: false, estimatedTime: '5 min' },
];

// ─── PREMIUM TIER ──────────────────────────────────────────
export const PREMIUM_CARDS: GameCard[] = [

  // ── TRUTH ──────────────────────────────────────────────
  { id: 'p-t1',  type: 'truth', content: "What's the dirtiest thought you've had about me in the last 24 hours? Every detail.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-t2',  type: 'truth', content: "If I told you to get on your knees right now—would you? Would you want to?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-t3',  type: 'truth', content: "The last time you touched yourself thinking about me—what was happening in your head?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-t4',  type: 'truth', content: "Tell me the one thing I do in bed that makes you lose control. Describe it in detail.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-t5',  type: 'truth', content: "What's something you want me to do to you right now that you've been too shy to ask for?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-t6',  type: 'truth', content: "Describe your ideal quickie with me. Location, how it starts, and how it ends.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-t7',  type: 'truth', content: "What's the most submissive thing you'd let me do to you right now?", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-t8',  type: 'truth', content: "Describe your ideal blow job / oral session from me. Start to finish. Don't hold back.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-t9',  type: 'truth', content: "What's the dirtiest thing you'd let me call you in bed if I asked first?", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-t10', type: 'truth', content: "Describe a fantasy involving me and one other person. Who, what, and who does what to whom.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'p-t11', type: 'truth', content: "What would you do if I walked over, grabbed your hand, and put it exactly where I wanted it?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-t12', type: 'truth', content: "How do you want me to undress you right now? Walk me through it.", intensity: 3, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-t13', type: 'truth', content: "What's something that instantly makes you wet / hard just thinking about it?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-t14', type: 'truth', content: "If I only had 10 minutes and one body part to work with—what would you choose and why?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-t15', type: 'truth', content: "What's the dominant thing you most want to do to me right now? Be specific.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '2 min' },

  // ── DARE ───────────────────────────────────────────────
  { id: 'p-d1',  type: 'dare', content: "Trail of fire: Kiss me from my neck to my inner thigh. Slow. Don't skip anything.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-d2',  type: 'dare', content: "Undress me completely using only your mouth. No hands. Figure it out.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'p-d3',  type: 'dare', content: "Tie my wrists with a scarf. 5 minutes. Do whatever you want to me.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['scarf'] },
  { id: 'p-d4',  type: 'dare', content: "Blindfold me. 3 minutes. I can't see a thing. Do what you want.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min', requires: ['blindfold'] },
  { id: 'p-d5',  type: 'dare', content: "Lap dance. 2 minutes. Use me like a chair. Make me want you.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-d6',  type: 'dare', content: "Suck my fingers like it's oral sex. Eye contact the whole time.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-d7',  type: 'dare', content: "Pin both my wrists above my head and kiss me until I squirm.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-d8',  type: 'dare', content: "Spank me 10 times. Alternate soft and hard. I count every one out loud.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min', safetyNotes: "⚠️ IMPACT PLAY: Start light and build up. Avoid kidneys, tailbone, and joints. Check in frequently." },
  { id: 'p-d9',  type: 'dare', content: "Drizzle something sweet on my body and lick off every drop.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['honey/syrup'] },
  { id: 'p-d10', type: 'dare', content: "Kiss every inch of me—everywhere EXCEPT my lips. Stop only when I beg for your mouth.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-d11', type: 'dare', content: "Pull my hair, arch my head back, and tell me what you're going to do to me.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '1 min', safetyNotes: "⚠️ HAIR PULLING: Grab close to the scalp, not the ends. Support the neck." },
  { id: 'p-d12', type: 'dare', content: "Put an ice cube in your mouth and go down on me. Cold and heat at the same time.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['ice'] },
  { id: 'p-d13', type: 'dare', content: "Strip naked and stand in front of me for 60 seconds. Don't say a word. Just let me look.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-d14', type: 'dare', content: "Put my hand exactly where you want it and show me how you want to be touched.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'p-d15', type: 'dare', content: "Bring me to the edge with your mouth—then stop right before I finish.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-d16', type: 'dare', content: "Choke me lightly while you kiss me. Just pressure. Control.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '1 min', safetyNotes: "⚠️ BREATH PLAY: Never restrict airflow. Light pressure on sides only. Establish clear safeword before starting." },
  { id: 'p-d17', type: 'dare', content: "Touch yourself in front of me while I watch. Don't stop until I tell you to.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-d18', type: 'dare', content: "69. Right now. First one to stop has to do whatever the other wants next round.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-d19', type: 'dare', content: "Bite a hickey somewhere only I will see it. Claim your territory.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '1 min' },
  { id: 'p-d20', type: 'dare', content: "Trace every outline of my body with your tongue from shoulder to inner knee.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },

  // ── CHALLENGE ──────────────────────────────────────────
  { id: 'p-c1',  type: 'challenge', content: "Red Light / Green Light: Touch me however you want. I'll say 'red' to freeze you mid-action. 'Green' to continue. 5 rounds.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c2',  type: 'challenge', content: "Simon Says—but dirty: 'Simon says touch yourself.' 'Simon says kiss my neck.' Move without Simon says? Lose a piece of clothing.", intensity: 4, category: 'playful', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c3',  type: 'challenge', content: "Alphabet: Go down on me and trace every letter of the alphabet with your tongue. Don't skip any.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c4',  type: 'challenge', content: "Torture Timer: Set 5 minutes. You have to keep me at the edge without letting me finish until it goes off.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c5',  type: 'challenge', content: "Orgasm Race: We both touch ourselves. First to finish wins. Loser gives the winner oral right now.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c6',  type: 'challenge', content: "Sensory Overload: I get blindfolded + headphones. You have 3 minutes. I won't know what's coming.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min', requires: ['blindfold'] },
  { id: 'p-c7',  type: 'challenge', content: "Edging x3: Bring me right to the edge—then stop. 30 second wait. Do it 3 times. Then finish me.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-c8',  type: 'challenge', content: "Body Map: I touch 5 spots on you in order. You have to touch them back on me in reverse. Miss one—lose an item.", intensity: 3, category: 'physical', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c9',  type: 'challenge', content: "Strip Dice: Roll anything with 2-6 sides. That's how many items you take off. Then I roll for you.", intensity: 3, category: 'playful', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-c10', type: 'challenge', content: "Hold Still: I do whatever I want to you for 2 minutes. You are not allowed to move or make noise. If you do—you have to start over.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-c11', type: 'challenge', content: "Dirty 20 Questions: I'm thinking of something explicit I want to do to you. You have 20 yes/no questions. Get it wrong—you have to do it anyway.", intensity: 4, category: 'playful', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c12', type: 'challenge', content: "Kiss Marathon: 5 minutes. Kiss every part of my body you can reach. I count spots. Beat my record next round.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c13', type: 'challenge', content: "Forced Orgasm: I'm restrained. You don't stop until I've come twice. I'm not in control of when.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min', safetyNotes: "⚠️ RESTRAINT & FORCED ORGASM: Ensure restraints don't cut circulation. Check in frequently. Stop immediately if discomfort becomes pain." },
  { id: 'p-c14', type: 'challenge', content: "No Talking: For the next 5 minutes, no words. Only touch. Communicate entirely with your body.", intensity: 3, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'p-c15', type: 'challenge', content: "Copy Cat: You do something to me. I copy it exactly back on you. We keep going until someone escalates too far.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },

  // ── ROLEPLAY ───────────────────────────────────────────
  { id: 'p-r1',  type: 'roleplay', content: "Police Officer: You pulled me over. I'm trying to flirt my way out. Decide my punishment.", intensity: 4, category: 'playful', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r2',  type: 'roleplay', content: "Casting Director: I need the part. You have very specific requirements. What do I have to do?", intensity: 4, category: 'playful', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r3',  type: 'roleplay', content: "Strangers on a Plane: Turbulence. Middle of the night. Everyone asleep. We're trapped here together.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r4',  type: 'roleplay', content: "The Interrogation: I know something you want. Pleasure is the only weapon you're allowed to use.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r5',  type: 'roleplay', content: "Kidnapper / Captive: You have me tied up. I'm your prisoner. What do you do with me?", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r6',  type: 'roleplay', content: "Naughty Secretary: I made a mistake. You're the boss. Tell me exactly how I'm going to make it up to you.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r7',  type: 'roleplay', content: "Teacher / Student: I need extra credit. You have very creative requirements.", intensity: 4, category: 'playful', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r8',  type: 'roleplay', content: "The Maid: I keep dropping things and bending over. You keep watching. Eventually you can't help yourself.", intensity: 4, category: 'playful', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r9',  type: 'roleplay', content: "Repair Person: You're here to fix something. I answer the door in just a towel. It slips. Oops.", intensity: 4, category: 'playful', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r10', type: 'roleplay', content: "The Ex: We're done, but we keep running into each other. And neither of us can say no. One more time.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r11', type: 'roleplay', content: "Royal / Servant: You exist to serve my every desire. You will not speak unless spoken to.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r12', type: 'roleplay', content: "Hitchhiker: You picked me up. I have no money. We'll have to work something out.", intensity: 4, category: 'playful', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r13', type: 'roleplay', content: "Supervillain / Hero: You caught me. Now what? I'm completely at your mercy.", intensity: 4, category: 'playful', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r14', type: 'roleplay', content: "The Pool Person: You're working at my pool. I'm out here barely dressed. I can't stop staring at you.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'p-r15', type: 'roleplay', content: "CNC Scene: We've agreed. You resist. I overpower. We have a safeword. Let's use it if we need it.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '15 min', safetyNotes: "⚠️ CNC (Consensual Non-Consent): Discuss boundaries extensively beforehand. Establish clear safewords AND non-verbal signals. Aftercare is essential." },

  // ── FANTASY (confession/scenario) ─────────────────────
  { id: 'p-fn1',  type: 'fantasy', content: "Tell me a fantasy involving us that you've never said out loud. Take your time. Don't soften it.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'p-fn2',  type: 'fantasy', content: "Describe exactly how you'd want me to wake you up if you were asleep and I wanted you.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-fn3',  type: 'fantasy', content: "Threesome scenario: who joins us, what they look like, who does what. Make it vivid.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'p-fn4',  type: 'fantasy', content: "Describe your ultimate dominant move on me—right now, in this room, with what we have.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'p-fn5',  type: 'fantasy', content: "Tell me a public scenario where we almost got caught. Real or imagined. I want all the details.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min' },

  // ── KINK / CHASTITY ────────────────────────────────────
  { id: 'k-ch1', type: 'dare',      content: "Chastity agreement: starting right now, you're not allowed to touch yourself or finish without permission. I hold the key.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: 'ongoing' },
  { id: 'k-ch2', type: 'challenge', content: "Denial session: I'll bring you to the edge 3 times right now. You beg each time. I decide if you get to finish.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'k-ch3', type: 'truth',     content: "Chastity truth: How long could you last being denied by me? What would you do to earn your release?", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '2 min' },

  // ── IMPACT & SENSATION ─────────────────────────────────
  { id: 'k-i1', type: 'dare', content: "Put me over your lap. 10 spanks—count them. Alternate cheeks. I thank you after each one.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '3 min' },
  { id: 'k-i2', type: 'dare', content: "Trace an ice cube down my spine, over my nipples, between my thighs. Watch me react.", intensity: 3, category: 'intimate', isPremium: true, estimatedTime: '3 min', requires: ['ice'] },
  { id: 'k-i3', type: 'dare', content: "Drip warm wax on my skin (use a candle). The sting. The heat. The next drop landing somewhere new.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['candle'], safetyNotes: "⚠️ WAX PLAY: Use only body-safe candles (soy or paraffin, NOT beeswax). Test temperature on wrist first. Avoid face and genitals." },

  // ── POWER & CONTROL ────────────────────────────────────
  { id: 'k-p1', type: 'roleplay', content: "Command session: For 10 minutes, I give the orders. You follow every one. 'Open your mouth.' 'Get on your knees.' 'Beg for it.'", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min' },
  { id: 'k-p2', type: 'dare',     content: "Collar and lead: Put it on me. Lead me wherever you want. Use the leash to guide my head.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min', requires: ['collar'] },
  { id: 'k-p3', type: 'dare',     content: "Orgasm control: Decide when I get to finish. Bring me there—then deny me. I earn it.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min' },

  // ── TOYS & PROPS ───────────────────────────────────────
  { id: 'k-t1', type: 'dare', content: "Hold the vibrator against me and don't stop no matter what I say. You control when it ends.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['vibrator'] },
  { id: 'k-t2', type: 'dare', content: "Insert the butt plug. I wear it while you do other things to me. Every movement is a reminder.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '10 min', requires: ['butt plug'] },
  { id: 'k-t3', type: 'dare', content: "Nipple clamps on. Let me adjust. Then tug the chain while you kiss me.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['nipple clamps'] },

  // ── ORAL ──────────────────────────────────────────────
  { id: 'k-o1', type: 'dare',      content: "Tease me everywhere EXCEPT where I want it most. 3 minutes. Make me beg before you give in.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'k-o2', type: 'dare',      content: "Go as deep as you can. Use your throat. Hold eye contact. Don't stop until I tell you to.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'k-o3', type: 'dare',      content: "Sit on my face. Grind. Use me exactly how you need it. Take what you want.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'k-o4', type: 'challenge', content: "Rimming dare: Use your tongue where they never admit they want it. Soft, firm, then deep.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },

  // ── HUMILIATION / DEGRADATION ─────────────────────────
  { id: 'k-h1', type: 'dare',  content: "Write one word on my body somewhere hidden. Your word. Your choice. I wear it the rest of the night.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min', requires: ['body-safe marker'], safetyNotes: "⚠️ MARKING: Use only body-safe markers. Test for allergies first. Avoid sensitive areas and broken skin." },
  { id: 'k-h2', type: 'truth', content: "Tell me the most degrading thing you'd secretly want me to call you during sex—if I asked first.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '2 min' },
  { id: 'k-h3', type: 'roleplay', content: "Objectification: For 10 minutes I'm furniture. No names, no eye contact. Use me however you want.", intensity: 4, category: 'intimate', isPremium: true, estimatedTime: '10 min' },

  // ── GROUP / SHARING ───────────────────────────────────
  { id: 'k-g1', type: 'fantasy', content: "Cuckold / Hotwife: Would you want to watch me with someone? Or be watched? Tell me exactly what the scene looks like.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
  { id: 'k-g2', type: 'fantasy', content: "Group scenario: Multiple people. Being passed around. Completely used. Describe your ideal version in detail.", intensity: 5, category: 'intimate', isPremium: true, estimatedTime: '5 min' },
];

// ─── COMBINED ──────────────────────────────────────────────
export const ALL_CARDS: GameCard[] = [...FREE_CARDS, ...PREMIUM_CARDS];

export const getCardsByType = (type: GameCardType, unlocked: boolean): GameCard[] => {
  const pool = unlocked ? MASTER_DECK : [...FREE_CARDS, ...LEVEL1_CARDS.filter(c => !c.isPremium)];
  return pool.filter((c) => c.type === type);
};

export const getRandomCard = (type: GameCardType | 'all', unlocked: boolean): GameCard | null => {
  const cards = type === 'all' ? (unlocked ? MASTER_DECK : [...FREE_CARDS, ...LEVEL1_CARDS.filter(c => !c.isPremium)]) : getCardsByType(type, unlocked);
  if (!cards.length) return null;
  return cards[Math.floor(Math.random() * cards.length)];
};

export const getCardsByIntensity = (min: number, max: number, unlocked: boolean): GameCard[] => {
  const cards = unlocked ? MASTER_DECK : [...FREE_CARDS, ...LEVEL1_CARDS.filter(c => !c.isPremium)];
  return cards.filter((c) => c.intensity >= min && c.intensity <= max);
};

import { FREE_CARDS_ES, ALL_CARDS_ES } from './gameCards.es';

export const getCardsByLanguage = (lang: 'en' | 'es', unlocked: boolean): GameCard[] => {
  if (lang === 'es') {
    // Spanish cards - for now use original cards (expansion Spanish support can be added later)
    return unlocked ? ALL_CARDS_ES : FREE_CARDS_ES;
  }
  // English cards - include expansion cards
  return unlocked ? MASTER_DECK : [...FREE_CARDS, ...LEVEL1_CARDS.filter(c => !c.isPremium)];
};

export const getRandomCardByLang = (type: GameCardType | 'all', unlocked: boolean, lang: 'en' | 'es'): GameCard | null => {
  const cards = getCardsByLanguage(lang, unlocked);
  const filtered = type === 'all' ? cards : cards.filter((c) => c.type === type);
  if (!filtered.length) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
};

// ─── EXPANSION PACK IMPORTS ────────────────────────────────
import { EXPANSION_CARDS, LEVEL1_CARDS, LEVEL2_CARDS, LEVEL3_CARDS, LEVEL4_CARDS, LEVEL5_CARDS } from './game_cards_expansion';

// Export expansion cards
export { EXPANSION_CARDS, LEVEL1_CARDS, LEVEL2_CARDS, LEVEL3_CARDS, LEVEL4_CARDS, LEVEL5_CARDS };

// Combined master deck (original + expansion = 400+ cards)
export const MASTER_DECK: GameCard[] = [...ALL_CARDS, ...EXPANSION_CARDS];

// Get cards by intensity level (using expansion levels)
export const getCardsByIntensityLevel = (level: 1 | 2 | 3 | 4 | 5, unlocked: boolean): GameCard[] => {
  if (!unlocked) {
    // Free users only get Level 1 cards
    if (level === 1) return LEVEL1_CARDS.filter(c => !c.isPremium);
    return [];
  }
  switch (level) {
    case 1: return LEVEL1_CARDS;
    case 2: return LEVEL2_CARDS;
    case 3: return LEVEL3_CARDS;
    case 4: return LEVEL4_CARDS;
    case 5: return LEVEL5_CARDS;
    default: return [];
  }
};

// Get random card from specific intensity level
export const getRandomCardByIntensity = (level: 1 | 2 | 3 | 4 | 5, unlocked: boolean): GameCard | null => {
  const cards = getCardsByIntensityLevel(level, unlocked);
  if (!cards.length) return null;
  return cards[Math.floor(Math.random() * cards.length)];
};

// Get all cards from master deck
export const getMasterDeck = (unlocked: boolean): GameCard[] => {
  return unlocked ? MASTER_DECK : [...FREE_CARDS, ...LEVEL1_CARDS.filter(c => !c.isPremium)];
};

// Statistics for the complete collection
export const getDeckStatistics = () => {
  return {
    original: {
      total: ALL_CARDS.length,
      free: FREE_CARDS.length,
      premium: PREMIUM_CARDS.length
    },
    expansion: {
      total: EXPANSION_CARDS.length,
      level1: LEVEL1_CARDS.length,
      level2: LEVEL2_CARDS.length,
      level3: LEVEL3_CARDS.length,
      level4: LEVEL4_CARDS.length,
      level5: LEVEL5_CARDS.length,
      free: LEVEL1_CARDS.filter(c => !c.isPremium).length,
      premium: EXPANSION_CARDS.filter(c => c.isPremium).length,
      withSafetyNotes: EXPANSION_CARDS.filter(c => c.safetyNotes).length
    },
    master: {
      total: MASTER_DECK.length,
      free: FREE_CARDS.length + LEVEL1_CARDS.filter(c => !c.isPremium).length,
      premium: PREMIUM_CARDS.length + EXPANSION_CARDS.filter(c => c.isPremium).length
    }
  };
};
