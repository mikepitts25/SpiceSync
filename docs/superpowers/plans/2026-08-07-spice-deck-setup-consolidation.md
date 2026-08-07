# Spice Deck Setup Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the Spice Deck pre-game setup so its essentials, including Start Playing, fit on the opening phone screen without scrolling.

**Architecture:** Keep the existing `GameSetupPanel` as the setup-screen boundary and only reorganize its visual hierarchy. Remove obsolete props and i18n copy at the screen boundary, then use a compact, accessible control row for game mode and card language while preserving the established game-state callbacks.

**Tech Stack:** React Native, Expo Router, TypeScript, Jest, react-test-renderer.

## Global Constraints

- Retain all existing game setup callbacks and accessibility labels/selected states.
- Retain a 44-point minimum interactive height through `GAME_CONTROL_MIN_SIZE`.
- The English title must be `Pick your vibe. Draw a card.` and the Spanish title must remain one concise line.
- The initial setup must not use a vertically scrolling container.
- Do not modify unrelated existing worktree changes.

---

### Task 1: Define the compact setup-panel contract with a failing component test

**Files:**
- Modify: `apps/mobile/__tests__/game-screen-components.test.tsx:1-285`

**Interfaces:**
- Consumes: `GameSetupPanel` props from `apps/mobile/components/game/GameSetupPanel.tsx`.
- Produces: Regression coverage for the consolidated setup visual structure.


- [ ] **Step 1: Update the setup test fixture with the intended headline**

  Update `setupProps()` so it contains `introTitle: 'Pick your vibe. Draw a card.'`. Retain the legacy `introBody`, `badgeLabels`, and `intenseDisclaimer` properties until the component implementation removes them, so the new test can fail on the intended rendered-content assertions rather than on an undefined value during setup.

- [ ] **Step 2: Add the failing regression test**

  Add this test before the existing action-forwarding test:

  ```tsx
  it('consolidates setup controls without card-count copy, type badges, or scrolling', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<GameSetupPanel {...setupProps()} />);
    });

    expect(tree!.root.findAllByType(ScrollView)).toHaveLength(0);
    expect(
      tree!.root.findByProps({ children: 'Pick your vibe. Draw a card.' })
    ).toBeDefined();
    expect(
      tree!.root.findAll((node) => node.props.children === '120 cards ready for Normal mode.')
    ).toHaveLength(0);
    expect(
      tree!.root.findAll((node) => node.props.children === 'TRUTH')
    ).toHaveLength(0);

    const controls = tree!.root.findByProps({
      testID: 'game-setup-primary-controls',
    });
    expect(StyleSheet.flatten(controls.props.style)).toMatchObject({
      flexDirection: 'row',
      alignItems: 'center',
    });
    expect(
      controls.find((node) => node.props.accessibilityLabel === 'Game mode')
    ).toBeDefined();
    expect(
      controls.find((node) => node.props.accessibilityLabel === 'Card Language')
    ).toBeDefined();
  });
  ```


- [ ] **Step 3: Run the focused test to verify it fails for the missing compact layout**

  Run: `npm test -- --runInBand __tests__/game-screen-components.test.tsx`

  Expected: FAIL because the rendered component still contains a `ScrollView`, legacy copy, type badges, and no `game-setup-primary-controls` row.

### Task 2: Consolidate the setup panel and its screen call site

**Files:**
- Modify: `apps/mobile/components/game/GameSetupPanel.tsx:1-340`
- Modify: `apps/mobile/app/(game)/spice-deck.tsx:1031-1068`
- Modify: `apps/mobile/lib/i18n/en.ts:397-414`
- Modify: `apps/mobile/lib/i18n/es.ts:404-421`

**Interfaces:**
- Consumes: Existing player, level, card-type, drinking, card-language, custom-deck, and start callbacks.
- Produces: `GameSetupPanel` accepting no `introBody` or `badgeLabels`, and `t.game.introTitle` providing concise localized copy.

- [ ] **Step 1: Remove obsolete presentation props and call-site interpolation**

  In `GameSetupPanelProps` and its destructured parameters, delete `introBody`, `badgeLabels`, and `intenseDisclaimer`; then remove those three legacy properties from `setupProps()`. Remove the `GamePill` and `ScrollView` imports and the legacy badge/body/disclaimer render blocks. In `spice-deck.tsx`, remove `introBody={interpolate(...)}`, `badgeLabels={...}`, and `intenseDisclaimer={...}` from `<GameSetupPanel>`; `interpolate` has no remaining use in that file and should be removed from its import.

- [ ] **Step 2: Implement the compact, non-scrolling header controls**

  Replace the setup panel's root `ScrollView` with a `View`. Keep `GAME NIGHT` and the title, then add this primary control row directly below the title:

  ```tsx
  <View testID="game-setup-primary-controls" style={styles.primaryControls}>
    <GameSegmentedControl
      accessibilityLabel={t.game.gameModeA11y}
      value={mode}
      options={modeOptions}
      onChange={onModeChange}
      compact
    />
    <GameSegmentedControl
      accessibilityLabel={t.game.cardLanguage}
      value={cardLanguage}
      options={[
        { value: 'en', label: 'EN' },
        { value: 'es', label: 'ES' },
      ]}
      onChange={onCardLanguageChange}
      compact
    />
  </View>
  ```

  Delete the former standalone language section and omit the intense-mode disclaimer from the setup screen. The Normal/Intense control remains the mode indicator; omitting the supporting sentence prevents a mode-specific multi-line block from pushing Start Playing below the viewport.

- [ ] **Step 3: Reduce fixed vertical space without reducing touch targets**

  Set the new compact layout styles as follows, then bring the remaining panel group gaps and padding down to 8-12 points so the unscrolled setup fits a standard phone viewport:

  ```tsx
  content: { gap: 10, paddingBottom: 0 },
  hero: { gap: 6 },
  setupInner: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800', textAlign: 'center' },
  primaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  languageRow: { gap: 4 },
  ```

  Keep Pressable and segmented control minimum heights at 44 points. Retain the project's 16-point minimum for static labels and reduce only decorative/card padding, never the accessible hit area.

- [ ] **Step 4: Update the localized headline copy and remove unused availability copy**

  In `en.ts`, set `game.introTitle` to `Pick your vibe. Draw a card.` and delete `game.introBody`. In `es.ts`, set `game.introTitle` to `Elige tu vibra. Saca una carta.` and delete `game.introBody`.

- [ ] **Step 5: Run the focused test to verify the implementation passes**

  Run: `npm test -- --runInBand __tests__/game-screen-components.test.tsx`

  Expected: PASS, including the new compact-layout test and the existing control-action tests.

### Task 3: Verify the consolidated screen against the app quality gates

**Files:**
- Verify only: `apps/mobile/components/game/GameSetupPanel.tsx`
- Verify only: `apps/mobile/app/(game)/spice-deck.tsx`
- Verify only: `apps/mobile/lib/i18n/en.ts`
- Verify only: `apps/mobile/lib/i18n/es.ts`
- Verify only: `apps/mobile/__tests__/game-screen-components.test.tsx`

**Interfaces:**
- Consumes: The completed compact setup implementation.
- Produces: Fresh test, lint, and TypeScript evidence before review.

- [ ] **Step 1: Run the full mobile unit test suite**

  Run: `npm test -- --runInBand`

  Expected: PASS with zero failed suites or tests.

- [ ] **Step 2: Run lint and TypeScript checks**

  Run: `npm run lint && npx tsc --noEmit`

  Expected: both commands exit 0 with no errors.

- [ ] **Step 3: Inspect the scoped diff and commit only the Spice Deck changes**

  Run: `git diff --check -- apps/mobile/components/game/GameSetupPanel.tsx 'apps/mobile/app/(game)/spice-deck.tsx' apps/mobile/lib/i18n/en.ts apps/mobile/lib/i18n/es.ts apps/mobile/__tests__/game-screen-components.test.tsx`

  Expected: no whitespace errors. Then stage exactly those five files and commit with: `git commit -m "feat: consolidate spice deck setup"`.
