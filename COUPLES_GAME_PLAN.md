# SpiceSync Couples Game Plan
## "Spice Dice" - Truth, Dare & Challenge Game

---

## Overview
A couples game featuring truth questions, dares, and challenges to enhance intimacy and playfulness. Split into free (25 items) and premium (75+ items) tiers.

**Paywall Update:** $19.99 (was $34.99)

---

## Game Mechanics

### Game Flow
1. **Game Setup** - Select difficulty/intensity level (1-5)
2. **Choose Category** - Truth, Dare, Challenge, Fantasy, Roleplay
3. **Roll/Draw** - Random selection or browse cards
4. **Complete & Rate** - Mark as done, rate experience
5. **Earn Rewards** - Unlock achievements, streaks

### Modes
- **Solo Mode** - One partner draws, both participate
- **Duel Mode** - Alternating turns
- **Surprise Mode** - Random category each turn
- **Custom Deck** - Premium users create custom cards

---

## Data Structure

```typescript
interface GameCard {
  id: string;
  type: 'truth' | 'dare' | 'challenge' | 'fantasy' | 'roleplay';
  content: string;
  intensity: 1-5;
  category: 'communication' | 'physical' | 'emotional' | 'playful' | 'intimate';
  isPremium: boolean;
  estimatedTime: string; // "5 min", "15 min", "ongoing"
  requires: string[]; // "privacy", "props", "specific-location"
}

interface GameSession {
  id: string;
  startedAt: number;
  mode: 'solo' | 'duel' | 'surprise';
  intensity: 1-5;
  cardsPlayed: string[];
  cardsCompleted: string[];
  ratings: Record<string, 1-5>;
}

interface GameStats {
  totalSessions: number;
  cardsCompleted: number;
  favoriteCategory: string;
  averageIntensity: number;
  streakDays: number;
}
```

---

## Content Split

### FREE TIER (25 Cards)

**Truth (5)**
1. "What's one thing you've always wanted to tell me but haven't?"
2. "Describe your first impression of me in 3 words."
3. "What's your favorite memory of us together?"
4. "If you could plan our perfect date night, what would it be?"
5. "What's something I do that always makes you smile?"

**Dare (5)**
6. "Give me a 30-second shoulder massage."
7. "Feed me a bite of something sweet - blindfolded."
8. "Serenade me with a song (even if you can't sing)."
9. "Do your best impression of me for 1 minute."
10. "Give me compliments for 60 seconds straight."

**Challenge (5)**
11. "Hold hands and gaze into each other's eyes for 2 minutes without speaking."
12. "Take a selfie together making your silliest faces."
13. "Draw a portrait of each other (no judgment on quality!)."
14. "Slow dance to a song of my choosing."
15. "Write a haiku about our relationship."

**Fantasy (5)**
16. "Describe your dream vacation together."
17. "If we had a whole day with no responsibilities, what would we do?"
18. "Describe a perfect lazy Sunday morning together."
19. "What's an adventure you'd love for us to have?"
20. "If we could time travel together, where would we go?"

**Roleplay (5)**
21. "Pretend we're meeting for the first time at a coffee shop."
22. "Act like we're strangers on a blind date."
23. "You're the chef, I'm the food critic - rate my cooking."
24. "Pretend we're photographers on a scenic photoshoot."
25. "Act like we're tour guides showing each other our favorite spots."

---

### PREMIUM TIER (75+ Cards)

**Truth - Intimate (10)**
26. "What's your biggest turn-on that I might not know about?"
27. "Describe a fantasy you've never shared with anyone."
28. "What's the most adventurous place you'd want to be intimate?"
29. "What's something new you'd like us to try together?"
30. "Describe your ideal intimate evening with me."
31. "What's a secret desire you've been curious about?"
32. "Tell me about a dream you had about us."
33. "What's something that instantly puts you in the mood?"
34. "Describe the most memorable intimate moment we've had."
35. "What's a boundary you'd like to push together?"

**Dare - Playful (10)**
36. "Give me a kiss in 5 different places (face only)."
37. "Whisper something suggestive in my ear."
38. "Do a striptease to one article of clothing (keep it tasteful)."
39. "Give me a piggyback ride around the room."
40. "Play footsie with me for the next 5 minutes."
41. "Give me eskimo kisses for 30 seconds."
42. "Nibble on my ear and tell me something sweet."
43. "Dance seductively for 60 seconds."
44. "Give me a hickey (somewhere hidden)."
45. "Let me draw on you with whipped cream (then clean it up)."

**Dare - Kinky/Challenging (10)**
46. **"Swap clothes with your partner and wear them for the next 30 minutes."**
47. "Let me tie your hands (loosely) with a scarf for 5 minutes."
48. "Give me a full-body massage (clothes optional)."
49. "Blindfold me and tease me with different textures."
50. "Let me control your movements for 3 minutes."
51. "Leave a trail of kisses from my neck to my ankle."
52. "Pick a safeword and practice using it during light teasing."
53. "Let me feed you something while you're blindfolded."
54. "Give me a sensual massage using only your mouth."
55. "Let me choose your outfit for tomorrow."

**Challenge - Intimate (10)**
56. "Create a secret code word that means 'I want you' and use it today."
57. "Plan a surprise intimate encounter for later tonight."
58. "Write 3 things you love about our physical connection."
59. "Create a playlist of songs that put you in the mood."
60. "Set up a romantic bubble bath for two."
61. "Give each other full-body massages (no time limit)."
62. "Try a new intimate position or location tonight."
63. "Spend 10 minutes just touching each other (non-sexual)."
64. "Create a 'yes/no/maybe' list of new things to try."
65. "Plan a 'no phones' evening focused entirely on each other."

**Fantasy - Advanced (10)**
66. "Describe a detailed roleplay scenario you'd want to try."
67. "If we could have a 'free pass' fantasy night, what would it include?"
68. "Describe your ideal dominant/submissive dynamic."
69. "What's a public-but-discreet act you'd find thrilling?"
70. "Describe a scenario involving sensory deprivation."
71. "If we had a private cabin for a weekend, how would we spend it?"
72. "Describe a fantasy involving dress-up or costumes."
73. "What's an 'almost caught' scenario you find exciting?"
74. "Describe your ideal 'morning after' routine."
75. "If we could recreate any movie love scene, which would it be?"

**Roleplay - Advanced (10)**
76. "Boss and employee: You're interviewing me for a very personal position."
77. "Strangers at a bar: Pick me up using your best lines."
78. "Doctor and patient: Give me a very thorough 'examination'."
79. "Photographer and model: Direct me in a sensual photoshoot."
80. "Teacher and student: I need 'extra credit' - how do I earn it?"
81. "Massage therapist and client: Give me a professional-style massage."
82. "Personal trainer: Put me through a 'workout' routine."
83. "Chef and food critic: Feed me an intimate dinner."
84. "Artist and muse: Draw/paint me (or trace my body)."
85. "Pirate and captive: I'm your prisoner - what do you do with me?"

**Special Cards (Bonus 10)**
86. "Wildcard: Let your partner choose ANY card from the deck."
87. "Double Dare: Both partners must complete the same dare."
88. "Mystery Box: Pick a random item nearby and use it creatively."
89. "Time Warp: Recreate our first kiss exactly as it happened."
90. "Future Self: Write a letter to each other to open in 1 year."
91. "Phone a Friend: Text a friend something nice about your partner."
92. "Social Media: Post a cute couples photo with a sweet caption."
93. "Shopping Spree: Add something to the cart for us to try."
94. "Memory Lane: Recreate the scene from our first date."
95. "Bucket List: Add one new thing to our couples bucket list."

---

## Screen Designs

### 1. Game Hub Screen
```
┌─────────────────────────┐
│ 🎲 Spice Dice           │
│                         │
│ [Last Session Stats]    │
│                         │
│ ┌──────┐ ┌──────┐      │
│ │ Truth│ │ Dare │      │
│ └──────┘ └──────┘      │
│                         │
│ ┌──────┐ ┌──────┐      │
│ │Chall-│ │Fant- │      │
│ │enge  │ │asy   │      │
│ └──────┘ └──────┘      │
│                         │
│ ┌──────┐               │
│ │Role- │               │
│ │play  │               │
│ └──────┘               │
│                         │
│ [Start Game]            │
│ [Custom Deck 🔒]        │
└─────────────────────────┘
```

### 2. Card Draw Screen
```
┌─────────────────────────┐
│ ◀ Back        🔥 Level 3│
│                         │
│  ┌───────────────────┐  │
│  │                   │  │
│  │     💕 TRUTH      │  │
│  │                   │  │
│  │ "What's one thing │  │
│  │  you've always    │  │
│  │  wanted to tell   │  │
│  │  me but haven't?" │  │
│  │                   │  │
│  │    ⏱️ 2-5 min    │  │
│  └───────────────────┘  │
│                         │
│ [🔄 Skip]  [✅ Accept]  │
│                         │
│ [Complete & Rate ⭐]    │
└─────────────────────────┘
```

### 3. Game Stats Screen
```
┌─────────────────────────┐
│ 📊 Your Game Stats      │
│                         │
│ Sessions: 12            │
│ Cards Completed: 47     │
│ 🔥 Streak: 5 days       │
│                         │
│ [Bar Chart by Category] │
│                         │
│ Favorite: Truth (40%)   │
│ Avg Intensity: 3.2      │
│                         │
│ [Achievements]          │
└─────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Core Game (Week 1)
- [ ] Create game data structure
- [ ] Build card database (25 free, 75 premium)
- [ ] Create Game Hub screen
- [ ] Implement card draw logic
- [ ] Basic card display UI

### Phase 2: Gameplay (Week 2)
- [ ] Category selection
- [ ] Intensity filter
- [ ] Skip/Accept mechanics
- [ ] Complete & rate flow
- [ ] Session tracking

### Phase 3: Premium Features (Week 3)
- [ ] Premium card unlock
- [ ] Custom deck creation (premium)
- [ ] Advanced stats
- [ ] Achievement integration
- [ ] Streak tracking

### Phase 4: Polish (Week 4)
- [ ] Animations (card flip, draw)
- [ ] Sound effects
- [ ] Haptic feedback
- [ ] Share completed cards
- [ ] Push notifications (daily card)

---

## Paywall Integration

**Free Users:**
- 25 cards (5 per category)
- Basic game mode only
- No custom decks
- Limited stats

**Premium Users ($19.99):**
- All 100+ cards
- All game modes
- Custom deck builder
- Full stats & analytics
- Achievements & streaks
- Priority new content

**Paywall Triggers:**
- Drawing premium card → "Unlock to continue"
- Custom deck button → "Premium feature"
- Stats screen → "Upgrade for full insights"

---

## Technical Notes

**Storage:**
- Cards in JSON file (easy to add more)
- Game sessions in AsyncStorage
- Stats aggregated from sessions

**Randomization:**
- Fisher-Yates shuffle for deck
- Weighted by user's preferred intensity
- Track played cards to avoid repeats

**Performance:**
- Lazy load premium cards
- Cache card images locally
- Debounce rapid card draws

---

## Future Expansions

- **Expansion Packs** - Holiday themes, location-based, etc.
- **Community Cards** - User-submitted (moderated)
- **Couples Challenges** - Multi-day challenges
- **Integration** - Link to activities from main app
- **Multiplayer** - Play with other couples (virtual)

---

*Plan Version: 2026.2.27*
*Generated by Codex for SpiceSync*
