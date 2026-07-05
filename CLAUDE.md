# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SpiceSync is a privacy-first, offline-by-default interest matching app for adult couples (18+). All data is stored locally on-device — there is no server sync. Partners compare preferences using QR/share codes that encode votes as compact base64 strings.

## Commands

All commands run from `apps/mobile/`:

```bash
npx expo start          # Start Expo Go dev server
npm run ios             # Run on iOS simulator (requires Xcode)
npm run android         # Run on Android emulator
npm test                # Run Jest unit tests
npm test -- --testPathPattern=<name>  # Run a single test file
npm run lint            # ESLint
npm run format          # Prettier
npm run build:kinks     # Rebuild kinks data bundle
npm run e2e:build       # Build Detox E2E test binary
npm run e2e:test        # Run Detox E2E tests (iOS sim)
```

Node version constraint: `>=20 <23`.

## Architecture

### Stack
- **React Native** + **Expo SDK 53** (new architecture enabled)
- **Expo Router** (file-based routing, `expo-router/entry` as main)
- **TypeScript** (strict mode, path alias `@/*` → `apps/mobile/*`)
- **Zustand** + AsyncStorage for all persistent state
- **i18next** for EN/ES localization

### Directory Layout

```
apps/mobile/
  app/              # Expo Router screens (route groups below)
  components/       # Shared UI components (SwipeDeck, FlippableCard, etc.)
  constants/        # theme.ts — single source of colors/typography
  data/             # Static content: kinks JSON, game cards, conversation starters
  hooks/            # Custom React hooks
  lib/              # Business logic and state stores
  src/              # Additional stores and components (legacy split, not fully consolidated)
```

### Route Groups

| Group | Purpose |
|---|---|
| `(onboarding)` | Age gate, brand intro, privacy, profile creation, partner invite |
| `(tabs)` | Main tab navigator: browse, deck, matches, conversation, game, kinks |
| `(settings)` | Profiles, achievements, export, notifications, love-languages |
| `(game)` | Custom deck builder, draw, complete screens |
| `(conversation)` | Conversation starters: date-night, kink-topics |
| `(matches)` | Match results, date-night view, kink topics |
| `(about)` | About, insights, achievements display |
| `(unlock)` / `(redeem)` | Premium paywall and gift code redemption |
| `(browse)` | Browse and filter all kinks |
| `(suggestions)` | Suggestion flow |

### State Stores (all Zustand + AsyncStorage)

| Store | File | Purpose |
|---|---|---|
| `useSettings` | `lib/state/useStore.ts` | Age confirmation, discrete mode, language |
| `useProfilesStore` | `lib/state/profiles.ts` | Local profiles with name/emoji/PIN/color |
| `useVotesStore` | `src/stores/votes.ts` | Per-profile yes/maybe/no votes on kinks |
| `usePartnerStore` | `src/stores/partner.ts` | Partner connection via invite codes |
| `useShareCodes` | `lib/state/shareCodes.ts` | Offline share code generation/decoding |
| `useConversationStore` | `lib/state/conversationStore.ts` | Conversation favorites, history, date-night settings |
| `useStreakStore` | `lib/achievements.ts` | Daily streaks and achievement unlocks |
| `useMatchPlansStore` | `lib/state/matchPlans.ts` | Local match-to-plan state: favorites, next session, completed history, private notes |
| `useFantasyJournalStore` | `lib/state/fantasyJournal.ts` | Private fantasy journal; entries feed matching only via explicit share action |

`lib/state/votes.ts` is a deprecated re-export shim — use `src/stores/votes.ts` directly.

### Key Modules

- **`lib/data.ts`** — Loads and deduplicates kink items from `data/kinks.en.json` / `data/kinks.es.json`. Collapses multi-step sequences into single entries.
- **`lib/match/compute.ts`** — Pure function `computeMatchBuckets()` that produces `mutualYes`, `partial`, `mutualMaybe` buckets from two profiles' votes.
- **`lib/match/actionBuckets.ts`** — `computeActionBuckets()` produces actionable groups (Ready Now / Curious Together / Needs Conversation / hidden count) from readiness-aware votes, plus `explainMatch()` for match explanations.
- **`lib/votes/rolePreferences.ts`** — Vote record model. Votes are `yes/maybe/no`, optionally refined by a `readiness` state (`yes/curious/not_now/hard_no`) that always projects onto a legacy vote value for share-code/sync compatibility. A legacy plain `no` is treated as private (never surfaced), only an explicit `not_now` becomes a conversation topic.
- **`lib/kinks/guidance.ts`** — Derives risk/trust/experience levels and prep/safety/aftercare/consent-prompt defaults from kink metadata; explicit JSON fields (`riskLevel`, `prep`, `safetyNotes`, `aftercare`, `consentPrompts`, …) win over derived defaults.
- **`lib/safety/safetyFilter.ts`** — Validates custom activity titles/descriptions against a blocked-terms list.
- **`lib/storage/mmkv.ts`** — AsyncStorage adapter named "mmkv" for historical reasons; was switched from react-native-mmkv to AsyncStorage for Expo Go compatibility.
- **`lib/pricing.ts`** — IAP product SKUs and pack definitions ($4.99 base premium, $2.99 à la carte packs).
- **`lib/lock.ts`** — Biometric/FaceID app lock via `expo-local-authentication` + `expo-secure-store`.
- **`lib/deepLinks.ts`** — Handles `spicesync://invite?code=XXX-XXX` deep links for partner invite flow.

### Data Files

- `data/kinks.en.json`, `data/kinks.es.json` — Primary kink content (id, slug, title, description, tags, category, intensityScale 1-3, tier: soft/naughty/xxx)
- `data/game_cards_level{1-5}.ts` — Game cards tiered by intensity
- `data/conversation_starters_*.ts` — Conversation starter packs (date night, getting-to-know, love languages, relationship, spicy) with EN/ES variants

### Theme

Defined in `constants/theme.ts`. Dark-first design:
- Background: `#0D0D15`, card: `#1E1E2E`
- Primary: `#FF2D92` (hot pink), secondary: `#8B5CF6` (purple), accent: `#00D9FF` (cyan)
- Vote colors: yes=`#22C55E`, no=`#EF4444`, maybe=`#F59E0B`
- Tier gradient pairs: soft (pink→purple), naughty (pink→red), xxx (red→dark red)

### Privacy Model

- Zero server storage — all votes, profiles, and matches stay on-device
- Partner comparison works via encoded share codes (base64 JSON compressed votes) shared as QR or text
- Biometric lock and per-profile PIN (`expo-local-authentication`, `expo-secure-store`)
- Discrete mode hides app content for shoulder-surfing protection
- Age gate must be confirmed before accessing any content

## Content Guidelines

From `CONTRIBUTING.md`: keep language neutral and non-graphic. Run lint and tests before PRs.
