// apps/mobile/data/kink_conversation_topics.ts
// Conversation topics for each kink category & specific kinks
// Used by the kink-topics screen to spark discussion around matched kinks

export interface KinkConversationTopic {
  id: string;
  approach: string;       // e.g. "Curiosity", "Boundaries", "Fantasy"
  approachIcon: string;   // emoji
  prompt: string;
  followUps: string[];
  context: string;
}

export interface KinkTopicGroup {
  kinkSlug?: string;       // specific kink override
  kinkCategory?: string;   // category fallback
  topics: KinkConversationTopic[];
}

// ─── SENSORY ─────────────────────────────────────────────────────────────────
const sensoryTopics: KinkConversationTopic[] = [
  {
    id: 'sensory-curiosity',
    approach: 'Curiosity',
    approachIcon: '✨',
    prompt: 'What is it about sensory experiences that excites you most — is it the physical sensation, the anticipation, or something else?',
    followUps: [
      'Are there specific textures or temperatures that really do it for you?',
      'Do you prefer giving or receiving sensory attention?',
      'What part of your body is most sensitive to touch?',
    ],
    context: 'Sensory play is about heightening awareness. Starting with curiosity helps both partners understand what draws them in.',
  },
  {
    id: 'sensory-boundaries',
    approach: 'Boundaries',
    approachIcon: '🛡️',
    prompt: 'Are there any sensations that are completely off the table for you, and any that you especially want more of?',
    followUps: [
      'How do you feel about temperature play — heat vs cold?',
      'Are there areas of your body that feel too sensitive or ticklish?',
      'What would make you feel comfortable telling me to stop or slow down?',
    ],
    context: 'Knowing limits upfront makes the experience feel safe and lets both partners relax fully into it.',
  },
  {
    id: 'sensory-fantasy',
    approach: 'Fantasy',
    approachIcon: '💭',
    prompt: 'If you could design the perfect sensory experience with me, what would the scene look, feel, smell and sound like?',
    followUps: [
      'Would you want to be blindfolded to amplify other senses?',
      'What mood or setting feels most exciting — soft and romantic, or intense?',
      'Is there a specific sensation you\'ve always been curious to try?',
    ],
    context: 'Describing fantasies in detail helps partners understand desire beyond just the physical act.',
  },
  {
    id: 'sensory-experience',
    approach: 'Past Experience',
    approachIcon: '📖',
    prompt: 'Have you had a sensory experience — even outside of intimacy — that felt incredibly pleasurable? What made it so good?',
    followUps: [
      'Did that experience make you curious about exploring more?',
      'Is there anything from that you\'d want to recreate together?',
      'What\'s the most surprising thing you\'ve found pleasurable?',
    ],
    context: 'Connecting to real memories makes it easier to talk about what genuinely feels good vs what sounds good in theory.',
  },
  {
    id: 'sensory-logistics',
    approach: 'Logistics',
    approachIcon: '🗓️',
    prompt: 'If we were going to explore this together, what would we need to set up or have on hand to make it feel right?',
    followUps: [
      'Do you prefer a spontaneous moment or having it planned?',
      'Is there anything we\'d need to buy or prepare first?',
      'What time of day or kind of setting feels best for this?',
    ],
    context: 'Practical conversation removes mystery and makes actually doing it much more likely.',
  },
  {
    id: 'sensory-emotional',
    approach: 'Emotional',
    approachIcon: '💞',
    prompt: 'How do you feel emotionally when someone takes their time exploring your body with full attention?',
    followUps: [
      'Does slowing down feel vulnerable or exciting — or both?',
      'What would make you feel truly seen and appreciated during this?',
      'What do you need from me after an intense sensory session?',
    ],
    context: 'Sensory experiences can bring up deep vulnerability. Talking about the emotional side builds real intimacy.',
  },
];

// ─── COMMUNICATION ────────────────────────────────────────────────────────────
const communicationTopics: KinkConversationTopic[] = [
  {
    id: 'comm-curiosity',
    approach: 'Curiosity',
    approachIcon: '✨',
    prompt: 'When it comes to verbal intimacy — dirty talk, whispers, expressions of desire — what appeals to you most about it?',
    followUps: [
      'Is it more about hearing things or saying them yourself?',
      'Does tone of voice matter as much as the words?',
      'What\'s the difference for you between sweet and dirty communication?',
    ],
    context: 'Verbal communication during intimacy can feel awkward at first — starting the conversation outside the moment makes it much easier.',
  },
  {
    id: 'comm-sharing',
    approach: 'Sharing',
    approachIcon: '💬',
    prompt: 'Is there something you\'ve wanted to say to me during intimate moments but held back? What stopped you?',
    followUps: [
      'What would it take to feel more comfortable expressing yourself?',
      'Are there words or phrases that feel too vulnerable to say out loud?',
      'Would you prefer we practice outside the bedroom first?',
    ],
    context: 'Many people have desires they want to express verbally but fear judgment. Creating safety to share them is the first step.',
  },
  {
    id: 'comm-boundaries',
    approach: 'Boundaries',
    approachIcon: '🛡️',
    prompt: 'Are there certain words or phrases that are a total turn-off for you? And on the flip side, ones that would really turn you on?',
    followUps: [
      'Are there names or terms you love being called or hate being called?',
      'Is there a level of explicitness that feels like too much?',
      'What\'s your reaction when someone talks during intimacy unexpectedly?',
    ],
    context: 'Knowing both the yes and the no list makes verbal intimacy feel like a gift rather than a gamble.',
  },
  {
    id: 'comm-fantasy',
    approach: 'Fantasy',
    approachIcon: '💭',
    prompt: 'If I whispered something in your ear right now that would drive you wild, what would it be?',
    followUps: [
      'Are there full fantasies you\'d want me to narrate to you?',
      'Would you want to hear what I\'m thinking in real time?',
      'Does hearing your own desires described out loud by your partner turn you on?',
    ],
    context: 'Verbal fantasy lets both partners co-create the experience in real time, deepening connection and arousal.',
  },
  {
    id: 'comm-digital',
    approach: 'Outside the Bedroom',
    approachIcon: '📱',
    prompt: 'How do you feel about building anticipation through messages or notes during the day?',
    followUps: [
      'What kind of messages would excite you vs feel like too much pressure?',
      'Is there a time of day when receiving something flirty would really hit right?',
      'Would you want to set a "theme" or agreement for what\'s fair game to send?',
    ],
    context: 'Communication outside the bedroom can be a powerful way to maintain connection and keep desire alive.',
  },
];

// ─── AFTERCARE ────────────────────────────────────────────────────────────────
const aftercareTopics: KinkConversationTopic[] = [
  {
    id: 'aftercare-needs',
    approach: 'Your Needs',
    approachIcon: '🤗',
    prompt: 'After an intense or deeply intimate experience, what do you need from me to feel safe and cared for?',
    followUps: [
      'Is it physical closeness, words of affirmation, silence, or something else?',
      'How long do you typically need to feel settled?',
      'Is your need for aftercare different depending on the intensity of the experience?',
    ],
    context: 'Aftercare isn\'t just for BDSM — everyone benefits from intentional reconnection after vulnerability.',
  },
  {
    id: 'aftercare-giving',
    approach: 'Giving Care',
    approachIcon: '💝',
    prompt: 'When I\'m the one who needs care after intimacy, how would you want to show up for me?',
    followUps: [
      'Do you naturally know what to do, or would it help me to tell you?',
      'How do you feel when you\'re taking care of me emotionally?',
      'Is there a way I can make it easier for you to give me what I need?',
    ],
    context: 'Talking about giving care — not just receiving it — creates a more balanced sense of responsibility.',
  },
  {
    id: 'aftercare-physical',
    approach: 'Physical Comfort',
    approachIcon: '🛁',
    prompt: 'What physical rituals feel the most comforting to you after intimacy? Blankets, snacks, a bath, holding each other?',
    followUps: [
      'Is there something that always makes you feel better vs things that don\'t work?',
      'Do you prefer to stay close or have a little space to decompress?',
      'What\'s something small I could always do that would mean a lot?',
    ],
    context: 'Small physical rituals signal safety and care, strengthening the bond formed during intimacy.',
  },
  {
    id: 'aftercare-emotional',
    approach: 'Emotional Processing',
    approachIcon: '💞',
    prompt: 'Do you ever feel an emotional drop after intense intimacy — a dip in mood or energy? How do you usually handle that?',
    followUps: [
      'Have you ever felt that alone, without support? How did that feel?',
      'What would help if you were experiencing that with me?',
      'Should we have a check-in routine for after we try something new?',
    ],
    context: 'Sub drop and emotional vulnerability after intimacy are real. Knowing your partner\'s experience prevents misunderstanding.',
  },
];

// ─── ENVIRONMENT ──────────────────────────────────────────────────────────────
const environmentTopics: KinkConversationTopic[] = [
  {
    id: 'env-setting',
    approach: 'Setting the Scene',
    approachIcon: '🕯️',
    prompt: 'What does your ideal intimate environment look, sound, and smell like? Paint the full picture.',
    followUps: [
      'Lighting — candles, dim, total darkness, or something else?',
      'Music or silence? If music, what kind sets the right mood?',
      'Temperature — warm and cozy or cool sheets?',
    ],
    context: 'Environment shapes the entire emotional tone of an experience. Partners often have very different default preferences.',
  },
  {
    id: 'env-novelty',
    approach: 'New Locations',
    approachIcon: '🗺️',
    prompt: 'Is there a location outside of the bedroom that\'s always appealed to you — somewhere that feels exciting or forbidden?',
    followUps: [
      'What is it about that location that does it for you?',
      'What would make you feel comfortable enough to actually try it?',
      'Is there a fantasy location that\'s just a fantasy vs one you\'d genuinely want to try?',
    ],
    context: 'Novelty is a powerful driver of desire. Exploring which locations appeal to each partner opens doors — literally.',
  },
  {
    id: 'env-ritual',
    approach: 'Rituals & Prep',
    approachIcon: '✨',
    prompt: 'Is there something you like to do beforehand to shift into the right headspace — a shower, music, dimming the lights?',
    followUps: [
      'Do you need time to decompress from the day first?',
      'Is there something I could do to help set the mood for you?',
      'Do spontaneous moments work for you, or do you prefer some lead time?',
    ],
    context: 'Transition rituals help the mind shift from daily life to presence. Knowing each other\'s rituals reduces friction.',
  },
  {
    id: 'env-outdoor',
    approach: 'Nature & Outdoors',
    approachIcon: '🌿',
    prompt: 'How do you feel about outdoor or nature-based intimacy — camping, a private beach, a secluded spot? Exciting or not your thing?',
    followUps: [
      'Is the appeal the risk, the natural setting, or the adventure?',
      'What safeguards would you need to feel comfortable?',
      'Is this a "someday fantasy" or something you\'d genuinely want to plan?',
    ],
    context: 'Outdoor settings introduce elements of risk and nature that some find thrilling — but it requires real alignment.',
  },
];

// ─── LIGHT RESTRAINT ─────────────────────────────────────────────────────────
const lightRestraintTopics: KinkConversationTopic[] = [
  {
    id: 'restraint-curiosity',
    approach: 'Curiosity',
    approachIcon: '✨',
    prompt: 'What draws you to the idea of restraint or power exchange? Is it the trust, the vulnerability, the loss of control, or something else?',
    followUps: [
      'Do you lean more toward wanting to be restrained or doing the restraining?',
      'Does the appeal come from the physical sensation or the psychological element?',
      'Has this always been something you\'ve been curious about, or is it newer?',
    ],
    context: 'Restraint play is more about psychology than physical restriction. Understanding what the appeal actually is helps partners connect on a deeper level.',
  },
  {
    id: 'restraint-trust',
    approach: 'Trust & Safety',
    approachIcon: '🔐',
    prompt: 'What would need to be true for you to feel completely safe being physically restrained by me — or restraining me?',
    followUps: [
      'Do we need a safeword, and what would it be?',
      'How do you want me to check in with you during the experience?',
      'What would immediately make you want to stop, and how would you signal that?',
    ],
    context: 'Trust is the foundation of all restraint play. This conversation IS the intimacy — not just a prerequisite for it.',
  },
  {
    id: 'restraint-roles',
    approach: 'Roles & Dynamics',
    approachIcon: '👑',
    prompt: 'When you imagine a power dynamic between us, what role feels most natural or exciting to you?',
    followUps: [
      'Do you want to switch roles or does one feel clearly right for you?',
      'Is it important that this stays in a clearly defined scene, or do you like it bleeding into regular moments?',
      'What does submission or dominance mean to you emotionally — not just physically?',
    ],
    context: 'Roles in power exchange are deeply personal. There\'s no right answer — the goal is shared understanding.',
  },
  {
    id: 'restraint-limits',
    approach: 'Hard & Soft Limits',
    approachIcon: '🛡️',
    prompt: 'Let\'s talk about what\'s completely off-limits, what you\'d want to try carefully, and what you\'re fully excited about.',
    followUps: [
      'Are there specific tools (ropes, cuffs, tape) that feel okay vs uncomfortable?',
      'What\'s the difference between "not yet" and "never" for you with this?',
      'How do you want me to handle it if I\'m unsure whether something is okay?',
    ],
    context: 'Knowing the spectrum of limits — not just hard stops — gives both partners room to explore while staying grounded.',
  },
  {
    id: 'restraint-aftercare',
    approach: 'After the Scene',
    approachIcon: '🤗',
    prompt: 'After exploring power dynamics or restraint, what do you need to feel fully back to yourself and close to me?',
    followUps: [
      'Does your aftercare need change depending on how intense the experience was?',
      'Should we check in verbally right after, or give it a little time?',
      'What would feel like the perfect way to end that kind of experience?',
    ],
    context: 'Aftercare for restraint and power play is especially important — the return to equality and connection is part of the experience.',
  },
];

// ─── PROPS & TOYS ─────────────────────────────────────────────────────────────
const propsToysTopics: KinkConversationTopic[] = [
  {
    id: 'toys-curiosity',
    approach: 'Curiosity',
    approachIcon: '✨',
    prompt: 'When it comes to toys or props in the bedroom, what has genuinely interested you — even if you\'ve never mentioned it before?',
    followUps: [
      'Is there something you\'ve seen or read about that made you curious?',
      'Is your interest more about the physical sensation or the playfulness of it?',
      'Are there any you\'ve tried before that you loved or didn\'t love?',
    ],
    context: 'Many people have toy curiosities they\'ve never voiced. This question opens that door without pressure.',
  },
  {
    id: 'toys-comfort',
    approach: 'Comfort Level',
    approachIcon: '🛡️',
    prompt: 'How do you feel about introducing toys or props into our intimacy — excited, nervous, curious, or somewhere in between?',
    followUps: [
      'Is there anything that would feel like a step too far, at least for now?',
      'Would you want to shop for something together, or would you prefer I surprise you?',
      'Do you have any concerns about how it might change the dynamic between us?',
    ],
    context: 'Even enthusiastic partners can have hesitations. Making space for both the yes and the nervousness creates real trust.',
  },
  {
    id: 'toys-together',
    approach: 'Doing It Together',
    approachIcon: '🛍️',
    prompt: 'What would it be like to browse and choose a toy together? Would that be fun, awkward, exciting?',
    followUps: [
      'Would you prefer to shop online privately or browse together?',
      'Is there a price range or type that feels right to start with?',
      'How would you want to "introduce" it the first time?',
    ],
    context: 'Choosing together removes the pressure of guessing and turns the whole experience into something shared from the start.',
  },
  {
    id: 'toys-fantasy',
    approach: 'Fantasy',
    approachIcon: '💭',
    prompt: 'In your ideal scenario using a toy or prop with me, how does that scene play out?',
    followUps: [
      'Who takes the lead in that fantasy?',
      'What makes it exciting — the novelty, the sensation, or something else?',
      'Is there something specific you\'d want me to do or say during it?',
    ],
    context: 'Sharing the full fantasy — not just "I want to try X" — gives your partner the full picture of your desire.',
  },
];

// ─── ROLEPLAY ─────────────────────────────────────────────────────────────────
const roleplayTopics: KinkConversationTopic[] = [
  {
    id: 'roleplay-appeal',
    approach: 'The Appeal',
    approachIcon: '✨',
    prompt: 'What is it about roleplay that calls to you — the characters, the story, the ability to step outside yourself, or something else?',
    followUps: [
      'Is there a type of character or scenario that keeps coming back to you?',
      'Do you want to fully commit to characters or keep it light and playful?',
      'Is the appeal about power, novelty, fantasy fulfillment, or something else?',
    ],
    context: 'Roleplay means very different things to different people — from playful to deeply immersive. Getting clear on the appeal helps find common ground.',
  },
  {
    id: 'roleplay-scenarios',
    approach: 'Scenarios',
    approachIcon: '🎭',
    prompt: 'If we were going to try a roleplay scenario together, which of these sounds most exciting — strangers meeting, power dynamics, fantasy characters, or something completely your own?',
    followUps: [
      'Is there a specific scenario you\'ve had in mind for a while?',
      'What details about the scenario matter most to you?',
      'Would you want to plan it in advance or improvise as we go?',
    ],
    context: 'Giving specific options lowers the barrier to sharing. It\'s easier to react to a suggestion than invent from scratch.',
  },
  {
    id: 'roleplay-comfort',
    approach: 'Comfort & Limits',
    approachIcon: '🛡️',
    prompt: 'Are there any types of roleplay scenarios that feel completely off the table for you, and any that are definite yeses?',
    followUps: [
      'How do you feel about scenarios involving power imbalance or age-coded roles?',
      'Is there a line between "playing a character" and "being yourself" that matters to you?',
      'What would break the spell for you and pull you out of character?',
    ],
    context: 'Roleplay can touch on taboos that need careful navigation. A clear "yes / no / maybe" map makes it feel safe to go deep.',
  },
  {
    id: 'roleplay-logistics',
    approach: 'Making It Real',
    approachIcon: '🗓️',
    prompt: 'If we set up a roleplay scenario, what would actually help you get into character? Costumes, scripts, a specific setting?',
    followUps: [
      'Should we set the scene beforehand, or start mid-story?',
      'How do we handle it if one of us breaks character — keep going or pause?',
      'Is there a safe word or signal we should agree on before we start?',
    ],
    context: 'The logistics of roleplay are often what stop it from happening. Solving them in advance makes it something you actually do, not just fantasize about.',
  },
  {
    id: 'roleplay-after',
    approach: 'After the Scene',
    approachIcon: '🤗',
    prompt: 'After a roleplay scenario, how do you want to come back to just being us — gradually, immediately, or a mix?',
    followUps: [
      'Is there anything that would help you transition back to yourself?',
      'Would you want to talk about it right after, or process it first?',
      'How would you feel if something unexpected came up emotionally during the scenario?',
    ],
    context: 'Coming out of a roleplay scene can be disorienting or emotional. Knowing what each partner needs makes the re-entry feel grounding.',
  },
];

// ─── GROUP FANTASY ────────────────────────────────────────────────────────────
const groupTopics: KinkConversationTopic[] = [
  {
    id: 'group-fantasy-vs-reality',
    approach: 'Fantasy vs Reality',
    approachIcon: '💭',
    prompt: 'When it comes to fantasies involving other people — is this something that lives best as a fantasy for you, or something you\'d genuinely consider exploring?',
    followUps: [
      'What is it about the idea that appeals to you most?',
      'Have your thoughts on this changed over time?',
      'Is there a version of this that feels exciting vs one that feels threatening?',
    ],
    context: 'Many people hold group-related fantasies. The first and most important step is distinguishing fantasy from actual interest.',
  },
  {
    id: 'group-jealousy',
    approach: 'Jealousy & Security',
    approachIcon: '❤️',
    prompt: 'How do you feel about the idea of either of us being with or sharing intimacy with another person — what comes up emotionally?',
    followUps: [
      'Do you think you\'re wired in a way that could handle this, or does jealousy feel like a dealbreaker?',
      'What would you need from me to feel fully secure if we ever explored this?',
      'Are there any boundaries that, if crossed, would feel irreparable?',
    ],
    context: 'This conversation is not about deciding anything — it\'s about understanding each other\'s emotional landscape honestly.',
  },
  {
    id: 'group-rules',
    approach: 'Rules & Agreements',
    approachIcon: '📋',
    prompt: 'If this were ever on the table, what non-negotiable rules or agreements would you need in place?',
    followUps: [
      'Are there specific types of people or situations that would feel safer or less safe?',
      'How would we handle it if one of us wanted to stop?',
      'What would "checking in" look like during and after?',
    ],
    context: 'Even as a hypothetical, thinking through structure gives both partners a realistic picture of what it would actually involve.',
  },
  {
    id: 'group-emotional',
    approach: 'Emotional Honesty',
    approachIcon: '💞',
    prompt: 'Setting aside what sounds exciting on paper — how do you actually feel in your gut about this, and do you trust that gut feeling?',
    followUps: [
      'Is there a fear underneath the curiosity that\'s worth looking at?',
      'What would it mean for our relationship if we tried this and it changed something?',
      'What would it mean for us if we chose never to explore it at all?',
    ],
    context: 'The emotional truth is almost always more complicated than the fantasy. Sitting with that together builds real intimacy regardless of the outcome.',
  },
];

// ─── TOPIC GROUPS ─────────────────────────────────────────────────────────────

export const kinkTopicGroups: KinkTopicGroup[] = [
  { kinkCategory: 'sensory', topics: sensoryTopics },
  { kinkCategory: 'communication', topics: communicationTopics },
  { kinkCategory: 'aftercare', topics: aftercareTopics },
  { kinkCategory: 'environment', topics: environmentTopics },
  { kinkCategory: 'light_restraint', topics: lightRestraintTopics },
  { kinkCategory: 'props_and_toys', topics: propsToysTopics },
  { kinkCategory: 'roleplay', topics: roleplayTopics },
  { kinkCategory: 'group', topics: groupTopics },
];

// ─── LOOKUP FUNCTION ──────────────────────────────────────────────────────────

export function getTopicsForKink(kinkSlug: string, kinkCategory: string): KinkConversationTopic[] {
  // First try slug-specific
  const slugGroup = kinkTopicGroups.find((g) => g.kinkSlug === kinkSlug);
  if (slugGroup) return slugGroup.topics;

  // Fall back to category
  const catGroup = kinkTopicGroups.find((g) => g.kinkCategory === kinkCategory);
  if (catGroup) return catGroup.topics;

  // Last resort: sensory as generic fallback
  return sensoryTopics;
}
