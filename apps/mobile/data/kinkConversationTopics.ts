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
  },

  // Additional NAUGHTY TIER KINKS
  "edging": {
    id: "kct-edging",
    kinkSlug: "edging",
    approaches: [
      {
        title: "The Self-Control Challenge",
        description: "Frame it as a mutual test of willpower",
        starter: "I've been thinking about trying edging together—bringing ourselves close and then backing off. It's supposed to make the final release incredibly intense. Would you be up for that challenge?",
        followUps: ["Do you think you have good self-control, or would you need me to stop you?", "How many times do you think you could edge before needing release?", "Would you want to do this together or take turns watching each other?"]
      },
      {
        title: "The Tease Dynamic",
        description: "Focus on the teasing aspect",
        starter: "I love the idea of teasing you right to the edge and then making you wait. The anticipation and frustration can be incredibly hot. How would you feel about me controlling your pleasure like that?",
        followUps: ["Would you want me to be merciful or cruel with the timing?", "How would you communicate when you're close?", "What would be your reward for being patient?"]
      },
      {
        title: "The Competition",
        description: "Make it a playful competition",
        starter: "What if we made it a game—who can last longer on the edge without going over? Winner gets to choose how we finish. Interested?",
        followUps: ["Do you think you'd be good at this game?", "Should there be penalties for losing control?", "What would make winning worth the wait?"]
      }
    ]
  },

  "butt-plug-play": {
    id: "kct-butt-plug-play",
    kinkSlug: "butt-plug-play",
    approaches: [
      {
        title: "The Gentle Introduction",
        description: "Start small and focus on comfort",
        starter: "I've been curious about trying a small butt plug. It could add a feeling of fullness during other activities. Would you be open to exploring that with me?",
        followUps: ["Have you ever tried anything like this before?", "What would help you feel most comfortable?", "Would you want to wear it or have me wear it first?"]
      },
      {
        title: "The Extended Wear",
        description: "Discuss wearing it for longer periods",
        starter: "What do you think about wearing a plug for an extended time—like during a date night or while we're out? The secret shared between us could be really exciting.",
        followUps: ["Does the idea of secret public play appeal to you?", "How long do you think would be comfortable?", "What would be your signal if you needed to stop?"]
      },
      {
        title: "The Shopping Adventure",
        description: "Make it about choosing together",
        starter: "Want to go shopping for plugs together? We could pick different sizes and styles to experiment with. It could be a fun, intimate shopping trip.",
        followUps: ["Would you prefer silicone, glass, or metal?", "Do you like the idea of jeweled plugs or simple designs?", "Should we start with a beginner set?"]
      }
    ]
  },

  "dildo-play": {
    id: "kct-dildo-play",
    kinkSlug: "dildo-play",
    approaches: [
      {
        title: "The Versatile Toy",
        description: "Explore different uses and possibilities",
        starter: "I'd love to incorporate a dildo into our play. There are so many ways to use them—on you, on me, watching each other. What aspects sound interesting to you?",
        followUps: ["Do you have any experience with toys?", "What size and style appeals to you?", "Would you prefer realistic or abstract designs?"]
      },
      {
        title: "The Visual Show",
        description: "Focus on the voyeuristic element",
        starter: "The idea of watching you use a dildo on yourself is incredibly hot to me. Would you be comfortable putting on that show for me?",
        followUps: ["Would you want me to just watch or give instructions?", "What setting would make you feel most confident?", "Should we incorporate it into our regular play?"]
      },
      {
        title: "The Double Penetration Tease",
        description: "Explore the fantasy of fullness",
        starter: "I've been fantasizing about filling you completely—using a dildo along with myself to give you that full sensation. Is that something you'd want to try?",
        followUps: ["Does the idea of being completely filled appeal to you?", "Would you want to start with just the toy first?", "How would we communicate during to make sure it's good for you?"]
      }
    ]
  },

  "roleplay-strangers": {
    id: "kct-roleplay-strangers",
    kinkSlug: "roleplay-strangers",
    approaches: [
      {
        title: "The Bar Pickup",
        description: "Classic strangers meeting scenario",
        starter: "What if we pretended we were strangers meeting at a bar? You could approach me, or I could approach you, and we'd flirt like it's the first time. Does that sound exciting?",
        followUps: ["Would you want to be the pursuer or the pursued?", "What kind of character would you play?", "Should we actually go to a bar or create the scene at home?"]
      },
      {
        title: "The Hotel Encounter",
        description: "Anonymous hotel setting",
        starter: "Imagine we're both staying at the same hotel, strangers who meet in the elevator or bar. The anonymity could make it thrilling. Want to try that scenario?",
        followUps: ["What would your backstory be?", "Would you want to use different names?", "How far would we take the 'stranger' dynamic?"]
      },
      {
        title: "The First Date",
        description: "Pretend it's a first date with unknown outcome",
        starter: "Let's pretend this is our first date and we don't know if it'll end in the bedroom. The uncertainty and newness could be really exciting. Sound fun?",
        followUps: ["What would you wear to impress a stranger?", "What questions would you ask on a first date?", "How would you hint at what you wanted?"]
      }
    ]
  },

  "doctor-patient-roleplay": {
    id: "kct-doctor-patient-roleplay",
    kinkSlug: "doctor-patient-roleplay",
    approaches: [
      {
        title: "The Thorough Examination",
        description: "Focus on the clinical aspect",
        starter: "I've been thinking about a doctor-patient scenario where you need a very thorough examination. The power dynamic and vulnerability could be intense. Interested?",
        followUps: ["Would you want to be the doctor or the patient?", "What kind of 'examination' appeals to you?", "How clinical versus sensual should it be?"]
      },
      {
        title: "The House Call",
        description: "At-home medical visit scenario",
        starter: "What if you were a doctor making a house call, and things got increasingly personal during the examination? The home setting makes it more intimate.",
        followUps: ["Would you want props like a white coat or stethoscope?", "What symptoms would the patient have?", "How would the doctor cross professional boundaries?"]
      },
      {
        title: "The Specialist Visit",
        description: "Specific type of medical specialist",
        starter: "We could make it a specialist visit—like a gynecologist, proctologist, or therapist. The specific context could add to the realism. What specialty interests you?",
        followUps: ["Which medical specialty feels most exciting?", "Would you want to research actual procedures for realism?", "How would we handle the power dynamic?"]
      }
    ]
  },

  "strip-tease": {
    id: "kct-strip-tease",
    kinkSlug: "strip-tease",
    approaches: [
      {
        title: "The Performance",
        description: "Focus on the theatrical aspect",
        starter: "I want to give you a proper strip tease—music, lighting, slow deliberate movements. I want to drive you crazy before I even touch you. Would you enjoy that show?",
        followUps: ["What kind of music would set the right mood?", "Would you want me to start fully dressed or in lingerie?", "Can you handle being told 'no touching' until I'm done?"]
      },
      {
        title: "The Mutual Show",
        description: "Take turns performing",
        starter: "What if we took turns stripping for each other? You could show me what I've been missing, then I'll return the favor. A private show for each of us.",
        followUps: ["Would you be comfortable performing for me?", "What would make you feel sexiest while stripping?", "Should we give each other 'tips' or feedback?"]
      },
      {
        title: "The Amateur Night",
        description: "Keep it playful and imperfect",
        starter: "Even if I'm not a professional, I think it could be hot to try a strip tease. The effort and vulnerability might make it even sexier. Want to see my amateur attempt?",
        followUps: ["Would you laugh with me if I messed up the moves?", "What outfit would you want me to strip out of?", "Should we practice together first?"]
      }
    ]
  },

  "lap-dance": {
    id: "kct-lap-dance",
    kinkSlug: "lap-dance",
    approaches: [
      {
        title: "The Private Dance",
        description: "Focus on intimate contact",
        starter: "I want to give you a lap dance—grinding on you, teasing you, using my body to drive you wild while you can only watch and feel. Interested in being my audience?",
        followUps: ["Would you be able to keep your hands to yourself?", "What would you want me to wear?", "How long do you think you could last before wanting more?"]
      },
      {
        title: "The VIP Room",
        description: "Create a club atmosphere",
        starter: "Let's create a VIP room experience at home. I'll be your private dancer, and you're the VIP who gets all my attention. No bouncers, no rules—just us.",
        followUps: ["Would you want me to stay in character as a dancer?", "Should we set up the room with special lighting?", "What 'services' would the VIP receive?"]
      },
      {
        title: "The Role Reversal",
        description: "Take turns giving and receiving",
        starter: "What if we both took turns giving lap dances? I'd love to see you move for me, then I'll return the favor. Fair exchange?",
        followUps: ["Would you feel confident giving me a lap dance?", "What would you want to wear for your performance?", "Should we vote on who was better?"]
      }
    ]
  },

  "sexting-with-photos": {
    id: "kct-sexting-with-photos",
    kinkSlug: "sexting-with-photos",
    approaches: [
      {
        title: "The Teasing Buildup",
        description: "Start subtle and escalate",
        starter: "I want to send you photos throughout the day—starting innocent and getting more revealing. By the time we're together, you'll be desperate. Sound like fun?",
        followUps: ["What kind of photos would drive you crazy?", "Are you comfortable sending photos back?", "How explicit should we get?"]
      },
      {
        title: "The Scavenger Hunt",
        description: "Make it a game with locations",
        starter: "What if we made it a scavenger hunt? I'll send photos from different places—work, the car, home—each one showing a little more. You have to guess where I am.",
        followUps: ["Would you play along and send location hints too?", "What locations would be most exciting to receive photos from?", "Should there be a reward for guessing correctly?"]
      },
      {
        title: "The Request Line",
        description: "Take requests from each other",
        starter: "I want you to tell me exactly what you want to see, and I'll send it. Then I'll make my requests. A visual conversation building anticipation all day.",
        followUps: ["What would be your first request?", "Are there any limits on what you'd send or want to receive?", "How would we keep this private and secure?"]
      }
    ]
  },

  "phone-sex": {
    id: "kct-phone-sex",
    kinkSlug: "phone-sex",
    approaches: [
      {
        title: "The Late Night Call",
        description: "Classic intimate phone conversation",
        starter: "I love the idea of having phone sex with you when we're apart—hearing your voice, your breathing, telling each other exactly what we want to do. Would you be into that?",
        followUps: ["Do you feel comfortable being vocal during intimacy?", "What would you want me to say to you?", "Would you want to video chat or keep it audio only?"]
      },
      {
        title: "The Narration",
        description: "Describe actions in detail",
        starter: "What if we narrated everything we're doing to ourselves while on the phone? Every touch, every sensation described in detail for each other.",
        followUps: ["Would you prefer to lead or follow my lead?", "How explicit should our descriptions get?", "Should we try to finish together or take turns?"]
      },
      {
        title: "The Fantasy Share",
        description: "Share fantasies verbally",
        starter: "I want to tell you my deepest fantasies over the phone—things I might be too shy to say in person. And I want to hear yours. Ready for some intimate confessions?",
        followUps: ["Is there a fantasy you've been hesitant to share?", "Would you want me to react in the moment or just listen?", "How would we transition from talking to acting when we're together?"]
      }
    ]
  },

  "video-sex": {
    id: "kct-video-sex",
    kinkSlug: "video-sex",
    approaches: [
      {
        title: "The Visual Connection",
        description: "Focus on seeing each other",
        starter: "When we're apart, I'd love to video chat and watch each other pleasure ourselves. Seeing your reactions would be incredibly hot. Would you be comfortable with that?",
        followUps: ["Would you prefer to watch or be watched?", "What angles would you want to see?", "How would we handle the technical side (lighting, camera position)?"]
      },
      {
        title: "The Directed Scene",
        description: "One directs, one performs",
        starter: "What if one of us directed the other during a video call? 'Touch here,' 'Show me that,' 'Slow down.' Taking turns being in control could be exciting.",
        followUps: ["Would you want to direct or be directed first?", "What instructions would you give me?", "How would we communicate limits during?"]
      },
      {
        title: "The Shared Experience",
        description: "Do it simultaneously",
        starter: "I want us to masturbate together on video, watching each other, hearing each other, finishing together even though we're apart. Does that intimacy appeal to you?",
        followUps: ["Do you think you could relax enough to enjoy it?", "What would help you feel most comfortable on camera?", "Should we schedule it or make it spontaneous?"]
      }
    ]
  },

  "outdoor-quickie": {
    id: "kct-outdoor-quickie",
    kinkSlug: "outdoor-quickie",
    approaches: [
      {
        title: "The Adrenaline Rush",
        description: "Focus on the excitement of risk",
        starter: "I've been fantasizing about finding a secluded spot outdoors and having a quick, passionate encounter. The risk of being caught adds such adrenaline. Interested?",
        followUps: ["What outdoor locations feel exciting but safe to you?", "How would we handle the risk of being seen?", "Would the fear of getting caught turn you on or stress you out?"]
      },
      {
        title: "The Hiking Adventure",
        description: "Nature setting specifically",
        starter: "What if we went hiking and found a private spot off the trail? Being surrounded by nature, away from everything, could be incredibly freeing. Sound appealing?",
        followUps: ["Do you have a favorite hiking spot that might work?", "What would we need to bring for comfort and cleanup?", "How private would it need to be for you to relax?"]
      },
      {
        title: "The Spontaneous Moment",
        description: "Seize the opportunity",
        starter: "I love the idea of being out together, feeling the chemistry, and just finding a spot to be intimate right then. No planning, just passion. Does spontaneity excite you?",
        followUps: ["Would you prefer to plan a location or be spontaneous?", "What would be your ideal outdoor scenario?", "How would we handle cleanup and discretion?"]
      }
    ]
  },

  "car-sex": {
    id: "kct-car-sex",
    kinkSlug: "car-sex",
    approaches: [
      {
        title: "The Nostalgic Experience",
        description: "Recapture teenage excitement",
        starter: "Remember making out in cars when we were younger? I want to recapture that excitement—finding a secluded spot, the confined space forcing us close. Want to relive those days?",
        followUps: ["Do you have fond memories of car encounters?", "What made them exciting for you?", "How would we make it comfortable enough to enjoy?"]
      },
      {
        title: "The Road Trip Tease",
        description: "During a drive",
        starter: "What if we pulled over during a road trip for a quick intimate moment? The spontaneity and the journey context could make it memorable.",
        followUps: ["Would you be comfortable in daylight or prefer night?", "What type of location would feel safe enough?", "Should we bring blankets or pillows for comfort?"]
      },
      {
        title: "The Parking Spot",
        description: "Classic makeout scenario",
        starter: "I want to find a secluded parking spot and have a steamy makeout session in the back seat. The nostalgia and confined space could be really hot. Sound fun?",
        followUps: ["Would you prefer the front or back seat?", "What would you wear for easy access?", "How would we ensure privacy?"]
      }
    ]
  },

  "shower-head": {
    id: "kct-shower-head",
    kinkSlug: "shower-head",
    approaches: [
      {
        title: "The Solo Discovery",
        description: "Share the technique",
        starter: "I've discovered how amazing the shower head can feel for stimulation. I'd love to show you, or watch you discover it too. Interested in exploring this together?",
        followUps: ["Have you ever tried this?", "What water pressure and temperature do you prefer?", "Would you want me to control the shower head for you?"]
      },
      {
        title: "The Shared Shower",
        description: "Use it together",
        starter: "What if we showered together and I used the shower head on you? The warm water combined with my touch could be incredible. Want to try?",
        followUps: ["Would you prefer standing or sitting in the shower?", "What positions would work best?", "How would we keep from slipping?"]
      },
      {
        title: "The Temperature Play",
        description: "Combine with temperature variations",
        starter: "We could play with water temperature—warm, cool, pulsing. The contrast could add another dimension to the sensation. Does that sound interesting?",
        followUps: ["Are you sensitive to temperature changes?", "Would you want to alternate hot and cold?", "How would we communicate what feels good?"]
      }
    ]
  },

  "food-play": {
    id: "kct-food-play",
    kinkSlug: "food-play",
    approaches: [
      {
        title: "The Sweet Treat",
        description: "Use sweet foods",
        starter: "I've been thinking about using whipped cream or chocolate sauce on your body and licking it off. The combination of tastes could be delicious. Interested?",
        followUps: ["What foods appeal to you for this?", "Are there any foods you absolutely don't want involved?", "Would you want to feed me or be fed?"]
      },
      {
        title: "The Fruit Feast",
        description: "Fresh and sensual",
        starter: "What if we fed each other fruit—strawberries, grapes, mango—taking turns, letting juices drip? It could be sensual and playful at the same time.",
        followUps: ["What fruits do you find most sensual?", "Would you want this to be part of foreplay or the main event?", "Should we have a picnic-style setup?"]
      },
      {
        title: "The Messy Fun",
        description: "Embrace the mess",
        starter: "I want to get messy with you—whipped cream, chocolate, maybe even ice cream. The cleanup shower together could be just as fun. Ready to get sticky?",
        followUps: ["How do you feel about getting messy?", "What areas would be off-limits for food?", "Should we put down towels first?"]
      }
    ]
  },

  "body-paint": {
    id: "kct-body-paint",
    kinkSlug: "body-paint",
    approaches: [
      {
        title: "The Artistic Expression",
        description: "Focus on creativity",
        starter: "I want to paint on your body with edible body paint—creating art on your skin that I then get to taste. It's creative and sensual. Would you be my canvas?",
        followUps: ["What designs would you want me to paint?", "Do you have a favorite flavor?", "Would you want to paint me too?"]
      },
      {
        title: "The Chocolate Canvas",
        description: "Use chocolate specifically",
        starter: "What if we used chocolate sauce to write dirty words on each other, then licked them off? Sweet and sexy combined.",
        followUps: ["What words would you want me to write?", "Where on your body would you want the writing?", "Should we take turns being the canvas?"]
      },
      {
        title: "The Full Body Art",
        description: "Cover more area",
        starter: "I want to cover your entire torso in edible paint and then slowly lick every inch clean. It would take time and focus. Does that extended attention appeal to you?",
        followUps: ["Would you have the patience for that?", "What flavors should we use?", "How would we handle the cleanup?"]
      }
    ]
  },

  "tickling": {
    id: "kct-tickling",
    kinkSlug: "tickling",
    approaches: [
      {
        title: "The Playful Tease",
        description: "Keep it light and fun",
        starter: "I want to find your ticklish spots and tease you mercilessly. The laughter and squirming could be really cute and bonding. Are you ticklish?",
        followUps: ["Where are you most ticklish?", "Do you like being tickled or does it annoy you?", "Should we have a safe word for when it gets too much?"]
      },
      {
        title: "The Sensual Discovery",
        description: "Find erogenous zones through tickling",
        starter: "What if I used tickling to discover new sensitive spots on your body? Some of the most responsive areas might surprise us. Want to be my test subject?",
        followUps: ["Are there places that are ticklish in a good way?", "Would you want me to use fingers, feathers, or something else?", "How would we transition from tickling to more sensual touch?"]
      },
      {
        title: "The Restrained Tickling",
        description: "Add light bondage element",
        starter: "I've fantasized about gently holding you down while I tickle you—you unable to escape, laughing and squirming. The power dynamic could be exciting. Interested?",
        followUps: ["Would being held down make it more or less enjoyable?", "What would be your signal to stop?", "Should we take turns being the tickler?"]
      }
    ]
  },

  "scratching": {
    id: "kct-scratching",
    kinkSlug: "scratching",
    approaches: [
      {
        title: "The Intensity Scale",
        description: "Explore different pressures",
        starter: "I want to scratch your back with varying intensity—from gentle trails to deeper scratches that leave marks. The sensation range could be incredible. Want to try?",
        followUps: ["Do you like the idea of marking?", "What pressure feels best to you?", "Where do you most want to be scratched?"]
      },
      {
        title: "The Passion Marks",
        description: "Leave temporary marks",
        starter: "I love the idea of leaving scratch marks on you during passion—evidence of our intensity that fades over a few days. Does being marked appeal to you?",
        followUps: ["Would you wear the marks with pride or hide them?", "What areas would be okay to mark?", "How deep is too deep for you?"]
      },
      {
        title: "The Sensory Contrast",
        description: "Combine with other sensations",
        starter: "What if we combined scratching with other sensations—soft touch, kissing, temperature? The contrast could heighten everything. Sound interesting?",
        followUps: ["What sensations would you want paired with scratching?", "Would you want to scratch me back?", "How would we communicate intensity preferences?"]
      }
    ]
  },

  "pinching": {
    id: "kct-pinching",
    kinkSlug: "pinching",
    approaches: [
      {
        title: "The Strategic Pinch",
        description: "Focus on sensitive areas",
        starter: "I want to explore pinching your most sensitive areas—nipples, inner thighs, earlobes. The sharp, brief sensation can be really intense. Curious?",
        followUps: ["Are you sensitive to pinching sensations?", "What areas would be off-limits?", "Would you want me to pinch and hold or pinch and release?"]
      },
      {
        title: "The Pain-Pleasure Mix",
        description: "Explore the edge",
        starter: "What if we played with that line between pain and pleasure through pinching? Just enough to make you gasp, then soothe it with kisses. Interested in exploring that edge?",
        followUps: ["Do you enjoy mixing pain with pleasure?", "What would be your signal if it went too far?", "Should we have a scale for intensity?"]
      },
      {
        title: "The Surprise Element",
        description: "Unexpected moments",
        starter: "I love the idea of surprising you with a pinch at unexpected moments—during a kiss, while cuddling, mixed in with gentle touch. The unpredictability could be exciting. Sound fun?",
        followUps: ["Would unexpected pinching startle you too much?", "What context would make it welcome versus annoying?", "Should I warn you or keep it spontaneous?"]
      }
    ]
  },

  "temperature": {
    id: "kct-temperature",
    kinkSlug: "temperature",
    approaches: [
      {
        title: "The Hot and Cold",
        description: "Contrast temperatures",
        starter: "I want to play with hot and cold on your skin—ice cubes followed by warm breath, heated oil followed by cool air. The contrast can be electrifying. Want to experiment?",
        followUps: ["Are you more sensitive to hot or cold?", "What temperature range feels good versus uncomfortable?", "Would you want to alternate or focus on one at a time?"]
      },
      {
        title: "The Sensation Journey",
        description: "Travel across the body",
        starter: "What if I traced different temperatures across your entire body—starting warm, then cool, then warm again—creating a sensory map of your responses?",
        followUps: ["What areas are most temperature-sensitive?", "Would you want to be blindfolded to enhance the sensation?", "What tools should we use—ice, warm oil, heated stones?"]
      },
      {
        title: "The Oral Temperature",
        description: "Use mouth temperature",
        starter: "I could alternate between sipping hot tea and cold water, then kissing and licking you with different temperatures. My mouth becoming a temperature play tool. Interested?",
        followUps: ["Does the idea of oral temperature play appeal to you?", "What areas would you want this focused on?", "How extreme should the temperature difference be?"]
      }
    ]
  },

  "anal-beads": {
    id: "kct-anal-beads",
    kinkSlug: "anal-beads",
    approaches: [
      {
        title: "The Gradual Insertion",
        description: "Take it slow",
        starter: "I've been curious about anal beads—the gradual insertion, the feeling of fullness, and then the intense sensation when they're removed at climax. Want to explore this together?",
        followUps: ["Have you tried beads before?", "What size would you want to start with?", "Would you want to insert them yourself or have me do it?"]
      },
      {
        title: "The Climax Removal",
        description: "Focus on the timing",
        starter: "The idea of removing the beads right at the moment of orgasm is supposed to create incredibly intense sensations. Does that timing appeal to you?",
        followUps: ["Would you trust me to time it right?", "How would you communicate when you're close?", "What if we practiced with the timing first?"]
      },
      {
        title: "The Sensation Exploration",
        description: "Focus on the feeling",
        starter: "What if we just focused on the sensation of the beads—inserting them slowly, wearing them during other play, experiencing each bead individually?",
        followUps: ["Does the idea of wearing them during other activities appeal to you?", "What material interests you—silicone, glass, something else?", "How would we make sure you're comfortable throughout?"]
      }
    ]
  },

  "anal-play-beginner": {
    id: "kct-anal-play-beginner",
    kinkSlug: "anal-play-beginner",
    approaches: [
      {
        title: "The Gentle Start",
        description: "Begin with external touch",
        starter: "I'd love to explore anal play with you, starting super slow—just external touch and massage with lots of lube. We can stop anytime. Would you be open to trying?",
        followUps: ["What would help you feel most relaxed?", "Are you curious about this or hesitant?", "Would you want to start with just a finger or even just touch?"]
      },
      {
        title: "The Trust Conversation",
        description: "Focus on trust and communication",
        starter: "Anal play requires a lot of trust and communication. I want to make sure you feel completely safe with me. Can we talk about what would make this a good experience for you?",
        followUps: ["What would be your signal to slow down or stop?", "How would you want me to check in with you?", "What concerns do you have that we should address?"]
      },
      {
        title: "The Preparation",
        description: "Discuss logistics",
        starter: "If we're going to try this, I want to make sure we're prepared—plenty of lube, taking our time, maybe starting with a small toy. Does that approach sound good to you?",
        followUps: ["Would you want to research and shop for supplies together?", "How much preparation time would you need?", "What would make you feel most confident?"]
      }
    ]
  },

  "nipple-play": {
    id: "kct-nipple-play",
    kinkSlug: "nipple-play",
    approaches: [
      {
        title: "The Sensitivity Exploration",
        description: "Discover what feels good",
        starter: "I want to spend time exploring your nipples—different pressures, techniques, sensations. They're such an erogenous zone. Would you like me to focus there?",
        followUps: ["Are your nipples sensitive?", "What kind of touch do you prefer there?", "Would you want me to use my fingers, mouth, or both?"]
      },
      {
        title: "The Intense Focus",
        description: "Make them the main event",
        starter: "What if I made your nipples the complete focus of our session? Licking, sucking, pinching, teasing—until you can't take anymore. Does that sound exciting?",
        followUps: ["How much intensity can your nipples handle?", "Would you want to be restrained while I focus on them?", "What would be your signal if it got too intense?"]
      },
      {
        title: "The Temperature and Texture",
        description: "Experiment with different sensations",
        starter: "I want to try different things on your nipples—ice, warm breath, soft fabric, rougher touch. See what drives you wild. Interested in that experimentation?",
        followUps: ["Are there textures you already know you like?", "Would you be open to trying clamps or other toys?", "How would you communicate what feels best?"]
      }
    ]
  },

  "biting": {
    id: "kct-biting",
    kinkSlug: "biting",
    approaches: [
      {
        title: "The Gentle Nibble",
        description: "Start soft and sensual",
        starter: "I want to use my teeth on you—gentle nibbles on your neck, shoulders, thighs. Not to hurt, but to create sharp, pleasurable sensations. Would you be open to that?",
        followUps: ["Are there areas where biting is off-limits?", "How hard is too hard for you?", "Would you want me to leave marks or avoid them?"]
      },
      {
        title: "The Passionate Bite",
        description: "Intense in the moment",
        starter: "In the heat of passion, I want to bite you—mark you as mine in that moment. The primal intensity can be incredibly hot. Does that appeal to you?",
        followUps: ["Would you bite me back?", "What areas would be okay for harder bites?", "Should we have a safe word for when biting gets too intense?"]
      },
      {
        title: "The Sensual Tease",
        description: "Build anticipation",
        starter: "What if I grazed my teeth along your skin without biting down—just the threat, the anticipation of what I might do? The tease could be electrifying.",
        followUps: ["Does anticipation turn you on?", "Would you want me to sometimes bite and sometimes just tease?", "What areas are most sensitive to this kind of play?"]
      }
    ]
  },

  "hair-pulling": {
    id: "kct-hair-pulling",
    kinkSlug: "hair-pulling",
    approaches: [
      {
        title: "The Controlled Pull",
        description: "Focus on technique",
        starter: "I want to try gently pulling your hair—grabbing close to the roots where it's less painful but still intense. The scalp is so sensitive. Would you trust me to try?",
        followUps: ["Have you ever enjoyed hair pulling before?", "How much pressure feels good versus too much?", "Would you want this during intimacy or as part of a power dynamic?"]
      },
      {
        title: "The Dominant Gesture",
        description: "Use it as control",
        starter: "What if I used your hair to guide you—gentle but firm control of your head position? It could be a powerful way to establish dominance. Interested?",
        followUps: ["Would you want me to be gentle or more forceful?", "What positions would work best for this?", "How would you signal if it became uncomfortable?"]
      },
      {
        title: "The Passion Response",
        description: "Heat of the moment",
        starter: "In the heat of passion, I want to grab your hair and pull you into a deep kiss. The intensity and control mixed with passion. Does that sound exciting?",
        followUps: ["Would passionate hair pulling turn you on?", "Should we establish limits beforehand?", "Would you want to pull my hair too?"]
      }
    ]
  },

  "collaring": {
    id: "kct-collaring",
    kinkSlug: "collaring",
    approaches: [
      {
        title: "The Symbolic Meaning",
        description: "Discuss what it represents",
        starter: "I've been thinking about collaring you—not just as a kink accessory, but as a symbol of our connection and commitment. Would you want to explore what that means to us?",
        followUps: ["What would wearing my collar mean to you?", "Would you want it to be private or something you wear out?", "Should we have a ceremony or make it special somehow?"]
      },
      {
        title: "The Aesthetic Appeal",
        description: "Focus on how it looks",
        starter: "I think you'd look incredibly sexy wearing a collar. The visual of you marked as mine is really appealing. Would you be open to trying one?",
        followUps: ["What style of collar appeals to you—leather, metal, delicate?", "Would you want it to be obvious or subtle?", "Should we shop for one together?"]
      },
      {
        title: "The Power Dynamic",
        description: "Explore the D/s aspect",
        starter: "Wearing a collar could represent a power exchange between us—when you wear it, you're submitting to me. Does that dynamic interest you?",
        followUps: ["Would you want the collar to mean submission 24/7 or just during scenes?", "What rules would come with wearing it?", "How would we handle it in public?"]
      }
    ]
  },

  "leash-play": {
    id: "kct-leash-play",
    kinkSlug: "leash-play",
    approaches: [
      {
        title: "The Gentle Guidance",
        description: "Lead with care",
        starter: "I want to attach a leash to your collar and gently guide you around. Not rough, just leading you where I want you. Would you enjoy that kind of guidance?",
        followUps: ["Would you want the leash to be short or give you some room?", "What would you want me to do while leading you?", "How would you feel about being 'walked' on a leash?"]
      },
      {
        title: "The Control Element",
        description: "Focus on the power exchange",
        starter: "Having you on a leash gives me complete control of your movement. I decide where you go, when you stop. That power dynamic excites me. Does it excite you too?",
        followUps: ["Would you want to be able to resist or follow willingly?", "What would you want me to do while I have you leashed?", "Should we combine this with other restraints?"]
      },
      {
        title: "The Pet Play Connection",
        description: "Connect to animal roles",
        starter: "What if we combined the leash with pet play—you as my pet on a leash, being walked and cared for? The roleplay could add another dimension. Interested?",
        followUps: ["Would you want to be a specific type of pet?", "What pet behaviors would you enjoy?", "How would we transition in and out of the role?"]
      }
    ]
  },

  "spanking-paddle": {
    id: "kct-spanking-paddle",
    kinkSlug: "spanking-paddle",
    approaches: [
      {
        title: "The New Sensation",
        description: "Introduce the paddle",
        starter: "I want to try using a paddle on you—the broad surface creates a different sensation than a hand. More thud, different sting. Curious to feel the difference?",
        followUps: ["Are you nervous about trying a paddle?", "What material interests you—leather, wood, silicone?", "Would you want to start very light?"]
      },
      {
        title: "The Intensity Build",
        description: "Gradually increase",
        starter: "With a paddle, we can build intensity more gradually than with a hand. I can give you warm-up taps and work up to harder strikes. Does that progression appeal to you?",
        followUps: ["How would you want to communicate intensity levels?", "Would you want me to focus on one area or spread it around?", "What aftercare would you need?"]
      },
      {
        title: "The Ritual",
        description: "Make it a formal scene",
        starter: "What if we made paddling a ritual—you in position, counting the strikes, thanking me after each one? The formality could make it more intense. Sound interesting?",
        followUps: ["Would counting help you process the sensation?", "What position would you want to be in?", "How many strikes do you think you could handle?"]
      }
    ]
  },

  "flogging": {
    id: "kct-flogging",
    kinkSlug: "flogging",
    approaches: [
      {
        title: "The Sensation Variety",
        description: "Explore different feelings",
        starter: "A flogger can create so many different sensations—from gentle thuds to sharp stings. I want to explore all of them on your back and shoulders. Want to experiment?",
        followUps: ["Are you more interested in thuddy or stingy sensations?", "What areas would be okay to flog?", "Would you want to start with just a few tails?"]
      },
      {
        title: "The Rhythmic Experience",
        description: "Focus on the flow",
        starter: "Flogging can be almost meditative—the rhythmic falls, the build-up of sensation. I want to take you on that journey. Does that sound appealing?",
        followUps: ["Would you want music playing?", "How long of a session sounds good to you?", "What would put you in the right headspace?"]
      },
      {
        title: "The Trust Exercise",
        description: "Build connection through intensity",
        starter: "Flogging requires a lot of trust—you're letting me strike you repeatedly with something that could hurt. I want to earn that trust. Would you give it to me?",
        followUps: ["What would I need to do to earn your trust for this?", "How would you communicate if it became too much?", "What aftercare would help you feel safe?"]
      }
    ]
  },

  "candle-wax": {
    id: "kct-candle-wax",
    kinkSlug: "candle-wax",
    approaches: [
      {
        title: "The Temperature Rush",
        description: "Focus on the heat sensation",
        starter: "I want to drip warm wax on your skin—the sudden heat, the brief sting, then the warmth as it cools. It's an intense but controlled sensation. Interested?",
        followUps: ["Are you sensitive to heat?", "What areas would you want wax on?", "Would you want me to peel it off after?"]
      },
      {
        title: "The Artistic Pattern",
        description: "Create visual designs",
        starter: "What if I used different colored waxes to create patterns on your body? It could be beautiful and sensual at the same time. Does that aesthetic appeal to you?",
        followUps: ["What colors would you want?", "Would you want to see the results in a mirror?", "Should we take photos of the art before removing it?"]
      },
      {
        title: "The Sensory Combination",
        description: "Mix with other sensations",
        starter: "Imagine the contrast—warm wax dripping on your skin, then me scraping it off, then my hands soothing the area. The variety of sensations could be incredible. Sound good?",
        followUps: ["Would you want other sensations mixed in?", "What order would feel best?", "How would you want me to check in with you?"]
      }
    ]
  },

  "prostate-play": {
    id: "kct-prostate-play",
    kinkSlug: "prostate-play",
    approaches: [
      {
        title: "The Pleasure Discovery",
        description: "Focus on the potential for intense pleasure",
        starter: "I've read that prostate stimulation can create incredibly intense orgasms. I'd love to explore that with you and see what we discover. Would you be open to trying?",
        followUps: ["Have you ever explored prostate stimulation before?", "What would help you feel most relaxed?", "Would you want to start with external massage or internal?"]
      },
      {
        title: "The Health and Pleasure Mix",
        description: "Frame it as beneficial",
        starter: "Prostate massage is actually good for health, but it can also be incredibly pleasurable. Want to explore it from both angles—health and pleasure?",
        followUps: ["Does knowing it's healthy make you more comfortable?", "Would you want to research techniques together?", "What concerns do you have that we should address?"]
      },
      {
        "title": "The Toy Introduction",
        description: "Use specialized toys",
        starter: "There are toys specifically designed for prostate stimulation that can make it easier and more pleasurable. Should we look into getting one to try together?",
        followUps: ["Would you be comfortable using a toy designed for this?", "What features would you want in a prostate toy?", "Should we shop for one together?"]
      }
    ]
  },

  "roleplay-capture": {
    id: "kct-roleplay-capture",
    kinkSlug: "roleplay-capture",
    approaches: [
      {
        title: "The Fantasy Scenario",
        description: "Create the backstory",
        starter: "I want to roleplay a capture scenario—you as my willing or unwilling captive, me as the captor. The power dynamic could be incredibly intense. Does that fantasy appeal to you?",
        followUps: ["Would you want to be willing or resistant?", "What would be the context of the capture?", "How would we establish boundaries for this intense roleplay?"]
      },
      {
        title: "The Interrogation Scene",
        description: "Add psychological elements",
        starter: "What if we made it an interrogation scene—I capture you and have to extract information? The psychological tension could be thrilling. Interested in that twist?",
        followUps: ["What 'information' would I be trying to get?", "Would you resist or break easily?", "How would we make sure it stays fun and not too intense?"]
      },
      {
        title: "The Rescue Option",
        description: "Include an escape narrative",
        starter: "We could build a whole narrative—you captured, me as the captor, but maybe you try to escape or seduce me to gain your freedom. Want to create that story together?",
        followUps: ["Would you want to actually try escaping, or just pretend?", "What would your character's motivation be?", "How would the scene end?"]
      }
    ]
  },

  "roleplay-superhero": {
    id: "kct-roleplay-superhero",
    kinkSlug: "roleplay-superhero",
    approaches: [
      {
        title: "The Classic Battle",
        description: "Hero vs villain",
        starter: "What if we played superhero and villain? You could be the hero trying to stop me, or the villain I've captured. The power dynamics would be so fun to explore. Which side appeals to you?",
        followUps: ["Would you want to be hero or villain?", "What powers would your character have?", "How would the 'battle' escalate to intimacy?"]
      },
      {
        title: "The Rescue Scenario",
        description: "Damsel or dude in distress",
        starter: "Imagine you're captured by a villain and I rescue you, but the adrenaline of the rescue leads to passionate intimacy. Does that hero-rescue fantasy sound exciting?",
        followUps: ["Would you want to be the rescuer or rescued?", "What would the rescue look like?", "How would we transition from action to intimacy?"]
      },
      {
        title: "The Secret Identity",
        description: "Dual life drama",
        starter: "What if we were secret identities who don't know each other's hero/villain sides? The dramatic irony of us being intimate while hiding our alter egos could be really hot. Interested?",
        followUps: ["Would we know each other's identities or keep them secret?", "What would happen if one discovered the other?", "How would the secret affect our intimacy?"]
      }
    ]
  },

  "lingerie": {
    id: "kct-lingerie",
    kinkSlug: "lingerie",
    approaches: [
      {
        title: "The Fashion Show",
        description: "Make it a performance",
        starter: "I want you to model different lingerie pieces for me—make it a private fashion show where you're the star. I'll be your enthusiastic audience. Would you enjoy that attention?",
        followUps: ["What styles of lingerie do you feel sexiest in?", "Would you want music playing?", "How many outfits should we have ready?"]
      },
      {
        title: "The Gift Exchange",
        description: "Shop for each other",
        starter: "What if we bought lingerie for each other? I'd pick something I want to see you in, you pick something for me. The anticipation of the reveal would be exciting. Sound fun?",
        followUps: ["Would you want hints about what I like, or pure surprise?", "What's your budget for this?", "Should we set any style boundaries?"]
      },
      {
        title: "The Extended Wear",
        description: "Wear it under clothes",
        starter: "I love the idea of you wearing sexy lingerie under your regular clothes—only we know what's underneath. The secret between us all day. Does that sound exciting?",
        followUps: ["Would you wear it to work or just on dates?", "What would make you feel confident wearing it out?", "Should I give you a knowing look when we're out?"]
      }
    ]
  },

  "cross-dressing": {
    id: "kct-cross-dressing",
    kinkSlug: "cross-dressing",
    approaches: [
      {
        title: "The Exploration",
        description: "Try different clothing",
        starter: "I've been curious about trying on some of your clothes—or you trying on mine. Exploring different gender expressions could be really liberating. Would you be open to that?",
        followUps: ["Is there something specific you'd want to try wearing?", "How would you want me to react when you're dressed?", "Would you want to go out or keep it private?"]
      },
      {
        title: "The Transformation",
        description: "Full look change",
        starter: "What if we went all out—clothes, makeup, the whole transformation? Really embody a different gender expression for an evening. Does that complete transformation appeal to you?",
        followUps: ["Would you want me to help with makeup and styling?", "How long would you want to stay in character?", "What name would you use?"]
      },
      {
        title: "The Intimacy Angle",
        description: "Focus on attraction",
        starter: "I find the idea of you in different gender expressions really attractive. It shows different sides of you. Would you dress up for me to see that side of you?",
        followUps: ["Does knowing I find it attractive make you more comfortable?", "What would you want to wear specifically for me?", "How would you want me to show my appreciation?"]
      }
    ]
  },

  "feminization": {
    id: "kct-feminization",
    kinkSlug: "feminization",
    approaches: [
      {
        title: "The Gentle Introduction",
        description: "Start with small elements",
        starter: "I want to explore feminizing you—maybe starting with just panties or nail polish. Small steps into a more feminine presentation. Would you be curious to try?",
        followUps: ["What feminine elements interest you most?", "Are there things that feel too extreme to start with?", "Would you want this to be private or public?"]
      },
      {
        title: "The Full Experience",
        description: "Complete transformation",
        starter: "What if we went further—full makeup, dress, heels, the complete feminine transformation? I think you'd look beautiful. Does that appeal to you at all?",
        followUps: ["Would you want to pass as female or just enjoy the aesthetic?", "How would you want me to treat you during?", "What would make you feel most feminine?"]
      },
      {
        title: "The Power Dynamic",
        description: "Focus on D/s aspect",
        starter: "The idea of feminizing you as part of a power exchange excites me—dressing you up, making you present as I want. Would you submit to that kind of transformation?",
        followUps: ["Would this be part of a submissive role for you?", "What would I call you during this?", "How would we handle aftercare?"]
      }
    ]
  },

  "gender-play": {
    id: "kct-gender-play",
    kinkSlug: "gender-play",
    approaches: [
      {
        title: "The Fluid Exploration",
        description: "Play with gender expression",
        starter: "I want to explore different gender expressions with you—not necessarily male or female, but playing with the spectrum. Different clothes, mannerisms, roles. Interested in that exploration?",
        followUps: ["What gender expressions interest you?", "Would you want to switch between them?", "How would you want me to interact with each expression?"]
      },
      {
        title: "The Role Reversal",
        description: "Swap traditional roles",
        starter: "What if we completely reversed our usual gender roles in the bedroom? If I'm usually more dominant, I submit; if you're usually receptive, you take charge. Want to flip the script?",
        followUps: ["Would you want to be the penetrator or just take charge?", "How would you feel about me being more submissive?", "What would feel most different and exciting?"]
      },
      {
        title: "The Androgynous Middle",
        description: "Explore non-binary expression",
        starter: "What if we both explored androgynous expressions together—neither masculine nor feminine, just us as humans? The neutrality could be really freeing. Sound interesting?",
        followUps: ["What would androgyny look like for you?", "Would you want to use different pronouns?", "How would this change our dynamic?"]
      }
    ]
  },

  "voyeurism": {
    id: "kct-voyeurism",
    kinkSlug: "voyeurism",
    approaches: [
      {
        title: "The Watching Game",
        description: "One watches, one performs",
        starter: "I want to watch you pleasure yourself—see exactly how you touch yourself when you're alone. It would be incredibly hot to be your audience. Would you put on that show for me?",
        followUps: ["Would you want me to stay silent or give encouragement?", "What position would you want to be in?", "Would you want me to touch myself while watching?"]
      },
      {
        title: "The Hidden Observer",
        description: "Watch without being seen",
        starter: "What if you pretended I wasn't there and just went about your business—changing, showering, touching yourself—while I secretly watched? The voyeuristic thrill would be intense. Interested?",
        followUps: ["Would you really pretend not to know I was there?", "What would you do if you 'caught' me?", "How long should I watch before revealing myself?"]
      },
      {
        title: "The Mutual Watching",
        description: "Both watch each other",
        starter: "What if we both watched each other from across the room—no touching, just looking, seeing each other pleasure ourselves? The visual connection could be electric. Sound exciting?",
        followUps: ["How close would you want to be?", "Would you want to finish at the same time?", "What would make this more exciting than touching each other?"]
      }
    ]
  },

  "exhibitionism": {
    id: "kct-exhibitionism",
    kinkSlug: "exhibitionism",
    approaches: [
      {
        title: "The Private Audience",
        description: "Perform just for partner",
        starter: "I want you to perform for me—dance, strip, touch yourself—while I watch and appreciate every moment. Being my personal exhibitionist. Would you enjoy being the center of my attention?",
        followUps: ["What would you want to perform?", "Would you want me to react verbally or just watch?", "What would make you feel most confident performing?"]
      },
      {
        title: "The Risky Window",
        description: "Possible exposure",
        starter: "What if we played near a window—close the curtains most of the way but leave a gap? The possibility of being seen, even if unlikely, could be thrilling. Does that risk excite you?",
        followUps: ["How much risk would be exciting versus scary?", "What floor should we be on?", "What would you be comfortable doing near the window?"]
      },
      {
        title: "The Semi-Public Space",
        description: "Push boundaries safely",
        starter: "I want to find semi-public places where we might be seen—parking garages, stairwells, secluded park areas. The thrill of possible discovery. Are you brave enough for that?",
        followUps: ["What locations would feel exciting but safe enough?", "How would we handle it if someone saw us?", "What would be your limit for public exposure?"]
      }
    ]
  },

  // XXX TIER KINKS
  "water-sports": {
    id: "kct-water-sports",
    kinkSlug: "water-sports",
    approaches: [
      {
        title: "The Shower Introduction",
        description: "Start in the shower",
        starter: "I've been curious about water sports—exploring pee play in the shower where it's easy to clean up. It's taboo but can be really intimate. Would you be open to discussing it?",
        followUps: ["What aspects interest you or concern you?", "Would you want to receive or give, or both?", "How would we ensure it feels safe and consensual?"]
      },
      {
        title: "The Marking Territory",
        description: "Focus on possession",
        starter: "There's something primal about marking each other—claiming territory in the most basic way. Would you want to explore that possessive, animalistic aspect with me?",
        followUps: ["Does the possessive aspect appeal to you?", "Where on the body would you be comfortable?", "How would we handle cleanup and hygiene?"]
      },
      {
        title: "The Temperature Play",
        description: "Focus on sensation",
        starter: "The warmth and the taboo nature create unique sensations. I want to explore that with you—focus purely on how it feels. Would you be curious about the sensation?",
        followUps: ["Are you sensitive to temperature sensations?", "Would you want it as part of other play or standalone?", "What would make you feel most comfortable trying this?"]
      }
    ]
  },

  "age-play": {
    id: "kct-age-play",
    kinkSlug: "age-play",
    approaches: [
      {
        title: "The Caregiver Dynamic",
        description: "Nurture and care",
        starter: "I want to explore a caregiver role with you—taking care of you, nurturing you, maybe even treating you as younger. It's about trust and care. Would that dynamic appeal to you?",
        followUps: ["What age range would feel comfortable for you?", "Would you want activities like coloring or being read to?", "How would we transition back to adult roles?"]
      },
      {
        title: "The Innocence and Corruption",
        description: "Play with naivety",
        starter: "What if we played with innocence—you as naive and inexperienced, me as the one teaching you? The power dynamic of guiding and learning. Does that interest you?",
        followUps: ["Would you want to be completely innocent or somewhat knowing?", "What would you want to 'learn'?", "How would we ensure it stays consensual and safe?"]
      },
      {
        title: "The Regression",
        description: "True mental escape",
        starter: "I want to create a space where you can truly let go—be free of adult responsibilities and just exist in a simpler headspace. Would you want that kind of escape with me?",
        followUps: ["What adult stresses would you want to leave behind?", "What comforts would help you regress?", "How would I know when you need to come back to adult headspace?"]
      }
    ]
  },

  "pet-play": {
    id: "kct-pet-play",
    kinkSlug: "pet-play",
    approaches: [
      {
        title: "The Animal Choice",
        description: "Pick your pet persona",
        starter: "I want to explore pet play with you—you taking on an animal persona, me as your owner. Puppy, kitten, pony—which appeals to you most?",
        followUps: ["What animal do you most identify with?", "Would you want to be trained or just be?", "What pet behaviors would you enjoy?"]
      },
      {
        title: "The Training Dynamic",
        description: "Teach and reward",
        starter: "What if I trained you as my pet—teaching commands, rewarding good behavior, correcting mistakes? The structure could be really satisfying. Interested in that dynamic?",
        followUps: ["What would you want to learn?", "How would you want to be rewarded?", "What would appropriate corrections look like?"]
      },
      {
        title: "The Complete Transformation",
        description: "Full immersion",
        starter: "I want to go all in—ears, tail, collar, walking on all fours, eating from a bowl. Full immersion as my pet. Does that complete transformation excite you?",
        followUps: ["What gear would you want?", "How long would you want to stay in pet space?", "What would your pet name be?"]
      }
    ]
  },

  "medical-play": {
    id: "kct-medical-play",
    kinkSlug: "medical-play",
    approaches: [
      {
        title: "The Detailed Examination",
        description: "Thorough and invasive",
        starter: "I want to do a detailed medical exam on you—the kind that's thorough and invasive, where I check every part of you. The clinical detachment mixed with intimacy. Interested?",
        followUps: ["What procedures would you want included?", "Would you want it to feel realistic or more sexual?", "How would we handle any actual medical concerns?"]
      },
      {
        title: "The Procedure Roleplay",
        description: "Specific medical scenarios",
        starter: "What if we enacted specific medical procedures—injections, catheterization, enemas? The vulnerability and trust required would be intense. Are you curious about any specific procedures?",
        followUps: ["What procedures are hard limits?", "Would you want to research real procedures for accuracy?", "How would we ensure physical safety?"]
      },
      {
        title: "The Asylum Scenario",
        description: "Mental institution setting",
        starter: "Imagine an asylum scenario—I'm the doctor, you're the patient, and I have complete control over your treatment. The power imbalance would be extreme. Does that dark fantasy appeal to you?",
        followUps: ["What would your 'condition' be?", "Would you be a willing or unwilling patient?", "How would we ensure this stays consensual and safe?"]
      }
    ]
  },

  "electro-play": {
    id: "kct-electro-play",
    kinkSlug: "electro-play",
    approaches: [
      {
        title: "The Sensation Introduction",
        description: "Start with mild stimulation",
        starter: "I've been curious about electro-play—the tingling, buzzing sensations from electrical stimulation. We could start very mild and see how it feels. Would you be open to exploring?",
        followUps: ["Are you nervous about electricity near your body?", "What areas would you want to try first?", "Would you want to control the intensity yourself initially?"]
      },
      {
        title: "The E-Stim Toys",
        description: "Use specialized devices",
        starter: "There are toys specifically designed for safe electro-stimulation—violet wands, TENS units, e-stim boxes. Should we research and try one together?",
        followUps: ["What type of device interests you most?", "Would you want external or internal stimulation?", "How would we learn to use it safely?"]
      },
      {
        title: "The Pain-Pleasure Mix",
        description: "Explore intensity",
        starter: "Electro-play can range from pleasant tingling to intense pain. I want to explore that range with you, finding where your edges are. Interested in that exploration?",
        followUps: ["Do you enjoy mixing pain with pleasure?", "What would be your signal to stop or reduce intensity?", "Should we have a safe word specifically for this?"]
      }
    ]
  },

  "knife-play": {
    id: "kct-knife-play",
    kinkSlug: "knife-play",
    approaches: [
      {
        title: "The Psychological Thrill",
        description: "Focus on the mind",
        starter: "I want to explore knife play with you—not to cut, but for the psychological intensity. The cold blade, the danger, the trust required. Does that mental edge appeal to you?",
        followUps: ["Does the idea of a blade near you excite or scare you?", "Would you want to be blindfolded?", "How would we ensure absolute safety?"]
      },
      {
        title: "The Sensation Play",
        description: "Use the blade for sensation",
        starter: "What if we used a knife just for sensation—the flat of the blade, the point tracing without breaking skin? The intensity without actual cutting. Interested?",
        followUps: ["Would you trust me with a blade against your skin?", "What areas would be okay for this?", "Should we have a dull blade for practice first?"]
      },
      {
        title: "The Fear Factor",
        description: "Embrace the adrenaline",
        starter: "The fear and adrenaline from knife play can be incredibly intense. I want to take you on that edge—safely, but intensely. Are you brave enough for that experience?",
        followUps: ["How do you handle fear and adrenaline?", "What aftercare would you need after something this intense?", "Would you want to try cutting or keep it sensation-only?"]
      }
    ]
  },

  "fire-play": {
    id: "kct-fire-play",
    kinkSlug: "fire-play",
    approaches: [
      {
        title: "The Brief Heat",
        description: "Quick flame exposure",
        starter: "Fire play involves brief, controlled exposure to flame—just a quick flash of heat on the skin. It's intense but over quickly. Would you be curious to try?",
        followUps: ["Are you comfortable around fire?", "What areas would you want to try this on?", "How would we prepare safety equipment?"]
      },
      {
        title: "The Alcohol Technique",
        description: "Use alcohol for controlled burns",
        starter: "One technique uses alcohol on the skin, briefly ignited and extinguished. The heat is intense but fleeting. Does that controlled danger interest you?",
        followUps: ["Would you want to be the one ignited or watch first?", "How would we practice the safety protocols?", "What would make you feel secure during this?"]
      },
      {
        title: "The Ritual Aspect",
        description: "Make it ceremonial",
        starter: "Fire has been used in rituals for centuries. What if we created our own ritual around fire—marking transitions, claiming each other? Does that spiritual aspect appeal to you?",
        followUps: ["Would you want this to be symbolic or purely physical?", "What would the ritual signify for us?", "How would we make it meaningful?"]
      }
    ]
  },

  "wax-play": {
    id: "kct-wax-play",
    kinkSlug: "wax-play",
    approaches: [
      {
        title: "The Temperature Intensity",
        description: "Focus on the heat",
        starter: "I want to drip hot wax on your skin—the sudden heat, the brief sting, then the warmth as it cools. It's a controlled burn that can be incredibly sensual. Interested?",
        followUps: ["What temperature range feels exciting?", "What areas would you want wax on?", "Would you want me to peel it off after?"]
      },
      {
        title: "The Artistic Canvas",
        description: "Create visual patterns",
        starter: "What if we used different colored waxes to create art on your body? Layering colors, creating patterns. The visual combined with the sensation. Does that appeal to you?",
        followUps: ["What colors would you want?", "Would you want to see the results?", "Should we photograph the art before removing it?"]
      },
      {
        title: "The Sensation Layering",
        description: "Build up the wax",
        starter: "Imagine layer after layer of wax building up on your skin—each new drip a new sensation on top of the previous warmth. The accumulation could be overwhelming. Want to try?",
        followUps: ["How many layers do you think you could handle?", "Where would you want the most buildup?", "How would you want me to remove it?"]
      }
    ]
  },

  "figging": {
    id: "kct-figging",
    kinkSlug: "figging",
    approaches: [
      {
        title: "The Ginger Introduction",
        description: "Explain the sensation",
        starter: "Figging uses ginger root inserted anally or vaginally—it creates a burning, warming sensation that's intense but not damaging. Would you be curious about that unique feeling?",
        followUps: ["Are you familiar with the sensation of ginger?", "Would you want to try it externally first?", "How long do you think you could endure the burn?"]
      },
      {
        title: "The Discipline Connection",
        description: "Use in punishment scenes",
        starter: "Figging is traditionally used during spanking—the clenching from the burn intensifies every strike. Would you want to combine it with impact play?",
        followUps: ["Would this be part of a punishment scenario?", "How would you signal if it became too intense?", "What aftercare would you need?"]
      },
      {
        title: "The Sensation Focus",
        description: "Experience the burn",
        starter: "I want you to experience the unique, building burn of fresh ginger. It intensifies over time and there's no way to stop it except removal. Does that helplessness appeal to you?",
        followUps: ["Does the idea of enduring an unstoppable sensation excite you?", "Would you want to be restrained while figged?", "What would help you endure the intensity?"]
      }
    ]
  },

  "sounding": {
    id: "kct-sounding",
    kinkSlug: "sounding",
    approaches: [
      {
        title: "The Urethral Exploration",
        description: "Introduce the concept",
        starter: "Sounding involves inserting smooth rods into the urethra—it can create intense internal sensations and prostate stimulation. Would you be open to discussing this intimate exploration?",
        followUps: ["What concerns do you have about this?", "Would you want to start with very small sounds?", "How would we ensure sterile technique?"]
      },
      {
        title: "The Sensation Seeking",
        description: "Focus on unique feelings",
        starter: "The sensation of something sliding into the urethra is unlike anything else—intense, invasive, deeply personal. I want to take you on that journey. Interested?",
        followUps: ["Are you drawn to intense, unique sensations?", "Would you want to do this to yourself first?", "How would you communicate during this delicate play?"]
      },
      {
        title: "The Medical Fantasy",
        description: "Combine with medical play",
        starter: "What if we combined sounding with a medical scene—me as the doctor performing a procedure on you? The clinical context could add another layer. Does that appeal to you?",
        followUps: ["Would the medical context make it easier or harder?", "What kind of 'procedure' would we roleplay?", "How would we handle the vulnerability?"]
      }
    ]
  },

  "needle-play": {
    id: "kct-needle-play",
    kinkSlug: "needle-play",
    approaches: [
      {
        title: "The Endorphin Rush",
        description: "Focus on the body's response",
        starter: "Needle play triggers massive endorphin release—the body's natural response to the piercing. It can create a euphoric, floaty state. Would you want to experience that high?",
        followUps: ["Are you comfortable with needles in general?", "What areas would you consider for needle play?", "Have you ever experienced an endorphin high?"]
      },
      {
        title: "The Artistic Piercing",
        description: "Create temporary art",
        starter: "Needles can be arranged in beautiful patterns, creating temporary body art. The visual combined with the sensation. Would you want to be my canvas for a needle scene?",
        followUps: ["What patterns would you find beautiful?", "How many needles would you want to try?", "Would you want to see the results in a mirror?"]
      },
      {
        title: "The Ritual Intensity",
        description: "Make it ceremonial",
        starter: "Needle play can be deeply ritualistic—the preparation, the piercing, the aftercare. I want to take you through that complete journey. Are you ready for that intensity?",
        followUps: ["Would you want this to be a special occasion?", "What would help you prepare mentally?", "What aftercare would you need?"]
      }
    ]
  },

  "blood-play": {
    id: "kct-blood-play",
    kinkSlug: "blood-play",
    approaches: [
      {
        title: "The Primal Connection",
        description: "Focus on the ancient symbolism",
        starter: "Blood has been sacred in human culture forever—life force, sacrifice, deep connection. Sharing blood play could be incredibly bonding. Would you want to explore that primal connection?",
        followUps: ["What does blood symbolize to you?", "Would you want to give blood, receive it, or both?", "How would we ensure medical safety?"]
      },
      {
        title: "The Small Cut",
        description: "Start minimal",
        starter: "We could start very small—just a tiny scratch with a sterile blade, enough to see red but nothing serious. A taste of the intensity. Would that be a good starting point?",
        followUps: ["Would a small scratch feel manageable?", "What areas would be safe for this?", "How would we handle aftercare for the wound?"]
      },
      {
        title: "The Vampire Fantasy",
        description: "Play with feeding",
        starter: "What if we played with vampire dynamics—me feeding from you, marking you as my victim? The dark romance of it could be thrilling. Does that fantasy appeal to you?",
        followUps: ["Would you want to be the vampire or the victim?", "How would we make it feel authentic?", "What would the 'feeding' look like?"]
      }
    ]
  },

  "scat-play": {
    id: "kct-scat-play",
    kinkSlug: "scat-play",
    approaches: [
      {
        title: "The Taboo Exploration",
        description: "Discuss the ultimate taboo",
        starter: "Scat play is one of the most taboo kinks—the ultimate in intimacy and acceptance. I want to discuss whether this is something either of us wants to explore. Can we talk openly about it?",
        followUps: ["What aspects interest you or repulse you?", "Is this a hard limit or something you're curious about?", "How would we handle hygiene and health concerns?"]
      },
      {
        title: "The Humiliation Angle",
        description: "Focus on degradation",
        starter: "For some, scat play is about ultimate humiliation and degradation. If that's the appeal, would you want to explore those feelings in other, less extreme ways first?",
        followUps: ["Is humiliation the core appeal for you?", "What level of degradation feels exciting?", "How would we process those intense emotions after?"]
      },
      {
        title: "The Trust Test",
        description: "Ultimate acceptance",
        starter: "Sharing this would require absolute trust and acceptance of each other's bodies in their most basic form. Are we at that level of intimacy? Is this something we want to work toward?",
        followUps: ["Do you feel we're ready for this level of intimacy?", "What would need to happen first?", "If this is a hard limit, how do you feel about that?"]
      }
    ]
  },

  "extreme-humiliation": {
    id: "kct-extreme-humiliation",
    kinkSlug: "extreme-humiliation",
    approaches: [
      {
        title: "The Degradation Spectrum",
        description: "Find the edge",
        starter: "I want to explore deep humiliation with you—finding where your edges are, what truly makes you feel small and owned. It requires enormous trust. Are you willing to go that deep?",
        followUps: ["What words or actions would truly humiliate you?", "How would we ensure you feel safe even while degraded?", "What aftercare would you need?"]
      },
      {
        title: "The Public Element",
        description: "Humiliation with witnesses",
        starter: "What if the humiliation involved others—being displayed, used, or shamed in front of someone else? The exposure multiplies the intensity. Would you ever want that?",
        followUps: ["Would you want a trusted third party or strangers?", "What would be your absolute limits for public degradation?", "How would we handle potential emotional fallout?"]
      },
      {
        title: "The Objectification",
        description: "Reduce to an object",
        starter: "I want to reduce you to an object—furniture, a toy, something I use without regard for your humanity. Complete objectification. Does that total loss of personhood appeal to you?",
        followUps: ["Would you want to be a specific type of object?", "How long could you maintain that headspace?", "What would bring you back to yourself?"]
      }
    ]
  },

  "public-exposure": {
    id: "kct-public-exposure",
    kinkSlug: "public-exposure",
    approaches: [
      {
        title: "The Calculated Risk",
        description: "Manage the danger",
        starter: "I want to expose you in public—calculated risks where we might be seen but probably won't. The thrill of potential discovery. Are you brave enough for that?",
        followUps: ["What level of risk feels exciting versus terrifying?", "What would you be comfortable exposing?", "How would we handle it if someone saw?"]
      },
      {
        title: "The Remote Locations",
        description: "Find secluded public spots",
        starter: "What if we found remote hiking trails, abandoned buildings, or late-night parking lots? Public but unlikely to be caught. Does that balance feel right?",
        followUps: ["What locations would you consider?", "What time of day feels safest?", "What would be your escape plan?"]
      },
      {
        title: "The Online Exposure",
        description: "Digital exhibitionism",
        starter: "What about exposing you online—photos, video streams, showing you off to strangers digitally? The exposure without physical risk. Would that appeal to you?",
        followUps: ["Would you want your face shown or hidden?", "What platforms would you consider?", "How would we protect your identity?"]
      }
    ]
  },

  "intense-cbt": {
    id: "kct-intense-cbt",
    kinkSlug: "intense-cbt",
    approaches: [
      {
        title: "The Pain Endurance",
        description: "Test limits",
        starter: "I want to push your genital pain limits—impact, pressure, constriction. Finding where your edge is and holding you there. Do you have the endurance for that intensity?",
        followUps: ["What types of genital pain have you experienced?", "What would be your hard limits?", "How would you communicate during this intense play?"]
      },
      {
        title: "The Torture Devices",
        description: "Use specialized equipment",
        starter: "There are devices designed specifically for genital torture—ball crushers, parachutes, weights. Should we explore what these tools can do?",
        followUps: ["What devices intrigue you?", "What scares you?", "How would we ensure no permanent damage?"]
      },
      {
        title: "The Orgasm Denial Mix",
        description: "Combine pain with pleasure control",
        starter: "What if we combined intense CBT with orgasm control—pain when you're close, stopping just before release? The frustration would be maddening. Interested?",
        followUps: ["Would the pain enhance or ruin your pleasure?", "How many cycles could you endure?", "What would your reward be for enduring?"]
      }
    ]
  },

  "mummification": {
    id: "kct-mummification",
    kinkSlug: "mummification",
    approaches: [
      {
        title: "The Complete Immobilization",
        description: "Total restraint",
        starter: "I want to mummify you—wrap you completely in cling film, bandages, or tape until you can't move at all. Total immobilization and helplessness. Does that appeal to you?",
        followUps: ["Does total immobility excite or scare you?", "What material would you want to be wrapped in?", "How would we ensure you can breathe safely?"]
      },
      {
        title: "The Sensory Deprivation",
        description: "Add hoods and earplugs",
        starter: "What if we added sensory deprivation—hood, earplugs, completely cutting you off from the world while you're wrapped? Just you and your thoughts. Interested in that isolation?",
        followUps: ["Would you want to be able to see or hear anything?", "How long could you endure sensory deprivation?", "What would help you stay calm?"]
      },
      {
        title: "The Transformation",
        description: "Become an object",
        starter: "Once you're fully mummified, you become an object—something I can move, position, use as I see fit. Complete transformation from person to thing. Does that objectification appeal to you?",
        followUps: ["Would you want to be displayed or hidden away?", "How would you feel about being moved while unable to resist?", "What would the unwrapping ritual look like?"]
      }
    ]
  },

  "extreme-suspension": {
    id: "kct-extreme-suspension",
    kinkSlug: "extreme-suspension",
    approaches: [
      {
        title: "The Full Suspension",
        description: "Hang completely off the ground",
        starter: "I want to suspend you completely—hang you from ropes so no part of you touches the ground. Total surrender to gravity and my control. Are you ready for that experience?",
        followUps: ["Does being completely off the ground excite or terrify you?", "What positions would you want to try?", "How would we handle circulation and nerve safety?"]
      },
      {
        title: "The Dynamic Suspension",
        description: "Move while suspended",
        starter: "What if I moved you while you're suspended—spun you, swung you, changed your position? The complete loss of control over your own body. Does that dynamic element appeal to you?",
        followUps: ["Would you want gentle movement or intense spinning?", "How would you communicate discomfort?", "What would be your safe signal?"]
      },
      {
        title: "The Extended Hang",
        description: "Stay suspended for time",
        starter: "Imagine being suspended for an extended period—minutes or longer—while I do whatever I want to your exposed, helpless body. The endurance challenge. Could you handle that?",
        followUps: ["How long do you think you could endure?", "What would you want me to do while you're suspended?", "How would we monitor your physical condition?"]
      }
    ]
  },

  "branding": {
    id: "kct-branding",
    kinkSlug: "branding",
    approaches: [
      {
        title: "The Permanent Mark",
        description: "Discuss the commitment",
        starter: "Branding would leave a permanent mark—my symbol on your body forever. It's the ultimate claim. Are you ready for that level of permanent commitment to me?",
        followUps: ["What would you want branded on you?", "Where on your body would you want it?", "Have you thought about how you'd explain it to others?"]
      },
      {
        title: "The Temporary Test",
        description: "Try temporary first",
        starter: "Before we consider permanent branding, what if we tried temporary methods—henna, temporary tattoos, play piercing patterns? See how it feels to wear my mark. Sound reasonable?",
        followUps: ["Would you want to test a temporary mark first?", "How long would you want to wear it?", "What would help you decide about going permanent?"]
      },
      {
        title: "The Ceremony",
        description: "Make it meaningful",
        starter: "If we do this, I want it to be ceremonial—meaningful, intentional, something we both remember forever. A ritual of ownership. How would you want that ceremony to look?",
        followUps: ["Would you want it private or witnessed?", "What would make it meaningful to you?", "How would we celebrate afterward?"]
      }
    ]
  },

  "scarification": {
    id: "kct-scarification",
    kinkSlug: "scarification",
    approaches: [
      {
        title: "The Art of Scars",
        description: "Create permanent body art",
        starter: "Scarification creates permanent designs through controlled cutting. The healed scars become body art. Would you want to wear my art on your body forever?",
        followUps: ["What designs would you want scarred into you?", "Where would you want these scars?", "Are you prepared for the healing process?"]
      },
      {
        title: "The Cutting Ritual",
        description: "Make it ceremonial",
        starter: "The cutting itself can be ritualistic—intentional, meaningful, a shared experience of pain and creation. I want to cut you carefully, artistically. Does that appeal to you?",
        followUps: ["Would you want it to be a long, drawn-out process or quick?", "How would you handle the pain?", "What atmosphere would you want?"]
      },
      {
        title: "The Healing Journey",
        description: "Focus on aftercare",
        starter: "Scarification requires weeks of careful aftercare—I'll need to tend to your wounds, watch them heal, see my art form. Are you ready for that extended journey together?",
        followUps: ["Would you be committed to the aftercare process?", "How would you feel about me caring for your wounds?", "What would the healed scars mean to you?"]
      }
    ]
  },

  "intense-bondage": {
    id: "kct-intense-bondage",
    kinkSlug: "intense-bondage",
    approaches: [
      {
        title: "The Inescapable Restraint",
        description: "No chance of escape",
        starter: "I want to bind you so completely that escape is impossible—multiple layers, different materials, total immobilization. True helplessness. Does that appeal to you?",
        followUps: ["Does total helplessness excite or scare you?", "What materials would you want used?", "How would we ensure your safety?"]
      },
      {
        title: "The Extended Duration",
        description: "Stay bound for hours",
        starter: "What if we kept you bound for hours—through position changes, bathroom breaks, meals? Extended submission to my control. Could you endure that long?",
        followUps: ["How long do you think you could stay bound?", "What would your limits be?", "How would we handle basic needs?"]
      },
      {
        title: "The Stress Positions",
        description: "Uncomfortable by design",
        starter: "I want to put you in positions that are difficult to maintain—stress positions that challenge your endurance. The discomfort becomes part of the experience. Interested?",
        followUps: ["What positions would challenge you most?", "How would you communicate when you need adjustment?", "What would be your reward for enduring?"]
      }
    ]
  },

  "impact-play": {
    id: "kct-impact-play",
    kinkSlug: "impact-play",
    approaches: [
      {
        title: "The Intensity Build",
        description: "Gradually increase force",
        starter: "I want to start light and build to intense impact—hands, paddles, floggers, canes. Taking you on a journey of increasing pain and endorphins. Ready for that escalation?",
        followUps: ["What implements interest you most?", "What areas would be okay for heavy impact?", "How would you rate pain levels?"]
      },
      {
        title: "The Endorphin Chase",
        description: "Reach subspace",
        starter: "Heavy impact play can trigger massive endorphin release—taking you to subspace where pain becomes pleasure. I want to take you there. Will you let me?",
        followUps: ["Have you experienced subspace before?", "What helps you get there?", "What aftercare do you need coming back?"]
      },
      {
        title: "The Marks and Bruises",
        description: "Wear the evidence",
        starter: "I want to mark you—bruises, welts, evidence of our play that lasts for days. Wearing my impact on your skin. Does being marked appeal to you?",
        followUps: ["Would you wear bruises with pride or hide them?", "How long would you want marks to last?", "What areas would be okay to mark?"]
      }
    ]
  },

  "cnc-play": {
    id: "kct-cnc-play",
    kinkSlug: "cnc-play",
    approaches: [
      {
        title: "The Consensual Non-Consent",
        description: "Discuss the paradox",
        starter: "Consensual non-consent means agreeing to pretend it's not consensual—roleplaying force, resistance, taking. It requires enormous trust. Are we ready for that level of trust?",
        followUps: ["What CNC scenarios appeal to you?", "What would be your hard limits?", "How would we ensure you feel safe even while 'fighting'?"]
      },
      {
        title: "The Resistance",
        description: "Fight back",
        starter: "I want you to fight me—really struggle, resist, make me work for it. The energy of that resistance can be incredibly hot. Are you willing to fight me?",
        followUps: ["How much resistance would feel real?", "Would you want me to overpower you or negotiate?", "What would be your safe word?"]
      },
      {
        title: "The Aftermath",
        description: "Process the intensity",
        starter: "CNC can be emotionally intense afterward. I want to make sure we have extensive aftercare—processing, reconnecting, ensuring you feel safe and loved. Are you prepared for that need?",
        followUps: ["What aftercare would you need after CNC?", "How would you want me to help you process?", "What would reassure you most?"]
      }
    ]
  },

  "chastity-play": {
    id: "kct-chastity-play",
    kinkSlug: "chastity-play",
    approaches: [
      {
        title: "The Device Introduction",
        description: "Lock up the pleasure",
        starter: "I want to lock you in chastity—control when and if you can touch yourself or orgasm. The device becomes a constant reminder of my control. Would you surrender that to me?",
        followUps: ["How long would you want to be locked initially?", "What type of device interests you?", "How would you handle hygiene?"]
      },
      {
        title: "The Extended Denial",
        description: "Days or weeks",
        starter: "What if we extended chastity for days or even weeks? The constant arousal, the frustration, the complete dependence on me for release. Could you endure that?",
        followUps: ["How long do you think you could last?", "What would help you endure the wait?", "What would your reward be?"]
      },
      {
        title: "The Tease and Denial",
        description: "Torment while locked",
        starter: "While you're locked, I want to tease you mercilessly—arouse you, frustrate you, remind you that you can't do anything about it. The psychological torture. Interested?",
        followUps: ["Would you want me to tease you daily or randomly?", "What forms of teasing would be most frustrating?", "How would you beg for release?"]
      }
    ]
  },

  "degradation": {
    id: "kct-degradation",
    kinkSlug: "degradation",
    approaches: [
      {
        title: "The Verbal Degradation",
        description: "Words that wound and arouse",
        starter: "I want to use words to degrade you—call you names, reduce you, make you feel small and worthless. The right words can cut deep. Are you ready to hear what I think of you?",
        followUps: ["What words would affect you most?", "Are there words that are too hurtful?", "How would you want me to build you back up after?"]
      },
      {
        title: "The Physical Degradation",
        description: "Actions that humble",
        starter: "What if I made you do things that degrade you—crawl, eat from the floor, service me in humiliating ways? The physical acts of submission. Does that appeal to you?",
        followUps: ["What acts would you find degrading?", "Would you want to resist or submit willingly?", "How would we handle your emotional response?"]
      },
      {
        title: "The Public Element",
        description: "Degradation with witnesses",
        starter: "What if others saw your degradation? Being humiliated in front of someone else multiplies the shame. Would you ever want to be degraded where someone might see?",
        followUps: ["Would you want a trusted third party present?", "What would be your absolute limits?", "How would we handle the vulnerability?"]
      }
    ]
  },

  "group-fantasy": {
    id: "kct-group-fantasy",
    kinkSlug: "group-fantasy",
    approaches: [
      {
        title: "The Discussion",
        description: "Talk about the fantasy",
        starter: "I've been curious about your thoughts on group play—whether it's something you'd ever fantasize about or want to explore. Can we talk about that openly?",
        followUps: ["Is this purely fantasy or something you'd consider?", "What configuration interests you—MMF, FFM, more?", "What would be your concerns?"]
      },
      {
        title: "The Roleplay",
        description: "Pretend with toys",
        starter: "What if we simulated group play—using toys to represent other people, roleplaying scenarios? We could explore the fantasy without actual others. Interested?",
        followUps: ["Would roleplay satisfy the curiosity?", "What scenarios would you want to act out?", "How would we handle any jealousy?"]
      },
      {
        title: "The Voyeur Path",
        description: "Watch first",
        starter: "What if we started by watching others—either videos or at a club? We could see how we feel about group dynamics without participating. Would that be a good first step?",
        followUps: ["Would you want to watch in person or just videos?", "What would turn you on or off about watching?", "How would we decide if we wanted to go further?"]
      }
    ]
  },

  "double-penetration": {
    id: "kct-double-penetration",
    kinkSlug: "double-penetration",
    approaches: [
      {
        title: "The Toy Introduction",
        description: "Use a toy first",
        starter: "I want to try double penetration with you—me and a toy filling you completely. The full sensation can be incredible. Would you be open to that level of fullness?",
        followUps: ["Have you ever tried anything like this?", "What size toy would you want to start with?", "Would you want vaginal and anal, or both in one opening?"]
      },
      {
        title: "The Preparation",
        description: "Take time to get ready",
        starter: "DP requires lots of preparation—relaxation, lube, going slowly. I want to make sure you're completely ready before we try. Does that careful approach sound good?",
        followUps: ["How much preparation time would you need?", "What would help you relax most?", "How would we communicate during?"]
      },
      {
        title: "The Future Fantasy",
        description: "Consider a third person",
        starter: "For now we can use toys, but have you ever fantasized about the real thing—two people inside you at once? It's something we could discuss for the future if you're curious.",
        followUps: ["Is this something you'd ever want to try with another person?", "What would your ideal scenario be?", "What concerns would you have?"]
      }
    ]
  },

  "fisting": {
    id: "kct-fisting",
    kinkSlug: "fisting",
    approaches: [
      {
        title: "The Gradual Build",
        description: "Work up to it slowly",
        starter: "I want to work toward fisting you—gradually stretching you over time until I can fit my whole hand inside. It's intense but achievable with patience. Interested in that journey?",
        followUps: ["Does the idea of being that full appeal to you?", "What concerns do you have about the stretching?", "How much time would you want to take building up?"]
      },
      {
        title: "The Trust Required",
        description: "Emphasize safety and care",
        starter: "Fisting requires enormous trust—you're letting me inside you in the most intimate way possible. I want to earn that trust completely. Would you let me try?",
        followUps: ["What would I need to do to earn that trust?", "How would you communicate if it became too much?", "What aftercare would you need?"]
      },
      {
        title: "The Sensation Focus",
        description: "Experience the fullness",
        starter: "Once inside, the sensation of fullness is like nothing else—my hand pressing against all your most sensitive spots. I want to give you that experience. Ready to try?",
        followUps: ["What do you imagine it would feel like?", "Would you want me to move once inside or stay still?", "How long do you think you could hold my fist?"]
      }
    ]
  },

  "suspension": {
    id: "kct-suspension",
    kinkSlug: "suspension",
    approaches: [
      {
        title: "The Partial Start",
        description: "Begin with partial suspension",
        starter: "I want to start with partial suspension—some of your weight supported by ropes while your feet still touch the ground. A gentler introduction. Does that sound manageable?",
        followUps: ["Would partial suspension feel safer to start?", "What positions would you want to try?", "How would we ensure the ropes don't cut circulation?"]
      },
      {
        title: "The Rope Art",
        description: "Appreciate the aesthetics",
        starter: "Suspension creates beautiful rope patterns on the body—intricate designs while you're held aloft. Would you want to be my rope art canvas?",
        followUps: ["Would you want to see photos of the rope work?", "What positions would show off the ropes best?", "How long would you want to be displayed?"]
      },
      {
        title: "The Full Experience",
        description: "Work toward complete suspension",
        starter: "Eventually I want to suspend you completely—off the ground, fully supported by rope, helpless and beautiful. Are you willing to work toward that goal with me?",
        followUps: ["What would your first full suspension look like?", "How would we build up your tolerance?", "What would be your safe signal?"]
      }
    ]
  },

  "breath-play": {
    id: "kct-breath-play",
    kinkSlug: "breath-play",
    approaches: [
      {
        title: "The Edge of Consciousness",
        description: "Discuss the risks",
        starter: "Breath play is extremely dangerous but some find the edge of consciousness incredibly erotic. I want to discuss whether this is something we'd ever consider, knowing the risks.",
        followUps: ["Are you aware of how dangerous this is?", "Is this a hard limit for you?", "Would safer alternatives like holding breath voluntarily interest you?"]
      },
      {
        "title": "The Psychological Thrill",
        description: "Focus on the mind game",
        starter: "Even without actual restriction, the threat of breath control—the hand at the throat, the psychological dominance—can be intense. Would that mental aspect satisfy you?",
        followUps: ["Would the threat without actual restriction work?", "How would you want me to dominate you psychologically?", "What would be your absolute limits?"]
      },
      {
        title: "The Safer Alternatives",
        description: "Find other ways",
        starter: "If actual breath restriction is too dangerous, what about alternatives—gas masks, rebreather bags, other ways to control air without direct choking? Would any of those interest you?",
        followUps: ["Would controlled air devices feel safer?", "What level of control would you want me to have?", "How would we monitor your safety?"]
      }
    ]
  },

  "extreme-bondage": {
    id: "kct-extreme-bondage",
    kinkSlug: "extreme-bondage",
    approaches: [
      {
        title: "The Inescapable Restraint",
        description: "No chance of escape",
        starter: "I want to bind you so completely that escape is impossible—multiple layers, different materials, total immobilization. True helplessness. Does that appeal to you?",
        followUps: ["Does total helplessness excite or scare you?", "What materials would you want used?", "How would we ensure your safety?"]
      },
      {
        title: "The Extended Duration",
        description: "Stay bound for hours",
        starter: "What if we kept you bound for hours—through position changes, bathroom breaks, meals? Extended submission to my control. Could you endure that long?",
        followUps: ["How long do you think you could stay bound?", "What would your limits be?", "How would we handle basic needs?"]
      },
      {
        title: "The Stress Positions",
        description: "Uncomfortable by design",
        starter: "I want to put you in positions that are difficult to maintain—stress positions that challenge your endurance. The discomfort becomes part of the experience. Interested?",
        followUps: ["What positions would challenge you most?", "How would you communicate when you need adjustment?", "What would be your reward for enduring?"]
      }
    ]
  },

  "invasive-medical": {
    id: "kct-invasive-medical",
    kinkSlug: "invasive-medical",
    approaches: [
      {
        title: "The Procedure Fantasy",
        description: "Specific invasive acts",
        starter: "I want to explore invasive medical procedures—catheters, enemas, speculums. The vulnerability and clinical nature combined. Would you trust me to perform these on you?",
        followUps: ["What procedures are you curious about?", "What are your hard limits?", "How would we ensure sterility and safety?"]
      },
      {
        title: "The Clinical Detachment",
        description: "Play the uncaring doctor",
        starter: "What if I played a doctor who is completely clinical and detached—treating you like a specimen, examining you invasively without emotion? Does that coldness appeal to you?",
        followUps: ["Would the detachment make it hotter or scarier?", "What would you want me to say during?", "How would we transition back to intimacy?"]
      },
      {
        title: "The Research Subject",
        description: "Experimental procedures",
        starter: "Imagine you're a research subject and I'm conducting experiments on your body—invasive, unusual, for science. The power imbalance of that scenario. Interested?",
        followUps: ["What kind of 'experiments' would you want?", "Would you be a willing or unwilling subject?", "What would the 'results' be?"]
      }
    ]
  },

  "extreme-age-play": {
    id: "kct-extreme-age-play",
    kinkSlug: "extreme-age-play",
    approaches: [
      {
        title: "The Regression Deep Dive",
        description: "Go very young",
        starter: "I want to explore taking you to a very young age—complete regression, unable to speak, needing everything done for you. Total dependence. Would you want to go that deep?",
        followUps: ["What age would you want to regress to?", "Would you want to be non-verbal?", "How would we handle feeding and bathroom needs?"]
      },
      {
        title: "The Caregiver Responsibility",
        description: "Embrace the caretaker role",
        starter: "Taking care of you at that level requires enormous responsibility. I want to provide everything you need—food, comfort, discipline, love. Would you trust me with that care?",
        followUps: ["What would you need most from me as a caregiver?", "Would you want discipline or just nurturing?", "How would we transition back to adult roles?"]
      },
      {
        title: "The Taboo Acknowledgment",
        description: "Discuss the edges",
        starter: "This kink touches on taboo territory. I want us to be very clear about boundaries, consent, and what this means to us. Can we have that honest conversation?",
        followUps: ["What makes you uncomfortable about this kink?", "How do we keep it healthy and consensual?", "What aftercare would you need?"]
      }
    ]
  },

  "pet-training": {
    id: "kct-pet-training",
    kinkSlug: "pet-training",
    approaches: [
      {
        title: "The Obedience Training",
        description: "Teach commands",
        starter: "I want to train you like a pet—teach you commands, tricks, behaviors. Reward good behavior, correct mistakes. The structure of training appeals to me. Would you submit to my training?",
        followUps: ["What commands would you want to learn?", "How would you want to be rewarded?", "What would corrections look like?"]
      },
      {
        title: "The Behavioral Modification",
        description: "Change habits",
        starter: "What if we used pet training to modify your behavior—breaking bad habits, reinforcing good ones, completely reshaping how you act? The control would be total. Interested?",
        followUps: ["What behaviors would you want to change?", "How would you feel about me having that much control?", "What would success look like?"]
      },
      {
        title: "The Show Training",
        description: "Prepare for display",
        starter: "I want to train you to perform—to show off your tricks, your obedience, your training for others. A well-trained pet is impressive. Would you want to show off for me?",
        followUps: ["Would you perform for others or just me?", "What tricks would you want to master?", "How would we celebrate your achievements?"]
      }
    ]
  },

  "total-power-exchange": {
    id: "kct-total-power-exchange",
    kinkSlug: "total-power-exchange",
    approaches: [
      {
        title: "The 24/7 Discussion",
        description: "Beyond the bedroom",
        starter: "I want to discuss total power exchange—me having authority over you not just during scenes, but in daily life. A constant dynamic. Is that something you'd ever want?",
        followUps: ["What areas of life would you want controlled?", "Would this be all the time or certain hours?", "How would we handle work and family?"]
      },
      {
        title: "The Contract Negotiation",
        description: "Formalize the arrangement",
        starter: "If we did TPE, I want a contract—formal, detailed, covering all aspects of our relationship. The clarity would protect us both. Would you sign a power exchange contract with me?",
        followUps: ["What would your hard limits be in the contract?", "How often would we renegotiate?", "What would be your safeword for daily life?"]
      },
      {
        title: "The Reality Check",
        description: "Discuss practicalities",
        starter: "TPE sounds romantic but has real challenges. I want to be honest about the work, the communication required, the potential pitfalls. Are we ready for that commitment?",
        followUps: ["What concerns do you have about TPE?", "How would we prevent resentment?", "What would success look like for us?"]
      }
    ]
  },

  "consensual-slavery": {
    id: "kct-consensual-slavery",
    kinkSlug: "consensual-slavery",
    approaches: [
      {
        title: "The Ownership Concept",
        description: "Discuss what it means",
        starter: "Consensual slavery means you belong to me—truly, completely, in a way that goes beyond typical D/s. I want to explore what that would mean for us. Are you interested?",
        followUps: ["What would ownership mean to you?", "How would this differ from our current dynamic?", "What would you get out of being owned?"]
      },
      {
        title: "The Collaring Ceremony",
        description: "Make it official",
        starter: "If you become my slave, I want a ceremony—collaring, vows, witnesses. Making it as real as marriage. Would you commit to me at that level?",
        followUps: ["Would you want a private or public ceremony?", "What would your vows include?", "How would we dissolve this if needed?"]
      },
      {
        title: "The Daily Reality",
        description: "Live the dynamic",
        starter: "Being a slave isn't just scenes—it's service, obedience, existing for my pleasure and convenience. The reality might be harder than the fantasy. Are you prepared for that?",
        followUps: ["What daily tasks would you expect?", "How would you handle days when you don't feel submissive?", "What would your rewards be?"]
      }
    ]
  },

  "extreme-objectification": {
    id: "kct-extreme-objectification",
    kinkSlug: "extreme-objectification",
    approaches: [
      {
        title: "The Furniture Fantasy",
        description: "Become an object",
        starter: "I want to use you as furniture—sit on you, rest my feet on you, use your body as a table. Complete reduction to object status. Does that dehumanization appeal to you?",
        followUps: ["What furniture would you want to be?", "How long could you maintain a position?", "Would you want to be able to speak?"]
      },
      {
        title: "The Hole Concept",
        description: "Reduce to orifices",
        starter: "What if I treated you as just holes for my pleasure—no regard for your pleasure, your comfort, your humanity? Pure objectification. Would you want to experience that?",
        followUps: ["Would you want any recognition of your personhood?", "How would you communicate limits?", "What aftercare would you need?"]
      },
      {
        title: "The Display Piece",
        description: "Show you off",
        starter: "I want to display you—position you, dress you, present you as my object for others to see. The exhibitionism of objectification. Would you want to be shown off?",
        followUps: ["Would you want to be displayed in public or private?", "What would you want to wear?", "How would you feel about others looking at you as an object?"]
      }
    ]
  },

  "forced-orgasm": {
    id: "kct-forced-orgasm",
    kinkSlug: "forced-orgasm",
    approaches: [
      {
        title: "The Overstimulation",
        description: "Don't stop at one",
        starter: "I want to force you to orgasm repeatedly—not letting you stop, making you come again and again until you're begging me to stop. The overstimulation can be overwhelming. Interested?",
        followUps: ["How many orgasms do you think you could handle?", "Would you want me to use toys or my body?", "How would you safeword if it became too much?"]
      },
      {
        title: "The Bondage Element",
        description: "Restrain while forcing",
        starter: "What if I tied you up and then forced orgasm after orgasm—you unable to escape, unable to stop me, completely at my mercy? The helplessness would intensify everything. Sound exciting?",
        followUps: ["What position would you want to be in?", "Would you want to be gagged?", "How would you communicate your limits?"]
      },
      {
        title: "The Post-Orgasm Torture",
        description: "Continue when sensitive",
        starter: "After you orgasm, you're incredibly sensitive. I want to keep stimulating you through that sensitivity—torturing you with pleasure you can't escape. Does that sound intense?",
        followUps: ["How sensitive are you after orgasm?", "Would you want me to be gentle or relentless?", "What would help you endure?"]
      }
    ]
  },

  "orgasm-denial-extended": {
    id: "kct-orgasm-denial-extended",
    kinkSlug: "orgasm-denial-extended",
    approaches: [
      {
        title: "The Days of Denial",
        description: "Extend for days",
        starter: "I want to deny you for days—arousing you constantly but never letting you finish. The constant frustration, the growing desperation. Could you endure days of denial?",
        followUps: ["How many days do you think you could last?", "What would help you endure?", "Would you want to be locked in chastity?"]
      },
      {
        title: "The Weeks of Waiting",
        description: "Push to weeks",
        starter: "What if we extended it to weeks? The psychological shift that happens when you accept that you won't orgasm until I decide. Are you strong enough for that level of denial?",
        followUps: ["What would change for you after a week of denial?", "How would I keep you motivated?", "What would your reward be?"]
      },
      {
        title: "The Ruined Release",
        description: "Frustrate even when allowed",
        starter: "Even when I finally let you orgasm, I might ruin it—stop stimulation right at the peak so you get no pleasure from the release. The ultimate cruelty. Would you accept that?",
        followUps: ["Would ruined orgasms be harder than denial?", "How would you feel about me controlling even your release?", "What would be the point of waiting?"]
      }
    ]
  },

  "extreme-anal": {
    id: "kct-extreme-anal",
    kinkSlug: "extreme-anal",
    approaches: [
      {
        title: "The Stretching Journey",
        description: "Work toward larger insertions",
        starter: "I want to stretch you—gradually work up to larger toys, more fingers, eventually my fist. The journey of opening you up completely. Are you ready for that training?",
        followUps: ["What size goals would you have?", "How often would we need to practice?", "What would your training schedule look like?"]
      },
      {
        title: "The Depth Play",
        description: "Go deeper",
        starter: "What if we focused on depth—seeing how deep you can take something? The sensation of being filled completely, internally. Does deep penetration appeal to you?",
        followUps: ["How deep do you think you could take something?", "What concerns do you have about depth?", "How would we ensure safety?"]
      },
      {
        title: "The Double Anal",
        description: "Two at once",
        starter: "Eventually I want to try double anal—two toys, or me and a toy, filling you completely. The ultimate stretch. Is that something you'd work toward?",
        followUps: ["Would you want two real people or toys?", "What would that level of fullness feel like?", "How would we prepare for that?"]
      }
    ]
  },

  "gang-bang-fantasy": {
    id: "kct-gang-bang-fantasy",
    kinkSlug: "gang-bang-fantasy",
    approaches: [
      {
        title: "The Fantasy Discussion",
        description: "Talk about the scenario",
        starter: "I want to know if you've ever fantasized about being with multiple people at once—being the center of attention, overwhelmed by sensation. Is that a fantasy you have?",
        followUps: ["Is this purely fantasy or something you'd consider?", "How many people would be in your fantasy?", "What would the scenario be?"]
      },
      {
        title: "The Simulation",
        description: "Use toys and roleplay",
        starter: "What if we simulated a gang bang—using multiple toys, me playing different roles, creating the sensation of being overwhelmed? We could explore the fantasy safely together.",
        followUps: ["Would simulation satisfy the fantasy?", "What toys would we need?", "How would we create the atmosphere?"]
      },
      {
        title: "The Reality Question",
        description: "Consider if you'd ever do it",
        starter: "If we found the right people, the right situation, would you ever want to try a real gang bang? Or is this strictly fantasy? I want to know where you stand.",
        followUps: ["What would need to be true for you to try it?", "What are your biggest concerns?", "How would we handle jealousy?"]
      }
    ]
  },

  "cuckolding": {
    id: "kct-cuckolding",
    kinkSlug: "cuckolding",
    approaches: [
      {
        title: "The Fantasy Exploration",
        description: "Discuss the appeal",
        starter: "I want to understand if cuckolding appeals to you—me being with someone else while you watch or know about it. The humiliation, the compersion, the complexity. Does that interest you?",
        followUps: ["Would you want to watch or just know?", "Would you feel humiliation or excitement?", "What would you get out of it?"]
      },
      {
        title: "The Hotwife Alternative",
        description: "Without the humiliation",
        starter: "What about a hotwife dynamic instead—me being with others but without the humiliation aspect? Just the freedom and the sharing. Would that feel better to you?",
        followUps: ["Would removing humiliation make it appealing?", "Would you want to participate or just hear about it?", "How would we reconnect afterward?"]
      },
      {
        title: "The Reality Check",
        description: "Consider actual logistics",
        starter: "If we did this, how would it actually work? Finding partners, safety, emotions, reconnecting afterward. Are we ready for that complexity? Let's talk through it.",
        followUps: ["How would we find appropriate partners?", "What boundaries would we need?", "How would we handle unexpected emotions?"]
      }
    ]
  },

  "hotwife": {
    id: "kct-hotwife",
    kinkSlug: "hotwife",
    approaches: [
      {
        title: "The Freedom and Sharing",
        description: "Positive compersion",
        starter: "The hotwife dynamic is about me having freedom to explore while you celebrate my pleasure—no humiliation, just joy in my experiences. Does that positive sharing appeal to you?",
        followUps: ["Would you genuinely feel joy or would jealousy be an issue?", "How much would you want to know?", "Would you want the same freedom?"]
      },
      {
        title: "The Reclaiming",
        description: "Coming back together",
        starter: "After I'm with someone else, I want you to reclaim me—remind me I'm yours, take me back completely. The reunion can be incredibly passionate. Would you want that?",
        followUps: ["What would reclaiming look like for you?", "Would you want details or just the physical reunion?", "How would we ensure we reconnect emotionally?"]
      },
      {
        title: "The Selective Sharing",
        description: "Choose carefully",
        starter: "If we did this, I'd want to be selective about partners—quality over quantity, people who respect our relationship. Would you want involvement in choosing?",
        followUps: ["Would you want veto power over partners?", "What qualities would matter to you?", "How often would feel right?"]
      }
    ]
  },

  "swinging": {
    id: "kct-swinging",
    kinkSlug: "swinging",
    approaches: [
      {
        title: "The Couples Experience",
        description: "Play together",
        starter: "What if we explored swinging—playing with other couples together? The shared experience, both of us participating. Would that feel safer than separate play?",
        followUps: ["Would you want us to stay together or separate rooms?", "What would your ideal couple be like?", "What activities would be okay?"]
      },
      {
        title: "The Club Scene",
        description: "Visit a swingers club",
        starter: "We could start by visiting a swingers club—just to watch, get a feel for the environment, see if it appeals to us. Would you be curious to explore that scene?",
        followUps: ["Would you want to participate or just watch?", "What would make you comfortable there?", "What would be your limits?"]
      },
      {
        title: "The Soft Swap",
        description: "Start slow",
        starter: "We could start with soft swap—playing with others but no penetration, keeping some boundaries. A way to test the waters. Would that be a good starting point?",
        followUps: ["What would soft swap include for you?", "What would still feel like too much?", "How would we check in during?"]
      }
    ]
  },

  "polyamory-discussion": {
    id: "kct-polyamory-discussion",
    kinkSlug: "polyamory-discussion",
    approaches: [
      {
        title: "The Relationship Structure",
        description: "Discuss non-monogamy",
        starter: "I want to have a serious discussion about polyamory—whether having multiple loving relationships could work for us. It's a big conversation, but are you open to having it?",
        followUps: ["Have you ever considered polyamory before?", "What appeals to you or concerns you?", "Would you want hierarchical or non-hierarchical?"]
      },
      {
        title: "The Jealousy Question",
        description: "Address the hard part",
        starter: "Polyamory brings up jealousy. I want to talk honestly about whether we could handle seeing each other with other people, loving other people. Could you manage that?",
        followUps: ["How do you typically handle jealousy?", "What would help you feel secure?", "Would you want to meet each other's partners?"]
      },
      {
        title: "The Practical Reality",
        description: "Logistics matter",
        starter: "If we were polyamorous, how would it work? Time management, scheduling, holidays, possibly living arrangements. Are we ready for that complexity?",
        followUps: ["How much time would you want with other partners?", "Would we tell family and friends?", "What would success look like?"]
      }
    ]
  },

  "extreme-stretching": {
    id: "kct-extreme-stretching",
    kinkSlug: "extreme-stretching",
    approaches: [
      {
        title: "The Gradual Process",
        description: "Take time",
        starter: "Extreme stretching takes time and patience—gradually working up to larger sizes over weeks or months. I want to take that journey with you. Are you committed to the process?",
        followUps: ["What size goals do you have?", "How often would we need to practice?", "What would your training regimen look like?"]
      },
      {
        title: "The Sensation of Fullness",
        description: "Focus on the feeling",
        starter: "The feeling of being completely stretched, filled to your limit, can be incredibly intense. I want to give you that sensation. Does extreme fullness appeal to you?",
        followUps: ["What does fullness feel like to you?", "Would you want to be able to close after?", "What would be your ultimate size goal?"]
      },
      {
        title: "The Visual Aspect",
        description: "See the results",
        starter: "There's something visually striking about extreme stretching—the gape, the capacity. I want to see what your body can do. Would you want to see it too?",
        followUps: ["Would you want photos or videos?", "Would you be comfortable with the visual results?", "What would that openness represent to you?"]
      }
    ]
  },

  "inflation": {
    id: "kct-inflation",
    kinkSlug: "inflation",
    approaches: [
      {
        title: "The Enema Introduction",
        description: "Start with water",
        starter: "Inflation can start with enemas—filling you with water to create a swollen, full feeling. It's a controlled way to experience inflation. Would you be curious to try?",
        followUps: ["Have you ever tried enemas?", "What volume would you want to start with?", "How would we handle the release?"]
      },
      {
        title: "The Air Inflation",
        description: "Use air instead",
        starter: "What about air inflation—pumping air inside to create a swollen, pregnant-like belly? The sensation is different from water. Does that appeal to you?",
        followUps: ["Would air feel safer than liquid?", "How inflated would you want to get?", "What would the sensation be like?"]
      },
      {
        title: "The Visual Transformation",
        description: "See the change",
        starter: "Inflation dramatically changes your appearance—swollen belly, stretched skin. I want to see that transformation. Would you want to see yourself inflated?",
        followUps: ["Would you want to inflate to look pregnant?", "How long would you want to stay inflated?", "What would you wear while inflated?"]
      }
    ]
  },

  "vacuum-bedding": {
    id: "kct-vacuum-bedding",
    kinkSlug: "vacuum-bedding",
    approaches: [
      {
        title: "The Total Immobilization",
        description: "Complete restriction",
        starter: "Vacuum bedding sucks all air out, immobilizing you completely in latex or plastic. You can't move at all, breathe carefully controlled. Does that total restriction appeal to you?",
        followUps: ["Does total immobility excite or scare you?", "How long could you handle it?", "What would help you stay calm?"]
      },
      {
        title: "The Sensory Deprivation",
        description: "Cut off completely",
        starter: "Inside the vacuum bed, you're cut off from all sensation—sight, sound, touch, everything. Just your own breathing and heartbeat. Would you want that isolation?",
        followUps: ["Would you want a breathing tube or hole?", "How long could you endure sensory deprivation?", "What would you think about inside?"]
      },
      {
        title: "The Trust Exercise",
        description: "Complete dependence",
        starter: "Vacuum bedding requires absolute trust—I'm in complete control of your breathing, your safety, everything. Would you give me that level of control?",
        followUps: ["What would I need to do to earn that trust?", "How would you communicate distress?", "What would the release feel like?"]
      }
    ]
  },

  "extreme-sensory": {
    id: "kct-extreme-sensory",
    kinkSlug: "extreme-sensory",
    approaches: [
      {
        title: "The Overload",
        description: "Too much sensation",
        starter: "I want to overwhelm your senses—bright lights, loud sounds, strong smells, intense touch, all at once. Sensory overload to push you to your limits. Would you want to experience that intensity?",
        followUps: ["Which sense is most sensitive for you?", "How much stimulation could you handle?", "What would your safe signal be?"]
      },
      {
        title: "The Deprivation Contrast",
        description: "From nothing to everything",
        starter: "What if we went from complete sensory deprivation to sudden overload? The contrast would be shocking, disorienting, intense. Does that extreme swing appeal to you?",
        followUps: ["Would the contrast be exciting or overwhelming?", "How long in deprivation before overload?", "What would help you process that intensity?"]
      },
      {
        title: "The Sensory Mix",
        description: "Conflicting inputs",
        starter: "I want to mix sensations that don't go together—hot and cold, rough and soft, pleasure and pain—all at once. The confusion of conflicting inputs. Interested in that disorientation?",
        followUps: ["What contrasting sensations would you want?", "Would confusion enhance or ruin the experience?", "How would you communicate through the overload?"]
      }
    ]
  },

  "long-term-chastity": {
    id: "kct-long-term-chastity",
    kinkSlug: "long-term-chastity",
    approaches: [
      {
        title: "The Weeks of Waiting",
        description: "Extend for weeks",
        starter: "I want to lock you in chastity for weeks—no orgasm, no touching, constant arousal with no release. The psychological shift that happens over time. Could you endure weeks of denial?",
        followUps: ["How many weeks do you think you could last?", "What would change for you after a week locked?", "How would I keep you motivated?"]
      },
      {
        title: "The Months of Denial",
        description: "Push to months",
        starter: "What if we extended to months? The complete rewiring of your relationship to pleasure, making your release entirely dependent on me. Are you ready for that level of surrender?",
        followUps: ["What would months of denial do to you psychologically?", "How would we handle your frustration?", "What would your reward be at the end?"]
      },
      {
        title: "The Permanent Question",
        description: "Consider indefinite",
        starter: "Some couples practice permanent or near-permanent chastity—release is rare, the locked state is normal. Is that something you'd ever consider, or is it strictly temporary for you?",
        followUps: ["Would you ever want permanent chastity?", "What would need to be true for that?", "How would we maintain intimacy?"]
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
