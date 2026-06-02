# Monetization Scaffold V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock premium purchase success with a disabled-by-default monetization scaffold.

**Architecture:** Add purchase availability helpers to the purchase service, make purchase/restore conservative by default, adjust premium gift redemption to avoid fake unlocks, and update the unlock UI to collect interest instead of granting entitlements.

**Tech Stack:** Expo Router, React Native, Zustand, Jest, TypeScript.

---

### Task 1: Purchase Service Guardrails

**Files:**

- Modify: `apps/mobile/lib/purchases/purchaseService.ts`
- Create: `apps/mobile/__tests__/purchase-service.test.ts`

- [x] Add failing tests that purchase is disabled by default and does not mutate subscription state.
- [x] Add `isPurchaseProviderConfigured()`.
- [x] Make `purchaseProduct()` return `{ success: false, error: ... }` when disabled.
- [x] Make `restorePurchases()` return an empty list when disabled.
- [x] Run focused purchase-service tests.

### Task 2: Premium Store Gift Guardrails

**Files:**

- Modify: `apps/mobile/src/stores/premium.ts`
- Create: `apps/mobile/__tests__/premium-store.test.ts`

- [x] Add failing tests that typed gift codes do not unlock premium without validation.
- [x] Keep `validateGiftCode()` as format-only validation.
- [x] Make `redeemGiftCode()` return false until backend validation exists.
- [x] Run focused premium-store tests.

### Task 3: Unlock UI Scaffold

**Files:**

- Modify: `apps/mobile/app/(unlock)/index.tsx`
- Modify: `apps/mobile/__tests__/router-files.test.ts`

- [x] Add route-file assertion that unlock UI has no `mock_receipt`.
- [x] Replace premium and pack purchase handlers with waitlist/coming-soon handlers.
- [x] Replace gift-code purchase generation with notification copy.
- [x] Replace subscription auto-renew legal copy with current not-live copy.
- [x] Run focused router-file tests.

### Task 4: Verification and Commit

**Commands:**

- `cd apps/mobile && npm test -- --runInBand __tests__/purchase-service.test.ts __tests__/premium-store.test.ts __tests__/router-files.test.ts`
- `cd apps/mobile && npm test -- --runInBand`
- `cd apps/mobile && npx tsc -p tsconfig.json --noEmit`
- `git diff --check`

- [x] Verify focused tests.
- [x] Verify full mobile tests.
- [x] Verify TypeScript.
- [x] Commit and push.
