# App Icon and Launch Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and wire a polished two-heart SpiceSync app icon plus a solid-color launch screen.

**Architecture:** Use one editable SVG source for the icon artwork and rasterize Expo-required PNG outputs with ImageMagick. Keep app configuration aligned with the existing Expo asset paths, changing only the generated asset files and launch background behavior.

**Tech Stack:** Expo app config, SVG, PNG assets, ImageMagick `magick`, macOS `sips`.

---

### Task 1: Generate Icon Assets

**Files:**
- Create: `apps/mobile/assets/icon-source.svg`
- Modify: `apps/mobile/assets/icon.png`
- Modify: `apps/mobile/assets/adaptive-icon.png`
- Modify: `apps/mobile/assets/splash-logo.png`

- [ ] **Step 1: Create SVG source**

Create `apps/mobile/assets/icon-source.svg` with a 1024x1024 full-background two-heart design using the approved pink, purple, and deep burgundy palette.

- [ ] **Step 2: Rasterize icon outputs**

Run:

```bash
magick -background none apps/mobile/assets/icon-source.svg -resize 1024x1024 apps/mobile/assets/icon.png
magick -background none apps/mobile/assets/icon-source.svg -resize 1024x1024 apps/mobile/assets/adaptive-icon.png
magick -size 1024x1024 xc:none apps/mobile/assets/splash-logo.png
```

Expected: all three PNG files are written successfully.

- [ ] **Step 3: Verify dimensions**

Run:

```bash
sips -g pixelWidth -g pixelHeight apps/mobile/assets/icon.png apps/mobile/assets/adaptive-icon.png apps/mobile/assets/splash-logo.png
```

Expected: every file reports `pixelWidth: 1024` and `pixelHeight: 1024`.

### Task 2: Confirm Expo Configuration

**Files:**
- Modify only if needed: `apps/mobile/app.json`

- [ ] **Step 1: Check app config**

Confirm `icon`, `splash.image`, `splash.backgroundColor`, `android.adaptiveIcon.foregroundImage`, and `android.adaptiveIcon.backgroundColor` point to the generated assets and use `#0D0006` for launch/adaptive background.

- [ ] **Step 2: Run config validation**

Run:

```bash
npx expo config --type public
```

Expected: Expo config prints without JSON or asset path errors.
