# SpiceSync 2026 Implementation Plan

## 1. Product Strategy
**Positioning:** "The most private, playful compatibility app for couples"

**Key Differentiators:**
- One-time unlock ($34.99) vs subscriptions
- Local-first privacy
- <3 min to first match
- ENM/poly native support

## 2. UX/UI Design System
**Colors:** Coral #E85A5A, Plum #9B6B9B, Teal #4ECDC4, Dark #0F0F12
**Typography:** Playfair Display (headlines), Inter (body)
**Motion:** Spring physics for cards, 300ms screen transitions

## 3. Information Architecture
```
(onboarding) → (app)
  ├── index (brand)
  ├── value
  ├── privacy
  ├── profile
  └── invite

(app)
  ├── (home)/index (discovery hub)
  ├── (deck)/index (swipe)
  ├── (matches)/index
  ├── (insights)/index [premium]
  └── (settings)/index
```

## 4. Monetization: Free vs Lifetime

| Feature | Free | Unlock ($34.99) |
|---------|------|-----------------|
| Profiles | 2 | Unlimited |
| Custom Activities | ❌ | ✅ |
| Insights | Basic | Full dashboard |
| Export | ❌ | PDF/CSV |
| Themes | Default | Premium packs |

## 5. 90-Day Roadmap

### Phase 0: Stabilize (Weeks 1-2)
- [ ] Consolidate settings stores
- [ ] Canonical route structure
- [ ] CI/CD with tests
- [ ] Crash-free >99%

### Phase 1: UX Core (Weeks 3-5)
- [ ] Onboarding v2 (5 screens)
- [ ] Discovery hub
- [ ] Swipe deck redesign
- [ ] Match celebration

### Phase 2: Monetization (Weeks 6-8)
- [ ] Paywall UI
- [ ] RevenueCat IAP
- [ ] Insights dashboard
- [ ] A/B framework

### Phase 3: Growth (Weeks 9-12)
- [ ] Web app
- [ ] Referral system
- [ ] Push notifications
- [ ] ASO optimization

## 6. Technical Migration

### Store Consolidation
```typescript
// Merge into single store
interface SettingsStore {
  activeProfileId: string;
  profiles: Profile[];
  language: 'en' | 'es';
  ageVerified: boolean;
  unlocked: boolean;
}
```

### Route Cleanup
- Move to `(app)/` structure
- Remove legacy screens
- Type-safe routes

## 7. Prioritized Backlog

### Epic 1: Foundation (Week 1-2)

**Story 1.1: Consolidate Settings Store**
- AC: Single settings store, no duplicates
- Notes: Audit imports, migrate user data

**Story 1.2: Canonical Routes**
- AC: All routes under (app)/, no orphans
- Notes: Use Expo Router typed routes

**Story 1.3: Unified Theme**
- AC: Single theme/index.ts, no hardcoded values
- Notes: ESLint rule for colors

### Epic 2: Onboarding (Week 3)

**Story 2.1: Brand Moment**
- AC: Animated logo, 5s auto-advance

**Story 2.2: Profile Creation**
- AC: Name, emoji avatar, age verify

**Story 2.3: Partner Invite**
- AC: Code generation, QR, share sheet

### Epic 3: Discovery (Week 4)

**Story 3.1: Discovery Hub**
- AC: Search, category chips, mood filters, intensity slider

**Story 3.2: Activity Detail**
- AC: Full card, related, add to deck

### Epic 4: Deck (Week 4-5)

**Story 4.1: Swipe Deck v2**
- AC: 85% width, category borders, intensity dots, progress counter

**Story 4.2: Match Celebration**
- AC: Confetti, "You both said YES!", 3 actions, 8s auto-close

### Epic 5: Monetization (Week 6-8)

**Story 5.1: Paywall UI**
- AC: Full-screen, feature table, $34.99 price

**Story 5.2: IAP Integration**
- AC: RevenueCat, purchase flow, restore

**Story 5.3: Feature Gates**
- AC: usePaywall() hook, soft gates

### Epic 6: Insights (Week 7-8)

**Story 6.1: Compatibility Dashboard**
- AC: Score 0-100%, category bars, intensity pie, trends

**Story 6.2: Achievement System**
- AC: 20+ achievements, progress, unlock animation

### Epic 7: Growth (Week 9-12)

**Story 7.1: Referral System**
- AC: Codes, tracking, rewards

**Story 7.2: Push Notifications**
- AC: Match alerts, streak reminders

**Story 7.3: Web App**
- AC: Responsive, PWA, core flows

## 8. Launch Plan

### Pre-Launch
- Beta: 50 couples
- ASO: Screenshots, video, keywords
- Influencer outreach

### Launch Day
- Product Hunt
- Reddit (r/sex, r/relationships)
- Twitter/X couples creators

### Metrics (6 Months)
- Downloads: 50,000
- Monthly Active: 10,000 couples
- Unlock Conversion: 4%
- Revenue: $15,000/mo

---
*Created: 2026-02-27*
