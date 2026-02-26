# SpiceSync 2026 Master Plan (Prompt-Ready for OpenClaw + Kimi 2.5)

## Paste-Ready Prompt
You are my senior product + UX + mobile/web architect for SpiceSync. Build an implementation-ready transformation plan and execution backlog for this app based on the context below.

Constraints:
- Platform: existing Expo React Native app (`apps/mobile`) with future web support.
- Business model target: free core app + one-time lifetime unlock (no required subscription for core use).
- Domain: couples intimacy exploration app, privacy-first, consent-first.
- Audience: adults 21-45, couples (new + long-term), privacy-sensitive users.
- Priority: shippable, marketable, premium feel, and technically realistic.

Deliverables required:
1. Product strategy and competitive positioning.
2. Full UX overhaul (mobile + web) with 2026 best practices.
3. Information architecture and navigation map.
4. Monetization model (free vs lifetime unlock feature matrix).
5. 90-day roadmap with milestones and measurable KPIs.
6. Technical architecture actions for current codebase (state, routing, quality, analytics, paywall).
7. Prioritized backlog in this format: `Epic > Story > Acceptance Criteria > Engineering Notes`.
8. Launch plan (beta, App Store optimization, retention loops, referral mechanics).

Use the current app context snapshot below.

---

## Current App Snapshot (Codebase Audit)
- Stack: Expo Router + React Native + Zustand + AsyncStorage/MMKV style persistence.
- Existing strengths:
  - Privacy-oriented framing.
  - Profile system with PIN switching.
  - Core voting + matches flow.
  - Localization plumbing (`en`/`es`).
  - Stores for premium, achievements, leveling, custom activities.
- Current weaknesses:
  - Inconsistent architecture (duplicate settings stores, mixed legacy/new routes/screens).
  - Visual inconsistency across screens (multiple visual styles and token sources).
  - Onboarding + monetization flow not cohesive.
  - Many lint warnings, dead/legacy screen paths, and weak test/quality guardrails.

---

## 2026 Product Direction

### Positioning
"The most private, playful compatibility app for couples."

### ICP (Ideal Customer Profile)
- Primary: committed couples 25-40 wanting better intimacy communication.
- Secondary: younger couples 21-30 exploring boundaries safely.
- Tertiary: ENM/poly users who need multi-profile clarity and discretion.

### Category Differentiators
- Privacy-first by default (local-first data, clear consent UX).
- Playful experience over clinical tone.
- Fast path to "useful match" in under 3 minutes.
- One-time unlock option (anti-subscription fatigue differentiator).

---

## Monetization Model (Free + One-Time Unlock)

### Free (useful forever)
- Single couple mode (2 profiles max).
- Core swipe/vote + mutual yes matches.
- Limited filters + limited insights summary.
- Basic onboarding and safety content.

### Lifetime Unlock (one-time, suggested $24.99-$39.99 A/B)
- Unlimited profiles and profile sets.
- Advanced insights and compatibility trends.
- Custom activities and private packs.
- Premium deck controls, advanced filters, favorites lists, exports.
- Enhanced partner sync/share workflows.
- Cosmetic premium theme packs (non-explicit, tasteful).

### Optional Future
- Pro add-on (separate high-tier) only after PMF proof.
- Keep core value in free tier to avoid churn-driving paywall aggression.

---

## UX/UI Overhaul Blueprint (Mobile + Web)

### UX Principles (2026)
- Immediate value proof in first session (time-to-first-match < 3 min).
- Progressive disclosure for sensitive topics.
- Strong trust scaffolding (consent, boundaries, privacy reminders in-context).
- High legibility, thumb-first actions, reduced cognitive load.
- Emotion-forward microcopy, non-judgmental tone.

### UI System Direction
- Build one unified design system and remove duplicate theme files.
- Typography pair: editorial headline + clean sans body.
- Visual mood: warm, intimate, premium; avoid generic dark/purple-heavy defaults.
- Component library: cards, chips, segmented controls, sticky CTAs, celebration states.
- Motion: purposeful transitions (onboarding, match reveal, unlock moments), not decorative noise.
- Accessibility: WCAG 2.2 AA, dynamic type, focus order, touch target >= 44px.

### Web Product Shape
- Responsive web app for onboarding, browsing, profile management, and match review.
- Marketing site with conversion-focused landing + trust pages.
- PWA support for lightweight install and retention loops.

---

## Information Architecture (Target)
- Onboarding
- Home / Discovery
- Deck (vote)
- Matches
- Insights
- Custom Activities
- Partner Sync
- Settings (profiles, language, privacy, billing)
- Unlock (paywall, restore purchase)

---

## Technical Plan (Mapped to Current Repo)

### Phase 0: Stabilize (Week 1-2)
- Consolidate routing to a single canonical structure under Expo Router.
- Remove duplicate/legacy store patterns (single source for settings + age gate).
- Add route integrity checks and static path constants.
- Raise quality baseline: typecheck + tests in CI, warning budget policy.

### Phase 1: UX Core (Week 3-5)
- Unified design tokens and component primitives.
- Redesign onboarding, discovery, deck, matches core loop.
- Add premium visual polish and coherent motion system.

### Phase 2: Monetization + Insights (Week 6-8)
- Implement one-time unlock purchase flow and entitlement checks.
- Replace mock premium state with production IAP integration.
- Launch advanced insights dashboard (unlock-gated).

### Phase 3: Web + Growth (Week 9-12)
- Ship responsive web companion experience.
- Lifecycle triggers: streaks, reactivation nudges, partner invite loops.
- Experiment framework for paywall and onboarding conversion.

---

## KPI Framework
- Activation: `% users completing onboarding` and `% reaching first 20 votes`.
- Engagement: D7 retention, sessions/week, votes/session.
- Value: matches per active couple, time-to-first-match.
- Monetization: unlock conversion, unlock ARPPU, paywall view->purchase rate.
- Quality: crash-free sessions, route errors, bug regression rate.

---

## Immediate Bug Fixes Already Applied (This Pass)
- Fixed missing `/welcome` route entry by adding `app/welcome/index.tsx`.
- Fixed invalid onboarding destination (`/welcome/create-profile`) to a real route.
- Unified age-gate actions to the active settings store used by the entry gate.
- Added missing settings stack route for `profiles/new`.
- Repaired Jest config so tests run in this repo.
- Fixed compile-time path/type issues (`PaywallModal`, `ShareCodePanel`, `Insights`, theme token ordering, achievements typing).

---

## Next Implementation Request to Kimi
Create:
1. A concrete PR-by-PR backlog for the next 4 weeks.
2. Updated screen-level wireframes (mobile + web) in text spec form.
3. A final free-vs-lifetime unlock matrix with copy-ready paywall text.
4. A technical migration checklist that avoids breaking existing user data.
