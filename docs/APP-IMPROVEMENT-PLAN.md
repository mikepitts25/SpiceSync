# SpiceSync App Improvement Plan

Written 2026-07-12 from a full codebase analysis. Goal: make the game genuinely
fun and sexy for 1–4 players, make kink selection/matching smooth and clear,
and clean up the debt that causes real bugs.

Each item is self-contained with file paths so it can be picked up cold.
Work top to bottom within a priority tier unless told otherwise.

---

## P0 — Critical bug (fix before anything else)

### 1. Votes silently dropped on the legacy deck route — ✅ DONE

- `app/(home)/DiscoveryHub.tsx:95` and `app/(suggestions)/index.tsx:237,290`
  push to `/(deck)`, which resolves to the **legacy** `app/(deck)/DeckScreen.tsx`,
  not the real deck tab at `app/(tabs)/deck.tsx`.
- The legacy screen's `saveVote` (`app/(deck)/DeckScreen.tsx:43-56`) calls a
  React hook (`store.useVotes()`) outside of render, inside `try/catch {}`.
  It throws and is swallowed every time — users swipe, nothing saves, matches
  never appear.
- **Fix:** repoint those three navigations to `/(tabs)/deck`, then delete:
  - `app/(deck)/DeckScreen.tsx` (and the `(deck)` route group if empty)
  - `components/SwipeDeck.tsx`, `components/SwipeDeckRedesigned.tsx`,
    `components/SwipeDeckV2.tsx` (only the legacy screen imports these)
- Verify: `npm test`, then manually navigate Discovery Hub → deck and confirm
  a swipe creates a vote in `src/stores/votes.ts` state.

---

## P1 — Kink deck UX (highest user-visible payoff)

### 2. Undo on the swipe deck — ✅ DONE

- A mis-swiped "Hard No" is unrecoverable and hard-nos are permanently hidden
  from matching by design (`lib/votes/rolePreferences.ts`).
- Add an undo button to `app/(tabs)/deck.tsx`: keep a small history stack of
  `(kinkId, previousRecord)` per session; undo restores the previous vote
  record (or clears it) via the votes store and steps the queue back.
- There is an abandoned remote branch `origin/feat/deck-undo` worth mining,
  but do not merge it blindly — the deck screen has since been rewritten.

### 3. Progress + payoff loop on the deck — ✅ DONE

- No position indicator today. Add "12 of 89 · Naughty" near the tier filter
  in `app/(tabs)/deck.tsx` (queue length is already computed).
- Show potential-match momentum: when the active profile's vote lands on a
  kink the partner already voted yes/curious on, surface a small
  "+1 potential match" pulse. Partner votes are already available on-card
  (`partnerVotes` / `remotePartnerVotes` in that file).
- Celebrate finishing a tier (reuse `components/EnhancedMatchCelebration.tsx`
  or a lighter variant) with a CTA to the Matches tab.

### 4. i18n gaps on core screens (ES users see mixed language) — ✅ DONE

Hardcoded English that bypasses `lib/i18n`:
- `READINESS_ACTIONS` labels in `app/(tabs)/deck.tsx:82-117`
  ("Hard No", "Not Now", "Curious", "Yes")
- "Give / Receive / Both" role selector in the same file (~line 201)
- "Number of Players" in `components/game/GameSetupPanel.tsx:106`
- Audit `components/game/GameControls.tsx` and `GameSessionChrome.tsx` for
  any other literals.
Add keys to `lib/i18n/en.ts` + `lib/i18n/es.ts` and use them.

### 5. Consolidate rating entry points — ✅ DONE

- `app/(tabs)/kinks.tsx` (tier picker), `app/(tabs)/categories.tsx`,
  `app/(tabs)/browse.tsx`, and `app/(tabs)/deck.tsx` all lead to rating
  content. The tier picker just sets the same filter the deck already has
  as chips.
- Make the deck the single rating surface; turn the kinks tier picker into a
  redirect or remove it from navigation. Note `app/(tabs)/kinks.tsx:48` uses
  `(useProfiles() as any)` — that screen is legacy-quality anyway.

### 6. Starter pack onboarding (time-to-first-match) — ✅ DONE

- New couples face 330 kinks (`data/kinks.en.json`) before anything happens.
- Curate ~15 broadly-popular, low-intensity kink ids as a "starter pack";
  first deck session serves only those, then celebrates the first matches
  and unlocks the full catalog. First-session matches are the retention event.

---

## P2 — Game overhaul (fun & sexy for 1–4 players)

### 7. Solo mode (1 player) — ✅ DONE

- `lib/gameSession.ts:1` hardcodes `MIN_GAME_PLAYERS = 2`; setup panel offers
  only 2/3/4 (`components/game/GameSetupPanel.tsx:108`).
- Add a 1-player mode with its own card pool style:
  - anticipation dares ("send your partner this tease text…")
  - self-discovery truths that can save into the fantasy journal
    (`lib/state/fantasyJournal.ts`, share-to-matching stays explicit)
  - confidence/prep challenges
- Solo mode skips the Player→Target matchup UI and consequences.

### 8. Group-safe card flags (3–4 players) — ✅ DONE

- Cards are written couple-to-couple ("Undress me completely using only your
  mouth") but the turn engine (`getGameTurn` in `lib/gameSession.ts`) deals
  them to ANY Player→Target pair — including two guests at a 4-player night.
- Add `minPlayers?: number` / `maxPlayers?: number` (or `groupSafe: boolean`)
  to `GameCard` in `data/gameCards.ts`; filter by active player count where
  decks are built (`lib/gameLevelFilter.ts` /
  `filterCardsBySelectedLevels` call in `app/(game)/index.tsx`).
- Classify existing cards: couple-only intimacy stays 2-player; flirty/party
  energy cards carry 3–4 player games. Write new group-safe cards where the
  3–4 player pool is thin. Card data lives in `data/gameCards.ts`,
  `data/game_cards_level{1-5}.ts`, ES variants in `data/gameCards.es.ts` and
  `data/gameCardTranslations.ts`.

### 9. Match-aware game deck (the differentiator) — ✅ DONE

- The game ignores the couple's vote data entirely. The app knows their
  mutual yeses (`lib/match/compute.ts` `computeMatchBuckets`,
  `lib/match/actionBuckets.ts`).
- Weight `createShuffledGameDeck` (`lib/gameDeck.ts`) toward card categories
  matching the couple's `mutualYes` buckets, and inject occasional
  "Inspired by your matches" cards referencing a mutual-yes kink by title.
- Respect privacy: only use data both partners have already revealed to each
  other (same rule as the matches screen / reveal consent in
  `lib/sync/revealConsent.ts`).

### 10. Session intensity arc — ✅ DONE

- `createShuffledGameDeck` is a flat shuffle; intense mode can open on a
  level-5 card cold.
- After shuffling, sort each dealt deck into a warm-up → build → peak ramp
  (e.g., first third biased low intensity, ramping up). Keep it seeded/testable
  like the existing shuffle (it takes an injectable `random`).

### 11. More consequences, scaled to mode — ✅ DONE

- Only 5 base + 3 drinking templates in `lib/gameSession.ts:35-81`; they
  repeat after a few passes.
- Expand pool substantially; scale spiciness with the selected mode
  (normal vs intense); add "Target invents the consequence" as an option.
  Keep ES translations in `formatGameConsequenceText`
  (`app/(game)/index.tsx:959`) in sync — or better, move consequence copy
  into i18n.

### 12. Setup flexibility + heat rounds — ✅ DONE

- Modes hardcode levels (`GAME_MODE_LEVELS` in `app/(game)/index.tsx:83`:
  normal=1-3, intense=4-5). Allow custom level selection and card-type
  filters (truth-only night, no-roleplay, etc.).
- Add a periodic "Heat Round" every N turns involving all players at once,
  so non-active players stay engaged in 3–4 player games.

---

## P3 — Store-readiness and debt

### 13. App Store metadata pass — ✅ DONE (see docs/app-store-metadata.md)

- iOS guideline 1.1.4 rejections in this category are usually about store
  METADATA (screenshots, description), not the app. Keep listing copy
  neutral/non-graphic (consistent with CONTRIBUTING.md), 17+ rating, and
  mention age gate + discrete mode + local-only storage in review notes.

### 14. Dead code / structure consolidation — ✅ DONE

- Finish the `lib/` vs `src/` store consolidation (CLAUDE.md notes the split).
  Duplicates: two theme files (`constants/theme.ts`, `src/constants/theme.ts`),
  two profile stores, `src/stores/settings.ts` vs `settingsStore.ts`.
- The P0 bug is exactly the class of failure this split causes.

### 15. Split MatchesScreen.tsx — ✅ DONE

- `app/(matches)/MatchesScreen.tsx` is 2,401 lines. Split into bucket
  section components before it calcifies. Consider a Matches tab badge with
  the Ready Now count.

---

## Suggested working order

| Order | Items | Size |
|---|---|---|
| 1 | P0 #1 | small |
| 2 | #2 undo, #3 progress, #4 i18n | 1–2 days combined |
| 3 | #9 match-aware deck, #10 arc | the flagship features |
| 4 | #7 solo mode, #8 group-safe flags, #11 consequences | content-heavy |
| 5 | #5, #6, #12–15 | as time allows |

Run `npm test` and `npm run lint` (from `apps/mobile/`) before each commit.
