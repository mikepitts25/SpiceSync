# Encrypted Vote Snapshot Recovery Design

## Goal

Make partner voting converge reliably after missed events, manual refreshes,
account restoration, and device-key rotation without exposing plaintext votes to
the relay.

## Production evidence

- The active couple's current devices authored no events after the latest
  recovery, although build 15 repeatedly fetched relay state.
- Forty-six vote events were encrypted by a subsequently revoked device for the
  partner's current device.
- Device recovery deliberately starts the replacement device at the newest event
  cursor because it cannot decrypt payloads written for its predecessor.
- The event client advances its cursor past payloads it cannot validate or
  decrypt, so a successful fetch can misleadingly report zero received.
- Supabase Auth logs show repeated `Passed nonce and nonce in id_token should
  either both exist or not` failures during account protection and restore.

## Architecture

Keep the existing append-only event stream for consent and unlink controls, but
make votes converge through one replaceable, recipient-bound encrypted snapshot
per couple member. A snapshot contains the author's complete normalized vote map
and answered count, including an empty map. The relay stores ciphertext, payload
hash, signature, author/recipient device IDs, and monotonically increasing
snapshot generation only.

Device registration increments a per-member resync-request generation whenever
keys rotate. On foreground, vote change, recovery, and manual refresh, the client
refreshes couple metadata and republishes its complete snapshot when the partner
has requested a newer generation. Receiving a valid snapshot atomically replaces
partner vote state. Invalid or wrong-recipient snapshots are rejected without
being acknowledged as synced.

## Required behavior

- Manual refresh refreshes metadata, publishes the complete local snapshot, then
  fetches and validates the partner snapshot.
- Empty snapshots clear stale partner votes.
- Device recovery requests fresh snapshots in both directions without relying on
  old event cursors.
- A stale recipient conflict refreshes metadata and retries once with fresh
  ciphertext and signature.
- Sync results distinguish uploaded, received, absent/waiting, and rejected
  snapshots; the Matches screen must not call rejected data a successful sync.
- Supabase RPC errors raised with SQLSTATE `P0001` are normalized from their
  semantic messages.
- Native provider credentials only send a nonce when the ID token contains a
  nonce claim; a token nonce without the matching raw nonce is rejected locally.
- Authentication implementation errors are mapped to safe, actionable UI copy
  instead of raw backend messages.
- Existing plaintext vote contents remain local; Supabase stores only encrypted
  payloads and routing/diagnostic metadata.

## Explicit limitation

Account recovery still does not restore a user's own local-only profiles and vote
history after an actual data wipe. It restores the protected partner connection
and guarantees that currently retained votes are re-exchanged once both partners
run the fixed app.
