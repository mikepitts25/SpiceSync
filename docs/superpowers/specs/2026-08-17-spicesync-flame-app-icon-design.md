# SpiceSync Flame App Icon Design

## Goal

Replace the current interlocking-heart icon with an original, playful, suggestive flame mark that is recognizable at a glance and compatible with SpiceSync's Expo/EAS release flow for TestFlight and the App Store.

This design supersedes the icon direction in `2026-05-31-app-icon-launch-screen-design.md`. It does not change the existing launch-screen direction.

## Approved Direction

Use one unmistakable classic fire silhouette inspired by the familiar visual grammar of the fire emoji, without copying the emoji artwork. The mark has:

- one large hot-pink outer flame with a broad rounded base;
- three intentional outer tips: a short left lick, a tall central lick, and a medium right lick;
- one vivid-purple inner flame that rises from the base and curves in a loose S motion;
- no heart, lettering, lips, people, peppers, orbit rings, gloss arcs, or sparkle.

The outer flame supplies immediate recognition and playful heat. The inner flame introduces SpiceSync's purple brand color and subtly suggests two energies moving together. The result should feel flirty and energetic while remaining discreet and App Store-safe.

## Visual Treatment

- Canvas/background: full-bleed `#0D0006`.
- Outer flame: `#FF2D92`.
- Inner flame: `#8B5CF6`.
- Geometry: bold, smooth, and compact, with no thin details.
- Placement: optically centered and approximately 68% of the canvas height, leaving enough margin for platform masking.
- Rendering: flat source geometry with clean edges. The approved concept preview's generated shading is not part of the production design.
- Corners: square source artwork with no baked-in rounded-corner mask.
- Text: none.

Concept reference: `outputs/app-icon-concepts/classic-flame-refined-v4.png`.

## Production Assets

Create a precise vector master before raster export. The generated concept image is a direction reference only and must not be shipped directly.

- `apps/mobile/assets/icon-source.svg`: opaque, full-square vector master for the default app icon.
- `apps/mobile/assets/icon.png`: 1024x1024 opaque sRGB PNG exported from the vector master.
- `apps/mobile/assets/adaptive-icon-source.svg`: Android adaptive foreground derived from the same flame geometry with mask-safe scaling and transparent space outside the foreground mark.
- `apps/mobile/assets/adaptive-icon.png`: 1024x1024 transparent PNG exported from the adaptive foreground source.

Keep the existing `apps/mobile/app.json` asset paths and the Android adaptive background color `#0D0006`. The splash assets are outside this change.

## Platform Constraints

Apple's current Human Interface Guidelines specify a 1024x1024 square layout for iOS app icons and state that the system applies the rounded mask. They also recommend simple, centered artwork that stays legible at small sizes. Expo's current guidance supports a 1024x1024 PNG, requires the icon to be exactly square and full-bleed without transparent corners, and lets EAS generate the remaining device sizes.

The project will continue using Expo's supported flattened-PNG path for this change. A layered Icon Composer asset can be considered separately later; it is not needed to replace the existing icon safely.

Sources:

- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/app-icons/
- Expo app icon guide: https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/
- Expo app configuration: https://docs.expo.dev/versions/latest/config/app/

## Verification

Before replacing the current assets:

1. Confirm both exported PNGs are exactly 1024x1024.
2. Confirm `icon.png` is opaque RGB/RGBA with no transparent pixels.
3. Confirm `adaptive-icon.png` retains transparency outside the foreground flame.
4. Render the default icon with representative iOS rounded-square masking and the adaptive foreground with common Android circle and squircle masks.
5. Review the mark at 1024px, 180px, 60px, and 32px to ensure the three outer flame tips and purple inner flame remain distinct.
6. Run the existing mobile release check and an Expo config inspection to confirm the configured asset paths resolve.

## Out of Scope

- App name, bundle identifier, store metadata, screenshots, and splash-screen redesign.
- Dark, tinted, or clear iOS appearance variants.
- Android monochrome themed-icon artwork.
- Changes to in-app logos or navigation icons.
