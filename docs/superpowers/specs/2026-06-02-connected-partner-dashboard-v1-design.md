# Connected Partner Dashboard V1 Design

## Goal

Add a connected partner dashboard that makes remote sync understandable and controllable after a partner is linked.

## Scope

Connected Partner Dashboard V1 adds a `Partner Sync` screen under Settings and links the active remote partner card on the Profiles tab to that screen.

The dashboard shows:

- Remote partner avatar/name.
- Connection status.
- Linked date.
- Last synced time.
- Pending upload queue count.
- Partner vote count received on this device.
- Partner answered count reported by sync.
- Local profile currently bound to remote vote sync.
- Actions to open Matches, reconnect/create invite, and disconnect local remote partner state.

The disconnect action uses the existing local data control helper and is local-device only.

## Non-Goals

- No remote account deletion.
- No Supabase row cleanup.
- No live network diagnostics beyond local sync state.
- No push/pull retry controls.
- No partner rename/avatar editing.

## UX

When no active remote link exists, the screen shows an empty state and a button to open partner setup.

When a link exists, the screen presents:

- Header card with partner avatar/name and active status.
- Compact status grid for sync facts.
- Action rows/buttons for Matches, Partner setup, and Disconnect.

The Profiles tab remote partner card becomes tappable and routes to the dashboard.

## Data

Reads from:

- `useCoupleLinkStore`
- `usePartnerVotesStore`
- `useEventQueueStore`
- `useVoteSyncStore`
- `useProfilesStore`

Uses `disconnectRemotePartnerLocal()` for disconnect.

## Testing

Add unit tests for a small `getPartnerDashboardStats()` formatter so status labels are stable.

Run:

- `cd apps/mobile && npm test -- --runInBand __tests__/partner-dashboard.test.ts`
- `cd apps/mobile && npm test -- --runInBand`
- `cd apps/mobile && npx tsc -p tsconfig.json --noEmit`
