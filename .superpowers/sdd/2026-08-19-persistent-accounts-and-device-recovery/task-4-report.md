# Task 4: Partner Account Gate and Anonymous Upgrade UX

## Implementation

- Added reusable provider buttons and `PartnerAccountGate`. Provider linking must complete and `requirePermanentUser()` must succeed before its completion callback runs. `ACCOUNT_EXISTS` changes to an explicit existing-account confirmation and requests a fresh credential before `signIn()`.
- Wrapped both remote invite creation and acceptance in a deferred permanent-account gate. Existing anonymous remote sync is otherwise unchanged.
- Added a non-blocking **Protect your connection** card for active anonymous couples. Its success callback refreshes account state only; it intentionally does not call `recoverPermanentAccount()`, leaving the documented callback seam for Task 6.
- Added English/Spanish account-protection copy.

## TDD evidence

1. RED: `npm test -- --runInBand __tests__/partner-account-gate.test.tsx __tests__/partner-connect-recovery.test.ts` failed because `PartnerAccountGate` did not exist.
2. GREEN: the same command passed after the gate and provider buttons were added.
3. RED: `npm test -- --runInBand __tests__/partner-account-protection.test.ts __tests__/partner-account-gate.test.tsx` failed because the partner-sync protection surface was absent.
4. GREEN: the focused partner tests passed after the anonymous-couple card was added.
5. RED: `partner-account-gate.test.tsx` failed when the gate could call completion without a successful `requirePermanentUser()` check.
6. GREEN: completion is now blocked until that check resolves permanently.

## Verification

- Focused: `npm test -- --runInBand __tests__/partner-account-protection.test.ts __tests__/partner-account-gate.test.tsx __tests__/partner-connect-recovery.test.ts __tests__/sync-invite-flow.test.ts` — 4 suites, 19 tests passed.
- TypeScript: `npx tsc --noEmit` — passed.
- Changed-file ESLint: no errors; two `no-void` warnings are pre-existing, untouched polling lines in `partner-connect.tsx`.
- Full suite: `npm test -- --runInBand` — 110 suites, 574 tests passed. One unrelated SafeAreaView deprecation warning remains.

## Files and review

- New: `components/auth/AccountProviderButtons.tsx`, `components/auth/PartnerAccountGate.tsx`, and gate/protection tests.
- Modified: partner create/accept and partner-sync settings flows plus i18n files.
- Reviewed for unrelated baseline changes; only Task 4 hunks are staged. `git diff --check` passes.

## Concerns

- Task 6 must attach same-device registration/recovery to `handleProtectionComplete`; this task deliberately does not call an unavailable recovery RPC.

## Fix Round 1

### Implementation

- Provider operations now report pending state to the gate. **Not now** is disabled through credential acquisition, link/sign-in, permanence verification, and the deferred callback. The gate also invalidates its session before any cancel transition.
- Apple `ERR_REQUEST_CANCELED` is normalized to `CANCELLED`; both Apple and Google cancellation invoke the same safe `onCancel` transition.
- `PartnerConnect` now uses a synchronous ref latch before its permanent-account check, so double taps cannot start duplicate create or accept work. Deferred actions carry a session id, and stale completion after cancellation is ignored.

### TDD evidence

1. RED: `npm test -- --runInBand __tests__/partner-account-gate.test.tsx __tests__/auth-providers.test.ts` failed for Google/Apple cancellation, in-flight cancellation, and Apple cancellation normalization.
2. GREEN: the same command passed after pending/session handling and native cancellation normalization.
3. RED: `npm test -- --runInBand __tests__/partner-connect-account-gate.test.tsx` failed because duplicate create and accept taps each called `requirePermanentUser()` twice.
4. GREEN: both controller paths now latch before checking the account; the controller, stale-cancel, gate, provider, recovery, and invite tests pass together.

### Verification

- `npx eslint app/'(onboarding)'/partner-connect.tsx components/auth/AccountProviderButtons.tsx components/auth/PartnerAccountGate.tsx lib/auth/providers/apple.ios.ts __tests__/partner-account-gate.test.tsx __tests__/partner-connect-account-gate.test.tsx __tests__/partner-connect-account-gate-cancel.test.tsx __tests__/auth-providers.test.ts` — passed with no warnings.
- `npx tsc --noEmit` — passed.
- `npm test -- --runInBand __tests__/partner-account-gate.test.tsx __tests__/partner-connect-account-gate.test.tsx __tests__/partner-connect-account-gate-cancel.test.tsx __tests__/auth-providers.test.ts __tests__/partner-connect-recovery.test.ts __tests__/sync-invite-flow.test.ts` — 6 suites, 31 tests passed.

### Files and self-review

- Changed `PartnerAccountGate`, provider buttons, Apple provider, and partner-connect controller; added interaction tests for the real controller and stale cancellation race.
- Confirmed deferred creation/acceptance cannot run from a canceled session and no recovery RPC was introduced.
