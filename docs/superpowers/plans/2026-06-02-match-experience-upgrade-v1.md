# Match Experience Upgrade V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add actionable match details, filters, role summaries, and a try-tonight checklist to the Matches tab.

**Architecture:** Extend reveal match rows with detail metadata, add a pure match-experience helper for role copy/plans/filtering, and wire the existing Matches screen to render filters plus an in-screen detail panel. Viewed state remains local and lightweight.

**Tech Stack:** Expo Router, React Native, Zustand, Jest, TypeScript.

---

### Task 1: Match Experience Helpers

**Files:**

- Create: `apps/mobile/lib/match/experience.ts`
- Create: `apps/mobile/__tests__/match-experience.test.ts`
- Modify: `apps/mobile/lib/match/reveal.ts`
- Test: `apps/mobile/__tests__/match-reveal.test.ts`

- [x] Add failing tests for role summary copy, plan generation, filtering, and enriched reveal rows.
- [x] Implement `describeRoleCompatibility()`.
- [x] Implement `createMatchPlan()`.
- [x] Implement `filterMatchItems()`.
- [x] Extend `RevealMatchItem` with metadata and vote records.
- [x] Run focused tests and confirm they pass.

### Task 2: Viewed Match State

**Files:**

- Create: `apps/mobile/lib/match/viewedMatches.ts`

- [x] Add a persisted local store for viewed match ids.
- [x] Expose `markViewed(id)` and `viewedIds`.
- [x] Keep the store independent from remote sync.

### Task 3: Matches UI Upgrade

**Files:**

- Modify: `apps/mobile/app/(matches)/MatchesScreen.tsx`

- [x] Convert the main content area to scrollable content.
- [x] Add filter chip rows for visibility, category, intensity, and role.
- [x] Make revealed result rows tappable.
- [x] Render the selected match detail panel.
- [x] Render the try-tonight checklist with local check state.
- [x] Keep locked bucket rows hidden until unlock.

### Task 4: Verification and Commit

**Commands:**

- `cd apps/mobile && npm test -- --runInBand __tests__/match-experience.test.ts __tests__/match-reveal.test.ts`
- `cd apps/mobile && npm test -- --runInBand`
- `cd apps/mobile && npx tsc -p tsconfig.json --noEmit`
- `git diff --check`

- [x] Verify focused tests.
- [x] Verify full mobile tests.
- [x] Verify TypeScript.
- [x] Commit and push.
