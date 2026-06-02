# Monetization Scaffold V1 Design

## Goal

Keep SpiceSync free while preparing a clean upgrade path that does not grant fake premium access or simulate successful purchases before a real billing provider is configured.

## Scope

V1 replaces mock purchase success with an honest "coming soon" monetization scaffold:

- Purchase service is disabled by default.
- Paywall buttons collect interest or explain that purchasing is not available yet.
- Restore purchases returns no restored items while purchases are disabled.
- Gift redemption no longer grants premium from any locally typed code.
- Existing premium entitlement state remains available for future real receipts and manual testing.

## Non-Goals

- No RevenueCat/App Store/Play Store integration in this slice.
- No backend gift-code validation.
- No pricing experiment or paywall copy A/B test.
- No removal of premium-gated feature code.

## Data

Add purchase availability helpers in the purchases module. The default state is unavailable unless a future public env flag/provider explicitly enables it.

The premium store keeps its subscription and pack shapes, but redemption is conservative when there is no server validation.

## UX

The unlock screen still shows Premium, Packs, and Gift tabs so users understand the future offer. CTAs say "Join waitlist" or "Notify me" rather than "Processing..." or "Unlock." Tapping them shows a clear message that purchases are not live yet.

## Testing

Add tests that assert:

- Purchase service returns a disabled result by default and does not mutate premium state.
- Gift redemption cannot unlock premium without real validation.
- Unlock UI has no `mock_receipt` strings and uses waitlist/notification copy.
