// SpiceSync - Level 1: Flirty & Playful (60 cards)
// Very mild, getting-to-know-you content
// Safe for new couples or first-time players
// All Level 1 cards are FREE

import { GameCard } from './gameCards';

export const LEVEL1_CARDS: GameCard[] = [
  // ─── TRUTH (15 cards) ────────────────────────────────────
  {
    id: 'lvl1-t-001',
    type: 'truth',
    content: "What's your favorite thing about my smile? Tell me while looking into my eyes.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-t-002',
    type: 'truth',
    content: "What was your first impression of me? Be completely honest.",
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '3 min',
    requires: []
  },
  {
    id: 'lvl1-t-003',
    type: 'truth',
    content: "What's a sweet memory of us that always makes you smile?",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '3 min',
    requires: []
  },
  {
    id: 'lvl1-t-004',
    type: 'truth',
    content: "If you could only eat one type of cuisine for the rest of your life, which would you choose and why?",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-t-005',
    type: 'truth',
    content: "What's your favorite way to be comforted when you're having a bad day?",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-t-006',
    type: 'truth',
    content: "What's something small I do that makes you feel loved?",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-t-007',
    type: 'truth',
    content: "If we could travel anywhere in the world together, where would you take me?",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '3 min',
    requires: []
  },
  {
    id: 'lvl1-t-008',
    type: 'truth',
    content: "What's your favorite song that reminds you of us?",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-t-009',
    type: 'truth',
    content: "What quality do you admire most in me that you wish you had more of?",
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-t-010',
    type: 'truth',
    content: "What's your favorite childhood memory?",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '3 min',
    requires: []
  },
  {
    id: 'lvl1-t-011',
    type: 'truth',
    content: "If you had to describe me to a stranger using only three words, what would they be?",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-t-012',
    type: 'truth',
    content: "What's your favorite physical feature of mine? Point to it.",
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'lvl1-t-013',
    type: 'truth',
    content: "What's something you've always wanted to learn or try?",
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-t-014',
    type: 'truth',
    content: "What's the most romantic thing someone has ever done for you?",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '3 min',
    requires: []
  },
  {
    id: 'lvl1-t-015',
    type: 'truth',
    content: "If you could have any superpower, what would it be and why?",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },

  // ─── DARE (15 cards) ─────────────────────────────────────
  {
    id: 'lvl1-d-001',
    type: 'dare',
    content: "Hold my hand for the next 5 minutes without letting go, no matter what.",
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-d-002',
    type: 'dare',
    content: "Give me a 2-minute shoulder massage while telling me what you appreciate about me.",
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-d-003',
    type: 'dare',
    content: "Make the silliest face you can and hold it for 10 seconds while I take a mental picture.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'lvl1-d-004',
    type: 'dare',
    content: "Trace the outline of my hand with your finger, slowly, while looking into my eyes.",
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'lvl1-d-005',
    type: 'dare',
    content: "Whisper 'te quiero' or 'I love you' in my ear three different ways—sweet, playful, and dramatic.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-d-006',
    type: 'dare',
    content: "Feed me a piece of fruit or chocolate—slowly, like in a romantic movie.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '2 min',
    requires: ['food']
  },
  {
    id: 'lvl1-d-007',
    type: 'dare',
    content: "Play with my hair for 3 minutes while we talk about our day.",
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '3 min',
    requires: []
  },
  {
    id: 'lvl1-d-008',
    type: 'dare',
    content: "Give me three genuine compliments, each one about something different.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-d-009',
    type: 'dare',
    content: "Kiss the back of my hand like a gentleman/lady from an old movie.",
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'lvl1-d-010',
    type: 'dare',
    content: "Do your best impression of me—how I laugh, how I talk, how I move.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-d-011',
    type: 'dare',
    content: "Give me a gentle forehead kiss and tell me one thing you're grateful for about us.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'lvl1-d-012',
    type: 'dare',
    content: "Tickle me gently for 30 seconds, but stop immediately if I say 'parar' (stop).",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'lvl1-d-013',
    type: 'dare',
    content: "Draw a heart on my palm with your finger and tell me what it represents to you.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
    requires: []
  },
  {
    id: 'lvl1-d-014',
    type: 'dare',
    content: "Give me a piggyback ride around the room while humming our song.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-d-015',
    type: 'dare',
    content: "Brush my hair or fix my collar/shirt with extra care and attention.",
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },

  // ─── CHALLENGE (15 cards) ────────────────────────────────
  {
    id: 'lvl1-c-001',
    type: 'challenge',
    content: "Eye Gazing Challenge: Stare into each other's eyes for 2 minutes without talking or looking away. First to break eye contact gives the other a kiss.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-c-002',
    type: 'challenge',
    content: "Slow Dance: Put on a romantic song and slow dance together for the entire song, holding each other close.",
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '5 min',
    requires: ['music']
  },
  {
    id: 'lvl1-c-003',
    type: 'challenge',
    content: "Love Note: Write a short, sweet note to each other and hide it somewhere the other will find later.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '5 min',
    requires: ['paper', 'pen']
  },
  {
    id: 'lvl1-c-004',
    type: 'challenge',
    content: "Question Game: Take turns asking each other questions. You must answer honestly. Go for 10 questions.",
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '10 min',
    requires: []
  },
  {
    id: 'lvl1-c-005',
    type: 'challenge',
    content: "Mirror Me: Copy everything I do for 2 minutes—every movement, every expression. Try to make me laugh.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-c-006',
    type: 'challenge',
    content: "20 Questions: Think of something, and I have 20 yes/no questions to guess what it is about you.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-c-007',
    type: 'challenge',
    content: "Playlist Creation: Each of you adds 3 songs to a shared playlist that represents your relationship.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '10 min',
    requires: ['music-app']
  },
  {
    id: 'lvl1-c-008',
    type: 'challenge',
    content: "Trust Fall: Fall backward into my arms. I'll catch you. Then we switch.",
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '2 min',
    requires: []
  },
  {
    id: 'lvl1-c-009',
    type: 'challenge',
    content: "Future Planning: Together, plan one small adventure or date you want to have in the next month.",
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '10 min',
    requires: []
  },
  {
    id: 'lvl1-c-010',
    type: 'challenge',
    content: "Compliment Battle: Take turns giving each other compliments. The first one who can't think of one loses and has to give a kiss.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-c-011',
    type: 'challenge',
    content: "Breathing Sync: Sit facing each other, hold hands, and try to breathe in sync for 3 minutes.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '3 min',
    requires: []
  },
  {
    id: 'lvl1-c-012',
    type: 'challenge',
    content: "Story Building: Take turns adding one sentence to create a ridiculous story together. Make it as silly as possible.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-c-013',
    type: 'challenge',
    content: "Memory Lane: Share your favorite memory of us from each season of the year.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '10 min',
    requires: []
  },
  {
    id: 'lvl1-c-014',
    type: 'challenge',
    content: "Thumb War Tournament: Best of 5 thumb wars. Winner gets to choose the next activity.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-c-015',
    type: 'challenge',
    content: "Gratitude Circle: Take turns sharing three things you're grateful for about your life right now.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },

  // ─── FANTASY (8 cards) ───────────────────────────────────
  {
    id: 'lvl1-fn-001',
    type: 'fantasy',
    content: "Imagine we're on a picnic in a beautiful garden. Describe what we'd eat, where we'd sit, and what we'd talk about.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-fn-002',
    type: 'fantasy',
    content: "Pretend we're meeting for the first time at a coffee shop. Introduce yourself and flirt with me.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-fn-003',
    type: 'fantasy',
    content: "Describe our perfect lazy Sunday morning together—what time we wake up, what we eat, what we do.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-fn-004',
    type: 'fantasy',
    content: "Imagine we're old and gray, sitting on our porch. What are we doing? What are we talking about?",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-fn-005',
    type: 'fantasy',
    content: "Pretend we're tourists in our own city. Where would you take me on a 'first date' exploring?",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-fn-006',
    type: 'fantasy',
    content: "Describe the coziest possible evening we could have together right now.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '3 min',
    requires: []
  },
  {
    id: 'lvl1-fn-007',
    type: 'fantasy',
    content: "Imagine we could teleport anywhere for just one hour. Where would we go and what would we do?",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '3 min',
    requires: []
  },
  {
    id: 'lvl1-fn-008',
    type: 'fantasy',
    content: "Pretend we're characters in a romantic comedy. What would our 'meet cute' scene look like?",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },

  // ─── ROLEPLAY (7 cards) ──────────────────────────────────
  {
    id: 'lvl1-rp-001',
    type: 'roleplay',
    content: "Barista and Customer: You're making me the perfect coffee. Flirt with me while you 'prepare' my drink.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-rp-002',
    type: 'roleplay',
    content: "Tour Guide: You're showing me around your hometown (or favorite place). Tell me all the special spots.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-rp-003',
    type: 'roleplay',
    content: "Chef and Food Critic: You've made me a special meal. Describe each dish with passion and flair.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-rp-004',
    type: 'roleplay',
    content: "Artist and Muse: I'm your inspiration. Describe what you see and how it moves you to create.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-rp-005',
    type: 'roleplay',
    content: "Pen Pals: We're writing letters to each other from different countries. What do you tell me about your life?",
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-rp-006',
    type: 'roleplay',
    content: "Dance Instructor: Teach me a simple dance step. Be patient, encouraging, and close.",
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  },
  {
    id: 'lvl1-rp-007',
    type: 'roleplay',
    content: "Book Club: We're discussing our favorite book. Convince me why I should read it.",
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '5 min',
    requires: []
  }
];
