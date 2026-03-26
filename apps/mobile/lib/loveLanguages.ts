// Love Languages Quiz Data
// Based on the 5 Love Languages by Gary Chapman

export type LoveLanguage = 'words' | 'time' | 'gifts' | 'acts' | 'touch';

export interface QuizQuestion {
  id: number;
  optionA: {
    text: string;
    type: LoveLanguage;
  };
  optionB: {
    text: string;
    type: LoveLanguage;
  };
}

export const LOVE_LANGUAGE_NAMES: Record<LoveLanguage, string> = {
  words: 'Words of Affirmation',
  time: 'Quality Time',
  gifts: 'Receiving Gifts',
  acts: 'Acts of Service',
  touch: 'Physical Touch',
};

export const LOVE_LANGUAGE_EMOJIS: Record<LoveLanguage, string> = {
  words: '💬',
  time: '⏰',
  gifts: '🎁',
  acts: '🤝',
  touch: '🤗',
};

export const LOVE_LANGUAGE_DESCRIPTIONS: Record<LoveLanguage, string> = {
  words: 'You feel loved when your partner gives you compliments, says "I love you," or expresses appreciation verbally.',
  time: 'You feel loved when your partner gives you their undivided attention and spends meaningful time with you.',
  gifts: 'You feel loved when your partner gives you thoughtful presents, big or small, that show they were thinking of you.',
  acts: 'You feel loved when your partner does things to help you, like chores, errands, or tasks that make your life easier.',
  touch: 'You feel loved through physical connection—hugs, kisses, holding hands, and other forms of affectionate touch.',
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    optionA: { text: 'I like to receive notes of affection from my partner', type: 'words' },
    optionB: { text: 'I like to be hugged by my partner', type: 'touch' },
  },
  {
    id: 2,
    optionA: { text: 'I feel loved when my partner gives me their full attention', type: 'time' },
    optionB: { text: 'I feel loved when my partner does things to help me', type: 'acts' },
  },
  {
    id: 3,
    optionA: { text: 'I like to receive small gifts from my partner', type: 'gifts' },
    optionB: { text: 'I like to hear that I am appreciated by my partner', type: 'words' },
  },
  {
    id: 4,
    optionA: { text: 'I feel loved when my partner helps me with tasks', type: 'acts' },
    optionB: { text: 'I feel loved when my partner holds my hand', type: 'touch' },
  },
  {
    id: 5,
    optionA: { text: 'I like to spend uninterrupted leisure time with my partner', type: 'time' },
    optionB: { text: 'I like when my partner gives me thoughtful surprises', type: 'gifts' },
  },
  {
    id: 6,
    optionA: { text: 'I feel loved when my partner compliments my appearance', type: 'words' },
    optionB: { text: 'I feel loved when my partner helps me with a project', type: 'acts' },
  },
  {
    id: 7,
    optionA: { text: 'I like to sit close to my partner', type: 'touch' },
    optionB: { text: 'I like when my partner surprises me with a gift', type: 'gifts' },
  },
  {
    id: 8,
    optionA: { text: 'I feel loved when my partner runs errands for me', type: 'acts' },
    optionB: { text: 'I feel loved when my partner tells me they love me', type: 'words' },
  },
  {
    id: 9,
    optionA: { text: 'I like to go places together with my partner', type: 'time' },
    optionB: { text: 'I like to hold hands with my partner', type: 'touch' },
  },
  {
    id: 10,
    optionA: { text: 'I feel loved when my partner gives me a thoughtful gift', type: 'gifts' },
    optionB: { text: 'I feel loved when my partner helps me around the house', type: 'acts' },
  },
  {
    id: 11,
    optionA: { text: 'I like to hear encouraging words from my partner', type: 'words' },
    optionB: { text: 'I like when my partner cuddles with me', type: 'touch' },
  },
  {
    id: 12,
    optionA: { text: 'I feel loved when my partner takes time to listen to me', type: 'time' },
    optionB: { text: 'I feel loved when my partner brings me a small token of affection', type: 'gifts' },
  },
  {
    id: 13,
    optionA: { text: 'I like when my partner does chores without being asked', type: 'acts' },
    optionB: { text: 'I like when my partner tells me I look nice', type: 'words' },
  },
  {
    id: 14,
    optionA: { text: 'I feel loved when my partner gives me a massage', type: 'touch' },
    optionB: { text: 'I feel loved when my partner plans a special date for us', type: 'time' },
  },
  {
    id: 15,
    optionA: { text: 'I like receiving gifts on special occasions', type: 'gifts' },
    optionB: { text: 'I like when my partner helps me solve a problem', type: 'acts' },
  },
  {
    id: 16,
    optionA: { text: 'I feel loved when my partner gives me their undivided attention', type: 'time' },
    optionB: { text: 'I feel loved when my partner says they are proud of me', type: 'words' },
  },
  {
    id: 17,
    optionA: { text: 'I like to be physically close to my partner', type: 'touch' },
    optionB: { text: 'I like when my partner remembers special occasions with a gift', type: 'gifts' },
  },
  {
    id: 18,
    optionA: { text: 'I feel loved when my partner does things to lighten my load', type: 'acts' },
    optionB: { text: 'I feel loved when my partner plans activities for us to do together', type: 'time' },
  },
  {
    id: 19,
    optionA: { text: 'I like to hear "I love you" from my partner', type: 'words' },
    optionB: { text: 'I like when my partner puts their arm around me', type: 'touch' },
  },
  {
    id: 20,
    optionA: { text: 'I feel loved when my partner gives me a handmade gift', type: 'gifts' },
    optionB: { text: 'I feel loved when my partner takes care of something I need done', type: 'acts' },
  },
  {
    id: 21,
    optionA: { text: 'I like when my partner listens to me without interrupting', type: 'time' },
    optionB: { text: 'I like when my partner surprises me with something I mentioned wanting', type: 'gifts' },
  },
  {
    id: 22,
    optionA: { text: 'I feel loved when my partner gives me a kiss', type: 'touch' },
    optionB: { text: 'I feel loved when my partner tells me what they admire about me', type: 'words' },
  },
  {
    id: 23,
    optionA: { text: 'I like when my partner helps me with my responsibilities', type: 'acts' },
    optionB: { text: 'I like when my partner creates special memories with me', type: 'time' },
  },
  {
    id: 24,
    optionA: { text: 'I feel loved when my partner brings me flowers or a treat', type: 'gifts' },
    optionB: { text: 'I feel loved when my partner embraces me', type: 'touch' },
  },
  {
    id: 25,
    optionA: { text: 'I like to hear praise from my partner', type: 'words' },
    optionB: { text: 'I like when my partner makes time for just us', type: 'time' },
  },
  {
    id: 26,
    optionA: { text: 'I feel loved when my partner does a task I was dreading', type: 'acts' },
    optionB: { text: 'I feel loved when my partner gives me something they know I will enjoy', type: 'gifts' },
  },
  {
    id: 27,
    optionA: { text: 'I like to walk while holding hands with my partner', type: 'touch' },
    optionB: { text: 'I like when my partner tells me I am valued', type: 'words' },
  },
  {
    id: 28,
    optionA: { text: 'I feel loved when my partner prioritizes time with me', type: 'time' },
    optionB: { text: 'I feel loved when my partner anticipates my needs and helps', type: 'acts' },
  },
  {
    id: 29,
    optionA: { text: 'I like receiving meaningful gifts from my partner', type: 'gifts' },
    optionB: { text: 'I like physical affection from my partner', type: 'touch' },
  },
  {
    id: 30,
    optionA: { text: 'I feel loved when my partner expresses their appreciation for me', type: 'words' },
    optionB: { text: 'I feel loved when my partner is fully present with me', type: 'time' },
  },
];

export interface QuizResult {
  primary: LoveLanguage;
  secondary: LoveLanguage;
  scores: Record<LoveLanguage, number>;
}

export function calculateResults(answers: LoveLanguage[]): QuizResult {
  const scores: Record<LoveLanguage, number> = {
    words: 0,
    time: 0,
    gifts: 0,
    acts: 0,
    touch: 0,
  };

  answers.forEach((type) => {
    scores[type]++;
  });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  
  return {
    primary: sorted[0][0] as LoveLanguage,
    secondary: sorted[1][0] as LoveLanguage,
    scores,
  };
}
