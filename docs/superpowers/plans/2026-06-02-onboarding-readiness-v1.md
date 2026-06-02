# Onboarding Readiness V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit adult, consent, and privacy confirmations to the welcome age gate.

**Architecture:** Keep persisted state unchanged, add a pure readiness helper for requirement ids/completion, then wire `WelcomeFlow` to render checklist rows and legal links. Tests cover helper behavior and route/copy contracts.

**Tech Stack:** Expo Router, React Native, Zustand, Jest, TypeScript.

---

### Task 1: Readiness Helper and Copy

**Files:**

- Create: `apps/mobile/lib/welcome/readiness.ts`
- Create: `apps/mobile/__tests__/welcome-readiness.test.ts`
- Modify: `apps/mobile/lib/i18n/en.ts`
- Modify: `apps/mobile/lib/i18n/es.ts`
- Modify: `apps/mobile/__tests__/welcome-content.test.ts`

- [x] Add failing tests for requirement ids, completion logic, and localized copy.
- [x] Implement readiness requirement definitions.
- [x] Implement `hasCompletedReadiness()`.
- [x] Add English and Spanish checklist labels.
- [x] Run focused readiness/content tests.

### Task 2: Welcome Age Gate UI

**Files:**

- Modify: `apps/mobile/app/welcome/WelcomeFlow.tsx`
- Modify: `apps/mobile/__tests__/welcome-routing.test.ts`

- [x] Add local checked-state for readiness requirements.
- [x] Render tappable checklist rows.
- [x] Disable the age-confirm button until all requirements are checked.
- [x] Add Privacy Policy and Terms links.
- [x] Keep `ageConfirmed` as the only persisted completion flag.
- [x] Add route-file assertions for legal links and disabled confirm behavior.

### Task 3: Verification and Commit

**Commands:**

- `cd apps/mobile && npm test -- --runInBand __tests__/welcome-readiness.test.ts __tests__/welcome-content.test.ts __tests__/welcome-routing.test.ts`
- `cd apps/mobile && npm test -- --runInBand`
- `cd apps/mobile && npx tsc -p tsconfig.json --noEmit`
- `git diff --check`

- [x] Verify focused tests.
- [x] Verify full mobile tests.
- [x] Verify TypeScript.
- [x] Commit and push.
