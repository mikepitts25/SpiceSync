# SpiceSync Flame App Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace SpiceSync's current interlocking-heart artwork with the approved, production-ready two-color flame icon for Expo/EAS, TestFlight, and the App Store.

**Architecture:** Keep the existing Expo asset paths unchanged. Define the icon once as precise SVG geometry, derive a mask-safe Android adaptive SVG from the same two flame paths, and export both PNG deliverables deterministically with ImageMagick. Verify metadata, opacity, mask behavior, small-size legibility, Expo configuration, and the existing release checks before committing.

**Tech Stack:** SVG, PNG/sRGB, ImageMagick 7 (`magick`), Expo SDK 54/EAS, Node.js 20, macOS `sips`

## Global Constraints

- Default background: full-bleed `#0D0006`.
- Outer flame: solid `#FF2D92`.
- Inner flame: solid `#8B5CF6`.
- The default source is square and opaque, with no baked rounded-corner mask.
- The mark contains one broad outer flame with exactly three intentional tips and one curved inner flame.
- Do not add hearts, lettering, lips, people, peppers, orbit rings, gloss arcs, sparkles, thin details, gradients, shadows, or transparency to the default icon.
- Keep the existing `apps/mobile/app.json` icon paths and Android adaptive background color `#0D0006` unchanged.
- Produce a 1024x1024 opaque sRGB default PNG and a 1024x1024 transparent Android adaptive foreground PNG.
- Do not change splash assets, store metadata, dark/tinted/clear iOS variants, Android monochrome artwork, or in-app logos.

---

## File Structure

- `apps/mobile/assets/icon-source.svg`: authoritative full-square vector master with the opaque background and default-size flame.
- `apps/mobile/assets/adaptive-icon-source.svg`: Android foreground master reusing the same flame paths at a smaller mask-safe scale and no background rectangle.
- `apps/mobile/assets/icon.png`: opaque 1024x1024 sRGB Expo/EAS default icon generated from `icon-source.svg`.
- `apps/mobile/assets/adaptive-icon.png`: transparent 1024x1024 Android adaptive foreground generated from `adaptive-icon-source.svg`.
- `outputs/app-icon-validation/ios-rounded.png`: temporary visual QA rendering with a representative rounded-square mask; do not commit.
- `outputs/app-icon-validation/android-circle.png`: temporary visual QA rendering with a circle mask; do not commit.
- `outputs/app-icon-validation/android-squircle.png`: temporary visual QA rendering with a squircle-like mask; do not commit.
- `outputs/app-icon-validation/small-size-sheet.png`: temporary 180px/60px/32px legibility sheet; do not commit.

### Task 1: Build and verify the production icon assets

**Files:**

- Modify: `apps/mobile/assets/icon-source.svg`
- Modify: `apps/mobile/assets/adaptive-icon-source.svg`
- Modify: `apps/mobile/assets/icon.png`
- Modify: `apps/mobile/assets/adaptive-icon.png`
- Reference: `outputs/app-icon-concepts/classic-flame-refined-v4.png`
- Reference: `docs/superpowers/specs/2026-08-17-spicesync-flame-app-icon-design.md`

**Interfaces:**

- Consumes: Expo's existing `expo.icon` value `./assets/icon.png`, `expo.android.adaptiveIcon.foregroundImage` value `./assets/adaptive-icon.png`, and adaptive background `#0D0006` from `apps/mobile/app.json`.
- Produces: one opaque 1024x1024 default PNG and one transparent 1024x1024 adaptive foreground PNG, both derived from reviewable SVG masters.

- [ ] **Step 1: Run semantic source checks against the current icon and confirm they fail**

Run:

```bash
node - <<'NODE'
const fs = require('fs');
const source = fs.readFileSync('apps/mobile/assets/icon-source.svg', 'utf8');
for (const required of [
  'data-icon="spicesync-flame"',
  'id="outer-flame"',
  'id="inner-flame"',
  'fill="#0D0006"',
  'fill="#FF2D92"',
  'fill="#8B5CF6"',
]) {
  if (!source.includes(required)) throw new Error(`Missing ${required}`);
}
NODE
```

Expected: FAIL with `Missing data-icon="spicesync-flame"`, proving the current heart artwork does not satisfy the approved icon contract.

- [ ] **Step 2: Replace the default SVG master with the approved flame geometry**

Set `apps/mobile/assets/icon-source.svg` to:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" data-icon="spicesync-flame">
  <rect width="1024" height="1024" fill="#0D0006"/>
  <path id="outer-flame" fill="#FF2D92" d="M512 164C576 226 621 286 638 355C652 416 638 476 674 535C722 490 744 442 746 390C821 475 858 573 851 672C841 797 743 875 598 884C438 895 297 829 259 708C229 612 251 505 331 426C321 477 333 521 367 553C388 503 426 461 464 418C521 353 548 287 512 164Z"/>
  <path id="inner-flame" fill="#8B5CF6" d="M576 507C521 544 494 587 503 633C513 683 558 715 569 758C580 802 546 846 492 870C530 881 575 886 616 879C680 864 716 824 717 772C719 719 682 681 641 646C596 608 579 564 604 520C596 517 586 512 576 507Z"/>
</svg>
```

The path geometry intentionally uses only two foreground shapes. Do not trace the generated raster preview or introduce its gradients.

- [ ] **Step 3: Replace the Android adaptive foreground SVG with the same mark at mask-safe scale**

Set `apps/mobile/assets/adaptive-icon-source.svg` to:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" data-icon="spicesync-flame-adaptive">
  <g transform="translate(112.64 112.64) scale(0.78)">
    <path id="outer-flame" fill="#FF2D92" d="M512 164C576 226 621 286 638 355C652 416 638 476 674 535C722 490 744 442 746 390C821 475 858 573 851 672C841 797 743 875 598 884C438 895 297 829 259 708C229 612 251 505 331 426C321 477 333 521 367 553C388 503 426 461 464 418C521 353 548 287 512 164Z"/>
    <path id="inner-flame" fill="#8B5CF6" d="M576 507C521 544 494 587 503 633C513 683 558 715 569 758C580 802 546 846 492 870C530 881 575 886 616 879C680 864 716 824 717 772C719 719 682 681 641 646C596 608 579 564 604 520C596 517 586 512 576 507Z"/>
  </g>
</svg>
```

This transformation keeps the artwork centered because it scales the 1024-unit coordinate system to 78% and offsets it by `(1024 - 1024 * 0.78) / 2 = 112.64` on each axis.

- [ ] **Step 4: Re-run the semantic source checks and verify they pass**

Run:

```bash
node - <<'NODE'
const fs = require('fs');
const source = fs.readFileSync('apps/mobile/assets/icon-source.svg', 'utf8');
for (const required of [
  'data-icon="spicesync-flame"',
  'id="outer-flame"',
  'id="inner-flame"',
  'fill="#0D0006"',
  'fill="#FF2D92"',
  'fill="#8B5CF6"',
]) {
  if (!source.includes(required)) throw new Error(`Missing ${required}`);
}
const adaptive = fs.readFileSync('apps/mobile/assets/adaptive-icon-source.svg', 'utf8');
if (!adaptive.includes('data-icon="spicesync-flame-adaptive"')) throw new Error('Missing adaptive flame marker');
if (adaptive.includes('<rect')) throw new Error('Adaptive foreground must not contain a background rectangle');
NODE
```

Expected: exit 0 with no output.

- [ ] **Step 5: Export deterministic 1024px PNG assets**

Run:

```bash
magick -background none apps/mobile/assets/icon-source.svg -resize '1024x1024!' -strip -colorspace sRGB -depth 8 -alpha off apps/mobile/assets/icon.png
magick -background none apps/mobile/assets/adaptive-icon-source.svg -resize '1024x1024!' -strip -colorspace sRGB -depth 8 -alpha on apps/mobile/assets/adaptive-icon.png
```

Expected: both commands exit 0 and replace only the two configured PNG assets.

- [ ] **Step 6: Verify dimensions, colorspace, and opacity behavior**

Run:

```bash
sips -g pixelWidth -g pixelHeight apps/mobile/assets/icon.png apps/mobile/assets/adaptive-icon.png
magick identify -format 'default: %wx%h %[colorspace] opaque=%[opaque]\n' apps/mobile/assets/icon.png
magick identify -format 'adaptive: %wx%h %[colorspace] opaque=%[opaque]\n' apps/mobile/assets/adaptive-icon.png
```

Expected:

```text
pixelWidth: 1024
pixelHeight: 1024
pixelWidth: 1024
pixelHeight: 1024
default: 1024x1024 sRGB opaque=True
adaptive: 1024x1024 sRGB opaque=False
```

- [ ] **Step 7: Generate representative iOS and Android mask previews**

Run:

```bash
mkdir -p outputs/app-icon-validation
magick apps/mobile/assets/icon.png \( +clone -alpha transparent -fill white -draw 'roundrectangle 0,0 1023,1023 230,230' \) -compose CopyOpacity -composite outputs/app-icon-validation/ios-rounded.png
magick -size 1024x1024 canvas:'#0D0006' apps/mobile/assets/adaptive-icon.png -compose over -composite \( +clone -alpha transparent -fill white -draw 'circle 512,512 512,0' \) -compose CopyOpacity -composite outputs/app-icon-validation/android-circle.png
magick -size 1024x1024 canvas:'#0D0006' apps/mobile/assets/adaptive-icon.png -compose over -composite \( +clone -alpha transparent -fill white -draw 'roundrectangle 64,64 959,959 300,300' \) -compose CopyOpacity -composite outputs/app-icon-validation/android-squircle.png
```

Expected: all three previews are 1024x1024; the flame is centered, no tip is clipped, no transparent corner appears inside the platform mask, and the adaptive icon has similar perceived scale under circle and squircle masks.

- [ ] **Step 8: Generate and inspect a small-size legibility sheet**

Run:

```bash
magick -size 360x260 canvas:'#26232C' \( apps/mobile/assets/icon.png -resize 180x180 \) -geometry +20+40 -composite \( apps/mobile/assets/icon.png -resize 60x60 \) -geometry +220+70 -composite \( apps/mobile/assets/icon.png -resize 32x32 \) -geometry +294+84 -composite outputs/app-icon-validation/small-size-sheet.png
```

Open `outputs/app-icon-validation/small-size-sheet.png` and verify that the outer silhouette reads immediately as fire at every size, the left/center/right tips remain distinct, and the purple inner flame remains visible at 32px.

- [ ] **Step 9: Confirm Expo resolves the unchanged icon configuration**

Run:

```bash
cd apps/mobile
npx expo config --type public --json > /tmp/spicesync-expo-config.json
node - <<'NODE'
const config = require('/tmp/spicesync-expo-config.json');
if (config.icon !== './assets/icon.png') throw new Error(`Unexpected icon: ${config.icon}`);
if (config.android?.adaptiveIcon?.foregroundImage !== './assets/adaptive-icon.png') throw new Error('Unexpected adaptive foreground');
if (config.android?.adaptiveIcon?.backgroundColor !== '#0D0006') throw new Error('Unexpected adaptive background');
console.log('Expo icon configuration resolves correctly.');
NODE
```

Expected: `Expo icon configuration resolves correctly.`

- [ ] **Step 10: Run the existing release verification**

Run:

```bash
cd apps/mobile
npm run release:check
```

Expected: admin tests, mobile Jest, TypeScript, Expo release config, and TestFlight profile sanity all pass, ending with `Release check passed.`

- [ ] **Step 11: Review the final diff and commit the asset replacement**

Run:

```bash
git diff --check
git status --short
git diff -- apps/mobile/assets/icon-source.svg apps/mobile/assets/adaptive-icon-source.svg
git add apps/mobile/assets/icon-source.svg apps/mobile/assets/adaptive-icon-source.svg apps/mobile/assets/icon.png apps/mobile/assets/adaptive-icon.png
git commit -m "feat: replace app icon with flame mark"
```

Expected: the commit contains exactly the two SVG masters and two generated PNGs. Do not stage `outputs/app-icon-validation/` or unrelated working-tree files.
