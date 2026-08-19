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
