# Couple Match Artwork Design

## Goal

Replace every user-visible instance of the platform-rendered `💑` glyph with SpiceSync-owned artwork. The supplied interlocking-pepper heart becomes the generic couple/match symbol, while Insights shows the active couple's real profile avatars with the existing heart badge treatment from Profiles.

## Acceptance Criteria

- The `💑` glyph never renders in the app.
- The character may remain only in a non-rendered legacy avatar migration list so previously saved profile values continue to resolve to a supported avatar.
- Both Insights route implementations show the active local avatar and linked partner avatar with the same visual treatment as the Profiles partner card.
- When no active partner link is available, Insights shows the generic pepper-heart artwork instead of inventing a partner avatar.
- Existing unrelated work in both Insights files, including the bar-track layout change already in the working tree, is preserved.
- The supplied image at `/Users/mike/Downloads/Generated image 3.png` is copied into the mobile app assets and is not left referenced from Downloads or the generated-images directory.

## UI Components

### `MatchCoupleIcon`

A small reusable image component owns the pepper-heart asset and its sizing/cropping behavior. It accepts a numeric size and an accessibility label. The component clips the supplied square artwork cleanly on dark surfaces and scales the subject for legibility at loading-screen and achievement-badge sizes without modifying the source artwork.

It replaces visible `💑` uses in:

- the root entry/loading screen;
- the `Soulmates` achievement;
- the `Better Together` achievement;
- any other rendered occurrence discovered by the final repository scan.

The achievement renderer selects the custom component for those semantic achievement IDs. Locked achievements continue to show the existing lock icon. The persisted achievement data shape remains compatible with existing installs.

### `CoupleAvatarPair`

Extract the overlapping-avatar treatment from the Profiles partner card into one shared component. It renders:

- the active local profile avatar in the existing pink gradient circle;
- the linked partner avatar in the existing blue-to-purple gradient circle;
- the existing pink circular badge with a filled white heart between the avatars.

The component accepts both avatar identifiers and a size so Profiles and Insights can use the same structure at their appropriate visual scale. Profiles is refactored to consume it, making the Insights treatment the same implementation rather than a close copy.

## Insights Behavior

Both `app/(insights)/index.tsx` and the older `app/(about)/InsightsScreen.tsx` follow the same rule:

1. Read the active profile avatar from `useProfilesStore`.
2. Read the partner avatar only from an active `useCoupleLinkStore` link.
3. Render `CoupleAvatarPair` when an active link exists.
4. Otherwise render `MatchCoupleIcon` as the neutral fallback.

The score, labels, charts, and calculations do not change.

## Compatibility and Failure Handling

- Missing or obsolete avatar identifiers continue to use `ProfileAvatarIcon`'s existing fallback resolution.
- Existing persisted achievements may still contain `emoji: '💑'`; rendering is determined by stable achievement IDs, so old persisted values cannot make the glyph visible.
- The legacy `PROFILE_AVATAR_OPTIONS` mapping retains `💑` only as migration input. It is never passed to a `Text` renderer.
- No network or runtime image fetch is introduced; all artwork is bundled locally.

## Verification

- Add focused Jest coverage for the generic icon renderer and the linked-versus-unlinked Insights visual selection.
- Add a source regression assertion that fails when `💑` appears outside the legacy migration mapping.
- Run the relevant Jest tests, TypeScript check, lint, and formatting checks.
- Search the mobile source for `💑` and verify the only remaining occurrence is the documented legacy migration mapping.
- Review the affected screens at hero and badge sizes to confirm the artwork is legible and no square-edge artifact is visible.

## Out of Scope

- Replacing unrelated emoji elsewhere in the app.
- Changing compatibility calculations or Insights copy.
- Redesigning profile avatars, partner sync, achievements, or the Profiles layout beyond extracting the shared couple-avatar visual.
