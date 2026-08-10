# Spice Deck Game-Table Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Spice Deck setup feel like a polished, responsive pre-game table while keeping the established dark-magenta theme and one-screen setup flow.

**Architecture:** Keep all setup state in `spice-deck.tsx`; evolve `GameSetupPanel` into a visually structured view composed of small layout-only groups. Extend `GameControls` with an optional game-action visual treatment so the richer primary action remains reusable and keeps existing interaction/accessibility semantics.

**Tech Stack:** React Native, Expo, TypeScript, lucide-react-native, Jest, react-test-renderer.

## Global Constraints

- Preserve every existing setup callback, accessibility role, label, selected state, and 44-point minimum touch target.
- Keep the initial setup visible without vertical scrolling on the standard phone viewport.
- Add no dependencies, game content, network behavior, or decorative illustrations.
- Use `Your deck. Your pace.` and `Tu mazo. Tu ritmo.` as the localized setup title.
- Use `Deal First Card` and `Repartir la primera carta.` as the localized primary action.
- Motion is brief, interruptible, and never blocks interaction; no looping animation is added.
- Do not modify the unrelated `Family Budget1.xlsx` or `outputs/family-budget-august-2026/` files.

---

### Task 1: Define regression coverage for the polished setup hierarchy

**Files:**
- Modify: `apps/mobile/__tests__/game-screen-components.test.tsx:40-325`

**Interfaces:**
- Consumes: `GameSetupPanel`, `GameButton`, and existing setup callback props.
- Produces: Render-level regression coverage for the settings strip, grouped setup sections, deck-specific CTA, and unchanged actions.

- [ ] **Step 1: Update the setup fixture to the new copy**

  In `setupProps()`, set `introTitle: 'Your deck. Your pace.'` and `startLabel: 'Deal First Card'`. Update the existing non-scrolling test's title assertion and the existing callback-forwarding test's start-button query to those same new values, so the red run fails on the new hierarchy contract, not stale copy.

- [ ] **Step 2: Add the failing hierarchy test**

  Add this test after the existing non-scrolling setup test:

  ```tsx
  it('renders a structured game-table setup with a deck-specific primary action', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<GameSetupPanel {...setupProps()} />);
    });

    expect(
      tree!.root.findByProps({ children: 'Your deck. Your pace.' })
    ).toBeDefined();
    expect(
      tree!.root.findByProps({ testID: 'game-setup-settings-strip' })
    ).toBeDefined();
    expect(
      tree!.root.findByProps({ testID: 'game-setup-players' })
    ).toBeDefined();
    expect(
      tree!.root.findByProps({ testID: 'game-setup-deck' })
    ).toBeDefined();

    const start = tree!.root.find(
      (node) => node.props.accessibilityLabel === 'Deal First Card'
    );
    expect(flattenedPressableStyle(start)).toMatchObject({
      minHeight: GAME_CONTROL_MIN_SIZE,
    });
  });
  ```

- [ ] **Step 3: Run the focused test to verify the missing hierarchy fails**

  Run: `npm test -- --runInBand __tests__/game-screen-components.test.tsx`

  Expected: FAIL because `game-setup-settings-strip`, `game-setup-players`, and `game-setup-deck` are absent and the old copy/action label still render.

### Task 2: Build the game-table hierarchy and interaction finish

**Files:**
- Modify: `apps/mobile/components/game/GameSetupPanel.tsx:1-400`
- Modify: `apps/mobile/components/game/GameControls.tsx:35-245`
- Modify: `apps/mobile/app/(game)/spice-deck.tsx:1025-1065`
- Modify: `apps/mobile/lib/i18n/en.ts:392-430`
- Modify: `apps/mobile/lib/i18n/es.ts:399-437`
- Modify: `apps/mobile/__tests__/game-screen-components.test.tsx:40-350`

**Interfaces:**
- Consumes: Existing `GameSetupPanelProps` callbacks; existing `GameButton` and `GameSegmentedControl` APIs.
- Produces: Optional `emphasis?: 'default' | 'game'` on `GameButton`; polished layout test IDs; localized title and start-action copy.

- [ ] **Step 1: Add the reusable game-action emphasis**

  Add the optional `emphasis` prop to `GameButton`, defaulting to `default`. When `emphasis="game"` and `variant="primary"`, use a three-stop primary gradient and a fine translucent inner border. Preserve `compact`, disabled behavior, the existing press-scale response, and all accessibility values.

  ```tsx
  <LinearGradient
    colors={
      emphasis === 'game'
        ? ['#C90B5A', '#FF2D92', '#FF4F7A']
        : GRADIENTS.primary
    }
    style={[
      styles.buttonBody,
      compact && styles.buttonBodyCompact,
      emphasis === 'game' && styles.buttonBodyGame,
    ]}
  >
  ```

- [ ] **Step 2: Structure `GameSetupPanel` into compact visual zones**

  Keep the outer `GAME NIGHT` eyebrow and the new title. Wrap the two existing compact segmented controls in a single `View` with `testID="game-setup-settings-strip"`; place each in a column with a 16-point uppercase label (`MODE` and `CARDS`) and preserve their 44-point controls.

  Wrap the player count and player names in `testID="game-setup-players"`. Wrap the drinking row, level chips, card-type chips, and optional custom-deck mix in `testID="game-setup-deck"`. Use 1-point low-contrast separators and a shared 16-point uppercase section-heading style rather than adding nested card surfaces.

  Use the existing magenta/crimson colors to add depth without artwork: a soft translucent accent wash inside `setupCard`, an illuminated active-chip fill, and a restrained active-chip shadow. Do not reduce any interactive height below 44 points. Reduce surrounding gap/padding only enough to keep the panel one-screen.

- [ ] **Step 3: Give selections and the start action purposeful presence**

  Add a short mount-only `Animated.timing` transition to the setup card (opacity 0→1 and translateY 8→0 over 220ms with native driver). It must not loop or affect hit testing.

  Pass `emphasis="game"` to the primary `GameButton`, use `Layers3` from `lucide-react-native` as its icon, and retain `compact`. Keep the current `PlusCircle` custom-deck icon. The existing pressed scale is the interaction response; do not add a looping pulse.

- [ ] **Step 4: Localize copy at the screen call site**

  In `en.ts`, change `game.introTitle` to `Your deck. Your pace.` and `game.startPlaying` to `Deal First Card`. In `es.ts`, change them to `Tu mazo. Tu ritmo.` and `Repartir la primera carta.` respectively. No hardcoded user-facing copy belongs in `GameSetupPanel`.

- [ ] **Step 5: Run the focused tests to verify the polished hierarchy passes**

  Run: `npm test -- --runInBand __tests__/game-screen-components.test.tsx`

  Expected: PASS, including the new hierarchy test, existing callback forwarding, non-scrolling layout, and 44-point control tests.

### Task 3: Verify and independently review the polish pass

**Files:**
- Verify only: `apps/mobile/components/game/GameSetupPanel.tsx`
- Verify only: `apps/mobile/components/game/GameControls.tsx`
- Verify only: `apps/mobile/app/(game)/spice-deck.tsx`
- Verify only: `apps/mobile/lib/i18n/en.ts`
- Verify only: `apps/mobile/lib/i18n/es.ts`
- Verify only: `apps/mobile/__tests__/game-screen-components.test.tsx`

**Interfaces:**
- Consumes: Completed game-table polish implementation.
- Produces: Fresh quality-gate evidence and independent review feedback.

- [ ] **Step 1: Run quality gates**

  Run: `npm test -- --runInBand && npm run lint && npx tsc --noEmit`

  Expected: all Jest suites pass, lint exits with zero errors, and TypeScript exits 0.

- [ ] **Step 2: Request an independent polish review**

  Ask a second agent to inspect the scoped diff and component tests against the design spec. The review must assess visual hierarchy, density, selected-state clarity, motion restraint, accessible touch sizes, copy tone, and regression risks. Address every actionable finding, re-run the focused and full tests after any change, and retain only the intended scope.

- [ ] **Step 3: Inspect and commit the scoped change**

  Run: `git diff --check -- apps/mobile/components/game/GameSetupPanel.tsx apps/mobile/components/game/GameControls.tsx 'apps/mobile/app/(game)/spice-deck.tsx' apps/mobile/lib/i18n/en.ts apps/mobile/lib/i18n/es.ts apps/mobile/__tests__/game-screen-components.test.tsx`

  Expected: no whitespace errors. Stage exactly those six files and commit with: `git commit -m "feat: polish spice deck setup"`.
