# Profile Achievements Refresh Design

Date: 2026-06-05

## Goal

Remove Insights from profile/settings navigation and make Achievements a more useful, polished local progression surface. The achievement system should cover more app behaviors and introduce cosmetic rewards for major milestones, such as special profile icons or profile frames.

## Current Context

The Settings screen links to Achievements and Insights from `apps/mobile/app/(settings)/index.tsx`. The active Achievements screen at `apps/mobile/app/(settings)/achievements.tsx` reads from `apps/mobile/lib/achievements.ts`, which currently defines a small streak/activity catalog.

There is a separate richer catalog in `apps/mobile/src/stores/achievements.ts`, but it is not the store used by the active settings achievement route. This refresh will extend the currently wired `lib/achievements.ts` path instead of switching systems during the same change.

## Approved Interaction

- Remove the Insights row from Settings/About navigation so users are no longer sent to `/(insights)`.
- Keep Achievements as the main local progress destination.
- Expand the catalog to roughly 24-30 achievements.
- Cover varied behaviors:
  - Streaks and active days
  - Voting and category exploration
  - Matches
  - Conversation usage
  - Game activity
  - Profile setup and partner sync
  - Privacy/safety setup
- Use achievement tiers: bronze, silver, gold, and platinum.
- Add cosmetic reward metadata to major achievements.
- Rewards are local-only cosmetics for now, not paid entitlements or functional perks.

## Achievement UI

The Achievements screen should become more scannable and premium-feeling without becoming a separate dashboard:

- A compact summary row shows total achievements, unlocked count, and current streak.
- Achievement cards show icon, title, description, tier, progress, and lock/unlock state.
- Higher-tier cards should visually stand out through tier color, border treatment, or subtle gradient accents.
- Cards with cosmetic rewards should show a short reward label.
- Locked cards should still show progress instead of hiding useful context.

## Rewards

Cosmetic rewards should be modeled as metadata on achievement definitions. The first implementation should support at least these reward types:

- Profile icon unlock
- Profile frame unlock

The achievement screen can display reward labels immediately. Applying unlocked icons or frames to profile editing may be added if it stays small; otherwise it should remain metadata for a later profile-customization pass.

## Implementation Shape

- Extend `Achievement` definitions in `apps/mobile/lib/achievements.ts` with tier, target, and optional reward metadata.
- Keep current persisted unlock IDs compatible with existing users.
- Add progress support for the expanded achievement IDs.
- Update `apps/mobile/app/(settings)/achievements.tsx` to render the richer catalog and reward labels.
- Remove the Insights navigation row and unused import from `apps/mobile/app/(settings)/index.tsx`.
- Avoid broad deletion of old Insights route files unless they are directly referenced by the removed UI.

## Testing

- Add or update focused tests for the achievement catalog shape and progress calculation.
- Verify existing unlock IDs remain valid.
- Run the focused achievement tests and a relevant settings/router test if one already covers settings route files.

## Out of Scope

- Paid reward entitlements.
- Server sync for achievements or rewards.
- Full profile customization management if it requires a separate settings flow.
- Reworking or deleting the old disconnected achievement store in `apps/mobile/src/stores/achievements.ts`.
