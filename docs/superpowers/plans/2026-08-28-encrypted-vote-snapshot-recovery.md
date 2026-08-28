# Encrypted Vote Snapshot Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make encrypted partner votes converge across refresh, missed events, and device recovery while repairing native account restore nonce handling.

**Architecture:** Add a recipient-bound encrypted latest-snapshot mailbox alongside the existing control-event stream. Clients publish complete vote state and atomically replace received partner state; device recovery bumps resync generations so current keys always receive fresh ciphertext.

**Tech Stack:** Expo/React Native, TypeScript, Zustand, Supabase Auth/Postgres RPCs, Jest, EAS Build/Submit.

**Spec:** `docs/superpowers/specs/2026-08-28-encrypted-vote-snapshot-recovery.md`

## Global Constraints

- Supabase must never receive plaintext vote content.
- Every behavior change starts with a failing Jest or SQL contract test.
- Preserve the existing event stream for reveal consent and unlink controls.
- Do not include unrelated workspace files or Xcode project changes.
- Release only after focused tests, all 133 suites, release checks, production RPC verification, and independent review pass.

---

### Task 1: Relay snapshot and recovery-generation contract

**Files:**
- Create: `supabase/migrations/<generated>_encrypted_vote_snapshots.sql`
- Create: `apps/mobile/__tests__/encrypted-vote-snapshot-contract.test.ts`
- Modify: `apps/mobile/lib/sync/relayTypes.ts`
- Modify: `apps/mobile/lib/sync/relayClient.ts`
- Modify: `apps/mobile/lib/sync/supabaseRelayClient.ts`
- Test: `apps/mobile/__tests__/supabase-relay-client.test.ts`

**Interfaces:**
- Produces `putVoteSnapshot(coupleId, request)` and `getVoteSnapshot(coupleId)` relay methods.
- Produces recovery request-generation fields on couple and recovery responses.

- [ ] Write failing client contract tests for snapshot RPC argument/response mapping, semantic `P0001` error normalization, and recovery generation mapping.
- [ ] Run the focused tests and confirm failures are caused by missing snapshot interfaces.
- [ ] Generate the migration with `supabase migration new encrypted_vote_snapshots`.
- [ ] Add the encrypted snapshot table, member-authorized security-definer RPCs, device/key/recipient checks, generation counters, grants, and RLS defense in depth.
- [ ] Implement the minimal TypeScript relay types and client methods.
- [ ] Run the focused tests and verify they pass.

### Task 2: Complete encrypted snapshot codec and atomic partner state

**Files:**
- Create: `apps/mobile/lib/sync/voteSnapshot.ts`
- Create: `apps/mobile/__tests__/vote-snapshot.test.ts`
- Modify: `apps/mobile/lib/sync/partnerVotes.ts`

**Interfaces:**
- Produces `buildEncryptedVoteSnapshot`, `validateAndDecryptVoteSnapshot`, and `replaceSnapshot`.
- Snapshot plaintext schema contains `schemaVersion`, `authorDeviceId`, `snapshotGeneration`, `votes`, `answeredCount`, and `updatedAt`.

- [ ] Write failing tests for complete non-empty state, empty-state clearing, hash/signature/recipient rejection, and atomic replacement.
- [ ] Run the focused tests and confirm the expected missing-behavior failures.
- [ ] Implement deterministic normalization, recipient-bound signing, encryption/decryption, and atomic replacement.
- [ ] Run the focused tests and verify they pass.

### Task 3: Snapshot convergence orchestration

**Files:**
- Modify: `apps/mobile/lib/sync/voteSync.ts`
- Modify: `apps/mobile/lib/sync/syncLoop.ts`
- Modify: `apps/mobile/lib/sync/coupleLink.ts`
- Modify: `apps/mobile/lib/sync/inviteFlow.ts`
- Modify: `apps/mobile/app/(matches)/MatchesScreen.tsx`
- Modify: `apps/mobile/components/matches/MatchSyncStatus.tsx`
- Test: `apps/mobile/__tests__/vote-sync.test.ts`
- Test: `apps/mobile/__tests__/sync-loop.test.ts`
- Test: `apps/mobile/__tests__/durable-account-recovery.test.ts`
- Test: `apps/mobile/__tests__/match-sync-status.test.tsx`

**Interfaces:**
- Extends `SyncResult` with snapshot publish/fetch status and rejection reason.
- Manual refresh always performs metadata refresh, full publish, then full fetch.

- [ ] Write failing tests for publish-before-fetch, empty snapshot propagation, recovery-generation republish, rotation retry, and honest waiting/rejected UI states.
- [ ] Run the focused tests and confirm the expected failures.
- [ ] Implement foreground/change/recovery/manual convergence and structured results.
- [ ] Keep the control-event loop intact while removing vote/progress dependence on cursor replay.
- [ ] Run focused tests and verify they pass.

### Task 4: Native account nonce and recovery error handling

**Files:**
- Create: `apps/mobile/lib/auth/idToken.ts`
- Modify: `apps/mobile/lib/auth/accountService.ts`
- Modify: `apps/mobile/app/(auth)/restore.tsx`
- Modify: `apps/mobile/components/auth/OnboardingAccountProtection.tsx`
- Test: `apps/mobile/__tests__/account-service.test.ts`
- Test: `apps/mobile/__tests__/auth-providers.test.ts`
- Test: `apps/mobile/__tests__/restore-resumes-sync.test.tsx`
- Test: `apps/mobile/__tests__/onboarding-account-protection.test.tsx`

**Interfaces:**
- Produces `credentialPayloadForIdToken` that aligns the supplied raw nonce with the JWT nonce claim.
- Produces safe restore/protection error messages for nonce and provider failures.

- [ ] Write failing tests for token-with-nonce, token-without-nonce, missing raw nonce, malformed token, and safe UI messages.
- [ ] Run focused tests and verify the nonce mismatch reproduces.
- [ ] Implement claim-aware credential construction without disabling Supabase nonce verification.
- [ ] Map backend implementation text to actionable user-facing messages.
- [ ] Run focused tests and verify they pass.

### Task 5: Verification, production migration, integration, and release

**Files:**
- Modify: `apps/mobile/app.json` or release configuration only if the build number is source-controlled by the existing release flow.
- Verify: all changed files and generated migration.

**Interfaces:**
- Production RPCs must accept authorized current devices, reject wrong members/devices, and return only ciphertext metadata.
- TestFlight artifact must be built from the exact pushed `main` commit.

- [ ] Run TypeScript/lint, focused tests, all Jest suites, and `npm run release:check`.
- [ ] Run Supabase security/performance advisors and review every new security-definer function and grant.
- [ ] Request independent code review and address all valid findings with test-first changes.
- [ ] Apply the finalized production migration and execute read-only verification queries.
- [ ] Commit only the scoped work, fast-forward local `main`, and push `origin/main`.
- [ ] Create a clean detached release worktree from the pushed SHA.
- [ ] Run the release check again, build iOS with EAS, submit to TestFlight, and confirm the submission finishes.
