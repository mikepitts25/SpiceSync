# Persistent accounts and device recovery — final-review fix report

Date: 2026-08-21

Final-review base: `161c81f314ebd485a30b825a29e2740dc1c943c7`

Implementation head before this report: `cf6eb4416`

Branch: `codex/persistent-accounts-recovery`

## Outcome

The single whole-feature final-review fix wave closes all four Critical and all
four Important findings. It also completes the requested low-risk deferred
items: explicit Apple authorization-code mapping coverage, platform-aware
Google configuration detection, Member-B/recovery/protection/no-couple
coverage, removal of the unread SQL variable, and removal of unrelated
Node-version lockfile metadata normalization while retaining the required
dependencies.

The implementation is local only. No production deployment, hosted migration,
secret write, store build, or physical-device action was performed.

## Commits

- `068e66daa` — `fix: bootstrap real missing auth sessions`
- `99f84df73` — `fix: preserve legacy anonymous v2 sync`
- `cf6eb4416` — `fix: bind remote state and deletion proof`
- The report itself is committed separately after the implementation commits.

The implementation range from the review base changes 48 files with 3,084
insertions and 335 deletions. The progress ledger was not edited.

## Finding-by-finding resolution

### C1 — genuine fresh-install Supabase auth

Root cause: the installed Supabase SDK represents empty local auth storage as
`{ user: null, error: AuthSessionMissingError }`. `getSnapshot()` previously
treated that real SDK result as a generic auth failure, so
`ensureAnonymousUser()` threw instead of calling anonymous sign-in.

RED:

- Added a characterization using the installed SDK's real
  `AuthSessionMissingError` class.
- Added negative characterizations for network/retryable and validation errors
  so the local-only exception could not become a broad error swallow.
- Before the fix, the real missing-session case returned an error snapshot and
  anonymous sign-in was not invoked.

GREEN:

- `getSnapshot()` now classifies only `isAuthSessionMissingError(error)` as
  local-only.
- Other Supabase errors remain actionable error snapshots.
- `ensureAnonymousUser()` proceeds to `signInAnonymously()` for the genuine
  fresh-install contract.

Primary files:

- `apps/mobile/lib/auth/accountService.ts`
- `apps/mobile/__tests__/account-service.test.ts`

### C2 — grandfathered anonymous v2 compatibility

Root cause: the permanent-account migration correctly protected new
relationship/device-registry operations, but its blanket guard replacement
also made the v2 append RPC permanent-only. Live anonymous couples created
before the registry feature could still use compatible reads/v1 behavior, but
the current client always sent v2 and had no non-destructive path because those
installations have no device rows to backfill unambiguously.

RED:

- Upgrade pgTAP started with two live, unrevoked anonymous couple members and
  zero device-registry rows.
- The exact version-one couple device/key material could not append through
  v2 before the compatibility migration.
- Negative cases covered recipient mismatch, author mismatch, non-member
  escalation, registry/replacement history, revoked device state, and a
  permanent account attempting to use the anonymous exception.

GREEN:

- Migration `20260820222200_grandfathered_anonymous_v2_compatibility.sql`
  adds a narrow v2 compatibility path.
- The caller must be a current Auth row and an actual unrevoked couple member.
- The author and recipient must exactly match the couple's stored device,
  encryption key, signing key, and version-one material.
- A missing author registry row is accepted only for a still-anonymous owner
  with no registry history for either the user or device. The partner must be
  either the equally untouched anonymous side or an exact active version-one
  registered device.
- Normal active-registry enforcement remains unchanged for registered,
  rotated, replaced, revoked, permanent, or mismatched devices.
- Function `search_path` remains empty, identifiers are fully qualified, and
  execute grants remain authenticated-only. The unused author-device SQL
  variable was removed.
- The C2-only expanded pgTAP suite passed 48/48; the final combined suite
  passes 56/56.

Primary files:

- `supabase/migrations/20260820222200_grandfathered_anonymous_v2_compatibility.sql`
- `supabase/tests/database/persistent_accounts_device_recovery.test.sql`

### C3 and I1/I2/I3 — shared ownership, pause, recovery, and queue model

Root cause: remote sync authority was spread across status-only predicates.
The persisted link did not identify its owning Supabase user, pending plaintext
did not identify its account/couple/device envelope, sign-out did not persist a
sync pause before ending Auth, and recovery could replace a relationship while
old remote-derived state or pending plaintext remained. Reveal and vote
producers also used different preconditions, including a confirmation-only
bootstrap exception.

RED:

- The first focused ownership run failed 14 of 43 tests.
- The initial persisted-v1 rotation run failed 3 of 3 tests.
- Stateful tests were added for same-user in-place linking, a different-account
  conflict, conflict after a signed-out restart, Member-B recovery, same-couple
  recovery, a different recovered couple, server `no-couple`, protected-link
  startup, sign-out success/failure, profile-confirmation pause, old pending
  plaintext, reveal before and after identity await, cross-owner quarantine,
  recipient rotation, and one-retry upgrade behavior.
- Whole-diff review found two additional failures before commit: the
  signed-out restart safely cleared state but returned `accountChanged: false`,
  and unbound legacy plaintext lacked persisted same-couple provenance. Both
  were reproduced in focused failing tests before their fixes.

GREEN — persisted ownership:

- Every `CoupleLink` now has `ownerUserId` as well as `coupleId`, local device,
  and partner device/key identity.
- New queue entries persist owner, couple, author device, recipient device,
  and envelope version.
- `isCoupleLinkSyncable()` / `getActiveRemoteSyncOwnership()` are the central
  authority: the link must be active, profile-confirmed, unpaused, owned by the
  exact currently verified Auth user, and have exact device identities.
- The verified Auth user is runtime-only. A restart cannot trust a persisted
  user assertion before `bootstrapAccountState()` revalidates it.
- Legacy unbound v1 queue records are normalized after both persisted stores
  hydrate. They inherit couple/author provenance only from the persisted active
  same-device link; without that proof they are reduced to non-sensitive
  `legacy-unproven` quarantine metadata. Live auth/recovery must still prove
  the owner before upload, at which point the record is stamped with the
  current recipient and rebuilt as a v2 ciphertext/signature.

GREEN — sign-out and account transitions:

- Sign-out persists `signed-out` before ending Auth, stops the loop and vote
  subscription, and leaves the protected relationship paused after success.
- A sign-out failure restores the previous owner/pause and restarts sync only
  if the restored central guard is valid.
- Protected links never bootstrap a new anonymous account.
- Linking Apple/Google into the same Supabase anonymous user preserves the
  relationship and queue.
- Signing into a different account is explicit (`accountChanged`), requires
  recovery/profile confirmation, clears link and remote-derived partner
  votes/reveal/sync metadata, and quarantines pending plaintext while
  preserving local profiles, local votes, and settings.
- The pre-sign-in owner is captured before snapshot reconciliation, so this
  conflict is still reported after a signed-out process restart.
- Server `no-couple` always clears the previous relationship and remote state.
- Recovery to a different couple quarantines the old queue before installing
  the new relationship; old plaintext is never re-encrypted for a new partner.
- Safe clearing is persisted as a `remoteStateNotice` and surfaced with
  recovery/setup guidance in partner sync UI.

GREEN — producers and retry behavior:

- Queue enqueue itself enforces the central guard, so every producer has a
  final common check.
- Vote bootstrap/subscriptions and reveal consent check the guard before
  identity awaits and rely on guarded enqueue afterward.
- Profile confirmation releases the durable pause before producers may
  enqueue; a subsequent failure restores the confirmation pause.
- Cross-owner/couple/device records are quarantined and never uploaded.
- `CLIENT_UPGRADE_REQUIRED` gets at most one safe claim/rebuild/retry; a repeat
  enters ordinary queue backoff.

Primary files:

- `apps/mobile/lib/sync/coupleLink.ts`
- `apps/mobile/lib/sync/eventQueue.ts`
- `apps/mobile/lib/sync/remoteOwnership.ts`
- `apps/mobile/lib/sync/syncLoop.ts`
- `apps/mobile/lib/sync/voteSync.ts`
- `apps/mobile/lib/sync/revealConsent.ts`
- `apps/mobile/lib/sync/inviteFlow.ts`
- `apps/mobile/lib/auth/accountService.ts`
- `apps/mobile/app/_layout.tsx`
- `apps/mobile/app/(auth)/confirm-profile.tsx`
- `apps/mobile/components/auth/PartnerAccountGate.tsx`
- `apps/mobile/app/(settings)/partner-sync.tsx`
- Ownership/restart regressions across `account-service`,
  `durable-account-recovery`, `sync-loop`, `sync-event-queue`, `vote-sync`,
  `reveal-sync-ownership`, routing, confirmation, invite, protection, and
  partner UI tests.

### C4 — server-verifiable Google deletion proof

Root cause: Google-only deletion previously accepted a fresh isolated Supabase
bearer but did not send or server-verify the native Google credential. That
proved control of a Supabase session, not a fresh assertion for the linked
Google subject. The classic native Google API in use has no nonce parameter.

RED:

- Added hermetic RSA/JWKS tests before the Google verifier existed.
- Handler regressions rejected direct bearer-only deletion and exercised
  challenge issue, mismatched subject, stale/failed verification, replay, and
  concurrent consumption.
- Mobile regressions required challenge creation before native Google sign-in
  and required the final deletion call to use only the isolated reauth bearer.

GREEN — database and handler:

- Migration `20260820223748_google_deletion_challenges.sql` creates private
  challenge storage with a five-minute expiry and atomic one-time consumption.
- The table is outside exposed API schemas. `anon` and `authenticated` have no
  schema/table access. Only `service_role` can execute issue/consume RPCs.
  Both are security-definer functions with empty `search_path`.
- The challenge action authenticates the original bearer, verifies a linked
  Google identity exists, and issues the challenge for that exact user.
- The final Google path requires challenge ID plus the raw fresh Google ID
  token. Direct bearer-only deletion fails.
- The verifier checks an RSA/RS256 signature against Google's JWKS, supported
  issuer, exact scalar `GOOGLE_WEB_CLIENT_ID` audience, expiration/not-before,
  a recent non-future `iat`, and a non-empty subject.
- The verified subject must match the linked Google identity before the
  owner's challenge is atomically consumed. Replay and concurrent-race losers
  fail before cleanup.
- Apple remains preferred for accounts with Apple linked, including the prior
  authorization-code exchange, subject verification, and revocation path.
- Error logs contain event/error class/user ID only; no authorization code,
  ID token, access token, or bearer is logged.

GREEN — client and documented boundary:

- The shared authenticated client requests a Google challenge before native
  reauthentication.
- Native reauthentication occurs in an isolated Supabase client. The deletion
  function receives challenge ID and fresh Google ID token under only that
  isolated bearer; the persisted shared session remains untouched.
- `GOOGLE_WEB_CLIENT_ID` is documented as Edge Function server configuration
  that must exactly match the mobile web-client ID. It is configuration, not a
  secret, but remains server-side.
- Documentation accurately states that classic native Google sign-in has no
  nonce here. The boundary is the short-lived one-time server challenge plus
  strict recent `iat`; no nonce-binding claim is made.

Primary files:

- `supabase/migrations/20260820223748_google_deletion_challenges.sql`
- `supabase/functions/_shared/google.ts`
- `supabase/functions/_shared/google_test.ts`
- `supabase/functions/spicesync-delete-account/index.ts`
- `supabase/functions/spicesync-delete-account/index_test.ts`
- `apps/mobile/lib/auth/accountService.ts`
- `apps/mobile/lib/auth/types.ts`
- `apps/mobile/app/(settings)/account.tsx`
- `apps/mobile/__tests__/account-service.test.ts`
- `apps/mobile/__tests__/account-deletion.test.tsx`
- `docs/apple-google-account-setup.md`

### I4 — complete deletion disclosures

Root cause: the public page and localized app copy described deletion only at
a high level. They did not distinguish server deletion from device-local
copies, disclose request timing/retained request metadata/provider identifiers,
or separate account deletion from store subscription cancellation.

RED:

- Copy/behavior tests first required all disclosure topics in the public page,
  confirmation response, English app copy, Spanish app copy, and privacy page.

GREEN:

- Public and localized in-app copy now states immediate in-app processing after
  fresh verification and the target of completing manually verified requests
  within 30 days.
- Copy lists deleted server account/provider identifier, device/couple
  metadata, invitations, and encrypted relay events, plus retained manual
  request provider/contact/status/timestamps.
- Copy distinguishes current-device cleanup from local copies on other devices
  and explains that reinstall does not restore local profiles/votes/history.
- Copy states that account deletion and store subscription cancellation are
  separate, while accurately noting that SpiceSync currently offers lifetime
  access rather than inventing an active subscription feature.

Primary files:

- `supabase/functions/spicesync-account-deletion/index.ts`
- `supabase/functions/spicesync-account-deletion/index_test.ts`
- `apps/mobile/lib/i18n/en.ts`
- `apps/mobile/lib/i18n/es.ts`
- `apps/mobile/lib/i18n/uiLiteral.ts`
- `apps/mobile/app/(settings)/privacy-policy.tsx`
- `apps/mobile/__tests__/release-privacy-copy.test.ts`

## Deferred-minor cleanup included

- Added an explicit regression that Apple `authorizationCode` maps to
  Supabase `access_token` when linking, while deletion reauth keeps the
  one-time code out of Supabase `signInWithIdToken`.
- Google provider configuration detection now requires the iOS client ID only
  on iOS and the web client ID on every platform.
- Added Member-B recovery and concrete protection/recovery/no-couple behavior
  coverage.
- Reverted 142 unrelated Node 24 lockfile `dev` metadata normalizations back to
  the Node 22-compatible `devOptional` form. Required feature dependencies and
  integrity/version entries remain intact.
- Removed the known unread SQL author-device variable.

## Verification evidence

All mobile commands used Node `v22.16.0` from
`/Users/mike/.nvm/versions/node/v22.16.0/bin`.

| Gate | Result |
| --- | --- |
| Full mobile Jest | 120/120 suites, 706/706 tests, 0 failures; baseline was 683 tests (+23) |
| TypeScript | `npx tsc --noEmit` exit 0 |
| Full ESLint | `npm run lint` exit 0; 0 errors, 4,771 non-blocking repository warnings remain outside this blocker-focused wave |
| Release check | exit 0; 20/20 admin content tests, mobile Jest 706/706, TypeScript, Expo config, and TestFlight profile checks pass |
| Deno formatting | `deno fmt --check .` checked 11 files, exit 0 |
| Frozen Deno typecheck | 11 files checked with `--frozen`, exit 0 |
| Frozen Deno tests | 35/35 pass: deletion page 8, deletion handler 18, invite 2, Apple crypto 5, Google RSA/JWKS 2 |
| Fresh local database | `supabase db reset` exit 0; all 12 migrations applied in order |
| Expanded pgTAP | 56/56 pass; base was 38 (+18) |
| Migration list | all 12 local migrations aligned through `20260820223748` |
| Database lint | `supabase db lint --local --level warning`: `No schema errors found` |
| Catalog grants/privacy | anon/authenticated denied private schema/table and challenge RPCs; service role allowed both RPCs; both security-definer/empty-search-path |
| Auth guard catalog | all seven sampled permanent/current-auth operations contain the intended guard and empty `search_path` |
| Diff hygiene | `git diff --check` clean; progress ledger untouched |

Expected non-failures in output:

- Watchman reports its existing recrawl warning.
- One existing React Native `SafeAreaView` deprecation warning is printed by a
  readability test.
- The full lint command has no errors but still reports the repository's broad
  warning backlog; this wave did not mass-format unrelated files.

## Security/catalog observations

- `private.spicesync_google_deletion_challenges` intentionally does not use RLS
  because it is outside the configured API schemas and has all public/anon/
  authenticated schema and table privileges revoked. It is reachable only
  inside the service-role security-definer functions.
- The v2 append compatibility function and challenge RPCs use empty
  `search_path`; application/security object references are qualified.
- Permanent-only create/accept/register/revoke-device operations still call
  `spicesync_require_current_permanent_user`; compatible couple read/sync calls
  use `spicesync_require_current_auth_user`, which verifies the Auth row still
  exists and therefore rejects stale deleted-user JWTs.
- Hosted Supabase advisors were not run against these migrations: this isolated
  worktree is intentionally unlinked and the instructions prohibit external
  deploys. Local schema lint, pgTAP, grants, function-definition, exposed-schema,
  and search-path checks are green. Hosted security/performance advisors remain
  a deployment-time gate after applying the migrations in the target project.

## Remaining external checks and concerns

- Set `GOOGLE_WEB_CLIENT_ID` in the Edge Function environment before deployment
  and verify it exactly matches `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- Apply migrations/functions to a controlled Supabase target, then run hosted
  security and performance advisors and inspect production function behavior.
- Run the production-mode release check with the actual protected EAS/CI
  environment and `--require-social-recovery`.
- Complete Apple and Google protect/link/cancel/restore/delete smoke tests on
  physical devices with release-signed builds. Google deletion must confirm
  challenge-before-native ordering and replay failure; Apple remains the
  preferred provider when both are linked.
- Verify the managed public deletion endpoint's production rate limiting and
  origin-bypass controls. No external configuration was changed here.

No unresolved local Critical or Important finding remains after the automated
and catalog verification above.
