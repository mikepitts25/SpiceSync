# Paired Kink Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace duplicate give/receive kink cards with one paired card that records Give, Receive, or Both and matches compatible partner roles.

**Architecture:** The mobile data loader will collapse opt-in `pairMode` give/receive source entries into one `pair:<pairKey>` card. Votes remain backward compatible with plain string values, but paired votes are stored as `{ value, pairPreference }` and synced through the Supabase relay. The admin tool exposes pair mode fields so future content can opt in or out.

**Tech Stack:** Expo Router, React Native, Zustand persisted stores, Jest, Node admin app.

---

### File Structure

- Modify `apps/mobile/lib/data.ts`: define pair types, collapse complete opt-in role pairs, preserve source IDs.
- Create `apps/mobile/lib/votes/rolePreferences.ts`: normalize vote records and evaluate paired role compatibility.
- Modify `apps/mobile/src/stores/votes.ts`: persist string or object votes, keep existing store callers working.
- Modify `apps/mobile/lib/match/reveal.ts`: compute mutual buckets using role compatibility instead of duplicate slug pairing.
- Modify `apps/mobile/lib/sync/eventQueue.ts`, `apps/mobile/lib/sync/voteSync.ts`, `apps/mobile/lib/sync/partnerVotes.ts`, `apps/mobile/lib/sync/syncLoop.ts`: include `pairPreference` in vote events.
- Modify `apps/mobile/app/(tabs)/deck.tsx`: render inline segmented Give/Receive/Both control on paired cards and store selected preference.
- Modify `apps/mobile/app/(matches)/MatchesScreen.tsx`: pass partner paired vote records to reveal matching.
- Modify `admin/public/app.js`: add pair mode fields, pair badges, search support, and pair metadata display.
- Modify `apps/mobile/data/kinks.en.json` and `apps/mobile/data/kinks.es.json`: set `pairMode: true` on the 28 complete directional pairs only.
- Add/update tests in `apps/mobile/__tests__/paired-kinks.test.ts`, `apps/mobile/__tests__/vote.test.ts`, `apps/mobile/__tests__/match-reveal.test.ts`, `apps/mobile/__tests__/sync-event-queue.test.ts`, and `apps/mobile/__tests__/sync-loop.test.ts`.

### Task 1: Vote Model

**Files:**
- Create: `apps/mobile/lib/votes/rolePreferences.ts`
- Modify: `apps/mobile/src/stores/votes.ts`
- Test: `apps/mobile/__tests__/vote.test.ts`

- [ ] Add `PairPreference = 'give' | 'receive' | 'both'`.
- [ ] Add `KinkVote = VoteValue | { value: VoteValue; pairPreference?: PairPreference }`.
- [ ] Normalize persisted plain string votes and paired object votes.
- [ ] Keep `getVote()` returning the vote value string for old callers.
- [ ] Add `getVoteRecord()` or exported helper support for callers that need `pairPreference`.
- [ ] Test plain vote persistence and paired vote persistence.

### Task 2: Pair-Aware Data Loading

**Files:**
- Modify: `apps/mobile/lib/data.ts`
- Test: `apps/mobile/__tests__/paired-kinks.test.ts`

- [ ] Add `pairMode?: boolean`, `sourceIds?: string[]`, and `availablePairRoles?: PairPreference[]` to `KinkItem`.
- [ ] Collapse only complete pairs where both entries share a `pairKey`, one is `pairRole: 'give'`, one is `pairRole: 'receive'`, and both have `pairMode: true`.
- [ ] Generate combined ID `pair:<pairKey>`.
- [ ] Strip role suffixes from title and slug.
- [ ] Merge tags while dropping role-only tags.
- [ ] Test complete opt-in pair collapse and incomplete/disabled pair passthrough.

### Task 3: Matching Matrix

**Files:**
- Modify: `apps/mobile/lib/match/reveal.ts`
- Test: `apps/mobile/__tests__/match-reveal.test.ts`

- [ ] Replace complementary slug matching with `pairPreference` compatibility for paired cards.
- [ ] Treat non-paired cards as compatible when both voted on the same card ID.
- [ ] Match yes/yes when Give/Receive, Receive/Give, Both/Give, Give/Both, Both/Receive, Receive/Both, and Both/Both.
- [ ] Do not match yes/yes when Give/Give or Receive/Receive.
- [ ] Preserve yes/maybe and maybe/maybe buckets when both votes are compatible or non-paired.

### Task 4: Sync Payloads

**Files:**
- Modify: `apps/mobile/lib/sync/eventQueue.ts`
- Modify: `apps/mobile/lib/sync/voteSync.ts`
- Modify: `apps/mobile/lib/sync/partnerVotes.ts`
- Modify: `apps/mobile/lib/sync/syncLoop.ts`
- Test: `apps/mobile/__tests__/sync-event-queue.test.ts`
- Test: `apps/mobile/__tests__/sync-loop.test.ts`

- [ ] Add optional `pairPreference` to `vote.upsert`.
- [ ] Diff object votes by value and preference.
- [ ] Store remote partner votes as records containing `vote` and `pairPreference`.
- [ ] Test paired preference survives enqueue, pull, decrypt, and partner vote storage.

### Task 5: Deck UI

**Files:**
- Modify: `apps/mobile/app/(tabs)/deck.tsx`

- [ ] Add an inline segmented control on paired cards with options Give, Receive, Both.
- [ ] Default paired cards to Both.
- [ ] Reset selected preference when the active card changes.
- [ ] Pass the selected preference to `setVote()` for paired cards.
- [ ] Keep unpaired cards visually unchanged.

### Task 6: Admin Pair Controls and Data Audit

**Files:**
- Modify: `admin/public/app.js`
- Modify: `apps/mobile/data/kinks.en.json`
- Modify: `apps/mobile/data/kinks.es.json`

- [ ] Add admin fields `pairMode`, `pairKey`, and `pairRole`.
- [ ] Add pair badges/meta and searchable pair fields.
- [ ] Set `pairMode: true` on the current 28 complete directional role pairs in both language files.
- [ ] Leave ambiguous, mutual, environmental, and non-directional cards unpaired.

### Task 7: Verification and Commit

**Commands:**
- `cd apps/mobile && npm test -- --runInBand`
- `cd apps/mobile && npx tsc -p tsconfig.json --noEmit`
- `git status -sb`
- `git add -A && git commit -m "Add paired kink role voting"`
- `git push origin main`

- [ ] Run focused tests after each implementation task.
- [ ] Run full mobile Jest suite.
- [ ] Run TypeScript.
- [ ] Commit and push the implementation to `main`.

### Self-Review

- Spec coverage: Pair collapsing, role selection, Both compatibility, admin controls, data opt-in, sync payload, and fresh vote handling are covered.
- Placeholder scan: No task depends on undefined filenames or open-ended placeholders.
- Type consistency: `PairPreference`, `KinkVote`, `pairMode`, `pairKey`, `pairRole`, and `pairPreference` are consistently named across data, votes, matching, sync, and admin.
