# Safety Controls V1 Design

## Goal

Add a first app-store-readiness safety surface inside Settings that gives adults clear privacy/safety context and local destructive controls.

## Scope

Safety Controls V1 adds a `Privacy & Safety` settings screen with:

- A short adults-only, consent-first, private-by-design summary.
- Links to existing Privacy Policy and Terms of Service screens.
- `Clear my votes`, which clears votes for the active local profile only.
- `Disconnect remote partner`, which clears local remote partner state: couple link, partner votes, reveal consent, and pending sync queue.
- `Reset app on this device`, which clears local profiles, local votes, remote partner state, reveal consent, pending sync queue, sync identity, and age verification on this device.

The reset actions are local-device only. They do not delete Supabase auth users or remote rows because the app currently uses anonymous auth and has no account-management flow. Remote relay cleanup remains an operator/admin task until account deletion is designed.

## Non-Goals

- No new legal documents.
- No App Store metadata changes.
- No content rewrite.
- No remote account deletion.
- No moderation system.

## UX

The Settings screen gets a new row in the Security section:

- Label: `Privacy & Safety`
- Value: `Data controls`
- Icon: shield/lock style

The new screen uses the existing dark settings style and groups controls into:

- `Safety`: adults-only and consent-first copy.
- `Policies`: Privacy Policy and Terms of Service rows.
- `Data controls`: Clear votes, disconnect partner, reset app on this device.

Each destructive action requires an `Alert` confirmation. The reset action uses the strongest wording and routes the user back to `/welcome` after completion.

## Data Flow

`Clear my votes` calls `useVotesStore.getState().clearProfile(activeProfileId)`.

`Disconnect remote partner` calls:

- `useCoupleLinkStore.getState().unlink()`
- `usePartnerVotesStore.getState().reset()`
- `useRevealConsentStore.getState().reset()`
- `useEventQueueStore.getState().reset()`

`Reset app on this device` calls:

- profile store reset helper
- votes store reset helper
- couple link clear helper
- partner votes reset
- reveal consent reset
- event queue reset
- vote sync local profile reset
- `clearIdentity()`
- settings age reset

If a store does not yet expose the needed helper, the implementation adds the narrow helper to that store rather than reaching into internal state from the screen.

## Error Handling

Async identity clearing is wrapped in `try/catch`. If reset fails, the app shows an error alert and does not navigate away. Local Zustand resets are synchronous and should complete before identity clearing.

## Testing

Add focused tests for:

- remote partner local disconnect clears couple link, partner votes, reveal consent, and queue
- full local reset clears profiles, votes, sync state, and age verification

Run:

- `cd apps/mobile && npm test -- --runInBand`
- `cd apps/mobile && npx tsc -p tsconfig.json --noEmit`

## Self-Review

No placeholders remain. The design is local-only by intent and does not imply remote account deletion. The implementation is scoped to one settings screen plus narrow store reset helpers.
