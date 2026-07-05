import { GameCard } from './gameCards';

export const LEVEL1_CARDS: GameCard[] = [
  {
    id: 'lvl1-t-002',
    type: 'truth',
    content:
      'What was the first physical detail about me that caught your attention? Be specific.',
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-004',
    type: 'truth',
    content:
      'If I fed you one bite slowly right now, what would you want it to be?',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-007',
    type: 'truth',
    content:
      'If we slipped away for one private minute right now, where would you take me?',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-009',
    type: 'truth',
    content:
      'What is one confident move I make that you secretly find attractive?',
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-011',
    type: 'truth',
    content:
      'Describe my flirt style in three words, then show me one of them.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-015',
    type: 'truth',
    content:
      'If you could control one tiny thing about this round—my posture, my voice, or my hands—which would you choose?',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-d-001',
    type: 'dare',
    content:
      'Hold my hand for the next 1 minute without letting go, no matter what.',
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-d-002',
    type: 'dare',
    content:
      'Give me a 1-minute shoulder massage while telling me what you appreciate about me.',
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-d-003',
    type: 'dare',
    content:
      'Give me your most innocent face, then your most guilty face. Hold each for 5 seconds.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-d-004',
    type: 'dare',
    content:
      'Trace the outline of my hand with your finger, slowly, while looking into my eyes.',
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-d-006',
    type: 'dare',
    content:
      'Feed me one bite of fruit or chocolate slowly, like you know I am watching your mouth.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
    requires: ['food'],
  },
  {
    id: 'lvl1-d-007',
    type: 'dare',
    content:
      'Play with my hair for 1 minute while telling me exactly how you like me looking at you.',
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-d-008',
    type: 'dare',
    content:
      'Give me three compliments: one sweet, one physical, and one that would make me blush.',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-d-009',
    type: 'dare',
    content:
      'Kiss the back of my hand like you are asking permission to flirt harder.',
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-d-010',
    type: 'dare',
    content:
      'Swap flirt styles with me for 30 seconds: move, talk, and tease the way I do.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-d-013',
    type: 'dare',
    content:
      'Draw a tiny secret symbol on my palm and whisper what you want it to mean this round.',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-d-014',
    type: 'dare',
    content:
      'Stand behind me, place your hands on my waist, and guide one slow turn like I am on display.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-d-015',
    type: 'dare',
    content:
      'Brush my hair or fix my collar/shirt with extra care and attention.',
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '30 sec',
    safetyNotes:
      'Keep anything at the neck loose and decorative—never restricting. Remove immediately on request.',
  },
  {
    id: 'lvl1-c-002',
    type: 'challenge',
    content:
      'Slow Dance: Hum or play one chorus of a song and slow dance with me, forehead to forehead, until it ends.',
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
    requires: ['music'],
  },
  {
    id: 'lvl1-c-003',
    type: 'challenge',
    content:
      'Love Note: Write me a five-word love note, fold it, and press it into my hand like a secret.',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
    requires: ['paper', 'pen'],
  },
  {
    id: 'lvl1-c-004',
    type: 'challenge',
    content:
      'Quick Fire: Ask each other three flirty yes/no questions. No dodging, no explaining until the timer ends.',
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-c-005',
    type: 'challenge',
    content:
      'Mirror Me: Copy my slowest, most seductive movement for 1 minute. Then I copy yours.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-c-006',
    type: 'challenge',
    content:
      '20 Questions: Pick one thing you want me to do to you right now. I get 20 yes/no questions to guess it.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-c-007',
    type: 'challenge',
    content:
      'Soundtrack Swap: Each of you names one song that would make this room feel hotter right now.',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
    requires: ['music'],
  },
  {
    id: 'lvl1-c-009',
    type: 'challenge',
    content:
      'Next Move: Each of you names one quick thing you want the other to do before the next draw.',
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-c-011',
    type: 'challenge',
    content:
      'Breathing Sync: Sit facing each other, hold hands, and try to breathe in sync for 1 minute.',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-c-012',
    type: 'challenge',
    content:
      'Tease Story: Take turns adding one sentence to describe how this round gets more tempting.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-c-013',
    type: 'challenge',
    content:
      'Memory Spark: Each of you names one moment when the other looked especially irresistible.',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-c-014',
    type: 'challenge',
    content:
      "Hand Control: Thumb wrestle once. Winner places the loser's hand somewhere non-explicit for 10 seconds.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-fn-003',
    type: 'fantasy',
    content:
      'Describe waking up next to me and the first teasing thing you would do before either of us gets up.',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-fn-006',
    type: 'fantasy',
    content:
      'Describe the coziest outfit you could put me in right now, then what you would adjust first.',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-fn-007',
    type: 'fantasy',
    content:
      "Imagine we could vanish for one private minute. Where do we land, and what's the first thing you whisper?",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-rp-006',
    type: 'roleplay',
    content:
      'Dance Instructor: Teach me a simple dance step. Be patient, encouraging, and close.',
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-t-001',
    type: 'truth',
    content:
      "What's your favorite thing about my smile? Tell me while looking into my eyes.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-003',
    type: 'truth',
    content: "What's a sweet memory of us that always makes you smile?",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-005',
    type: 'truth',
    content:
      "What's your favorite way to be comforted when you're having a bad day?",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-006',
    type: 'truth',
    content: "What's something small I do that makes you feel loved?",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-008',
    type: 'truth',
    content:
      'What sound from me—laugh, sigh, whisper, or breath—gets your attention fastest?',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-010',
    type: 'truth',
    content:
      'What is one innocent habit of mine that becomes distracting when you notice it?',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-012',
    type: 'truth',
    content: "What's your favorite physical feature of mine? Point to it.",
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-013',
    type: 'truth',
    content: "What's one playful role swap you would try with me for 1 minute?",
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-t-014',
    type: 'truth',
    content:
      'What is one small seductive gesture from me that would feel romantic and dangerous at the same time?',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-d-005',
    type: 'dare',
    content:
      "Whisper 'te quiero' or 'I love you' in my ear three different ways—sweet, playful, and dramatic.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-d-011',
    type: 'dare',
    content:
      "Give me a gentle forehead kiss and tell me one thing you're grateful for about us.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-d-012',
    type: 'dare',
    content:
      "Tickle me gently for 30 seconds, but stop immediately if I say 'parar' (stop).",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-c-001',
    type: 'challenge',
    content:
      "Eye Gazing Challenge: Stare into each other's eyes for 1 minute without talking or looking away. First to break eye contact gives the other a kiss.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-c-008',
    type: 'challenge',
    content:
      "Trust Fall: Fall backward into my arms. I'll catch you. Then we switch.",
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-c-010',
    type: 'challenge',
    content:
      "Compliment Battle: Take turns giving each other compliments. The first one who can't think of one loses and has to give a kiss.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-c-015',
    type: 'challenge',
    content:
      "Gratitude Circle: Take turns sharing three things you're grateful for about your life right now.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-fn-001',
    type: 'fantasy',
    content:
      'Imagine we are alone on a blanket outside. Describe the teasing rule we both have to follow for 1 minute.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-fn-002',
    type: 'fantasy',
    content:
      "Pretend we're meeting for the first time at a coffee shop. Introduce yourself and flirt with me.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-fn-004',
    type: 'fantasy',
    content:
      'Imagine I am dressed exactly how you like. What am I wearing, and what do you notice first?',
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-fn-005',
    type: 'fantasy',
    content:
      "Pretend we're strangers at a hotel bar. Give me the first line that would make me stay.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-fn-008',
    type: 'fantasy',
    content:
      "Pretend we're characters in a secret flirtation. What tiny signal tells me you want my attention?",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-rp-001',
    type: 'roleplay',
    content:
      "Barista and Customer: You're making me the perfect coffee. Flirt with me while you 'prepare' my drink.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-rp-002',
    type: 'roleplay',
    content:
      'Stylist and Client: Adjust one part of my outfit and tell me why it looks better your way.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-rp-003',
    type: 'roleplay',
    content:
      'Makeup Artist and Muse: Pretend to touch up my look with one fingertip, then show me the final pose.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-rp-004',
    type: 'roleplay',
    content:
      "Artist and Muse: I'm your inspiration. Describe what you see and how it moves you to create.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-rp-005',
    type: 'roleplay',
    content:
      'Secret Admirer: Deliver a 30-second confession about the part of me you cannot stop noticing.',
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-rp-007',
    type: 'roleplay',
    content:
      'Photographer and Model: Direct one pose, one look, and one expression. Keep it tasteful but charged.',
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-qk-001',
    type: 'dare',
    content:
      "Look me up and down—slowly, obviously—then bite your lip and say 'not bad.' Sell it.",
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-qk-002',
    type: 'dare',
    content:
      'Spray your perfume or cologne on your wrist and hold it to my lips like an offering.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
    requires: ['perfume'],
  },
  {
    id: 'lvl1-qk-003',
    type: 'dare',
    content:
      'Kiss the back of my hand like we just met at a royal ball. Introduce yourself in character.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-qk-004',
    type: 'challenge',
    content:
      'Walk across the room the way I walk. Then I walk like you. Loving imitation only—make it charming.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '1 min',
  },
  {
    id: 'lvl1-qk-005',
    type: 'dare',
    content:
      'Fix one thing about my outfit—a sleeve, a button, a strand of hair—slowly, like it matters.',
    intensity: 1,
    category: 'physical',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-qk-006',
    type: 'truth',
    content:
      'Which single item in my wardrobe do you secretly love on me? Why that one?',
    intensity: 1,
    category: 'communication',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-qk-007',
    type: 'dare',
    content:
      'Strike your best magazine-cover pose against the nearest wall and hold it while I rate it out of ten.',
    intensity: 1,
    category: 'playful',
    isPremium: false,
    estimatedTime: '30 sec',
  },
  {
    id: 'lvl1-qk-008',
    type: 'dare',
    content:
      "Whisper my name into my ear like it's the answer to a question you've been asked all your life.",
    intensity: 1,
    category: 'emotional',
    isPremium: false,
    estimatedTime: '30 sec',
  },
];
