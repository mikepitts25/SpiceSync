# Persistent Accounts and Device Recovery Design

**Date:** 2026-08-19
**Status:** Approved for implementation planning

## Summary

SpiceSync will keep solo use account-free while requiring a permanent account before a user creates or accepts a remote partner connection. Permanent accounts will use native Sign in with Apple on iOS and native Sign in with Google on iOS and Android. Existing anonymous Supabase users will be upgraded in place so their user ID and existing couple ownership remain stable.

After reinstall, a user will sign in with a previously linked provider. SpiceSync will create a new device identity, revoke the prior installation, recover couple membership by the authenticated user ID, rotate that member's public device keys, and resume future encrypted sync. Phase one restores the account and partner connection; it does not restore local profiles, votes, preferences, achievements, or historical ciphertext encrypted for the old device.

## Goals

- Keep solo onboarding and solo features usable without an account.
- Require a permanent account for every new remote partner connection.
- Let existing anonymous couples upgrade without changing their Supabase user ID.
- Recover a permanent account and couple membership after reinstall.
- Replace lost device keys safely and make the replacement visible to the partner.
- Support Apple on iOS and Google on iOS and Android.
- Let iOS users link both Apple and Google to one SpiceSync account.
- Provide sign-out, device removal, and account deletion flows.
- Preserve SpiceSync's rule that private keys and plaintext votes never reach Supabase.

## Non-goals

- Restoring local profiles, votes, preferences, achievements, custom content, or game history.
- Decrypting events that were encrypted for a lost device key.
- Supporting more than one active device per SpiceSync account.
- Supporting Sign in with Apple on Android.
- Adding email, OTP, phone, or password authentication.
- Automatically merging two existing permanent SpiceSync accounts.

## Product Rules

### Solo use

Solo use remains local-first and does not require authentication. SpiceSync must not display an account wall during age confirmation, profile creation, games, or local matching.

### Remote partner use

Creating or accepting a new remote partner invite requires a permanent Supabase user. The account gate appears immediately before the remote action. Cancelling authentication returns the user to partner setup without changing local data.

Existing anonymous couples continue syncing. They receive a prominent but non-blocking **Protect your connection** prompt. Successful provider linking upgrades the current anonymous user in place, so the couple's existing `member_a_user_id` or `member_b_user_id` remains valid.

### Provider availability

- iOS shows Apple and Google.
- Android shows Google.
- iOS account settings allow either provider to be linked later as a second recovery method.
- An Apple-only account cannot be recovered on Android in phase one. The account screen explains that linking Google is required before switching platforms.

## Architecture

### Shared Supabase client

The app will create exactly one configured Supabase client. Authentication, relay RPCs, and account management will all use it. The current relay wrapper will no longer be responsible for silently deciding the account lifecycle.

The client will use a SecureStore-backed mobile session adapter. Session storage is a convenience for the current installation, not the reinstall recovery mechanism; recovery always works by signing in again with Apple or Google.

### Account service

An isolated account service will expose operations with explicit intent:

- read the current session and permanent/anonymous status;
- ensure an anonymous session only when a remote flow needs one;
- link Apple or Google to the current anonymous account;
- sign in to an existing account after reinstall;
- list linked identities;
- sign out;
- forget the current device; and
- initiate permanent account deletion.

The service will derive authorization state from the validated Supabase user and JWT. It will not use editable user metadata for authorization.

### Provider adapters

Apple and Google integrations will be separate adapters that return validated provider credentials to the account service.

- Apple uses the native iOS authorization UI, a cryptographic nonce, and the returned identity token. The app captures Apple's name response on first authorization when available, but profile names in SpiceSync remain independent local data.
- Google uses native mobile authentication, platform client IDs, a nonce where required by Supabase, and the returned ID token.
- Linking an identity is distinct from signing into an existing identity. UI copy and account-service methods must preserve that distinction.

Provider secrets and console credentials are configuration, never source-controlled values. Missing configuration produces a clear development/configuration error and hides or disables the affected provider in production.

### Account state

The account layer will model these states explicitly:

- `local-only`: no remote session is needed;
- `anonymous`: a temporary Supabase user exists but cannot be recovered;
- `permanent`: at least one Apple or Google identity is linked;
- `recovering`: provider sign-in succeeded and device/couple recovery is running; and
- `error`: a retryable or actionable authentication/recovery failure exists.

Only `permanent` may create or accept new remote invites.

## Database Design

### Device registry

Add `public.spicesync_devices` with:

- `device_id text primary key`;
- `user_id uuid not null references auth.users(id) on delete cascade`;
- `signing_public_key text not null`;
- `encryption_public_key text not null`;
- `status text not null` constrained to `active` or `revoked`;
- `created_at timestamptz not null`;
- `last_seen_at timestamptz not null`; and
- `revoked_at timestamptz null`.

A partial unique index enforces one active device per user in phase one. RLS is enabled. Direct client mutation is not granted; narrowly scoped RPCs perform device registration and replacement.

### Permanent-account enforcement

Creating or accepting a new invite must reject a JWT whose `is_anonymous` claim is true. Existing couple read, append, list, and revoke operations remain available to grandfathered anonymous members so they are not abruptly disconnected before upgrading.

The check uses the validated JWT claim, not `user_metadata`, and remains combined with the existing `auth.uid()` ownership checks.

### Device registration and recovery RPC

One transactional recovery RPC will:

1. require an authenticated, non-anonymous user;
2. validate the new device ID and public keys;
3. lock the user's active-device and couple rows;
4. revoke any previous active device;
5. register the new device;
6. locate the newest unrevoked couple where `auth.uid()` is either member;
7. replace only that member's device ID and public keys on the couple row;
8. increment that member's device-key version;
9. read the current maximum server event sequence; and
10. return the refreshed couple metadata and recovery cursor.

If the user has no couple, device registration still succeeds and the couple result is null. If any mutation fails, the transaction rolls back and the old device remains active.

The function will use a fixed empty `search_path`, fully qualified object names, explicit `auth.uid()` and `is_anonymous` checks, revoked default `PUBLIC`/`anon` execution, and an explicit `authenticated` grant. Database tests must prove that callers cannot replace another user's device or couple membership.

### Existing couple schema

Phase one keeps the existing member user, device, and public-key columns on `spicesync_couples`. User IDs remain the canonical durable membership; device/key columns represent the one active installation for each member. Each member side gains a monotonically increasing device-key version, initially `1`, which increments on replacement.

Sync events gain a nullable `recipient_device_id` for legacy compatibility. The new append RPC requires the current recipient device ID and locks the couple row while validating it. An event encrypted immediately before recovery either commits before the recovery transaction and falls at or below the returned cursor, or waits and is rejected after recovery because its recipient is stale. The legacy append RPC remains available only while both member key versions are `1`; after the first replacement it returns a client-upgrade-required error. This prevents post-recovery ciphertext for the lost key from entering the new device's event stream.

## User Flows

### Protecting an anonymous account

1. The user begins remote partner setup or opens the protection prompt.
2. SpiceSync ensures the current anonymous session exists.
3. The user chooses an available provider.
4. The native provider adapter obtains a credential.
5. The account service links the credential to the current anonymous user.
6. SpiceSync fetches the validated user again and confirms `is_anonymous` is false.
7. SpiceSync registers the current device, then resumes the original invite action.

If the provider identity already belongs to a different permanent SpiceSync account, the link is not merged automatically. The app offers **Sign into existing account** and explains that the current device's local-only data will remain local.

If that device already contains local profiles or votes, signing into the existing account recovers account and couple metadata but keeps remote vote sync paused. The user must explicitly choose which local profile, if any, represents them in the recovered connection. Until that confirmation, no local event is queued or uploaded. Declining leaves the local data untouched and the remote connection paused.

### Restoring after reinstall

1. The welcome flow offers **Restore existing account** without blocking local-only onboarding.
2. The user signs in with Apple or Google.
3. Supabase returns the original permanent user ID.
4. SpiceSync generates a fresh device ID, signing keypair, and encryption keypair.
5. The transactional recovery RPC registers the replacement device and revokes the previous installation.
6. The RPC recovers couple membership by `auth.uid()`, rotates that member's device/public-key fields, and returns the current event cursor.
7. SpiceSync rebuilds the local couple-link state using the returned metadata.
8. The local cursor starts at the returned current server sequence so events encrypted for the lost key are not processed.
9. Future events resume after the partner refreshes the recovered member's keys.

No local data is claimed to be restored. The UI explicitly states that the account and connection were recovered, while local history from the previous installation is unavailable.

### Partner key refresh

On app foreground and before pushing a new encrypted event, the sync layer refreshes couple metadata. If the partner device ID or public keys changed, it:

- pauses event transmission;
- stores the new partner keys;
- records a local security notice with the change time;
- shows **Your partner restored SpiceSync on a new device**; and
- resumes future encryption using the new key.

Every new event includes the recipient device ID used for encryption. If append returns `RECIPIENT_KEY_CHANGED`, the client discards only that ciphertext, refreshes couple metadata, re-encrypts the same queued plaintext for the current recipient key, and retries once through the normal queue. It never retries stale ciphertext.

Phase one trusts the authenticated server-authorized replacement and does not require partner approval. The notice makes the trust change visible.

### Signing out

Signing out clears the Supabase session and pauses remote sync. It does not delete local profiles, votes, settings, or device keys. The account screen explains this before confirmation. Signing back into the same account resumes access.

### Forgetting a device

Forgetting the device first revokes its active device record while authenticated, then signs out and clears the local cryptographic identity. Local application data remains unless the user separately chooses the existing reset controls.

### Account deletion

Account deletion is available from account settings and requires fresh provider authentication plus a destructive confirmation.

The trusted deletion function will:

1. validate the caller and the recent provider credential;
2. revoke the active couple and devices;
3. remove relay invites, events, and associated server metadata through explicit cleanup or foreign-key cascades;
4. revoke Sign in with Apple authorization when Apple is linked;
5. delete the Supabase Auth user using a server-only administrative client; and
6. return success so the app can clear all local SpiceSync data and keys.

The service-role key and Apple private credentials exist only in Supabase function secrets. If provider revocation is temporarily unavailable, server-account deletion still completes and the revocation failure is logged without exposing credentials to the client.

Google Play's external deletion-request requirement will be met with a small branded web endpoint hosted by a Supabase Edge Function. It will provide a deletion request form and explain identity verification, expected timing, subscription handling, and local-data removal. The endpoint is included in Play Console metadata. The in-app flow remains the primary automated path.

## UI Surfaces

### Partner account gate

The gate explains one benefit: **Protect your partner connection so you can recover it after reinstalling.** It contains Apple and/or Google buttons based on platform, a cancel action, progress state, and concise provider errors. It does not claim that local activity history is backed up.

### Welcome restoration

The welcome flow includes a secondary **Restore existing account** action. It opens provider sign-in and the recovery progress state. A failed or cancelled recovery returns to welcome and still allows local-only setup.

### Account settings

Account settings shows:

- current status: local-only, unprotected, or protected;
- linked Apple and Google identities;
- an action to link the other available provider;
- the active device and last-seen time;
- sign out;
- forget this device; and
- delete account.

On iOS, an Apple-only account receives a recommendation to link Google for Android recovery. No warning is shown once Google is linked.

### Security notices

Device replacement creates a persistent local notice for the partner until acknowledged. The notice contains no key material, only the partner name, replacement time, and an explanation that future sync uses a new device key.

## Error Handling

- Provider cancellation is not an error and never mutates account, invite, or device state.
- Network and provider failures are retryable and retain the user's current screen context.
- Identity conflicts route to existing-account sign-in; they never trigger an automatic merge.
- A failed recovery transaction leaves the previous active device and couple keys unchanged.
- Invalid, anonymous, expired, or non-owner JWTs receive a generic authorization error; server logs retain the specific reason.
- Missing provider configuration is actionable in development and does not expose secrets or internal identifiers in production.
- Old encrypted events are skipped by starting at the recovery cursor rather than producing repeated decryption errors.
- Stale-recipient appends are rejected; the sender refreshes metadata and re-encrypts queued plaintext for the new key.
- Signing into an existing account on a populated device pauses remote sync until the user confirms the local profile association.
- Local state is not cleared on sign-in, linking, cancellation, or ordinary sign-out.
- Local state is cleared only after confirmed account deletion or the existing explicit reset-app action.

## Privacy and Policy Updates

The privacy policy will be updated to describe:

- optional Apple/Google account identifiers and provider-supplied email addresses;
- the distinction between local-only data and server-side account/relay metadata;
- device public keys and device-recovery records;
- what reinstall recovery does and does not restore;
- account deletion and server-data deletion; and
- the continued exclusion of plaintext votes and private encryption/signing keys from Supabase.

App Store privacy and Google Play Data Safety disclosures must be reviewed before release. Subscription cancellation remains separate from SpiceSync account deletion and must be explained in the deletion confirmation.

## Rollout and Compatibility

1. Deploy backward-compatible device tables and recovery functions.
2. Ship the shared auth client, provider configuration, and account settings.
3. Enable protection and migration prompts for existing anonymous couples.
4. Require permanent accounts in the client for new remote invitations.
5. Enforce non-anonymous create/accept checks in the database.
6. Verify existing anonymous couples can still read, append, list, and revoke while they migrate.

The current uncommitted couple-link recovery work remains conceptually separate: it repairs missing local link state when the same anonymous session and device identity still exist. Durable recovery supersedes its device-ID lookup after permanent sign-in but preserves its startup integration patterns where useful.

## Testing Strategy

### Unit tests

- Account-state classification for local-only, anonymous, permanent, recovering, and error states.
- Apple and Google cancellation, success, malformed token, and provider failure mapping.
- Anonymous identity linking preserves the current user ID.
- Existing-provider conflicts offer sign-in instead of merge.
- Partner actions are blocked until the user is permanent.
- Platform provider visibility and Apple-only cross-platform warning.
- Sign-out, forget-device, and deletion confirmation semantics.

### Database tests

- Anonymous users cannot call permanent-account registration/recovery paths.
- A permanent user can register only a device they own.
- A user cannot rotate another member's device or keys.
- One active device per user is enforced.
- Recovery atomically revokes the old device and updates only the caller's couple side.
- Recovery increments only the caller's device-key version.
- Transaction failure leaves the old device active.
- A concurrent append for the old recipient either precedes the recovery cursor or is rejected after rotation.
- Legacy append is rejected after the first device-key rotation.
- Existing anonymous couples retain grandfathered sync access.
- New anonymous users cannot create or accept invites.
- Account deletion removes or revokes all owned relay/device records without exposing another member's unrelated data.

### Integration tests

- Upgrade an existing anonymous couple through Apple and Google linking.
- Simulate uninstall by clearing local/session storage, sign back into the original provider account, generate a new device identity, and recover the same couple.
- Verify the old device can no longer append events after replacement.
- Verify the recovered client starts at the current cursor and does not decrypt old-key events.
- Verify the partner refreshes keys, shows the notice, and encrypts the next event for the new key.
- Verify stale-recipient ciphertext is rejected and queued plaintext is re-encrypted exactly once.
- Verify identity-conflict sign-in preserves local-only data and pauses sync until profile confirmation.
- Verify account deletion clears server and local state.
- Keep all existing invite, vote-sync, and couple-recovery tests passing.

### Manual release checks

- Apple linking, sign-in, cancellation, revocation, and deletion on a physical iPhone.
- Google linking, sign-in, cancellation, revocation, and deletion on physical iOS and Android devices.
- Reinstall recovery on both platforms using release-signed builds.
- Missing/invalid provider configuration behavior.
- App Store account-deletion flow and Google Play external deletion URL.

## Success Criteria

- A solo user can continue without creating an account.
- No new remote couple can be created with an anonymous Supabase user.
- An existing anonymous couple can upgrade without changing either member user ID.
- Reinstalling and signing in with a linked provider recovers the same couple with a newly registered device.
- The old device is revoked and cannot publish new events.
- The partner is notified of the key change and future encrypted sync resumes.
- SpiceSync never claims to restore local history in phase one.
- Users can sign out, forget a device, and delete their account from the app.
- Private keys and plaintext votes never leave the device.
