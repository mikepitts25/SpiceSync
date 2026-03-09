# Deep Dives - Conversation Starters Feature

A comprehensive conversation starters feature for the SpiceSync couples app with 200+ thought-provoking prompts across 4 categories.

## 📁 Files Created

### Data Files (200 prompts total)
- `data/conversation_starters_getting_to_know.ts` - 50 prompts
- `data/conversation_starters_relationship.ts` - 50 prompts  
- `data/conversation_starters_date_night.ts` - 50 prompts
- `data/conversation_starters_spicy.ts` - 50 prompts

### Library Files
- `lib/conversationStarters.ts` - Main library with filtering, random selection, and utilities
- `lib/state/conversationStore.ts` - Zustand store for favorites, history, and settings

### Screen Files
- `app/(conversation)/index.tsx` - Main conversation browser screen
- `app/(conversation)/date-night.tsx` - Full-screen immersive date night mode
- `app/(tabs)/conversation.tsx` - Tab redirect

### Component Files
- `components/DailyConversationWidget.tsx` - Home screen widget for daily starter

### Integration Files
- Updated `app/(tabs)/_layout.tsx` - Added Conversation tab
- Updated `app/_layout.tsx` - Added conversation route
- Updated `lib/notifications.ts` - Added daily conversation notifications

## 🎯 Categories

### 1. Getting to Know Each Other (50 prompts)
- Childhood memories and family dynamics
- Past relationships (lessons learned)
- Personal values and beliefs
- Dreams and aspirations
- "What's something I've never asked you about?"

### 2. Relationship Deep Dives (50 prompts)
- "What made you fall for me?"
- Favorite memories together
- How we handle conflict
- Future visions as a couple
- Appreciation and gratitude prompts

### 3. Date Night Fun (50 prompts)
- Light and flirty questions
- Hypothetical scenarios
- Bucket list items
- "Would you rather" questions
- Playful debates

### 4. Intimate Conversations (50 prompts)
- Desires and turn-ons
- Fantasies and boundaries
- Communication about intimacy
- Exploring comfort zones together

## 🔧 Features

### Main Screen
- Browse by category tabs
- Random starter button ("Pick a topic")
- Daily conversation starter
- Save favorites
- Share via text/copy
- Follow-up questions for deeper conversation

### Date Night Mode
- Full-screen immersive experience
- Beautiful background themes (dark, romantic, cozy)
- One question at a time with follow-ups
- Swipe gestures for navigation
- Optional timer (3/5/10/15 minutes per topic)
- Settings for including/excluding spicy content

### Notifications
- Daily conversation starter push notifications
- Configurable time
- Separate from activity notifications

### Widget
- Home screen widget showing today's conversation starter
- Compact and full-size variants

## 📊 Prompt Structure

```typescript
interface ConversationStarter {
  id: string;           // Unique identifier (e.g., "conv-get-001")
  category: 'getting_to_know' | 'relationship' | 'date_night' | 'spicy';
  intensity: 1 | 2 | 3 | 4;  // 1=safe, 4=intimate
  question: string;     // Main prompt
  followUps?: string[]; // 2-3 follow-up questions
  context?: string;     // Why this question matters
  tags: string[];       // Categories for filtering
}
```

## 🎨 Intensity Levels

- **1 - Light**: Easy, fun conversation starters
- **2 - Warm**: Getting to know each other better
- **3 - Deep**: Meaningful, vulnerable conversations
- **4 - Intimate**: Close, personal, and spicy topics

## 🚀 Usage

### Get a random starter
```typescript
import { getRandomStarter } from '../lib/conversationStarters';

const starter = getRandomStarter();
const starterFromCategory = getRandomStarter({ category: 'date_night' });
```

### Get daily starter
```typescript
import { getDailyStarter } from '../lib/conversationStarters';

const todayStarter = getDailyStarter();
```

### Filter by criteria
```typescript
import { filterStarters } from '../lib/conversationStarters';

const deepQuestions = filterStarters({ 
  intensity: [3, 4],
  tags: ['vulnerability']
});
```

### Use the store
```typescript
import { useConversationStore } from '../lib/state/conversationStore';

const { favorites, toggleFavorite, dateNightSettings } = useConversationStore();
```

## 📝 Content Guidelines

All prompts follow these principles:
- **Open-ended**: No yes/no questions
- **Culturally aware**: Colombian references where natural
- **Balanced**: Mix of light, deep, and intimate
- **Unique**: No repetitive questions
- **Engaging**: Follow-ups to keep conversation flowing
- **Meaningful**: Context explaining why the question matters

## 🎭 Date Night Mode Themes

- **Dark**: Classic dark gradient (#0D0D15 to #1A1A2E)
- **Romantic**: Deep purple/pink tones (#1a0a1a to #2d1b2d)
- **Cozy**: Warm brown tones (#1a1510 to #2d241b)

## 📱 Navigation Integration

The Conversation tab is added to the main tab bar with:
- Icon: 💬 (speech bubble)
- Label: "Talk"
- Position: After Browse tab

## 🔔 Notification Integration

Daily conversation notifications:
- Default time: 9:00 AM
- Content: Preview of today's question
- Tap action: Opens conversation screen
- Separate toggle from activity notifications
