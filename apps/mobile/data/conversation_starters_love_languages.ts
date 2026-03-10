// Love Languages - Conversation Starters
// Based on Gary Chapman's 5 Love Languages
// Helps couples discover and understand each other's love languages

import { ConversationStarter } from '../lib/conversationStarters';

export const loveLanguagesStarters: ConversationStarter[] = [
  // Words of Affirmation (10 prompts)
  {
    id: 'conv-ll-001',
    category: 'love_languages',
    intensity: 2,
    question: "What words of affirmation do you need to hear most from me?",
    followUps: [
      "When was the last time you felt truly appreciated by me?",
      "What specific compliments mean the most to you?",
      "How can I remind you daily that I love you?"
    ],
    context: "Words have power. For some, hearing 'I love you' or receiving praise is the ultimate expression of love.",
    tags: ['love-languages', 'words-of-affirmation', 'communication']
  },
  {
    id: 'conv-ll-002',
    category: 'love_languages',
    intensity: 2,
    question: "How do you feel when I give you compliments in front of others?",
    followUps: [
      "Does public praise make you uncomfortable or happy?",
      "Would you prefer private affirmations instead?",
      "What's the best way for me to celebrate your achievements?"
    ],
    context: "Public vs private affirmation can feel very different depending on your personality.",
    tags: ['love-languages', 'words-of-affirmation', 'public-vs-private']
  },
  {
    id: 'conv-ll-003',
    category: 'love_languages',
    intensity: 3,
    question: "What's something I've said that made you feel deeply loved?",
    followUps: [
      "Why did those words impact you so much?",
      "Do you need to hear those words more often?",
      "What other words would have a similar effect?"
    ],
    context: "Understanding what has worked helps us repeat those moments of connection.",
    tags: ['love-languages', 'words-of-affirmation', 'memories']
  },
  {
    id: 'conv-ll-004',
    category: 'love_languages',
    intensity: 2,
    question: "How important is it for you to hear 'I love you' daily?",
    followUps: [
      "Do actions matter more than words for you?",
      "Would you prefer different ways of expressing love?",
      "What happens when you don't hear those words?"
    ],
    context: "Some need verbal confirmation regularly, while others prefer actions over words.",
    tags: ['love-languages', 'words-of-affirmation', 'daily-habits']
  },
  {
    id: 'conv-ll-005',
    category: 'love_languages',
    intensity: 3,
    question: "What encouraging words do you need when you're facing a challenge?",
    followUps: [
      "Do you want advice or just support?",
      "What phrases help you feel capable and strong?",
      "How can I better support you during difficult times?"
    ],
    context: "Supportive words during tough times can be a powerful expression of love.",
    tags: ['love-languages', 'words-of-affirmation', 'support']
  },

  // Acts of Service (10 prompts)
  {
    id: 'conv-ll-006',
    category: 'love_languages',
    intensity: 2,
    question: "What daily acts of service would make you feel most loved?",
    followUps: [
      "Which household tasks do you appreciate most when I do them?",
      "Is it about the task itself or the thought behind it?",
      "What small gestures would make your day easier?"
    ],
    context: "Actions speak louder than words. For some, doing something helpful is the purest form of love.",
    tags: ['love-languages', 'acts-of-service', 'daily-life']
  },
  {
    id: 'conv-ll-007',
    category: 'love_languages',
    intensity: 2,
    question: "When I do something for you without being asked, how does that make you feel?",
    followUps: [
      "What unsolicited help means the most to you?",
      "Do you prefer me to ask first or just do it?",
      "What's the difference between help and taking over?"
    ],
    context: "Anticipating needs and acting on them shows deep care and attention.",
    tags: ['love-languages', 'acts-of-service', 'initiative']
  },
  {
    id: 'conv-ll-008',
    category: 'love_languages',
    intensity: 3,
    question: "What's something I do that you consider an act of love, even if I don't realize it?",
    followUps: [
      "Why does that particular action mean so much?",
      "Are there other things I do that you appreciate?",
      "How can I be more intentional about these acts?"
    ],
    context: "Sometimes we express love in ways we don't even realize. Understanding these hidden expressions deepens connection.",
    tags: ['love-languages', 'acts-of-service', 'awareness']
  },
  {
    id: 'conv-ll-009',
    category: 'love_languages',
    intensity: 2,
    question: "How do you feel when I take care of something you've been stressed about?",
    followUps: [
      "What tasks cause you the most stress?",
      "How can I better anticipate what you need?",
      "What would feel like a burden vs. a gift?"
    ],
    context: "Relieving your partner's stress through action is a profound way to show love.",
    tags: ['love-languages', 'acts-of-service', 'stress-relief']
  },
  {
    id: 'conv-ll-010',
    category: 'love_languages',
    intensity: 3,
    question: "What's one thing I could take off your plate that would make you feel truly cared for?",
    followUps: [
      "Is there something you dread doing that I could handle?",
      "What would give you more time for yourself?",
      "How would that change how you feel in our relationship?"
    ],
    context: "Sometimes the greatest gift is freedom from a burden.",
    tags: ['love-languages', 'acts-of-service', 'gift-of-time']
  },

  // Receiving Gifts (10 prompts)
  {
    id: 'conv-ll-011',
    category: 'love_languages',
    intensity: 2,
    question: "What kind of gifts make you feel most loved?",
    followUps: [
      "Is it the thought, the effort, or the item itself?",
      "Do you prefer practical gifts or sentimental ones?",
      "What was the most meaningful gift you've ever received?"
    ],
    context: "Gifts are visual symbols of love. For some, a thoughtful present speaks volumes.",
    tags: ['love-languages', 'receiving-gifts', 'thoughtfulness']
  },
  {
    id: 'conv-ll-012',
    category: 'love_languages',
    intensity: 2,
    question: "How do you feel when I bring you small surprises?",
    followUps: [
      "What kinds of surprises do you enjoy most?",
      "Do you prefer planned gifts or spontaneous ones?",
      "What's a small thing I could bring you that would make your day?"
    ],
    context: "It's not about the cost—it's about knowing your partner well enough to choose something meaningful.",
    tags: ['love-languages', 'receiving-gifts', 'surprises']
  },
  {
    id: 'conv-ll-013',
    category: 'love_languages',
    intensity: 3,
    question: "What's a gift you've always wanted but never received?",
    followUps: [
      "Why is that gift meaningful to you?",
      "What would it represent to receive it?",
      "Is there a story behind why you want it?"
    ],
    context: "Unfulfilled gift desires often represent deeper emotional needs.",
    tags: ['love-languages', 'receiving-gifts', 'dreams']
  },
  {
    id: 'conv-ll-014',
    category: 'love_languages',
    intensity: 2,
    question: "Do you prefer experiences or physical gifts?",
    followUps: [
      "What experiences would you love to share with me?",
      "Are there physical items that hold special meaning for you?",
      "How do you feel about handmade or personalized gifts?"
    ],
    context: "Some value memories created together; others treasure tangible reminders of love.",
    tags: ['love-languages', 'receiving-gifts', 'experiences']
  },
  {
    id: 'conv-ll-015',
    category: 'love_languages',
    intensity: 3,
    question: "How do you feel when I give you something that shows I've been paying attention?",
    followUps: [
      "What have I given you that showed I really know you?",
      "What does it mean when someone remembers small details?",
      "How can I get better at noticing what you'd love?"
    ],
    context: "Gifts that reflect deep knowledge of your partner are the most meaningful.",
    tags: ['love-languages', 'receiving-gifts', 'attention']
  },

  // Quality Time (10 prompts)
  {
    id: 'conv-ll-016',
    category: 'love_languages',
    intensity: 2,
    question: "What does quality time look like for you?",
    followUps: [
      "Do you prefer planned dates or spontaneous moments?",
      "What activities make you feel most connected to me?",
      "Is it about the activity or just being together?"
    ],
    context: "Undivided attention is the key. For some, time spent together is the ultimate expression of love.",
    tags: ['love-languages', 'quality-time', 'connection']
  },
  {
    id: 'conv-ll-017',
    category: 'love_languages',
    intensity: 3,
    question: "When do you feel most ignored by me, even if I'm physically present?",
    followUps: [
      "What behaviors make you feel like I'm not really there?",
      "How can I show you I'm fully present?",
      "What would uninterrupted attention look like?"
    ],
    context: "Physical presence without emotional presence can feel like absence.",
    tags: ['love-languages', 'quality-time', 'presence']
  },
  {
    id: 'conv-ll-018',
    category: 'love_languages',
    intensity: 2,
    question: "What shared activities would you like us to do more often?",
    followUps: [
      "What hobbies would you like us to explore together?",
      "Are there new experiences you'd like to try?",
      "What regular rituals would strengthen our bond?"
    ],
    context: "Shared experiences create lasting memories and deepen connection.",
    tags: ['love-languages', 'quality-time', 'shared-activities']
  },
  {
    id: 'conv-ll-019',
    category: 'love_languages',
    intensity: 3,
    question: "How do you feel when I put away my phone and give you my full attention?",
    followUps: [
      "What does undivided attention mean to you?",
      "How often do you need this kind of focused time?",
      "What would our ideal quality time look like?"
    ],
    context: "In a distracted world, full attention is a precious gift.",
    tags: ['love-languages', 'quality-time', 'attention']
  },
  {
    id: 'conv-ll-020',
    category: 'love_languages',
    intensity: 2,
    question: "What's your favorite memory of us spending time together?",
    followUps: [
      "What made that time so special?",
      "How can we create more moments like that?",
      "What elements made it feel like quality time?"
    ],
    context: "Understanding what made past moments special helps recreate them.",
    tags: ['love-languages', 'quality-time', 'memories']
  },

  // Physical Touch (10 prompts)
  {
    id: 'conv-ll-021',
    category: 'love_languages',
    intensity: 2,
    question: "What kind of physical touch makes you feel most loved?",
    followUps: [
      "Do you prefer public or private displays of affection?",
      "What types of touch help you feel connected?",
      "Are there times when touch is more important to you?"
    ],
    context: "For some, physical touch is the most direct way to feel loved and secure.",
    tags: ['love-languages', 'physical-touch', 'affection']
  },
  {
    id: 'conv-ll-022',
    category: 'love_languages',
    intensity: 3,
    question: "How do you feel when I reach for your hand or touch you casually?",
    followUps: [
      "What casual touches mean the most to you?",
      "Do you need more or less casual touch?",
      "What does physical connection communicate to you?"
    ],
    context: "Small, casual touches throughout the day can maintain connection.",
    tags: ['love-languages', 'physical-touch', 'casual-touch']
  },
  {
    id: 'conv-ll-023',
    category: 'love_languages',
    intensity: 3,
    question: "What happens to you emotionally when we don't have physical contact for a while?",
    followUps: [
      "How long is 'too long' without touch?",
      "What feelings come up when touch is missing?",
      "How can we maintain physical connection even when busy?"
    ],
    context: "For those who need physical touch, absence can feel like emotional distance.",
    tags: ['love-languages', 'physical-touch', 'needs']
  },
  {
    id: 'conv-ll-024',
    category: 'love_languages',
    intensity: 2,
    question: "What non-sexual physical affection do you enjoy most?",
    followUps: [
      "What types of touch help you feel safe and loved?",
      "Are there touches that are purely comforting?",
      "How can I initiate affection in ways that feel good to you?"
    ],
    context: "Physical touch isn't just about intimacy—it's about connection, comfort, and security.",
    tags: ['love-languages', 'physical-touch', 'comfort']
  },
  {
    id: 'conv-ll-025',
    category: 'love_languages',
    intensity: 3,
    question: "How does physical touch affect your mood and sense of connection?",
    followUps: [
      "What does touch communicate that words cannot?",
      "How quickly does your mood improve with affection?",
      "What would more regular touch do for our relationship?"
    ],
    context: "Understanding the emotional impact of touch helps prioritize it.",
    tags: ['love-languages', 'physical-touch', 'emotional-impact']
  },

  // Discovering Your Love Languages (5 prompts)
  {
    id: 'conv-ll-026',
    category: 'love_languages',
    intensity: 3,
    question: "Looking at the five love languages, which one resonates most with you?",
    followUps: [
      "Words of Affirmation, Acts of Service, Receiving Gifts, Quality Time, or Physical Touch?",
      "Why do you think that language speaks to you?",
      "How did you develop that preference?"
    ],
    context: "Discovering your primary love language is the first step to better communication.",
    tags: ['love-languages', 'discovery', 'self-awareness']
  },
  {
    id: 'conv-ll-027',
    category: 'love_languages',
    intensity: 3,
    question: "What's your secondary love language—the one that's important but not primary?",
    followUps: [
      "How does this secondary language show up in your needs?",
      "When does it become more important than your primary?",
      "How can I honor both languages?"
    ],
    context: "Most people have a primary and secondary love language that work together.",
    tags: ['love-languages', 'discovery', 'secondary-language']
  },
  {
    id: 'conv-ll-028',
    category: 'love_languages',
    intensity: 3,
    question: "Which love language is hardest for you to receive or give?",
    followUps: [
      "Why is that language challenging for you?",
      "Is it about comfort, past experiences, or something else?",
      "How can we work on this together?"
    ],
    context: "Understanding challenges helps us grow and meet each other halfway.",
    tags: ['love-languages', 'challenges', 'growth']
  },
  {
    id: 'conv-ll-029',
    category: 'love_languages',
    intensity: 3,
    question: "How can I better speak your love language, even if it's not natural for me?",
    followUps: [
      "What specific actions would mean the most?",
      "How can you help me learn your language?",
      "What patience do you need from me as I learn?"
    ],
    context: "Learning your partner's love language is an act of love in itself.",
    tags: ['love-languages', 'learning', 'effort']
  },
  {
    id: 'conv-ll-030',
    category: 'love_languages',
    intensity: 3,
    question: "What would it look like if we both felt completely loved in our own languages?",
    followUps: [
      "How would our relationship feel different?",
      "What daily habits would we have?",
      "What would be possible for us then?"
    ],
    context: "Visioning the ideal helps us work toward it together.",
    tags: ['love-languages', 'vision', 'future']
  },
];

export default loveLanguagesStarters;
