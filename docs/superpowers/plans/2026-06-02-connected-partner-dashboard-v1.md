# Connected Partner Dashboard V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a post-link partner sync dashboard with clear status, metrics, and local disconnect control.

**Architecture:** Add a small stats formatter, a Settings route screen, and route entry points from Settings and the Profiles tab. Reuse existing sync stores and local disconnect helper.

**Tech Stack:** Expo Router, React Native, Zustand, Jest, TypeScript.

---

### Task 1: Stats Helper

**Files:**

- Create: `apps/mobile/lib/sync/partnerDashboard.ts`
- Test: `apps/mobile/__tests__/partner-dashboard.test.ts`

- [x] Add `formatRelativeSyncTime()`.
- [x] Add `formatLinkedDate()`.
- [x] Add `getPartnerDashboardStats()` returning display rows.
- [x] Test never-synced, recent sync, pending count, received vote count, and active local profile name.

### Task 2: Dashboard Screen

**Files:**

- Create: `apps/mobile/app/(settings)/partner-sync.tsx`
- Modify: `apps/mobile/app/(settings)/_layout.tsx`
- Modify: `apps/mobile/app/(settings)/index.tsx`
- Modify: `apps/mobile/app/(tabs)/profiles.tsx`

- [x] Add route to settings stack.
- [x] Change Settings partner row to route to dashboard when connected.
- [x] Change Profiles remote partner card to route to dashboard.
- [x] Implement empty state for no active remote link.
- [x] Implement connected state with status cards and actions.
- [x] Confirm local disconnect before clearing local remote sync state.

### Task 3: Verification and Commit

**Commands:**

- `cd apps/mobile && npm test -- --runInBand __tests__/partner-dashboard.test.ts`
- `cd apps/mobile && npm test -- --runInBand`
- `cd apps/mobile && npx tsc -p tsconfig.json --noEmit`
- `git diff --check`

- [x] Verify focused tests.
- [x] Verify full mobile tests.
- [x] Verify TypeScript.
- [x] Commit and push.
