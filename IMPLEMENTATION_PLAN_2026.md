# SpiceSync 2026 Implementation Plan
## Complete Deliverables Package

---

## 1. PRODUCT STRATEGY & COMPETITIVE POSITIONING

### Brand Position
**"The most private, playful compatibility app for couples."**

### Market Positioning Matrix
| Dimension | SpiceSync | Kindu | Couply | Paired | Coral |
|-----------|-----------|-------|--------|--------|-------|
| **Privacy** | 🔒 Local-first, PIN-protected | Cloud sync | Cloud-based | Cloud-based | Cloud-based |
| **Pricing** | Free + One-time unlock ($24.99-39.99) | Subscription ($9.99/mo) | Subscription ($7.99/mo) | Subscription ($12.99/mo) | Subscription ($14.99/mo) |
| **Tone** | Playful, warm, premium | Clinical | Playful | Cute/Young | Educational |
| **Core Value** | Fast intimacy discovery (<3 min) | Date ideas | Relationship tracking | Games/Quizzes | Courses |
| **Multi-Profile** | ✅ Native support | ❌ | ❌ | ❌ | ❌ |

### Key Differentiators
1. **Anti-Subscription Fatigue** - One-time unlock vs monthly drain
2. **Privacy-First Architecture** - Local data by default, explicit sync consent
3. **Fast Time-to-Value** - First match in under 3 minutes
4. **Progressive Intimacy** - Starts light, deepens with trust signals
5. **ENM-Poly Friendly** - Multi-profile, multi-partner as first-class

### Target Segments

**Primary: Committed Couples (25-40)**
- Pain: Communication gaps about desires
- Motivation: Break routines, deepen connection
- Acquisition: Relationship podcasts, couples therapy referrals

**Secondary: Young Couples (21-30)**
- Pain: Awkwardness discussing boundaries
- Motivation: Safe exploration, building trust
- Acquisition: TikTok/Instagram, influencer partnerships

**Tertiary: ENM/Poly Communities**
- Pain: Managing multiple partner dynamics
- Motivation: Clear boundaries, consent tracking
- Acquisition: Community forums, ethical non-monogamy content

---

## 2. UX/UI OVERHAUL SPECIFICATION

### Design System: "Warm Intimacy"

#### Color Palette
```
Primary:    #E85A5A (Coral - passion, energy)
Secondary:  #9B6B9B (Plum - intimacy, luxury)
Accent:     #4ECDC4 (Teal - trust, calm)
Background: #0F0F12 (Deep charcoal - premium, discreet)
Surface:    #1A1A1F (Elevated surfaces)
Success:    #2ECC71 (Yes/match states)
Warning:    #F39C12 (Maybe/consider)
Danger:     #E74C3C (No/caution)
Text:       #FFFFFF (Primary)
TextMuted:  #8A8A8F (Secondary)
```

#### Typography
```
Headlines: "Playfair Display" (serif, editorial, intimate)
Body: "Inter" (clean, highly legible, friendly)
Numbers/Stats: "SF Pro Display" (iOS native)
```

#### Spacing System (8px base)
```
xxs: 4px  |  xs: 8px  |  sm: 12px  |  md: 16px  |  lg: 24px
xl: 32px  |  2xl: 48px  |  3xl: 64px  |  4xl: 96px
```

### Mobile UX Flows

#### A. Onboarding (5 screens, 60 seconds)
1. **Brand Moment** (5s) - Animated logo, tagline "Discover together"
2. **Value Proposition** (10s) - "Swipe together. Match on what matters."
3. **Privacy Promise** (10s) - "Your data stays on your device"
4. **Profile Setup** (30s) - Name, emoji avatar, partner invite
5. **First Deck** (5s) - "Start exploring"

#### B. Core Loop: Discovery → Deck → Match
```
[Discovery Hub] → [Swipe Deck] → [Match Celebration] → [Matches List]
     ↑                                              ↓
     └───────────── [Browse/Filter] ←───────────────┘
```

#### C. Match Celebration Moment
- Full-screen modal with confetti
- "You both said YES!" 
- Actions: "Add to Favorites", "Discuss Now", "Keep Swiping"
- Haptic celebration pattern

#### D. Navigation Structure (Bottom Tabs)
```
[Home] [Deck*] [Matches] [Insights] [Settings]

*Deck is primary CTA - largest touch target
```

### Web Product Spec

#### Responsive Breakpoints
```
Mobile:  < 640px (priority)
Tablet:  640px - 1024px
Desktop: > 1024px
```

#### Web-Specific Features
- **Landing Page**: Video hero, trust badges, feature grid, pricing
- **Onboarding**: Full-screen immersive experience
- **Dashboard**: Side-by-side couple view for desktop
- **Browse**: Grid layout with filtering sidebar
- **Matches**: Timeline view with export options

#### PWA Capabilities
- Install prompt after 2nd session
- Offline vote queueing
- Push notifications (partner activity, new matches)

### Component Library

#### Cards
```typescript
interface ActivityCardProps {
  title: string;
  category: Category;
  intensity: 1-5;
  duration?: string;
  image?: string;
  tags: string[];
  variant: 'stack' | 'grid' | 'list';
}
```

#### Buttons
- Primary: Coral, rounded-full, shadow
- Secondary: Outline, rounded-full
- Ghost: Text-only for subtle actions
- Icon: Circular, 44px touch target

#### Inputs
- Underline style (minimal, clean)
- Floating labels
- Inline validation with icons

### Motion System

#### Transitions
```
Screen enter: 300ms ease-out
Screen exit: 200ms ease-in
Card swipe: Spring physics (tension: 120, friction: 8)
Match celebration: 800ms staggered confetti
Modal: 250ms scale + fade
```

#### Micro-interactions
- Button press: Scale 0.96
- Card hover/lift: Shadow increase + translateY(-4px)
- Success: Checkmark draw animation
- Loading: Skeleton shimmer

---

## 3. INFORMATION ARCHITECTURE + NAVIGATION MAP

### App Structure

```
├── (auth)
│   └── _layout.tsx              # Auth gate logic
│
├── (onboarding)                 # First-time flow
│   ├── index.tsx               # Brand moment
│   ├── value.tsx               # Value prop
│   ├── privacy.tsx             # Privacy promise
│   ├── profile.tsx             # Create profile
│   └── invite.tsx              # Partner invite
│
├── (app)                        # Main authenticated app
│   ├── _layout.tsx             # Tab navigator
│   │
│   ├── (home)
│   │   ├── index.tsx           # Discovery Hub
│   │   ├── browse.tsx          # Grid browse
│   │   └── activity/[id].tsx   # Activity detail
│   │
│   ├── (deck)
│   │   └── index.tsx           # Swipe deck
│   │
│   ├── (matches)
│   │   ├── index.tsx           # Matches list
│   │   ├── [id].tsx            # Match detail
│   │   └── favorites.tsx       # Saved matches
│   │
│   ├── (insights)               # Gated content
│   │   ├── index.tsx           # Overview dashboard
│   │   ├── compatibility.tsx   # Couple analysis
│   │   └── trends.tsx          # Voting trends
│   │
│   └── (settings)
│       ├── index.tsx           # Settings menu
│       ├── profiles.tsx        # Profile management
│       ├── profiles/new.tsx    # Add profile
│       ├── privacy.tsx         # Privacy settings
│       ├── billing.tsx         # Subscription/unlock
│       ├── custom-activities.tsx # User-created
│       └── help.tsx            # Support
│
├── (unlock)
│   └── index.tsx               # Paywall screen
│
├── _layout.tsx                 # Root layout
└── +not-found.tsx              # 404
```

### Navigation State Machine

```
[App Launch]
    │
    ├─→ [Has Profile?] ──NO──→ [Onboarding Flow]
    │                              │
    │                              ↓
    │                        [Create Profile]
    │                              │
    │                              ↓
    │                        [Partner Invite]
    │                              │
    │                              ↓
    │←─────────────────── [Discovery Hub]
    │
    └─→ YES → [Check PIN?] ──YES──→ [PIN Entry]
                │                      │
                NO                     ↓
                │←──────────────── [Discovery Hub]
                ↓
        [Discovery Hub]
```

### Deep Linking Schema
```
spicesync://                              # Open app
spicesync://activity/123                  # Specific activity
spicesync://matches                       # Matches list
spicesync://invite?code=ABC123            # Partner invite
spicesync://unlock                        # Paywall
```

---

## 4. FREE VS LIFETIME UNLOCK MATRIX

### Feature Comparison

| Feature | Free | Lifetime Unlock ($34.99) |
|---------|------|-------------------------|
| **Profiles** | 2 (one couple) | Unlimited profiles |
| **Voting** | Unlimited | Unlimited |
| **Matches** | View mutual yes | View + favorites + notes |
| **Discovery** | Basic categories | Advanced filters + search |
| **Insights** | Basic count | Full compatibility analysis |
| **Custom Activities** | ❌ | ✅ Create + share |
| **Export** | ❌ | PDF/CSV export |
| **Themes** | Default only | 5+ premium themes |
| **Support** | Email | Priority + chat |
| **Sync** | Manual | Automatic cloud backup |

### Paywall Triggers (Soft Gates)

| Action | Free Limit | Paywall Trigger |
|--------|-----------|-----------------|
| View insights details | 3 views | "See full analysis" |
| Create custom activity | 0 | "Add your own idea" |
| Export matches | 0 | "Save your matches" |
| Add 3rd+ profile | Blocked | "Unlock multi-profile" |
| Advanced filters | Limited | "More filters" |

### Pricing Strategy

**Lifetime Unlock: $34.99** (A/B test $24.99-$39.99)
- Positioned as "less than one date night"
- One-time payment, own forever
- 30-day money-back guarantee

**Launch Promo: $19.99** (early adopters)
- Limited time offer
- "Founding Couple" badge
- Future feature early access

### Paywall Copy

**Headline:** "Go deeper together"
**Subheadline:** "Unlock unlimited profiles, advanced insights, and your private activity library."
**CTA:** "Unlock Lifetime Access"
**Guarantee:** "30-day money-back guarantee. No subscriptions, ever."

---

## 5. 90-DAY ROADMAP + KPI TARGETS

### Phase 0: Stabilize (Weeks 1-2)
**Focus:** Fix technical debt, establish quality baseline

| Task | Owner | Deliverable |
|------|-------|-------------|
| Consolidate stores | Eng | Single settings store |
| Fix routing | Eng | Canonical route structure |
| CI/CD setup | Eng | Typecheck + tests on PR |
| Bug bash | QA | Zero critical bugs |

**KPIs:**
- Crash-free sessions: >99%
- Route errors: 0
- Test coverage: >60%

### Phase 1: UX Core (Weeks 3-5)
**Focus:** Ship redesigned core loop

| Task | Owner | Deliverable |
|------|-------|-------------|
| Design system | Design | Token library + components |
| Onboarding v2 | Eng | 5-screen flow |
| Discovery hub | Eng | Search + filters |
| Deck redesign | Eng | Swipe deck v2 |
| Match celebration | Eng | Confetti + actions |

**KPIs:**
- Onboarding completion: >70%
- Time to first match: <3 min
- D1 retention: >40%

### Phase 2: Monetization (Weeks 6-8)
**Focus:** Unlock paywall + insights

| Task | Owner | Deliverable |
|------|-------|-------------|
| Paywall UI | Eng | Full-screen modal |
| IAP integration | Eng | RevenueCat setup |
| Insights dashboard | Eng | Compatibility view |
| A/B framework | Eng | Experiment infra |

**KPIs:**
- Paywall view→purchase: >5%
- Unlock conversion: >3%
- ARPPU: >$25

### Phase 3: Growth (Weeks 9-12)
**Focus:** Web + retention loops

| Task | Owner | Deliverable |
|------|-------|-------------|
| Web app | Eng | Responsive PWA |
| Referral system | Eng | Invite codes |
| Re-engagement | Eng | Push notifications |
| ASO optimization | Growth | Store listing v2 |

**KPIs:**
- D7 retention: >25%
- Referral rate: >10%
- Store conversion: >15%

### 90-Day Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Monthly Active Users | 5,000 | 0 |
| Unlock Conversion | 3% | 0% |
| D1 Retention | 40% | - |
| D7 Retention | 25% | - |
| Crash-free Rate | 99.5% | - |
| App Store Rating | 4.5+ | - |

---

## 6. TECHNICAL ARCHITECTURE PLAN

### Current State Analysis

**Strengths:**
- Expo Router for navigation
- Zustand for state management
- Localization framework in place
- Store structure established

**Technical Debt:**
- Duplicate theme files (app/constants vs constants/)
- Mixed legacy/new route patterns
- Multiple settings stores
- Weak type safety in places

### Migration Path

#### Week 1-2: Foundation

**1. Route Consolidation**
```typescript
// Before (scattered)
app/(home)/CategoryScreen.tsx
app/welcome/index.tsx
app/settings.tsx

// After (canonical)
app/(app)/(home)/index.tsx
app/(onboarding)/index.tsx
app/(app)/(settings)/index.tsx
```

**2. Store Consolidation**
```typescript
// Merge into single settings store
interface SettingsStore {
  // Profile
  activeProfileId: string;
  profiles: Profile[];
  
  // Preferences
  language: 'en' | 'es';
  theme: 'dark' | 'light';
  haptics: boolean;
  
  // Age gate (merged from separate store)
  ageVerified: boolean;
  
  // Premium (linked to IAP store)
  unlocked: boolean;
}
```

**3. Theme Unification**
```typescript
// Single source: app/theme/index.ts
export const tokens = {
  colors: { /* single palette */ },
  spacing: { /* 8px grid */ },
  typography: { /* type ramp */ },
  shadows: { /* elevation system */ },
};
```

#### Week 3-5: UX Implementation

**Component Architecture**
```
components/
├── primitives/          # Base components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── Icon.tsx
├── composite/           # Composed components
│   ├── ActivityCard.tsx
│   ├── SwipeDeck.tsx
│   └── MatchModal.tsx
└── screens/             # Screen-specific
    ├── OnboardingFlow.tsx
    ├── DiscoveryHub.tsx
    └── InsightsDashboard.tsx
```

**Navigation Guards**
```typescript
// app/_layout.tsx
function RootLayout() {
  const { hasProfile, ageVerified } = useSettings();
  
  if (!hasProfile) return <Redirect href="/(onboarding)" />;
  if (!ageVerified) return <Redirect href="/(onboarding)/privacy" />;
  
  return <AppLayout />;
}
```

#### Week 6-8: Monetization

**IAP Integration**
```typescript
// stores/premium.ts
interface PremiumStore {
  // Entitlements
  unlocked: boolean;
  
  // IAP
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
  
  // Feature gates
  canAccess: (feature: Feature) => boolean;
}
```

**Paywall Integration**
```typescript
// hooks/usePaywall.ts
function usePaywall() {
  const { unlocked } = usePremiumStore();
  const [showPaywall, setShowPaywall] = useState(false);
  
  const checkAccess = (feature: Feature) => {
    if (unlocked) return true;
    setShowPaywall(true);
    return false;
  };
  
  return { checkAccess, showPaywall, hidePaywall };
}
```

#### Week 9-12: Web + Analytics

**Web Build**
```bash
# Expo web configuration
expo export --platform web
# Deploy to Vercel/Netlify
```

**Analytics**
```typescript
// lib/analytics.ts
export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    // Amplitude/Mixpanel
  },
  identify: (userId: string, traits?: Record<string, any>) => {
    // User identification
  },
};
```

### Data Migration Strategy

**User Data Preservation**
```typescript
// migrations/v1-to-v2.ts
export async function migrateV1ToV2() {
  const legacySettings = await AsyncStorage.getItem('settings-v1');
  const legacyAgeGate = await AsyncStorage.getItem('age-gate');
  
  const newSettings = {
    ...parse(legacySettings),
    ageVerified: parse(legacyAgeGate)?.confirmed || false,
  };
  
  await AsyncStorage.setItem('settings-v2', JSON.stringify(newSettings));
}
```

---

## 7. PRIORITIZED BACKLOG

### Epic: Foundation (Week 1-2)

#### Story 1.1: Consolidate Settings Store
**Acceptance Criteria:**
- [ ] Single settings store at `stores/settings.ts`
- [ ] All components import from canonical location
- [ ] Legacy stores marked deprecated
- [ ] No duplicate state between stores

**Engineering Notes:**
- Audit all store imports with grep
- Create migration path for existing user data
- Update all components in one PR

#### Story 1.2: Canonical Route Structure
**Acceptance Criteria:**
- [ ] All routes under `(app)/` follow convention
- [ ] No orphaned legacy screens
- [ ] Deep links work for all main flows
- [ ] Type-safe route params

**Engineering Notes:**
- Use Expo Router typed routes
- Move legacy screens to `deprecated/` folder
- Update navigation references

#### Story 1.3: Unified Theme System
**Acceptance Criteria:**
- [ ] Single theme file: `theme/index.ts`
- [ ] All screens use theme tokens
- [ ] No hardcoded colors/strings
- [ ] Dark mode support

**Engineering Notes:**
- Create token generator from Figma
- ESLint rule: no hardcoded colors
- Gradual migration (file-by-file)

---

### Epic: Onboarding (Week 3)

#### Story 2.1: Brand Moment Screen
**Acceptance Criteria:**
- [ ] Animated logo entrance (2s)
- [ ] Tagline: "Discover together"
- [ ] Auto-advance to value prop
- [ ] Skip option for returning users

**Engineering Notes:**
- Use Lottie for complex animation
- 5-second max before auto-advance

#### Story 2.2: Profile Creation
**Acceptance Criteria:**
- [ ] Name input with validation
- [ ] Emoji avatar picker
- [ ] Age verification checkbox
- [ ] Privacy policy acknowledgment

**Engineering Notes:**
- Store profile in settings store
- Validate age 18+ (client-side)

#### Story 2.3: Partner Invitation
**Acceptance Criteria:**
- [ ] Generate unique invite code
- [ ] Share via native share sheet
- [ ] QR code display
- [ ] "Partner joined" notification

**Engineering Notes:**
- Code format: XXX-XXX (6 chars)
- Deep link: `spicesync://invite?code=XXX`

---

### Epic: Discovery (Week 4)

#### Story 3.1: Discovery Hub
**Acceptance Criteria:**
- [ ] Search bar with real-time results
- [ ] Category chips (scrollable)
- [ ] Mood filters (Romantic, Playful, etc.)
- [ ] Intensity slider (1-5)
- [ ] "Surprise me" shuffle button

**Engineering Notes:**
- Debounce search input (300ms)
- Filter client-side for speed
- Empty state: "Try different filters"

#### Story 3.2: Activity Detail View
**Acceptance Criteria:**
- [ ] Full activity card
- [ ] Related activities
- [ ] "Add to deck" CTA
- [ ] Share button

**Engineering Notes:**
- Use shared element transition
- Preload related activities

---

### Epic: Deck (Week 4-5)

#### Story 4.1: Swipe Deck v2
**Acceptance Criteria:**
- [ ] Cards 85% width, 60% height
- [ ] Category color borders
- [ ] Intensity dots (1-5)
- [ ] Progress counter ("Card 3 of 50")
- [ ] Swipe overlays (YES/NO/MAYBE)

**Engineering Notes:**
- Reanimated 3 for gestures
- Spring physics for release
- Haptic feedback on threshold

#### Story 4.2: Match Celebration
**Acceptance Criteria:**
- [ ] Full-screen modal
- [ ] Confetti animation (50 particles)
- [ ] "You both said YES!"
- [ ] 3 action buttons
- [ ] Auto-close after 8s

**Engineering Notes:**
- Use react-native-confetti-cannon
- Trigger haptics (success pattern)

---

### Epic: Monetization (Week 6-8)

#### Story 5.1: Paywall UI
**Acceptance Criteria:**
- [ ] Full-screen modal design
- [ ] Feature comparison table
- [ ] Pricing display ($34.99)
- [ ] "Restore purchases" link
- [ ] Terms/Privacy links

**Engineering Notes:**
- A/B test 2 variants
- Track view/purchase funnel

#### Story 5.2: IAP Integration
**Acceptance Criteria:**
- [ ] RevenueCat SDK integrated
- [ ] Purchase flow works end-to-end
- [ ] Receipt validation
- [ ] Restore purchases works
- [ ] Test in sandbox

**Engineering Notes:**
- Use react-native-purchases
- Configure products in App Store Connect

#### Story 5.3: Feature Gates
**Acceptance Criteria:**
- [ ] `usePaywall()` hook
- [ ] Soft gates on premium features
- [ ] Clear upgrade messaging
- [ ] No hard crashes for free users

**Engineering Notes:**
- Graceful degradation
- Clear value proposition in gates

---

### Epic: Insights (Week 7-8)

#### Story 6.1: Compatibility Dashboard
**Acceptance Criteria:**
- [ ] Compatibility score (0-100%)
- [ ] Category breakdown (bar chart)
- [ ] Intensity preferences (pie chart)
- [ ] Voting trends (line chart)

**Engineering Notes:**
- Use react-native-chart-kit
- Calculate scores client-side
- Export to PDF (premium)

#### Story 6.2: Achievement System
**Acceptance Criteria:**
- [ ] 20+ achievements defined
- [ ] Progress tracking
- [ ] Unlock animations
- [ ] Share achievement

**Engineering Notes:**
- Store progress in achievements store
- Trigger on relevant actions

---

### Epic: Growth (Week 9-12)

#### Story 7.1: Referral System
**Acceptance Criteria:**
- [ ] Generate referral code
- [ ] Track referrals
- [ ] Reward unlock (both parties)
- [ ] Referral dashboard

**Engineering Notes:**
- Backend tracking required
- Reward: 1 month premium or discount

#### Story 7.2: Push Notifications
**Acceptance Criteria:**
- [ ] New match notification
- [ ] Partner joined notification
- [ ] Streak reminder
- [ ] Custom content suggestions

**Engineering Notes:**
- Use Expo Notifications
- Request permission at right moment

#### Story 7.3: Web App
**Acceptance Criteria:**
- [ ] Responsive layout
- [ ] Core flows work (browse, matches)
- [ ] PWA installable
- [ ] Shared state with mobile

**Engineering Notes:**
- Expo Web for consistency
- Focus on landing + dashboard

---

## 8. LAUNCH + GROWTH PLAN

### Pre-Launch (Week 12)

**Beta Program**
- Target: 50 couples
- Channels: Personal network, Reddit r/sex, ENM forums
- Incentive: Free lifetime unlock for feedback

**App Store Preparation**
- Screenshots: 5 mobile, 3 tablet
- Preview video: 30 seconds
- Keywords: couples app, intimacy, compatibility, relationship
- Description: Focus on privacy + one-time pricing

### Launch Day

**Channels**
1. Product Hunt
2. Reddit (r/sex, r/relationships, r/polyamory)
3. Twitter/X couples content creators
4. Relationship podcasts (sponsored)

**Metrics to Track**
- Downloads (goal: 500 day 1)
- Activation rate (onboarding completion)
- First-match rate
- Crash reports

### Post-Launch Growth

**Week 1-4: Retention Focus**
- Daily push: "New activity suggestion"
- Email drip: Tips for using matches
- In-app: "Complete your profile" nudges

**Month 2-3: Acquisition**
- Influencer partnerships (couples content)
- ASO optimization based on conversion data
- Referral program launch

**KPI Dashboard**
```
Acquisition:
- Downloads/day
- Cost per install
- Store conversion rate

Activation:
- Onboarding completion %
- Time to first match
- First-session actions

Retention:
- D1, D7, D30 retention
- Sessions per week
- Votes per session

Revenue:
- Paywall view rate
- Unlock conversion %
- ARPPU
- Lifetime value

Referral:
- Invites sent/couple
- Invite acceptance rate
- Viral coefficient
```

### Content Strategy

**Blog Topics**
1. "How to talk about intimacy with your partner"
2. "50 questions to deepen your connection"
3. "Navigating consent in long-term relationships"
4. "ENM basics: Communication tools"

**Social Media**
- Instagram: Aesthetic couple imagery + quotes
- TikTok: "Try this with your partner" short videos
- Twitter: Thread storytelling + polls

### Success Metrics (6 Months)

| Metric | Target |
|--------|--------|
| Total Downloads | 50,000 |
| Monthly Active Couples | 10,000 |
| Unlock Conversion | 4% |
| Revenue (Monthly) | $15,000 |
| App Store Rating | 4.6 |
| D30 Retention | 20% |

---

## APPENDIX: CURRENT REPO FILE MAP

```
SpiceSync/
├── apps/
│   └── mobile/
│       ├── app/
│       │   ├── (about)/          # About, privacy, achievements
│       │   ├── (browse)/         # Browse screens
│       │   ├── (deck)/           # Swipe deck
│       │   ├── (home)/           # Category, discovery
│       │   ├── (matches)/        # Matches list
│       │   ├── (settings)/       # Settings screens
│       │   ├── (tabs)/           # Tab navigation
│       │   ├── welcome/          # Onboarding flow
│       │   ├── _layout.tsx       # Root layout
│       │   └── index.tsx         # Entry redirect
│       │
│       ├── components/           # Shared components
│       ├── constants/            # Theme, config
│       ├── lib/
│       │   ├── data/             # Kinks/activities data
│       │   └── state/            # Legacy stores
│       ├── src/
│       │   └── stores/           # New stores (premium, etc)
│       └── package.json
│
├── docs/                         # Documentation
├── package.json                  # Root config
└── TASK_BREAKDOWN.md             # Implementation tracking
```

---

*Document Version: 2026.2.26*
*Author: Gatsby (OpenClaw) powered by Kimi/Codex*
*Status: Implementation Ready*
