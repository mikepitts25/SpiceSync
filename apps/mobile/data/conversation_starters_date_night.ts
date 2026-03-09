// apps/mobile/data/conversation_starters_date_night.ts
// Date Night Fun - 50 conversation prompts
// Light, playful questions perfect for keeping date nights fun and flirty

import { ConversationStarter } from '../lib/conversationStarters';

export const dateNightStarters: ConversationStarter[] = [
  // Light & Flirty Questions (10 prompts)
  {
    id: 'conv-date-001',
    category: 'date_night',
    intensity: 1,
    question: "What was your first thought when you saw me tonight?",
    followUps: [
      "Has that changed as the night's gone on?",
      "What were you expecting?",
      "What would you like to happen next?"
    ],
    context: "Staying curious about each other keeps the spark alive.",
    tags: ['flirty', 'fun', 'present-moment']
  },
  {
    id: 'conv-date-002',
    category: 'date_night',
    intensity: 2,
    question: "What's something I do that still gives you butterflies?",
    followUps: [
      "When did you first notice it?",
      "Do I know I do it?",
      "Can I do it right now?"
    ],
    context: "Butterflies aren't just for new relationships—they can last with attention.",
    tags: ['flirty', 'attraction', 'butterflies']
  },
  {
    id: 'conv-date-003',
    category: 'date_night',
    intensity: 2,
    question: "If you had to describe me to someone who's never met me, what's the first thing you'd say?",
    followUps: [
      "Is that your favorite thing about me?",
      "Would I agree with that description?",
      "Has that quality grown stronger over time?"
    ],
    context: "How we describe our partner reveals what we value most about them.",
    tags: ['fun', 'perception', 'attraction']
  },
  {
    id: 'conv-date-004',
    category: 'date_night',
    intensity: 2,
    question: "What's your favorite physical feature of mine?",
    followUps: [
      "Has it always been that one?",
      "What do you love about it?",
      "Can I get a compliment back?"
    ],
    context: "Physical attraction is part of the whole package—celebrating it keeps passion alive.",
    tags: ['flirty', 'physical', 'attraction']
  },
  {
    id: 'conv-date-005',
    category: 'date_night',
    intensity: 2,
    question: "What's something I wore that you absolutely loved?",
    followUps: [
      "What made it work?",
      "Should I wear it more often?",
      "Is there something you'd love to see me in?"
    ],
    context: "Noticing and appreciating each other's style is a form of flirtation.",
    tags: ['flirty', 'style', 'attraction']
  },
  {
    id: 'conv-date-006',
    category: 'date_night',
    intensity: 2,
    question: "What's a nickname you have for me that you love?",
    followUps: [
      "Where did it come from?",
      "What does it mean to you?",
      "Should we make up a new one tonight?"
    ],
    context: "Pet names create intimacy and a private language between partners.",
    tags: ['fun', 'intimacy', 'playful']
  },
  {
    id: 'conv-date-007',
    category: 'date_night',
    intensity: 2,
    question: "What's something I do that you find unexpectedly sexy?",
    followUps: [
      "Do you think I know about it?",
      "When did you first notice?",
      "Can you demonstrate what you mean?"
    ],
    context: "Attraction often lives in the small, unexpected moments.",
    tags: ['flirty', 'sexy', 'attraction']
  },
  {
    id: 'conv-date-008',
    category: 'date_night',
    intensity: 1,
    question: "If we were characters in a movie, what genre would we be?",
    followUps: [
      "Rom-com, action, thriller?",
      "Who would play us?",
      "What would the plot be?"
    ],
    context: "Playful imagination keeps date nights light and creative.",
    tags: ['fun', 'creative', 'playful']
  },
  {
    id: 'conv-date-009',
    category: 'date_night',
    intensity: 2,
    question: "What's your favorite way I touch you?",
    followUps: [
      "Is it intimate or casual?",
      "Does it depend on the mood?",
      "Can I do it now?"
    ],
    context: "Physical connection comes in many forms—knowing preferences deepens intimacy.",
    tags: ['flirty', 'physical', 'intimacy']
  },
  {
    id: 'conv-date-010',
    category: 'date_night',
    intensity: 2,
    question: "What's the most attractive thing I've done recently?",
    followUps: [
      "Was it intentional?",
      "What made it stand out?",
      "How did it make you feel?"
    ],
    context: "Noticing attraction in everyday moments keeps the connection fresh.",
    tags: ['flirty', 'attraction', 'appreciation']
  },

  // Hypothetical Scenarios (10 prompts)
  {
    id: 'conv-date-011',
    category: 'date_night',
    intensity: 1,
    question: "If we won the lottery tomorrow, what's the first thing we'd do?",
    followUps: [
      "After the celebration, then what?",
      "Would we keep working?",
      "Where would we live?"
    ],
    context: "Dreaming together reveals shared values and priorities.",
    tags: ['fun', 'dreams', 'hypothetical']
  },
  {
    id: 'conv-date-012',
    category: 'date_night',
    intensity: 2,
    question: "If we could switch bodies for a day, what's the first thing you'd do?",
    followUps: [
      "What would you want to understand about me?",
      "What would surprise you most?",
      "What would you want me to experience in your body?"
    ],
    context: "Imagining walking in each other's shoes builds empathy and curiosity.",
    tags: ['fun', 'empathy', 'perspective']
  },
  {
    id: 'conv-date-013',
    category: 'date_night',
    intensity: 2,
    question: "If we had to start a business together, what would it be?",
    followUps: [
      "What would each of us contribute?",
      "Would we be good business partners?",
      "What's our company culture?"
    ],
    context: "Imagining collaboration reveals how we see each other's strengths.",
    tags: ['fun', 'creative', 'partnership']
  },
  {
    id: 'conv-date-014',
    category: 'date_night',
    intensity: 2,
    question: "If we could live anywhere in the world for one year, where would we go?",
    followUps: [
      "What draws us there?",
      "What would our daily life look like?",
      "Would we come back, or stay forever?"
    ],
    context: "Travel dreams reveal our desires for adventure and lifestyle.",
    tags: ['travel', 'dreams', 'adventure']
  },
  {
    id: 'conv-date-015',
    category: 'date_night',
    intensity: 2,
    question: "If we were stranded on a deserted island, what role would each of us play?",
    followUps: [
      "Who's building the shelter?",
      "Who's finding food?",
      "Who's keeping morale up?"
    ],
    context: "Survival scenarios reveal how we see each other's practical and emotional skills.",
    tags: ['fun', 'survival', 'skills']
  },
  {
    id: 'conv-date-016',
    category: 'date_night',
    intensity: 2,
    question: "If we could have dinner with any couple, living or dead, who would it be?",
    followUps: [
      "What would we ask them?",
      "What would we want to learn?",
      "What do they represent to us?"
    ],
    context: "The couples we admire reveal what we aspire to in our own relationship.",
    tags: ['fun', 'inspiration', 'role-models']
  },
  {
    id: 'conv-date-017',
    category: 'date_night',
    intensity: 2,
    question: "If we could relive one day of our relationship, which would you choose?",
    followUps: [
      "Why that day?",
      "Would you change anything?",
      "What made it perfect?"
    ],
    context: "Our favorite shared memories reveal what we value most in our time together.",
    tags: ['memories', 'nostalgia', 'reflection']
  },
  {
    id: 'conv-date-018',
    category: 'date_night',
    intensity: 2,
    question: "If we had to compete together on a reality show, which one would we win?",
    followUps: [
      "Amazing Race, cooking show, or something else?",
      "What would be our secret weapon?",
      "What would be our biggest challenge?"
    ],
    context: "Imagining competition reveals how we see our teamwork and dynamics.",
    tags: ['fun', 'competition', 'teamwork']
  },
  {
    id: 'conv-date-019',
    category: 'date_night',
    intensity: 2,
    question: "If we could instantly master any skill together, what would we choose?",
    followUps: [
      "Something practical or something fun?",
      "What would we do with it?",
      "Would we teach others or keep it secret?"
    ],
    context: "Shared skills create new ways to connect and have adventures together.",
    tags: ['fun', 'skills', 'learning']
  },
  {
    id: 'conv-date-020',
    category: 'date_night',
    intensity: 2,
    question: "If we could time travel together, where and when would we go?",
    followUps: [
      "Past or future?",
      "Would we participate or just observe?",
      "What would we want to experience?"
    ],
    context: "Time travel dreams reveal our curiosity about history, future, and shared experience.",
    tags: ['fun', 'imagination', 'adventure']
  },

  // Bucket List Items to Do Together (10 prompts)
  {
    id: 'conv-date-021',
    category: 'date_night',
    intensity: 2,
    question: "What's one thing on your bucket list you'd want to do with me?",
    followUps: [
      "Why that specifically?",
      "What would make it perfect?",
      "When can we start planning?"
    ],
    context: "Shared bucket list items give us exciting goals to work toward together.",
    tags: ['bucket-list', 'dreams', 'planning']
  },
  {
    id: 'conv-date-022',
    category: 'date_night',
    intensity: 2,
    question: "What's a food experience you want us to have together?",
    followUps: [
      "A specific restaurant, cuisine, or cooking experience?",
      "Is it about the food or the experience?",
      "When are we doing it?"
    ],
    context: "Shared food experiences create sensory memories and cultural exploration.",
    tags: ['food', 'experiences', 'culture']
  },
  {
    id: 'conv-date-023',
    category: 'date_night',
    intensity: 2,
    question: "What's an adventure or adrenaline experience you want us to try?",
    followUps: [
      "Skydiving, bungee jumping, or something tamer?",
      "What excites you about it?",
      "Are you more excited or nervous?"
    ],
    context: "Shared adrenaline experiences create intense bonding moments.",
    tags: ['adventure', 'adrenaline', 'experiences']
  },
  {
    id: 'conv-date-024',
    category: 'date_night',
    intensity: 2,
    question: "What's a festival or event anywhere in the world you'd want to attend with me?",
    followUps: [
      "Carnival in Rio, Oktoberfest, Burning Man?",
      "What draws you to it?",
      "How would we experience it together?"
    ],
    context: "Cultural events offer immersive experiences and shared memories.",
    tags: ['travel', 'culture', 'experiences']
  },
  {
    id: 'conv-date-025',
    category: 'date_night',
    intensity: 2,
    question: "What's a class or workshop you'd want us to take together?",
    followUps: [
      "Cooking, dancing, painting, or something else?",
      "Why that one?",
      "Would we be good students?"
    ],
    context: "Learning together keeps the relationship dynamic and creates shared competence.",
    tags: ['learning', 'growth', 'fun']
  },
  {
    id: 'conv-date-026',
    category: 'date_night',
    intensity: 2,
    question: "What's a natural wonder you'd want to see with me?",
    followUps: [
      "Northern lights, Grand Canyon, Great Barrier Reef?",
      "What would it feel like to experience it together?",
      "Would we camp or go luxury?"
    ],
    context: "Nature's wonders inspire awe—experiencing them together deepens connection.",
    tags: ['nature', 'travel', 'awe']
  },
  {
    id: 'conv-date-027',
    category: 'date_night',
    intensity: 2,
    question: "What's a challenge or physical goal you'd want us to accomplish together?",
    followUps: [
      "Marathon, hiking a mountain, or something else?",
      "What would training together look like?",
      "How would we celebrate?"
    ],
    context: "Shared physical challenges build teamwork and mutual support.",
    tags: ['fitness', 'challenge', 'teamwork']
  },
  {
    id: 'conv-date-028',
    category: 'date_night',
    intensity: 2,
    question: "What's a creative project you'd want us to collaborate on?",
    followUps: [
      "Writing, art, music, building something?",
      "What would we create?",
      "Would we be good creative partners?"
    ],
    context: "Creating together builds partnership beyond the practical aspects of life.",
    tags: ['creative', 'collaboration', 'fun']
  },
  {
    id: 'conv-date-029',
    category: 'date_night',
    intensity: 2,
    question: "What's a road trip route you'd love to take together?",
    followUps: [
      "Coastal highway, Route 66, European countryside?",
      "What would be our soundtrack?",
      "Pit stops or straight through?"
    ],
    context: "Road trips create space for deep conversation and shared adventure.",
    tags: ['travel', 'adventure', 'road-trip']
  },
  {
    id: 'conv-date-030',
    category: 'date_night',
    intensity: 2,
    question: "What's a romantic gesture you'd love to experience?",
    followUps: [
      "Grand gesture or something intimate?",
      "Public or private?",
      "Surprise or planned?"
    ],
    context: "Understanding romantic desires helps us make each other feel special.",
    tags: ['romance', 'gestures', 'love']
  },

  // "Would You Rather" Questions for Couples (10 prompts)
  {
    id: 'conv-date-031',
    category: 'date_night',
    intensity: 1,
    question: "Would you rather have a date night every week for a year, or one incredible week-long vacation together?",
    followUps: [
      "What would we do on the vacation?",
      "What makes regular date nights valuable?",
      "Can we compromise and do both?"
    ],
    context: "This reveals preferences for frequency vs. intensity of quality time.",
    tags: ['would-you-rather', 'preferences', 'time']
  },
  {
    id: 'conv-date-032',
    category: 'date_night',
    intensity: 2,
    question: "Would you rather be able to read my mind for a day, or have me read yours?",
    followUps: [
      "What would you want to know?",
      "What would you be nervous about me knowing?",
      "Is there something you've been wanting to say?"
    ],
    context: "This playful question opens the door to deeper sharing.",
    tags: ['would-you-rather', 'communication', 'fun']
  },
  {
    id: 'conv-date-033',
    category: 'date_night',
    intensity: 2,
    question: "Would you rather have a personal chef or a personal massage therapist for a month?",
    followUps: [
      "What would you have the chef make?",
      "Daily massages or weekly deep tissue?",
      "What does your choice say about your needs right now?"
    ],
    context: "Luxury preferences reveal current needs for nourishment or relaxation.",
    tags: ['would-you-rather', 'luxury', 'self-care']
  },
  {
    id: 'conv-date-034',
    category: 'date_night',
    intensity: 2,
    question: "Would you rather go on a surprise date planned by me, or plan a surprise date for me?",
    followUps: [
      "What would you plan if it was your turn?",
      "Do you like surprises or planning more?",
      "What's the best surprise date you've had?"
    ],
    context: "This reveals preferences for control, surprise, and giving/receiving.",
    tags: ['would-you-rather', 'surprises', 'dates']
  },
  {
    id: 'conv-date-035',
    category: 'date_night',
    intensity: 2,
    question: "Would you rather have our first date over again with all your current knowledge, or skip to our 50th anniversary party?",
    followUps: [
      "What would you do differently on that first date?",
      "What do you hope our 50th looks like?",
      "What would you want to preserve from the journey?"
    ],
    context: "Time travel questions reveal what we value about our journey together.",
    tags: ['would-you-rather', 'time', 'reflection']
  },
  {
    id: 'conv-date-036',
    category: 'date_night',
    intensity: 2,
    question: "Would you rather be famous together or live completely private lives?",
    followUps: [
      "Famous for what?",
      "What would fame add or take away?",
      "What does privacy mean to you?"
    ],
    context: "This reveals values around recognition, privacy, and lifestyle.",
    tags: ['would-you-rather', 'values', 'lifestyle']
  },
  {
    id: 'conv-date-037',
    category: 'date_night',
    intensity: 2,
    question: "Would you rather have unlimited money but little time together, or all the time together but modest means?",
    followUps: [
      "What would we do with unlimited money?",
      "How would we make modest means feel abundant?",
      "What matters more to you?"
    ],
    context: "This classic question reveals the time vs. money value hierarchy.",
    tags: ['would-you-rather', 'values', 'priorities']
  },
  {
    id: 'conv-date-038',
    category: 'date_night',
    intensity: 2,
    question: "Would you rather always know what I'm thinking, or always know what I'm feeling?",
    followUps: [
      "Which would be more useful?",
      "Which would be more overwhelming?",
      "Is there something you're thinking or feeling right now?"
    ],
    context: "This explores the difference between thoughts and emotions in connection.",
    tags: ['would-you-rather', 'communication', 'emotions']
  },
  {
    id: 'conv-date-039',
    category: 'date_night',
    intensity: 2,
    question: "Would you rather live in our dream home in an okay location, or an okay home in our dream location?",
    followUps: [
      "What makes a dream home for you?",
      "What makes a dream location?",
      "Can we find a compromise?"
    ],
    context: "Housing preferences reveal priorities around comfort, environment, and lifestyle.",
    tags: ['would-you-rather', 'home', 'lifestyle']
  },
  {
    id: 'conv-date-040',
    category: 'date_night',
    intensity: 2,
    question: "Would you rather never have to do chores again, or never have to work again?",
    followUps: [
      "What would you do with that freedom?",
      "Which drains you more right now?",
      "What does your answer reveal about your current stress?"
    ],
    context: "This reveals current pain points and what we'd do with true freedom.",
    tags: ['would-you-rather', 'freedom', 'stress']
  },

  // Playful Debates & Preferences (10 prompts)
  {
    id: 'conv-date-041',
    category: 'date_night',
    intensity: 1,
    question: "What's the best pizza topping, and can you defend your choice?",
    followUps: [
      "Thin crust or deep dish?",
      "Pineapple—yes or absolutely not?",
      "What's your pizza dealbreaker?"
    ],
    context: "Food debates are lighthearted ways to learn about each other's preferences.",
    tags: ['fun', 'debate', 'food']
  },
  {
    id: 'conv-date-042',
    category: 'date_night',
    intensity: 1,
    question: "Morning person or night owl—which is superior?",
    followUps: [
      "What time is your perfect morning?",
      "What do you love about your preferred time?",
      "How do we make our different rhythms work?"
    ],
    context: "Chronotype differences affect daily life—understanding them helps with compromise.",
    tags: ['fun', 'preferences', 'lifestyle']
  },
  {
    id: 'conv-date-043',
    category: 'date_night',
    intensity: 1,
    question: "Beach vacation or mountain getaway—make your case!",
    followUps: [
      "What specifically draws you to your choice?",
      "What would convince you to try the other?",
      "What's your ideal day at your chosen destination?"
    ],
    context: "Vacation preferences reveal relaxation styles and environmental preferences.",
    tags: ['fun', 'debate', 'travel']
  },
  {
    id: 'conv-date-044',
    category: 'date_night',
    intensity: 1,
    question: "Texting or calling—which is better for staying connected?",
    followUps: [
      "When is each appropriate?",
      "What do you prefer during the day?",
      "What makes you feel most connected?"
    ],
    context: "Communication preferences affect how we stay connected throughout the day.",
    tags: ['fun', 'communication', 'preferences']
  },
  {
    id: 'conv-date-045',
    category: 'date_night',
    intensity: 1,
    question: "Cooking together or ordering in—which makes for a better date night?",
    followUps: [
      "What's your signature dish?",
      "What's your go-to order?",
      "What makes each special?"
    ],
    context: "This reveals preferences for activity vs. relaxation in date nights.",
    tags: ['fun', 'food', 'date-night']
  },
  {
    id: 'conv-date-046',
    category: 'date_night',
    intensity: 1,
    question: "Big party or intimate dinner—which is more fun?",
    followUps: [
      "What size group is your sweet spot?",
      "What makes each energizing or draining?",
      "How do we balance both?"
    ],
    context: "Social preferences affect how we structure our social life together.",
    tags: ['fun', 'social', 'preferences']
  },
  {
    id: 'conv-date-047',
    category: 'date_night',
    intensity: 1,
    question: "Spontaneous adventure or planned itinerary—which wins?",
    followUps: [
      "What's the best spontaneous thing we've done?",
      "What's the best planned thing?",
      "How do we balance both approaches?"
    ],
    context: "Planning styles affect travel and daily life—finding balance is key.",
    tags: ['fun', 'planning', 'adventure']
  },
  {
    id: 'conv-date-048',
    category: 'date_night',
    intensity: 1,
    question: "Sweet or savory—which is the superior flavor profile?",
    followUps: [
      "What's your ultimate sweet treat?",
      "What's your ultimate savory dish?",
      "Dessert before dinner—acceptable or criminal?"
    ],
    context: "Food preferences are surprisingly revealing of personality and values.",
    tags: ['fun', 'food', 'preferences']
  },
  {
    id: 'conv-date-049',
    category: 'date_night',
    intensity: 1,
    question: "Stay in or go out—which is the perfect evening?",
    followUps: [
      "What makes a perfect night in?",
      "What makes a perfect night out?",
      "How do we decide when we disagree?"
    ],
    context: "Homebody vs. adventurer preferences shape our leisure time.",
    tags: ['fun', 'preferences', 'lifestyle']
  },
  {
    id: 'conv-date-050',
    category: 'date_night',
    intensity: 2,
    question: "What's a controversial opinion you have that I might disagree with?",
    followUps: [
      "Why do you hold that view?",
      "Are we going to fight about this?",
      "What can you teach me about your perspective?"
    ],
    context: "Respectful disagreement keeps relationships intellectually stimulating.",
    tags: ['fun', 'debate', 'perspective']
  }
];

export default dateNightStarters;
