# Safety Controls V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Settings privacy/safety screen with local clear, disconnect, and reset controls.

**Architecture:** Add narrow reset helpers for stores that own persisted state, then call those helpers from a new `/(settings)/privacy-safety` screen. Keep remote Supabase cleanup out of scope and leave existing dirty kink content untouched.

**Tech Stack:** Expo Router, React Native, Zustand persisted stores, Jest, TypeScript.

---

### Task 1: Reset Helpers

**Files:**

- Modify: `apps/mobile/lib/state/profiles.ts`
- Modify: `apps/mobile/lib/sync/coupleLink.ts`
- Modify: `apps/mobile/lib/sync/voteSync.ts`
- Create: `apps/mobile/lib/safety/localDataControls.ts`
- Test: `apps/mobile/__tests__/safety-controls.test.ts`

- [ ] Add a `resetAllProfiles()` action to the profiles store that sets profiles to `[]` and active profile to `null`.
- [ ] Add a `clear()` action to the couple link store that sets `link` to `null`.
- [ ] Add a `reset()` action to the vote sync store that clears `localProfileId`.
- [ ] Create `disconnectRemotePartnerLocal()` that clears couple link, partner votes, reveal consent, and event queue.
- [ ] Create `resetAppOnDevice()` that clears profiles, votes, partner state, reveal consent, queue, vote sync binding, sync identity, and age verification.
- [ ] Test both helper functions.

### Task 2: Settings Screen

**Files:**

- Create: `apps/mobile/app/(settings)/privacy-safety.tsx`
- Modify: `apps/mobile/app/(settings)/_layout.tsx`
- Modify: `apps/mobile/app/(settings)/index.tsx`

- [ ] Add a `Privacy & Safety` settings route to the stack.
- [ ] Add a row in the Settings security section with shield icon, label `Privacy & Safety`, value `Data controls`.
- [ ] Implement the screen with summary copy, policy rows, and three destructive rows.
- [ ] Confirm destructive actions with `Alert.alert`.
- [ ] Route full reset to `/welcome` after success.

### Task 3: Verification and Commit

**Commands:**

- `cd apps/mobile && npm test -- --runInBand __tests__/safety-controls.test.ts`
- `cd apps/mobile && npm test -- --runInBand`
- `cd apps/mobile && npx tsc -p tsconfig.json --noEmit`
- `git diff --check`
- `git status -sb`

- [ ] Verify focused safety tests.
- [ ] Verify full Jest suite.
- [ ] Verify TypeScript.
- [ ] Commit only safety-control files and docs, not unrelated dirty kink data unless explicitly requested.

### Self-Review

The plan covers the approved spec: local clear votes, local partner disconnect, full local reset, terms/privacy links, Settings route, confirmations, and verification. It intentionally does not implement remote account deletion or Supabase row cleanup.
