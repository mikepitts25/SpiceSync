// apps/mobile/data/conversation_starters_getting_to_know.ts
// Getting to Know Each Other - 50 conversation prompts
// Deep questions to understand your partner's past, values, and dreams

import { ConversationStarter } from '../lib/conversationStarters';

export const gettingToKnowStarters: ConversationStarter[] = [
  // Childhood Memories & Family Dynamics (10 prompts)
  {
    id: 'conv-get-001',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's a childhood memory that shaped who you are today?",
    followUps: [
      "How did that experience change your perspective?",
      "Would you want our kids to have a similar experience?",
      "What would you tell your younger self about that moment?"
    ],
    context: "Understanding formative experiences helps us see why we react certain ways.",
    tags: ['deep', 'childhood', 'growth']
  },
  {
    id: 'conv-get-002',
    category: 'getting_to_know',
    intensity: 2,
    question: "How did your parents show love when you were growing up?",
    followUps: [
      "Do you find yourself showing love the same way?",
      "Was there something you wish they did differently?",
      "How has that influenced what you need from me?"
    ],
    context: "Our 'love language' often stems from how we received love as children.",
    tags: ['deep', 'family', 'love-languages']
  },
  {
    id: 'conv-get-003',
    category: 'getting_to_know',
    intensity: 2,
    question: "What was your favorite family tradition growing up?",
    followUps: [
      "Would you want to continue that tradition with our family?",
      "What made it so special to you?",
      "Are there new traditions you'd like to create together?"
    ],
    context: "Traditions connect us to our roots and create shared meaning.",
    tags: ['family', 'traditions', 'nostalgia']
  },
  {
    id: 'conv-get-004',
    category: 'getting_to_know',
    intensity: 3,
    question: "What's something about your family dynamics that took you years to understand?",
    followUps: [
      "How did that realization change your relationship with them?",
      "Do you see any of those patterns in yourself?",
      "How has that shaped what you want for us?"
    ],
    context: "Family patterns often unconsciously influence our adult relationships.",
    tags: ['deep', 'family', 'self-awareness']
  },
  {
    id: 'conv-get-005',
    category: 'getting_to_know',
    intensity: 2,
    question: "What was your role in your family growing up? (The peacemaker, the rebel, the achiever...)",
    followUps: [
      "Do you still play that role today?",
      "How did that role serve or limit you?",
      "What role do you feel like you play in our relationship?"
    ],
    context: "Family roles often persist into adulthood unless we consciously examine them.",
    tags: ['family', 'patterns', 'self-awareness']
  },
  {
    id: 'conv-get-006',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's a smell or sound that instantly takes you back to childhood?",
    followUps: [
      "What memory does it bring up?",
      "Was that a happy time for you?",
      "Can we recreate that feeling somehow?"
    ],
    context: "Sensory memories are powerful gateways to our past experiences.",
    tags: ['nostalgia', 'sensory', 'childhood']
  },
  {
    id: 'conv-get-007',
    category: 'getting_to_know',
    intensity: 3,
    question: "What did you learn about relationships from watching your parents?",
    followUps: [
      "What do you want to emulate?",
      "What would you do differently?",
      "Has that influenced how you approach conflict with me?"
    ],
    context: "Our first model for relationships comes from what we observed as children.",
    tags: ['deep', 'family', 'relationships', 'patterns']
  },
  {
    id: 'conv-get-008',
    category: 'getting_to_know',
    intensity: 2,
    question: "What was your biggest dream when you were a kid?",
    followUps: [
      "Is any part of that dream still alive in you?",
      "What made you let go of it, if you did?",
      "How can I support the parts that still matter?"
    ],
    context: "Childhood dreams reveal our core values and authentic desires.",
    tags: ['dreams', 'childhood', 'aspirations']
  },
  {
    id: 'conv-get-009',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's something your family does that you thought was normal until you met other families?",
    followUps: [
      "How did you react when you realized it was different?",
      "Do you still do it?",
      "Is it something you'd want to pass on?"
    ],
    context: "Every family has its own culture—discovering differences helps us choose consciously.",
    tags: ['family', 'culture', 'fun']
  },
  {
    id: 'conv-get-010',
    category: 'getting_to_know',
    intensity: 3,
    question: "What's a wound from your childhood that you're still healing from?",
    followUps: [
      "How does it show up in your life now?",
      "What do you need when that wound gets triggered?",
      "How can I support your healing?"
    ],
    context: "Healing happens in relationships where we feel safe to be vulnerable.",
    tags: ['deep', 'vulnerable', 'healing', 'intimacy']
  },

  // Past Relationships - Lessons Learned (10 prompts)
  {
    id: 'conv-get-011',
    category: 'getting_to_know',
    intensity: 3,
    question: "What's the most important lesson a past relationship taught you?",
    followUps: [
      "How has that lesson changed how you show up with me?",
      "Was it a painful lesson or a gradual realization?",
      "What are you still unlearning?"
    ],
    context: "Past relationships are teachers—what we learned shapes what we create now.",
    tags: ['deep', 'growth', 'past-relationships']
  },
  {
    id: 'conv-get-012',
    category: 'getting_to_know',
    intensity: 3,
    question: "What pattern in relationships have you had to consciously break?",
    followUps: [
      "Where do you think that pattern came from?",
      "How do you catch yourself when it starts?",
      "What helps you stay aware?"
    ],
    context: "Awareness of patterns is the first step to creating something different.",
    tags: ['deep', 'patterns', 'self-awareness']
  },
  {
    id: 'conv-get-013',
    category: 'getting_to_know',
    intensity: 3,
    question: "What did you used to compromise on that you won't anymore?",
    followUps: [
      "What was the breaking point?",
      "How do you communicate that boundary now?",
      "What made you realize you deserved better?"
    ],
    context: "Our dealbreakers often come from understanding what doesn't work for us.",
    tags: ['deep', 'boundaries', 'self-worth']
  },
  {
    id: 'conv-get-014',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's something you used to believe about love that you've changed your mind about?",
    followUps: [
      "What experience changed that belief?",
      "How does that shift affect us?",
      "What do you believe about love now?"
    ],
    context: "Our beliefs about love evolve as we grow and have new experiences.",
    tags: ['deep', 'love', 'growth']
  },
  {
    id: 'conv-get-015',
    category: 'getting_to_know',
    intensity: 3,
    question: "What's a fear about relationships that you still carry?",
    followUps: [
      "Where do you think that fear comes from?",
      "What triggers it most?",
      "How can I help you feel safe with that fear?"
    ],
    context: "Naming our fears diminishes their power and invites our partner to support us.",
    tags: ['deep', 'vulnerable', 'fear', 'trust']
  },
  {
    id: 'conv-get-016',
    category: 'getting_to_know',
    intensity: 2,
    question: "What did you think you wanted in a partner that turned out not to matter?",
    followUps: [
      "What surprised you about what actually matters?",
      "How did that change your dating approach?",
      "What do you value most in me that wasn't on your original list?"
    ],
    context: "Real connection often transcends our checklists and expectations.",
    tags: ['reflection', 'growth', 'priorities']
  },
  {
    id: 'conv-get-017',
    category: 'getting_to_know',
    intensity: 3,
    question: "What's something you did in past relationships that you're not proud of?",
    followUps: [
      "What have you learned from that?",
      "How have you made amends with yourself?",
      "What would you do differently now?"
    ],
    context: "Owning our mistakes is part of growing into a better partner.",
    tags: ['deep', 'accountability', 'growth']
  },
  {
    id: 'conv-get-018',
    category: 'getting_to_know',
    intensity: 2,
    question: "What made you realize you were ready for a serious relationship?",
    followUps: [
      "Was there a specific moment or a gradual shift?",
      "What were you looking for differently?",
      "How did you know when you met me?"
    ],
    context: "Readiness for commitment often comes from internal shifts, not external pressure.",
    tags: ['commitment', 'readiness', 'reflection']
  },
  {
    id: 'conv-get-019',
    category: 'getting_to_know',
    intensity: 3,
    question: "What's a red flag you ignored in the past that you watch for now?",
    followUps: [
      "What made you overlook it then?",
      "How do you trust your intuition better now?",
      "What green flags do you look for instead?"
    ],
    context: "Learning to trust our instincts protects us and helps us choose better.",
    tags: ['boundaries', 'self-awareness', 'trust']
  },
  {
    id: 'conv-get-020',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's something about being single that you actually miss?",
    followUps: [
      "Is there a way to bring some of that into our relationship?",
      "What helped you appreciate that time?",
      "How do we balance independence and togetherness?"
    ],
    context: "Honoring what we miss helps us create a relationship that doesn't require losing ourselves.",
    tags: ['independence', 'balance', 'honesty']
  },

  // Personal Values & Beliefs (10 prompts)
  {
    id: 'conv-get-021',
    category: 'getting_to_know',
    intensity: 2,
    question: "What value do you hold that you'd never compromise, no matter what?",
    followUps: [
      "Where did that value come from?",
      "Has it ever been tested?",
      "How does it guide your daily decisions?"
    ],
    context: "Core values are the foundation of who we are and how we live.",
    tags: ['deep', 'values', 'integrity']
  },
  {
    id: 'conv-get-022',
    category: 'getting_to_know',
    intensity: 2,
    question: "What belief did you inherit from your culture that you've questioned?",
    followUps: [
      "What made you start questioning it?",
      "How has that changed your perspective?",
      "What parts of your culture do you still hold dear?"
    ],
    context: "Examining cultural beliefs helps us choose what truly resonates with us.",
    tags: ['culture', 'growth', 'identity']
  },
  {
    id: 'conv-get-023',
    category: 'getting_to_know',
    intensity: 3,
    question: "What do you believe happens after we die?",
    followUps: [
      "How does that belief affect how you live?",
      "Has that belief changed over time?",
      "Does it bring you comfort or anxiety?"
    ],
    context: "Our beliefs about mortality shape our priorities and how we spend our time.",
    tags: ['deep', 'spirituality', 'philosophy']
  },
  {
    id: 'conv-get-024',
    category: 'getting_to_know',
    intensity: 2,
    question: "What social issue are you most passionate about and why?",
    followUps: [
      "What personal experience connects you to it?",
      "What do you wish more people understood?",
      "How do you take action on it?"
    ],
    context: "Our passions reveal what we care about deeply and what we stand for.",
    tags: ['values', 'passion', 'purpose']
  },
  {
    id: 'conv-get-025',
    category: 'getting_to_know',
    intensity: 2,
    question: "What does success mean to you? Not society's definition—yours.",
    followUps: [
      "Has that definition changed over time?",
      "Are you living according to that definition now?",
      "How can I support your vision of success?"
    ],
    context: "Defining success for ourselves frees us from comparison and external validation.",
    tags: ['values', 'success', 'authenticity']
  },
  {
    id: 'conv-get-026',
    category: 'getting_to_know',
    intensity: 3,
    question: "What do you believe about forgiveness?",
    followUps: [
      "Is it something you give freely or something that must be earned?",
      "Have you had to forgive something major?",
      "How do you forgive yourself?"
    ],
    context: "Our relationship with forgiveness affects how we move through conflict and hurt.",
    tags: ['deep', 'forgiveness', 'healing']
  },
  {
    id: 'conv-get-027',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's a principle you try to live by every day?",
    followUps: [
      "How do you remind yourself of it?",
      "When was the last time you really practiced it?",
      "What happens when you fall short?"
    ],
    context: "Daily principles guide our actions and shape our character over time.",
    tags: ['values', 'integrity', 'daily-life']
  },
  {
    id: 'conv-get-028',
    category: 'getting_to_know',
    intensity: 2,
    question: "What role does faith or spirituality play in your life, if any?",
    followUps: [
      "Has that always been the case?",
      "What do you find meaningful about it?",
      "How does it shape your worldview?"
    ],
    context: "Spiritual beliefs, or the absence of them, deeply influence how we see the world.",
    tags: ['spirituality', 'beliefs', 'meaning']
  },
  {
    id: 'conv-get-029',
    category: 'getting_to_know',
    intensity: 3,
    question: "What do you believe about the nature of love?",
    followUps: [
      "Is it a choice or a feeling?",
      "Does it change over time?",
      "What makes love last, in your view?"
    ],
    context: "Our philosophy of love shapes how we approach and nurture our relationship.",
    tags: ['deep', 'love', 'philosophy']
  },
  {
    id: 'conv-get-030',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's something you used to judge in others that you now understand?",
    followUps: [
      "What changed your perspective?",
      "Have you experienced something similar?",
      "How has that made you more compassionate?"
    ],
    context: "Growing empathy often comes from life experiences that humble us.",
    tags: ['growth', 'empathy', 'perspective']
  },

  // Dreams & Aspirations (10 prompts)
  {
    id: 'conv-get-031',
    category: 'getting_to_know',
    intensity: 2,
    question: "If money and time weren't constraints, what would you do with your life?",
    followUps: [
      "What draws you to that?",
      "Is there a way to bring elements of that into our current life?",
      "What's stopping you from moving toward it now?"
    ],
    context: "Our unconstrained dreams reveal our deepest desires and values.",
    tags: ['dreams', 'aspirations', 'freedom']
  },
  {
    id: 'conv-get-032',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's something you want to learn or master in the next five years?",
    followUps: [
      "Why that specifically?",
      "What would mastering it mean to you?",
      "How can I support that goal?"
    ],
    context: "Our learning goals show what we value and who we want to become.",
    tags: ['growth', 'learning', 'goals']
  },
  {
    id: 'conv-get-033',
    category: 'getting_to_know',
    intensity: 3,
    question: "What legacy do you want to leave behind?",
    followUps: [
      "Why does that matter to you?",
      "What are you doing now to build toward that?",
      "How do you want to be remembered?"
    ],
    context: "Thinking about legacy helps us align our daily actions with our deepest values.",
    tags: ['deep', 'legacy', 'purpose']
  },
  {
    id: 'conv-get-034',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's a place you've always wanted to live?",
    followUps: [
      "What draws you there?",
      "Is it the place or the lifestyle?",
      "Could we make that happen someday?"
    ],
    context: "Our desired locations often reflect the lifestyle and values we aspire to.",
    tags: ['dreams', 'travel', 'lifestyle']
  },
  {
    id: 'conv-get-035',
    category: 'getting_to_know',
    intensity: 2,
    question: "What would your ideal day look like if you could design it perfectly?",
    followUps: [
      "What elements of that could we incorporate now?",
      "Is it more about activity or rest?",
      "How does that compare to your typical day?"
    ],
    context: "Our ideal day reveals what we truly need to feel fulfilled and happy.",
    tags: ['dreams', 'lifestyle', 'happiness']
  },
  {
    id: 'conv-get-036',
    category: 'getting_to_know',
    intensity: 3,
    question: "What fear holds you back from going after what you really want?",
    followUps: [
      "Where does that fear come from?",
      "What's the worst that could happen?",
      "What would you do if you weren't afraid?"
    ],
    context: "Our fears often guard the gate to our most authentic desires.",
    tags: ['deep', 'fear', 'courage', 'growth']
  },
  {
    id: 'conv-get-037',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's a creative project or business idea you've always had in the back of your mind?",
    followUps: [
      "What's kept you from starting it?",
      "What would it take to begin?",
      "How can I be your cheerleader for this?"
    ],
    context: "Our dormant ideas often represent parts of ourselves waiting to be expressed.",
    tags: ['creativity', 'ambition', 'dreams']
  },
  {
    id: 'conv-get-038',
    category: 'getting_to_know',
    intensity: 2,
    question: "What does your perfect retirement look like?",
    followUps: [
      "Where are we?",
      "What are we doing?",
      "What are we saving for now to make that possible?"
    ],
    context: "Shared visions of the future help us align our present actions.",
    tags: ['future', 'dreams', 'planning']
  },
  {
    id: 'conv-get-039',
    category: 'getting_to_know',
    intensity: 3,
    question: "What would you do if you knew you couldn't fail?",
    followUps: [
      "What's really stopping you?",
      "What would trying look like, even if you might fail?",
      "How can we make it safe to try?"
    ],
    context: "The fear of failure often masks our deepest desires.",
    tags: ['deep', 'fear', 'courage', 'dreams']
  },
  {
    id: 'conv-get-040',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's something you want to experience before you die?",
    followUps: [
      "Why is that important to you?",
      "What would it feel like to accomplish it?",
      "How can we make it happen?"
    ],
    context: "Our bucket list items reveal what we find most meaningful in life.",
    tags: ['dreams', 'experiences', 'meaning']
  },

  // "What's Something I've Never Asked You About?" (10 prompts)
  {
    id: 'conv-get-041',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's something you're really proud of that you never talk about?",
    followUps: [
      "Why don't you share it more?",
      "What did it take to achieve?",
      "How did it change you?"
    ],
    context: "We often under-share our accomplishments out of modesty or habit.",
    tags: ['pride', 'achievement', 'discovery']
  },
  {
    id: 'conv-get-042',
    category: 'getting_to_know',
    intensity: 3,
    question: "What's a secret dream you've never told anyone?",
    followUps: [
      "Why have you kept it secret?",
      "What would it mean to pursue it?",
      "How can I help make it feel safe to share?"
    ],
    context: "Our secret dreams are often the most vulnerable and precious parts of us.",
    tags: ['deep', 'vulnerable', 'dreams', 'trust']
  },
  {
    id: 'conv-get-043',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's something you know a lot about that would surprise me?",
    followUps: [
      "How did you get into that?",
      "What's the most interesting thing about it?",
      "Can you teach me something?"
    ],
    context: "Everyone has hidden expertise and passions waiting to be discovered.",
    tags: ['discovery', 'knowledge', 'fun']
  },
  {
    id: 'conv-get-044',
    category: 'getting_to_know',
    intensity: 3,
    question: "What's a part of yourself that you're still learning to accept?",
    followUps: [
      "What makes that part hard to accept?",
      "What would full acceptance look like?",
      "How can I help you embrace that part?"
    ],
    context: "Self-acceptance is a journey—we're all works in progress.",
    tags: ['deep', 'self-acceptance', 'vulnerable']
  },
  {
    id: 'conv-get-045',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's a small thing that brings you disproportionate joy?",
    followUps: [
      "Why do you think it affects you so much?",
      "When did you first notice it?",
      "Can we do more of that together?"
    ],
    context: "Our small joys often reveal what we truly value and need.",
    tags: ['joy', 'discovery', 'happiness']
  },
  {
    id: 'conv-get-046',
    category: 'getting_to_know',
    intensity: 3,
    question: "What's something you worry about that you've never mentioned?",
    followUps: [
      "Why have you kept it to yourself?",
      "What would help ease that worry?",
      "How can we face it together?"
    ],
    context: "Sharing our worries invites our partner into our inner world.",
    tags: ['deep', 'vulnerable', 'trust', 'worry']
  },
  {
    id: 'conv-get-047',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's a memory you treasure that I don't know about?",
    followUps: [
      "What made it so special?",
      "Why haven't you shared it before?",
      "What does it mean to you now?"
    ],
    context: "Our treasured memories shape who we are—sharing them deepens intimacy.",
    tags: ['memories', 'discovery', 'intimacy']
  },
  {
    id: 'conv-get-048',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's something you wish you were better at?",
    followUps: [
      "Why does that matter to you?",
      "What's prevented you from improving?",
      "Would you actually want to work on it, or is the wishing enough?"
    ],
    context: "Our perceived shortcomings often reveal our values and aspirations.",
    tags: ['growth', 'self-awareness', 'honesty']
  },
  {
    id: 'conv-get-049',
    category: 'getting_to_know',
    intensity: 3,
    question: "What's a question you've always wanted to ask me but haven't?",
    followUps: [
      "What stopped you?",
      "What are you afraid the answer might be?",
      "Is now a good time to ask it?"
    ],
    context: "Unasked questions often represent unexplored territory in our relationships.",
    tags: ['deep', 'discovery', 'curiosity']
  },
  {
    id: 'conv-get-050',
    category: 'getting_to_know',
    intensity: 2,
    question: "What's something about yourself that you're still figuring out?",
    followUps: [
      "What makes it confusing?",
      "What would clarity look like?",
      "How can I support your exploration?"
    ],
    context: "We're all evolving—acknowledging our uncertainty is part of growth.",
    tags: ['growth', 'self-discovery', 'honesty']
  }
];

export default gettingToKnowStarters;
