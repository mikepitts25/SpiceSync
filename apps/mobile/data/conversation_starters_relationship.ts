// apps/mobile/data/conversation_starters_relationship.ts
// Relationship Deep Dives - 50 conversation prompts
// Questions to explore your connection, history, and future together

import { ConversationStarter } from '../lib/conversationStarters';

export const relationshipStarters: ConversationStarter[] = [
  // "What Made You Fall For Me?" & Initial Attraction (10 prompts)
  {
    id: 'conv-rel-001',
    category: 'relationship',
    intensity: 2,
    question: "What was your first impression of me?",
    followUps: [
      "How accurate was it?",
      "What changed your mind, if anything?",
      "When did you realize you wanted to know me better?"
    ],
    context: "First impressions set the stage, but the real story is how they evolved.",
    tags: ['attraction', 'first-meeting', 'memories']
  },
  {
    id: 'conv-rel-002',
    category: 'relationship',
    intensity: 2,
    question: "What made you fall for me?",
    followUps: [
      "Was it one moment or many small things?",
      "Do you still feel that way about that quality?",
      "What keeps you choosing me?"
    ],
    context: "Remembering what drew us together strengthens our appreciation.",
    tags: ['love', 'attraction', 'appreciation']
  },
  {
    id: 'conv-rel-003',
    category: 'relationship',
    intensity: 2,
    question: "What's something you noticed about me early on that you still love?",
    followUps: [
      "Has it changed or grown over time?",
      "What does it say about who I am?",
      "How does it make you feel when you see it?"
    ],
    context: "The qualities that first attracted us often remain the foundation of our love.",
    tags: ['appreciation', 'observation', 'love']
  },
  {
    id: 'conv-rel-004',
    category: 'relationship',
    intensity: 3,
    question: "What made you decide to commit to me?",
    followUps: [
      "Was there a specific moment?",
      "What were you unsure about before that?",
      "How has that decision felt over time?"
    ],
    context: "Understanding the decision to commit helps us honor that choice.",
    tags: ['commitment', 'decision', 'deep']
  },
  {
    id: 'conv-rel-005',
    category: 'relationship',
    intensity: 2,
    question: "What's something I do that makes you feel special?",
    followUps: [
      "Do I know I do that?",
      "When did you first notice it?",
      "How can I do it more often?"
    ],
    context: "Small gestures often carry more weight than grand declarations.",
    tags: ['appreciation', 'gestures', 'love-languages']
  },
  {
    id: 'conv-rel-006',
    category: 'relationship',
    intensity: 2,
    question: "What did you tell your friends about me after our first few dates?",
    followUps: [
      "What were you most excited about?",
      "Were you worried about anything?",
      "What did they think?"
    ],
    context: "How we talk about a new partner to others reveals what we're feeling.",
    tags: ['memories', 'attraction', 'fun']
  },
  {
    id: 'conv-rel-007',
    category: 'relationship',
    intensity: 3,
    question: "What made you feel safe enough to be vulnerable with me?",
    followUps: [
      "Was it something I did or just who you felt I was?",
      "Do you still feel that safety?",
      "What could make you feel even safer?"
    ],
    context: "Vulnerability requires safety—understanding what creates it deepens trust.",
    tags: ['deep', 'vulnerability', 'trust', 'safety']
  },
  {
    id: 'conv-rel-008',
    category: 'relationship',
    intensity: 2,
    question: "What's a quirk of mine that you secretly love?",
    followUps: [
      "When did you first notice it?",
      "Does it ever annoy you too?",
      "What does it reveal about me?"
    ],
    context: "Loving someone's quirks is a sign of genuine acceptance.",
    tags: ['fun', 'acceptance', 'quirk']
  },
  {
    id: 'conv-rel-009',
    category: 'relationship',
    intensity: 2,
    question: "What was going through your mind during our first kiss?",
    followUps: [
      "Were you nervous?",
      "Did you want it to happen?",
      "How did you feel afterward?"
    ],
    context: "First kisses are milestones—remembering them keeps the spark alive.",
    tags: ['memories', 'intimacy', 'romance']
  },
  {
    id: 'conv-rel-010',
    category: 'relationship',
    intensity: 3,
    question: "What made you realize this was different from other relationships?",
    followUps: [
      "How did you know?",
      "What were you feeling?",
      "Did it scare you or excite you?"
    ],
    context: "Recognizing something special helps us appreciate what we have.",
    tags: ['deep', 'realization', 'commitment']
  },

  // Favorite Memories Together (10 prompts)
  {
    id: 'conv-rel-011',
    category: 'relationship',
    intensity: 2,
    question: "What's your favorite memory of us together?",
    followUps: [
      "What made it so special?",
      "What were you feeling in that moment?",
      "How can we create more moments like that?"
    ],
    context: "Reliving happy memories strengthens our bond and guides future experiences.",
    tags: ['memories', 'happiness', 'nostalgia']
  },
  {
    id: 'conv-rel-012',
    category: 'relationship',
    intensity: 2,
    question: "What's the most fun we've ever had together?",
    followUps: [
      "What were we doing?",
      "Why was it so fun?",
      "Can we do it again or something similar?"
    ],
    context: "Shared joy is the glue of relationships—prioritizing fun keeps us connected.",
    tags: ['fun', 'memories', 'joy']
  },
  {
    id: 'conv-rel-013',
    category: 'relationship',
    intensity: 2,
    question: "What's a small moment with me that you'll never forget?",
    followUps: [
      "Why has it stayed with you?",
      "Did you know in the moment it was special?",
      "What does it represent to you?"
    ],
    context: "The smallest moments often become our most treasured memories.",
    tags: ['memories', 'intimacy', 'meaning']
  },
  {
    id: 'conv-rel-014',
    category: 'relationship',
    intensity: 3,
    question: "What's a time I really showed up for you?",
    followUps: [
      "What did you need in that moment?",
      "How did it make you feel?",
      "What did my support mean to you?"
    ],
    context: "Being there for each other during hard times builds the deepest bonds.",
    tags: ['deep', 'support', 'gratitude']
  },
  {
    id: 'conv-rel-015',
    category: 'relationship',
    intensity: 2,
    question: "What's our most ridiculous or silly memory together?",
    followUps: [
      "What were we thinking?",
      "Do you still laugh about it?",
      "Why do silly moments matter in a relationship?"
    ],
    context: "Laughter and silliness keep relationships light and joyful.",
    tags: ['fun', 'laughter', 'memories']
  },
  {
    id: 'conv-rel-016',
    category: 'relationship',
    intensity: 2,
    question: "What's a trip or adventure with me that you think about often?",
    followUps: [
      "What was the highlight?",
      "What made it special—was it the place or us?",
      "Where should we go next?"
    ],
    context: "Shared adventures create lasting memories and deepen our connection.",
    tags: ['travel', 'adventure', 'memories']
  },
  {
    id: 'conv-rel-017',
    category: 'relationship',
    intensity: 3,
    question: "What's a time we overcame something difficult together?",
    followUps: [
      "How did it change our relationship?",
      "What did you learn about us?",
      "How did we grow from it?"
    ],
    context: "Overcoming challenges together proves our resilience as a couple.",
    tags: ['deep', 'resilience', 'growth']
  },
  {
    id: 'conv-rel-018',
    category: 'relationship',
    intensity: 2,
    question: "What's something we've created together that you're proud of?",
    followUps: [
      "Why does it matter to you?",
      "What did we each contribute?",
      "What should we create next?"
    ],
    context: "Creating together—whether memories, projects, or a life—builds partnership.",
    tags: ['creation', 'partnership', 'pride']
  },
  {
    id: 'conv-rel-019',
    category: 'relationship',
    intensity: 2,
    question: "What's a tradition we've started that you love?",
    followUps: [
      "How did it begin?",
      "What does it represent to you?",
      "What new traditions should we start?"
    ],
    context: "Traditions give rhythm and meaning to our shared life.",
    tags: ['traditions', 'meaning', 'connection']
  },
  {
    id: 'conv-rel-020',
    category: 'relationship',
    intensity: 3,
    question: "What's a moment you felt most connected to me?",
    followUps: [
      "What was happening?",
      "What created that connection?",
      "How can we cultivate more of those moments?"
    ],
    context: "Deep connection is the heart of intimacy—understanding it helps us nurture it.",
    tags: ['deep', 'connection', 'intimacy']
  },

  // How We Handle Conflict (10 prompts)
  {
    id: 'conv-rel-021',
    category: 'relationship',
    intensity: 3,
    question: "What do you need from me when we're in conflict?",
    followUps: [
      "Do I usually give you that?",
      "What makes it hard for you to ask?",
      "How can I be better at meeting that need?"
    ],
    context: "Understanding each other's conflict needs helps us navigate disagreements better.",
    tags: ['deep', 'conflict', 'needs', 'communication']
  },
  {
    id: 'conv-rel-022',
    category: 'relationship',
    intensity: 3,
    question: "What's something I do during arguments that bothers you?",
    followUps: [
      "Why does it bother you?",
      "What would you prefer I do instead?",
      "Is there a way I can catch myself doing it?"
    ],
    context: "Constructive feedback about conflict patterns helps us grow as a couple.",
    tags: ['deep', 'conflict', 'growth', 'feedback']
  },
  {
    id: 'conv-rel-023',
    category: 'relationship',
    intensity: 3,
    question: "What's your biggest fear when we fight?",
    followUps: [
      "Where does that fear come from?",
      "What would help you feel safer?",
      "How can I reassure you?"
    ],
    context: "Conflict fears often stem from past experiences—naming them helps us heal.",
    tags: ['deep', 'conflict', 'fear', 'trust']
  },
  {
    id: 'conv-rel-024',
    category: 'relationship',
    intensity: 3,
    question: "What do you think we do well when handling disagreements?",
    followUps: [
      "How did we develop that strength?",
      "What can we build on?",
      "How do we make sure we keep doing it?"
    ],
    context: "Acknowledging our strengths gives us confidence to handle future conflicts.",
    tags: ['conflict', 'strengths', 'appreciation']
  },
  {
    id: 'conv-rel-025',
    category: 'relationship',
    intensity: 3,
    question: "What's a recurring argument pattern you'd like to break?",
    followUps: [
      "What triggers it?",
      "What would a healthier pattern look like?",
      "How can we catch ourselves earlier?"
    ],
    context: "Breaking negative patterns requires awareness and intentional effort.",
    tags: ['deep', 'conflict', 'patterns', 'growth']
  },
  {
    id: 'conv-rel-026',
    category: 'relationship',
    intensity: 2,
    question: "How do you prefer to process conflict—immediately or with space?",
    followUps: [
      "Why does that work better for you?",
      "How can we honor both our needs?",
      "What signals can we use to communicate our needs?"
    ],
    context: "Different processing styles require compromise and clear communication.",
    tags: ['conflict', 'communication', 'needs']
  },
  {
    id: 'conv-rel-027',
    category: 'relationship',
    intensity: 3,
    question: "What's something you wish you could apologize for but haven't?",
    followUps: [
      "What's stopping you?",
      "What would you say?",
      "Can you say it now?"
    ],
    context: "Unspoken apologies can create distance—offering them heals old wounds.",
    tags: ['deep', 'apology', 'healing', 'vulnerability']
  },
  {
    id: 'conv-rel-028',
    category: 'relationship',
    intensity: 3,
    question: "What do you need to feel like a conflict is truly resolved?",
    followUps: [
      "Is it words, actions, or time?",
      "Do you feel that need is usually met?",
      "How can we close the loop better?"
    ],
    context: "Different people need different things to feel closure after conflict.",
    tags: ['deep', 'conflict', 'closure', 'needs']
  },
  {
    id: 'conv-rel-029',
    category: 'relationship',
    intensity: 3,
    question: "What's a hurt from our relationship that you're still healing from?",
    followUps: [
      "What do you need to heal?",
      "How can I support that healing?",
      "What would repair look like?"
    ],
    context: "Old hurts can linger—addressing them openly prevents resentment.",
    tags: ['deep', 'healing', 'vulnerability', 'repair']
  },
  {
    id: 'conv-rel-030',
    category: 'relationship',
    intensity: 2,
    question: "What's something you appreciate about how I handle stress?",
    followUps: [
      "How does it help you?",
      "What have you learned from it?",
      "How does it balance your own tendencies?"
    ],
    context: "Appreciating each other's coping styles builds empathy and partnership.",
    tags: ['appreciation', 'stress', 'balance']
  },

  // Future Visions as a Couple (10 prompts)
  {
    id: 'conv-rel-031',
    category: 'relationship',
    intensity: 2,
    question: "Where do you see us in five years?",
    followUps: [
      "What are we doing?",
      "How have we grown?",
      "What do we need to do now to get there?"
    ],
    context: "Shared vision aligns our present actions with our desired future.",
    tags: ['future', 'vision', 'planning']
  },
  {
    id: 'conv-rel-032',
    category: 'relationship',
    intensity: 3,
    question: "What kind of life do you want us to build together?",
    followUps: [
      "What matters most in that vision?",
      "What are you willing to sacrifice for it?",
      "What are you unwilling to sacrifice?"
    ],
    context: "Aligning on life vision ensures we're building toward the same future.",
    tags: ['deep', 'future', 'vision', 'values']
  },
  {
    id: 'conv-rel-033',
    category: 'relationship',
    intensity: 3,
    question: "What does our ideal home life look like to you?",
    followUps: [
      "What does a typical day look like?",
      "What traditions or rhythms do we have?",
      "How do we balance togetherness and independence?"
    ],
    context: "Our home life vision shapes how we structure our daily existence.",
    tags: ['future', 'home', 'lifestyle']
  },
  {
    id: 'conv-rel-034',
    category: 'relationship',
    intensity: 3,
    question: "What kind of parents would we be, if we choose to have children?",
    followUps: [
      "What values would we want to instill?",
      "What would we do differently from our parents?",
      "What excites or scares you about it?"
    ],
    context: "Discussing parenting philosophy helps us align on family vision.",
    tags: ['deep', 'future', 'family', 'parenting']
  },
  {
    id: 'conv-rel-035',
    category: 'relationship',
    intensity: 2,
    question: "What adventures do you want us to have in the coming years?",
    followUps: [
      "What kind of adventures—travel, experiences, challenges?",
      "Which one excites you most?",
      "How can we start planning for them?"
    ],
    context: "Shared adventures keep relationships exciting and create lasting memories.",
    tags: ['future', 'adventure', 'excitement']
  },
  {
    id: 'conv-rel-036',
    category: 'relationship',
    intensity: 3,
    question: "How do you want to grow as a partner?",
    followUps: [
      "What areas do you want to improve?",
      "What kind of partner do you aspire to be?",
      "How can I support your growth?"
    ],
    context: "Commitment to growth as partners keeps the relationship evolving.",
    tags: ['deep', 'growth', 'commitment', 'future']
  },
  {
    id: 'conv-rel-037',
    category: 'relationship',
    intensity: 2,
    question: "What financial goals do you want us to work toward?",
    followUps: [
      "What does financial security mean to you?",
      "What are we saving for?",
      "How do we balance present enjoyment and future security?"
    ],
    context: "Financial alignment prevents conflict and builds shared security.",
    tags: ['future', 'finance', 'planning']
  },
  {
    id: 'conv-rel-038',
    category: 'relationship',
    intensity: 3,
    question: "What do you want our relationship to be known for?",
    followUps: [
      "What qualities do you want us to embody?",
      "What do you want people to say about us?",
      "How do we live that out daily?"
    ],
    context: "Our relationship identity shapes how we show up in the world together.",
    tags: ['deep', 'identity', 'values', 'legacy']
  },
  {
    id: 'conv-rel-039',
    category: 'relationship',
    intensity: 2,
    question: "What do you hope we're still doing together when we're old?",
    followUps: [
      "What habits or traditions?",
      "What do you hope never changes?",
      "What are you most looking forward to?"
    ],
    context: "Long-term vision helps us prioritize what truly matters.",
    tags: ['future', 'long-term', 'commitment']
  },
  {
    id: 'conv-rel-040',
    category: 'relationship',
    intensity: 3,
    question: "What do you want to make sure we never lose in our relationship?",
    followUps: [
      "Why is that so important?",
      "What threatens it?",
      "How do we protect it?"
    ],
    context: "Protecting what matters most requires naming it and being intentional.",
    tags: ['deep', 'protection', 'values', 'commitment']
  },

  // Appreciation & Gratitude (10 prompts)
  {
    id: 'conv-rel-041',
    category: 'relationship',
    intensity: 2,
    question: "What do you appreciate about me that you don't say often enough?",
    followUps: [
      "Why don't you say it more?",
      "How does that quality affect your life?",
      "Can you tell me more about it now?"
    ],
    context: "Unspoken appreciation is a missed opportunity for connection.",
    tags: ['appreciation', 'gratitude', 'love']
  },
  {
    id: 'conv-rel-042',
    category: 'relationship',
    intensity: 2,
    question: "What's something I do that makes your life better?",
    followUps: [
      "Do you think I know how much it matters?",
      "What would life be like without it?",
      "How can I do it even more?"
    ],
    context: "Recognizing how we improve each other's lives deepens gratitude.",
    tags: ['gratitude', 'impact', 'appreciation']
  },
  {
    id: 'conv-rel-043',
    category: 'relationship',
    intensity: 3,
    question: "What have you learned from me that you're grateful for?",
    followUps: [
      "How has it changed you?",
      "Did you resist learning it at first?",
      "What else do you hope to learn from me?"
    ],
    context: "Partners who grow together stay together—gratitude for growth strengthens bonds.",
    tags: ['deep', 'gratitude', 'growth', 'learning']
  },
  {
    id: 'conv-rel-044',
    category: 'relationship',
    intensity: 2,
    question: "What's a way I've changed your life for the better?",
    followUps: [
      "Was it gradual or sudden?",
      "Did you expect it?",
      "What does that mean to you?"
    ],
    context: "Knowing our positive impact on our partner is deeply affirming.",
    tags: ['gratitude', 'impact', 'transformation']
  },
  {
    id: 'conv-rel-045',
    category: 'relationship',
    intensity: 2,
    question: "What's something you admire about me?",
    followUps: [
      "When did you first notice that quality?",
      "Do I know I have it?",
      "How does it inspire you?"
    ],
    context: "Admiration is different from love—it reflects who we aspire to be.",
    tags: ['admiration', 'inspiration', 'respect']
  },
  {
    id: 'conv-rel-046',
    category: 'relationship',
    intensity: 2,
    question: "What's a sacrifice I've made that you really appreciate?",
    followUps: [
      "Did I make it willingly?",
      "How did it affect you?",
      "What did it communicate to you?"
    ],
    context: "Recognizing sacrifices helps us appreciate the cost of love.",
    tags: ['gratitude', 'sacrifice', 'love']
  },
  {
    id: 'conv-rel-047',
    category: 'relationship',
    intensity: 3,
    question: "What do you love about the way I love you?",
    followUps: [
      "Is it words, actions, presence?",
      "Did you have to learn to receive it?",
      "What makes it feel safe?"
    ],
    context: "Understanding how we each love helps us appreciate and reciprocate.",
    tags: ['deep', 'love', 'love-languages', 'appreciation']
  },
  {
    id: 'conv-rel-048',
    category: 'relationship',
    intensity: 2,
    question: "What's a time you felt really proud to be with me?",
    followUps: [
      "What was happening?",
      "What quality were you proud of?",
      "How did it make you feel about us?"
    ],
    context: "Pride in our partner reflects our shared identity and values.",
    tags: ['pride', 'admiration', 'memories']
  },
  {
    id: 'conv-rel-049',
    category: 'relationship',
    intensity: 3,
    question: "What makes you feel lucky to have me?",
    followUps: [
      "Do you feel that often?",
      "What reminds you of it?",
      "How do you express that gratitude?"
    ],
    context: "Feeling lucky keeps us from taking each other for granted.",
    tags: ['deep', 'gratitude', 'appreciation']
  },
  {
    id: 'conv-rel-050',
    category: 'relationship',
    intensity: 3,
    question: "What would you want me to know about how much I mean to you?",
    followUps: [
      "Why is it hard to express?",
      "What words come closest?",
      "How can I really hear it?"
    ],
    context: "Sometimes the deepest feelings are the hardest to express—creating space for them is a gift.",
    tags: ['deep', 'love', 'vulnerability', 'expression']
  }
];

export default relationshipStarters;
