// apps/mobile/data/kinkConversationTopics.ts
// Kink-specific conversation topics

export interface KinkConversationTopic {
  id: string;
  kinkSlug: string;
  approaches: {
    title: string;
    description: string;
    starter: string;
    followUps: string[];
  }[];
}

export const kinkConversationTopics: Record<string, KinkConversationTopic> = {
  "sensual-massage": {
    id: "kct-sensual-massage",
    kinkSlug: "sensual-massage",
    approaches: [
      {
        title: "The Gentle Introduction",
        description: "Start with relaxation and comfort",
        starter: "I've been thinking about how nice it would feel to give you a slow, intimate massage. What kind of touch helps you relax most?",
        followUps: ["Do you prefer oil or lotion?", "Are there areas you'd want me to focus on or avoid?", "Would you want this to lead somewhere, or just be about relaxation?"]
      },
      {
        title: "The Sensual Exploration",
        description: "Focus on discovering each other's bodies",
        starter: "I want to take my time exploring your body with my hands, learning what makes you feel good. How do you feel about that?",
        followUps: ["What kind of pressure do you enjoy?", "Do you like being touched everywhere, or are there zones that are more sensitive?", "How would you want me to check in with you during?"]
      },
      {
        title: "The Role Reversal",
        description: "Discuss taking turns and reciprocity",
        starter: "I'd love for us to take turns giving each other massages. What would make that experience amazing for you?",
        followUps: ["Do you prefer giving or receiving more?", "Should we set a timer or just go with the flow?", "What atmosphere would help you get in the mood?"]
      }
    ]
  },

  "deep-kissing": {
    id: "kct-deep-kissing",
    kinkSlug: "deep-kissing",
    approaches: [
      {
        title: "The Nostalgic Approach",
        description: "Reminisce about your best kisses",
        starter: "Remember when we used to kiss for hours? I miss that intensity. What do you remember about our best kissing sessions?",
        followUps: ["What made those kisses so good?", "Do you think we've lost some of that passion?", "How could we bring that back?"]
      },
      {
        title: "The Technique Talk",
        description: "Discuss preferences and styles",
        starter: "I want to know exactly how you like to be kissed. Can you describe your perfect kiss?",
        followUps: ["Fast and passionate or slow and deep?", "Do you like using tongue, or prefer lip-focused kissing?", "What do I do that you love most when we kiss?"]
      },
      {
        title: "The Spontaneous Suggestion",
        description: "Propose a kissing-focused session",
        starter: "What if we spent an evening doing nothing but kissing—no pressure for more, just rediscovering each other's mouths?",
        followUps: ["Does that sound exciting or frustrating to you?", "Where would you want to do this?", "What would make it feel special?"]
      }
    ]
  },

  "cuddling-naked": {
    id: "kct-cuddling-naked",
    kinkSlug: "cuddling-naked",
    approaches: [
      {
        title: "The Comfort Conversation",
        description: "Focus on intimacy without expectation",
        starter: "I love the idea of just being naked with you, skin to skin, with no pressure for anything else. How does that sound?",
        followUps: ["Do you feel comfortable being naked together without it leading to sex?", "What would help you feel most relaxed?", "Would you want to talk, watch something, or just be silent?"]
      },
      {
        title: "The Vulnerability Share",
        description: "Discuss body confidence and acceptance",
        starter: "I want us to feel completely comfortable with each other's bodies. What would help you feel most at ease being naked with me?",
        followUps: ["Are there things that make you self-conscious?", "How can I make you feel more desired?", "What do you love most about my body?"]
      },
      {
        title: "The Afterglow Alternative",
        description: "Frame it as extended aftercare",
        starter: "You know how amazing it feels to cuddle after sex? What if we did that without the sex first—just pure intimacy?",
        followUps: ["Do you think that would feel as connecting?", "What would you want me to do while we cuddle?", "How long would feel right?"]
      }
    ]
  },

  "mutual-masturbation": {
    id: "kct-mutual-masturbation",
    kinkSlug: "mutual-masturbation",
    approaches: [
      {
        title: "The Learning Opportunity",
        description: "Frame it as discovering preferences",
        starter: "I'd love to watch how you touch yourself so I can learn exactly what you like. Would you be comfortable showing me?",
        followUps: ["What makes you feel shy about this, if anything?", "Would you want me to just watch, or guide me?", "How would you feel about me doing the same?"]
      },
      {
        title: "The Voyeuristic Thrill",
        description: "Focus on the visual excitement",
        starter: "The idea of watching you pleasure yourself is incredibly hot to me. Is that something you'd ever be open to?",
        followUps: ["What would make you feel sexy doing this?", "Would you want me to touch myself too?", "What setting would feel most comfortable?"]
      },
      {
        title: "The Mutual Discovery",
        description: "Make it about both partners learning",
        starter: "What if we took turns showing each other how we like to be touched? It could be like a masterclass in each other's pleasure.",
        followUps: ["Who would want to go first?", "Should we talk through it or stay silent?", "What would make this feel safe and fun?"]
      }
    ]
  },

  "blindfolded-touch": {
    id: "kct-blindfolded-touch",
    kinkSlug: "blindfolded-touch",
    approaches: [
      {
        title: "The Trust Builder",
        description: "Emphasize trust and surrender",
        starter: "I love the idea of you surrendering control and letting me surprise you with touch. How would you feel about being blindfolded?",
        followUps: ["What would help you feel safe?", "Would you want a signal to pause or stop?", "What kinds of touch sound exciting?"]
      },
      {
        title: "The Sensory Focus",
        description: "Highlight heightened sensations",
        starter: "When you can't see, every touch feels more intense. I'd love to explore your body that way. What do you think?",
        followUps: ["Are there textures you'd want me to use?", "Would you want to be lying down or standing?", "Should I focus on certain areas?"]
      },
      {
        title: "The Role Reversal",
        description: "Discuss taking turns",
        starter: "I'd love for us to take turns being blindfolded and explored. Which role appeals to you more—giving or receiving?",
        followUps: ["Why does that role appeal to you?", "What would you do if you were in control?", "What would you want done to you?"]
      }
    ]
  },

  "ice-cube-tease": {
    id: "kct-ice-cube-tease",
    kinkSlug: "ice-cube-tease",
    approaches: [
      {
        title: "The Temperature Play Intro",
        description: "Introduce temperature sensations gently",
        starter: "I've been curious about playing with temperature—like tracing an ice cube on your skin. How does that sound?",
        followUps: ["Are you sensitive to cold, or do you enjoy it?", "Where would you want me to start?", "Should I alternate with warm touch?"]
      },
      {
        title: "The Contrast Experience",
        description: "Focus on hot and cold together",
        starter: "Imagine the shock of cold ice followed by the warmth of my mouth. Does that kind of contrast appeal to you?",
        followUps: ["Do you enjoy intense sensations?", "What other temperature contrasts sound interesting?", "How would you want me to pace it?"]
      },
      {
        title: "The Teasing Game",
        description: "Frame it as playful teasing",
        starter: "I want to tease you with an ice cube, making you guess where I'll touch next. Would that be fun or too intense?",
        followUps: ["Do you like being teased?", "How long could you handle the anticipation?", "What would be your reward for being patient?"]
      }
    ]
  },

  "light-spanking": {
    id: "kct-light-spanking",
    kinkSlug: "light-spanking",
    approaches: [
      {
        title: "The Playful Introduction",
        description: "Start with fun and playfulness",
        starter: "I've been thinking it might be fun to try some playful, light spanking. Nothing intense—just something to mix things up. How do you feel about exploring that?",
        followUps: ["Have you ever been curious about this?", "What would make it feel fun rather than serious?", "How would you want me to check in with you?"]
      },
      {
        title: "The Sensation Focus",
        description: "Focus on the physical sensation",
        starter: "I read that the mix of pleasure and a little sting can be really intense. Would you be open to experimenting with light spanking to see how it feels?",
        followUps: ["Do you enjoy other kinds of impact sensations?", "What areas would be okay to try?", "Should we use a scale of 1-10 to communicate intensity?"]
      },
      {
        title: "The Power Dynamic",
        description: "Introduce light dominance/submission",
        starter: "The idea of you trusting me to give you a little spank is really hot to me. It's not about pain—it's about that playful power exchange. What do you think?",
        followUps: ["How do you feel about power dynamics in general?", "Would you want to switch roles, or just try one way?", "What would make you feel safe exploring this?"]
      }
    ]
  },

  "wrist-restraints": {
    id: "kct-wrist-restraints",
    kinkSlug: "wrist-restraints",
    approaches: [
      {
        title: "The Trust Exercise",
        description: "Frame it as building trust",
        starter: "I'd love to try gently restraining your wrists—just to see what it's like to surrender control to me completely. How would you feel about that level of trust?",
        followUps: ["What would help you feel completely safe?", "Would you want to be able to get out easily, or fully restrained?", "What would you want me to do while you're restrained?"]
      },
      {
        title: "The Sensory Enhancement",
        description: "Focus on heightened sensations when restrained",
        starter: "When you can't move your hands, every touch feels more intense. I'd love to explore your body while you're gently restrained. Does that intrigue you?",
        followUps: ["Do you think being unable to touch back would be frustrating or exciting?", "What sensations would you want to focus on?", "How long would feel comfortable?"]
      },
      {
        title: "The Soft Introduction",
        description: "Start with scarves or soft cuffs",
        starter: "What if we started super simple—just loosely tying your wrists with something soft like a scarf? We could stop anytime, and I'd check in constantly. Sound okay?",
        followUps: ["Do you have something soft we could use?", "Would you want your hands above your head or in front?", "What would be your signal if you wanted to stop?"]
      }
    ]
  },

  "vibrator-play": {
    id: "kct-vibrator",
    kinkSlug: "vibrator-play",
    approaches: [
      {
        title: "The Introduction",
        description: "Start with curiosity about toys",
        starter: "I've been curious about using a vibrator together. I think it could add something new to our play. How do you feel about bringing toys into our intimacy?",
        followUps: ["Have you used toys before, alone or with partners?", "Are there types of toys you're interested in or curious about?", "Would you want me to use it on you, or watch you use it?"]
      },
      {
        title: "The Shared Control",
        description: "Focus on giving control to partner",
        starter: "The idea of controlling a vibrator while you just receive pleasure is really hot to me. Would you trust me to control your experience like that?",
        followUps: ["Do you like the idea of surrendering control?", "What intensity levels would you want to explore?", "Should we have a signal for 'more' or 'less'?"]
      },
      {
        title: "The Shopping Trip",
        description: "Make it about choosing together",
        starter: "What if we went shopping for a vibrator together? We could pick one that excites us both. Would that be a fun date idea?",
        followUps: ["Would you prefer to shop online or in person?", "What features would be most important to you?", "Should we set a budget or go all out?"]
      }
    ]
  },

  "dirty-talk": {
    id: "kct-dirty-talk",
    kinkSlug: "dirty-talk",
    approaches: [
      {
        title: "The Word Preferences",
        description: "Discuss language comfort levels",
        starter: "I want to talk dirtier to you, but I want to make sure I use words that turn you on rather than offend you. What words do you like hearing during intimacy?",
        followUps: ["Are there words that are turn-offs for you?", "Do you prefer explicit language or more suggestive?", "Would you want me to describe what I'm doing or what I want to do?"]
      },
      {
        title: "The Narration Approach",
        description: "Start by describing actions",
        starter: "What if I started by just narrating what I'm doing to you? Like 'I'm kissing your neck now...' Would that feel natural or awkward?",
        followUps: ["Would you want me to talk the whole time or at certain moments?", "Do you prefer hearing my voice or being the one talking?", "What would make it feel sexy rather than silly?"]
      },
      {
        title: "The Fantasy Sharing",
        description: "Use words to share desires",
        starter: "I'd love to tell you exactly what I want to do to you, in detail, and have you tell me what you want. Would that kind of verbal sharing excite you?",
        followUps: ["Are you comfortable vocalizing your desires?", "What would you want me to say to you?", "Should we practice outside the bedroom first?"]
      }
    ]
  },

  "teacher-student-roleplay": {
    id: "kct-teacher-student",
    kinkSlug: "teacher-student-roleplay",
    approaches: [
      {
        title: "The Fantasy Discussion",
        description: "Explore the fantasy without pressure",
        starter: "I've always had this fantasy about a teacher-student dynamic. Not anything inappropriate—just the power and knowledge exchange. Is that something you've ever thought about?",
        followUps: ["What appeals to you about power dynamics?", "Would you want to be the teacher or the student?", "What would the 'lesson' be about?"]
      },
      {
        title: "The Costume Element",
        description: "Focus on the visual/setting",
        starter: "I think it could be hot to dress up and create a classroom scenario. Even just glasses and a strict attitude. Would you be into that kind of playful acting?",
        followUps: ["Do you enjoy dressing up or roleplaying?", "What props or outfits would help set the scene?", "Would you want to stay in character the whole time?"]
      },
      {
        title: "The Power Exchange",
        description: "Focus on authority and learning",
        starter: "The idea of you teaching me something intimate, or me teaching you, feels really exciting. Would you want to explore that authority dynamic?",
        followUps: ["Do you prefer being in charge or following instructions?", "What would you want to 'learn' or 'teach'?", "How would we transition out of the roles?"]
      }
    ]
  },

  "boss-employee-roleplay": {
    id: "kct-boss-employee",
    kinkSlug: "boss-employee-roleplay",
    approaches: [
      {
        title: "The Office Fantasy",
        description: "Create a workplace scenario",
        starter: "What if we pretended I was your boss and you were trying to get a promotion? The power dynamic could be really hot. Would you be into that scenario?",
        followUps: ["Have you ever had workplace fantasies?", "Would you want to be the boss or the employee?", "What 'work' would we be doing?"]
      },
      {
        title: "The Performance Review",
        description: "Frame it as evaluation and reward",
        starter: "Imagine I'm giving you a performance review, and things get increasingly personal and inappropriate. Does that scenario excite you?",
        followUps: ["What would you want to be 'reviewed' on?", "Would you want me to be critical or immediately attracted?", "How would you 'earn' your raise?"]
      },
      {
        title: "The After Hours",
        description: "Set it in an empty office",
        starter: "The idea of staying late at the office together, just the two of us, and things escalating... does that sound exciting to explore?",
        followUps: ["What about the office setting appeals to you?", "Would you want to actually be in an office-like space?", "What would make it feel authentic?"]
      }
    ]
  },

  "dominance-submission": {
    id: "kct-dominance-submission",
    kinkSlug: "dominance-submission",
    approaches: [
      {
        title: "The Gentle Introduction",
        description: "Start with light power exchange",
        starter: "I've been curious about exploring a little power exchange between us—nothing extreme, just playing with who takes the lead. How would you feel about that?",
        followUps: ["Do you naturally prefer leading or following?", "What would make you feel safe exploring this?", "Should we start just for one evening?"]
      },
      {
        title: "The Bedroom Only",
        description: "Limit it to intimate contexts",
        starter: "What if we experimented with dominance and submission just in the bedroom? I'd take complete control during sex, but we'd be equals outside. Does that boundary feel safe?",
        followUps: ["Would you want clear start and end signals?", "What would you call me during—Sir, Master, or just my name?", "How would we transition back to equals?"]
      },
      {
        title: "The Service Dynamic",
        description: "Focus on pleasing the dominant",
        starter: "The idea of you serving my pleasure, doing exactly what I tell you to do, is really exciting to me. Would you enjoy that kind of focused attention?",
        followUps: ["What would you get out of serving me?", "Would you want recognition or rewards?", "What would your limits be?"]
      }
    ]
  },

  "orgasm-control": {
    id: "kct-orgasm-control",
    kinkSlug: "orgasm-control",
    approaches: [
      {
        title: "The Denial Game",
        description: "Focus on delayed gratification",
        starter: "I've been thinking about controlling when you get to orgasm—bringing you close and then making you wait. The buildup can be incredibly intense. Would you trust me with that control?",
        followUps: ["How long do you think you could wait?", "Would you want me to tell you when you can, or ask permission?", "What would make the wait worth it?"]
      },
      {
        title: "The Permission Dynamic",
        description: "Require asking for release",
        starter: "What if you had to ask my permission before you could orgasm? I'd get to decide if you'd earned it. Does that power exchange appeal to you?",
        followUps: ["How would you feel about asking?", "What would you be willing to do to earn permission?", "Would you want the possibility of being denied?"]
      },
      {
        title: "The Mutual Control",
        description: "Take turns controlling",
        starter: "What if we took turns controlling each other's pleasure? One night I control yours, the next you control mine. Would that feel fair and exciting?",
        followUps: ["Who would want to go first?", "Would we have the same rules for both?", "What would be the reward for being patient?"]
      }
    ]
  }
};

export function getKinkConversationTopics(kinkSlug: string): KinkConversationTopic | undefined {
  return kinkConversationTopics[kinkSlug];
}

export function hasKinkConversationTopics(kinkSlug: string): boolean {
  return kinkSlug in kinkConversationTopics;
}

export default kinkConversationTopics;
