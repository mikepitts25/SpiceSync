# Game Language and Player Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the active-game EN/ES selector compact and right-aligned, keep Spanish phrases from splitting words, and center all player-box text.

**Architecture:** Extend the existing game controls with opt-in compact presentation props so default setup controls remain unchanged. Keep all layout decisions inside the active round and session-chrome presentation components; game state, translations, and callbacks remain untouched.

**Tech Stack:** React Native 0.81, Expo 54, TypeScript 5.9, Jest 29, `react-test-renderer` 19

## Global Constraints

- Preserve a minimum 44-point touch target for each language option and header action.
- Allow Spanish multi-word labels to wrap to at most two centered lines when necessary.
- Do not intentionally split individual words.
- Keep long player names on one line with `minimumFontScale={0.72}`.
- Do not change language persistence, translations, game rules, navigation, card content, or setup-screen segmented-control sizing.
- Preserve existing accessibility labels, selected states, button roles, and system font scaling.

## File Map

- Modify `apps/mobile/components/game/GameControls.tsx`: add opt-in compact segmented-control and button presentations.
- Modify `apps/mobile/components/game/GameRoundPanel.tsx`: right-align the compact active-game language selector.
- Modify `apps/mobile/components/game/GameSessionChrome.tsx`: allow clean Spanish header wrapping and center player-box copy.
- Modify `apps/mobile/__tests__/game-screen-components.test.tsx`: protect compact sizing, Spanish wrapping, touch targets, and centered matchup content.

---

### Task 1: Compact Active-Game Language Selector

**Files:**
- Modify: `apps/mobile/components/game/GameControls.tsx:51-92,194-212`
- Modify: `apps/mobile/components/game/GameRoundPanel.tsx:101-109,317-322`
- Test: `apps/mobile/__tests__/game-screen-components.test.tsx:133-156`

**Interfaces:**
- Consumes: existing `GameSegmentedControl<T>` props and `GAME_CONTROL_MIN_SIZE`.
- Produces: `GameSegmentedControl<T>` with optional `compact?: boolean`; default behavior remains unchanged.

- [ ] **Step 1: Write the failing compact-selector test**

Add this test after `reports selected state and forwards segmented changes`:

```tsx
it('keeps the active language selector compact, right aligned, and tappable', () => {
  const props = roundProps();
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(<GameRoundPanel {...props} />);
  });

  const selector = tree!.root.find(
    (node) => node.props.accessibilityLabel === 'Card language'
  );
  expect(StyleSheet.flatten(selector.props.style).alignSelf).toBe('flex-end');
  expect(StyleSheet.flatten(selector.parent!.props.style).alignItems).toBe(
    'flex-end'
  );

  const options = selector.findAllByType(Pressable);
  expect(options).toHaveLength(2);
  options.forEach((option) => {
    expect(flattenedPressableStyle(option)).toMatchObject({
      minWidth: GAME_CONTROL_MIN_SIZE,
      minHeight: GAME_CONTROL_MIN_SIZE,
    });
  });
});
```

- [ ] **Step 2: Run the targeted test and verify RED**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx -t "keeps the active language selector compact"
```

Expected: FAIL because the selector has no `alignSelf: 'flex-end'` style and no right-aligned wrapper.

- [ ] **Step 3: Add the opt-in compact segmented-control presentation**

Update the `GameSegmentedControl` signature and root/option styles in `GameControls.tsx`:

```tsx
export function GameSegmentedControl<T extends string>({
  accessibilityLabel,
  value,
  options,
  onChange,
  compact = false,
}: {
  accessibilityLabel: string;
  value: T;
  options: readonly GameSegmentOption<T>[];
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.segmented, compact && styles.segmentedCompact]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`${accessibilityLabel}: ${option.label}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segmentOption,
              compact && styles.segmentOptionCompact,
              selected && styles.segmentOptionSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                selected && styles.segmentTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

Add these styles next to the existing segmented-control styles:

```tsx
segmentedCompact: {
  alignSelf: 'flex-end',
},
segmentOptionCompact: {
  paddingHorizontal: 10,
},
```

- [ ] **Step 4: Right-align compact mode in the round panel**

Replace the direct selector in `GameRoundPanel.tsx` with:

```tsx
<View style={styles.languageControlRow}>
  <GameSegmentedControl
    compact
    accessibilityLabel="Card language"
    value={language}
    options={[
      { value: 'en', label: 'EN' },
      { value: 'es', label: 'ES' },
    ]}
    onChange={onLanguageChange}
  />
</View>
```

Add this style immediately after `cardContent`:

```tsx
languageControlRow: {
  alignItems: 'flex-end',
},
```

- [ ] **Step 5: Run the component suite and verify GREEN**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx
```

Expected: PASS, including the new compact-selector test and the existing selected-state test.

- [ ] **Step 6: Commit the compact selector**

```bash
git add apps/mobile/components/game/GameControls.tsx apps/mobile/components/game/GameRoundPanel.tsx apps/mobile/__tests__/game-screen-components.test.tsx
git commit -m "Polish active game language selector"
```

---

### Task 2: Clean Spanish Session-Header Wrapping

**Files:**
- Modify: `apps/mobile/components/game/GameControls.tsx:94-156,213-240`
- Modify: `apps/mobile/components/game/GameSessionChrome.tsx:23-44,85-116`
- Test: `apps/mobile/__tests__/game-screen-components.test.tsx:193-212`

**Interfaces:**
- Consumes: existing `GameButton` label, variant, disabled state, and callbacks.
- Produces: optional `compact?: boolean` and `labelNumberOfLines?: number` props on `GameButton`; `GameSessionHeader` opts into both.

- [ ] **Step 1: Strengthen the Spanish-header test and verify wrapping behavior**

Replace the assertions at the end of `renders a stable Spanish session header with optional drinking status` with:

```tsx
const gameNight = tree!.root.findByProps({ children: 'NOCHE DE JUEGO' });
expect(gameNight.props.numberOfLines).toBe(2);
expect(StyleSheet.flatten(gameNight.props.style).textAlign).toBe('center');

expect(tree!.root.findByProps({ children: 'Bebiendo' })).toBeDefined();

const endGameButton = tree!.root.find(
  (node) => node.props.accessibilityLabel === 'Terminar juego'
);
expect(flattenedPressableStyle(endGameButton).minHeight).toBeGreaterThanOrEqual(
  GAME_CONTROL_MIN_SIZE
);
const endGameText = endGameButton
  .findAllByType(Text)
  .find((node) => node.props.children === 'Terminar juego');
expect(endGameText!.props.numberOfLines).toBe(2);
expect(StyleSheet.flatten(endGameText!.props.style)).toMatchObject({
  flexShrink: 1,
  textAlign: 'center',
});
```

- [ ] **Step 2: Run the Spanish-header test and verify RED**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx -t "renders a stable Spanish session header"
```

Expected: FAIL because `NOCHE DE JUEGO` is limited to one line and `GameButton` does not expose two-line compact label styling.

- [ ] **Step 3: Add opt-in compact multiline support to `GameButton`**

Extend the props and text styles in `GameControls.tsx`:

```tsx
export function GameButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  compact = false,
  labelNumberOfLines,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  compact?: boolean;
  labelNumberOfLines?: number;
}) {
  const content = (
    <>
      {icon}
      <Text
        numberOfLines={labelNumberOfLines}
        style={[
          styles.buttonText,
          variant !== 'primary' && styles.buttonTextSecondary,
          compact && styles.buttonTextCompact,
        ]}
      >
        {label}
      </Text>
    </>
  );
```

Apply `compact && styles.buttonBodyCompact` after `styles.buttonBody` in both the primary gradient and secondary `View` style arrays:

```tsx
{variant === 'primary' ? (
  <LinearGradient
    colors={GRADIENTS.primary}
    start={{ x: 0, y: 0.5 }}
    end={{ x: 1, y: 0.5 }}
    style={[styles.buttonBody, compact && styles.buttonBodyCompact]}
  >
    {content}
  </LinearGradient>
) : (
  <View
    style={[
      styles.buttonBody,
      compact && styles.buttonBodyCompact,
      styles.buttonSecondary,
      variant === 'danger' && styles.buttonDanger,
    ]}
  >
    {content}
  </View>
)}
```

Add these styles:

```tsx
buttonBodyCompact: {
  minHeight: GAME_CONTROL_MIN_SIZE,
  paddingHorizontal: 12,
},
buttonTextCompact: {
  flexShrink: 1,
  fontSize: 15,
  textAlign: 'center',
},
```

- [ ] **Step 4: Give the Spanish header stable centered zones**

Update the header JSX in `GameSessionChrome.tsx`:

```tsx
<GameSurface style={styles.header}>
  <View style={[styles.headerZone, styles.headerLead]}>
    <Text numberOfLines={2} style={styles.eyebrow}>
      {gameNightLabel}
    </Text>
    <Text numberOfLines={2} style={styles.mode}>
      {modeLabel}
    </Text>
  </View>
  <View style={[styles.headerZone, styles.headerCenter]}>
    {drinkingLabel ? (
      <GamePill label={drinkingLabel} tone="accent" />
    ) : null}
  </View>
  <View style={[styles.headerZone, styles.headerAction]}>
    <GameButton
      compact
      labelNumberOfLines={2}
      label={endGameLabel}
      variant="secondary"
      onPress={onEndGame}
    />
  </View>
</GameSurface>
```

Update the header styles to:

```tsx
headerZone: {
  minWidth: 0,
  flexBasis: 0,
  flexGrow: 1,
  alignItems: 'center',
  justifyContent: 'center',
},
headerLead: {
  flexGrow: 1.15,
},
headerCenter: {
  flexGrow: 1,
},
headerAction: {
  minHeight: GAME_CONTROL_MIN_SIZE,
  flexGrow: 1.2,
  alignItems: 'stretch',
  justifyContent: 'center',
},
```

Replace the text styles with the centered variants below. These widths, together with the compact button padding, leave enough line width for the Spanish words `NOCHE`, `JUEGO`, and `Terminar` while allowing line breaks at spaces.

```tsx
eyebrow: {
  color: COLORS.textMuted,
  fontSize: 12,
  fontWeight: '800',
  letterSpacing: 0.8,
  textAlign: 'center',
},
mode: {
  color: COLORS.textPrimary,
  fontSize: 18,
  fontWeight: '900',
  marginTop: 2,
  textAlign: 'center',
},
```

- [ ] **Step 5: Run the component suite and verify GREEN**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx
```

Expected: PASS with the Spanish header using two-line centered labels and all controls retaining 44-point minimum targets.

- [ ] **Step 6: Commit the header wrapping fix**

```bash
git add apps/mobile/components/game/GameControls.tsx apps/mobile/components/game/GameSessionChrome.tsx apps/mobile/__tests__/game-screen-components.test.tsx
git commit -m "Fix Spanish game header wrapping"
```

---

### Task 3: Center Player Labels and Names

**Files:**
- Modify: `apps/mobile/components/game/GameSessionChrome.tsx:59-70,123-152`
- Test: `apps/mobile/__tests__/game-screen-components.test.tsx:214-236`

**Interfaces:**
- Consumes: unchanged `GamePlayerMatchup` props.
- Produces: centered, two-line role labels and centered one-line scale-to-fit player names.

- [ ] **Step 1: Add a failing matchup-alignment test**

Add this test after the existing long-name test:

```tsx
it('centers Spanish role labels and player names in both matchup boxes', () => {
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(
      <GamePlayerMatchup
        playerLabel="JUGADOR ACTIVO"
        playerName="Player 2"
        targetLabel="OBJETIVO"
        targetName="Player 3"
      />
    );
  });

  const roles = ['JUGADOR ACTIVO', 'OBJETIVO'].map((label) =>
    tree!.root.findByProps({ children: label })
  );
  roles.forEach((role) => {
    expect(role.props.numberOfLines).toBe(2);
    expect(StyleSheet.flatten(role.props.style).textAlign).toBe('center');
    expect(StyleSheet.flatten(role.parent!.props.style).alignItems).toBe(
      'center'
    );
  });

  const names = ['Player 2', 'Player 3'].map((name) =>
    tree!.root.findByProps({ children: name })
  );
  names.forEach((name) => {
    expect(StyleSheet.flatten(name.props.style).textAlign).toBe('center');
  });
});
```

- [ ] **Step 2: Run the matchup test and verify RED**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx -t "centers Spanish role labels"
```

Expected: FAIL because role labels have no two-line contract, person boxes do not center children horizontally, and target text is right-aligned.

- [ ] **Step 3: Center the matchup content without changing name scaling**

Replace the person text JSX in `GameSessionChrome.tsx` with:

```tsx
<Text numberOfLines={2} style={styles.role}>
  {label}
</Text>
<Text
  numberOfLines={1}
  adjustsFontSizeToFit
  minimumFontScale={0.72}
  style={styles.name}
>
  {name}
</Text>
```

Replace the three affected styles with these centered definitions and delete the unused `targetText` style:

```tsx
person: {
  flex: 1,
  minWidth: 0,
  minHeight: 92,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: RADII.card,
  paddingHorizontal: 14,
  paddingVertical: 12,
},
role: {
  color: COLORS.textMuted,
  fontSize: 12,
  fontWeight: '800',
  letterSpacing: 0.7,
  textAlign: 'center',
},
name: {
  color: COLORS.textPrimary,
  fontSize: 20,
  fontWeight: '900',
  marginTop: 5,
  textAlign: 'center',
},
```

- [ ] **Step 4: Run the component suite and verify GREEN**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx
```

Expected: PASS, including the existing 24-character name scaling assertions and the new centered Spanish-label assertions.

- [ ] **Step 5: Commit the matchup alignment**

```bash
git add apps/mobile/components/game/GameSessionChrome.tsx apps/mobile/__tests__/game-screen-components.test.tsx
git commit -m "Center active game player matchup"
```

---

### Task 4: Regression and Visual Verification

**Files:**
- Verify: `apps/mobile/components/game/GameControls.tsx`
- Verify: `apps/mobile/components/game/GameRoundPanel.tsx`
- Verify: `apps/mobile/components/game/GameSessionChrome.tsx`
- Verify: `apps/mobile/__tests__/game-screen-components.test.tsx`

**Interfaces:**
- Consumes: the completed compact control and session-chrome changes from Tasks 1-3.
- Produces: test, static-analysis, and Simulator evidence that the requested layout works in both languages.

- [ ] **Step 1: Run the focused component tests**

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx
```

Expected: PASS with all game-screen presentation tests green.

- [ ] **Step 2: Run related game-screen regression tests**

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-hub-transition-animation.test.ts __tests__/game-screen-components.test.tsx
```

Expected: PASS for both suites.

- [ ] **Step 3: Run TypeScript and focused lint checks**

```bash
cd apps/mobile
npx tsc --noEmit
npx eslint components/game/GameControls.tsx components/game/GameRoundPanel.tsx components/game/GameSessionChrome.tsx __tests__/game-screen-components.test.tsx
```

Expected: both commands exit 0 with no new errors.

- [ ] **Step 4: Inspect English in the iPhone 16e Simulator**

Open an active game in English and verify all of the following:

- EN/ES occupies only the upper-right portion of the round-card row.
- EN is selected and both options remain easy to tap.
- `GAME NIGHT`, `End Game`, `PLAYER UP`, `TARGET`, and both player names render without clipping.
- Both role labels and names are centered in their player boxes.

- [ ] **Step 5: Inspect Spanish in the iPhone 16e Simulator**

Switch the round selector to ES and verify all of the following:

- `NOCHE DE JUEGO` wraps at a space rather than truncating or splitting a word.
- `Terminar juego` wraps between words and neither word splits.
- `JUGADOR ACTIVO` may use two centered lines and neither word splits.
- `OBJETIVO` and both player names remain centered.
- The challenge title and body remain readable and scroll when content is long.

- [ ] **Step 6: Confirm a clean worktree and review the final diff**

```bash
git status --short
git diff HEAD~3 --check
git diff HEAD~3 -- apps/mobile/components/game/GameControls.tsx apps/mobile/components/game/GameRoundPanel.tsx apps/mobile/components/game/GameSessionChrome.tsx apps/mobile/__tests__/game-screen-components.test.tsx
```

Expected: no whitespace errors; the diff is limited to the four planned files; `git status --short` is empty after the three task commits.
