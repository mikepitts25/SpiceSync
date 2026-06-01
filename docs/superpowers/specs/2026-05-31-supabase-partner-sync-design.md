# Supabase Partner Sync Design

## Goal

Replace the self-hosted VPS relay requirement with a free-first Supabase durable relay while preserving SpiceSync's local-first, end-to-end encrypted partner syncing model.

## Approved Direction

Use Supabase as managed relay infrastructure, not as a profile or plaintext app-data backend. Each install signs in anonymously to Supabase and keeps its existing local sync identity, X25519 encryption key, and Ed25519 signing key. Supabase stores only anonymous membership metadata, public keys, invite hashes, and encrypted sync events.

For MVP, avoid always-on Realtime and avoid Edge Functions unless direct Postgres RPCs prove insufficient. This keeps the implementation inside the free tier for early testing and early users. Polling remains the durable source of truth:

- on app launch,
- on foreground,
- after local vote upload,
- every sync-loop interval while the app is active.

Supabase Realtime can be added later as a wake-up optimization once usage or paid customers justify it.

## Architecture

The mobile app keeps the existing `RelayClient` method shape and selects a transport at runtime:

```text
mobile sync loop
  -> relay transport interface
    -> Supabase RPC transport when Supabase URL/key are configured
    -> existing HTTP relay transport as fallback
```

Supabase owns these durable records:

- `spicesync_invites`
- `spicesync_couples`
- `spicesync_events`

Postgres RPC functions own atomic operations:

- `spicesync_create_invite`
- `spicesync_get_invite`
- `spicesync_accept_invite`
- `spicesync_get_couple`
- `spicesync_append_event`
- `spicesync_list_events`
- `spicesync_revoke_couple`

Row Level Security is enabled on all relay tables. Direct table access is denied by default; authenticated anonymous users operate through security-definer RPCs that check `auth.uid()` and couple membership.

## Privacy

Supabase never receives plaintext votes, profile names, profile emojis, match results, or local profile IDs. The relay can see:

- anonymous Supabase user IDs,
- anonymous device IDs,
- public encryption/signing keys,
- invite secret hashes,
- encrypted payloads,
- event cursors and timestamps.

The existing mobile crypto remains responsible for encrypting event payloads before upload and decrypting partner payloads after pull.

## Cost Controls

The MVP avoids Realtime subscriptions and Edge Function invocations by default. Free-tier pressure points are database size and egress. Events remain small encrypted JSON payloads, and future cleanup can delete old relay events after both partners have had enough time to pull them.

The app should continue to work locally when Supabase is not configured by falling back to the existing HTTP relay client.

## Rollout

1. Add Supabase schema migration with tables, RLS, and RPC functions.
2. Add a Supabase client/config module for Expo using anonymous auth.
3. Add a Supabase-backed relay transport that implements the current relay client API.
4. Select Supabase transport when `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are present.
5. Keep the existing HTTP relay path as fallback.
6. Verify with unit tests and then with two local simulator installs against a real Supabase project.

## Verification

- Supabase relay adapter unit tests cover anonymous sign-in, RPC argument mapping, response mapping, and structured error handling.
- Existing mobile sync tests continue to pass.
- Manual QA links two installs, votes on both sides, verifies encrypted event pull, and confirms matches reveal only locally.
