# Game Card Density and Scroll Affordance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make normal active-game challenges and their timer fully visible on iPhone 16e while giving genuinely long cards an explicit overflow cue.

**Architecture:** Reclaim vertical space through opt-in compact game chrome and a short icon-based timer strip, keeping the route and game-state data flow unchanged. `GameRoundPanel` owns only transient scroll measurement state and renders a non-interactive fade cue while more revealed content remains below.

**Tech Stack:** React Native 0.81, Expo 54, TypeScript 5.9, Jest 29, `react-test-renderer` 19, `expo-linear-gradient`, Lucide React Native

## Global Constraints

- Set the session header's default minimum height to 64 points.
- Render the active-round EN/ES chrome at 80 by 36 points at default text size while preserving a 44-by-44-point effective touch area for each option.
- Keep the setup-screen segmented control unchanged at a minimum 44-point visible size.
- Render revealed challenge titles at 28px/34px and body copy at 16px/22px.
- Keep the compact timer strip at or below 76 points tall at default text size.
- Keep Start/Pause, Reset, End Game, and outcome actions at least 44 points in each interactive dimension.
- Preserve timer behavior, callbacks, urgency at ten seconds, expiry announcement, translations, language persistence, player rotation, and outcome behavior.
- Show the overflow cue only for revealed content with more content below; it must not intercept gestures or appear at the bottom.
- Preserve natural growth and scrolling for larger accessibility text and long English or Spanish content.
- Limit sub-16px readability exceptions to session eyebrow, player role, card kicker, timer estimate, and outcome label.

## File Map

- Modify `apps/mobile/components/game/GameControls.tsx`: make the existing opt-in compact segmented control visually 80-by-36 while preserving effective touch area.
- Modify `apps/mobile/components/game/GameSessionChrome.tsx`: reduce the session header's default height and padding without changing Spanish intrinsic-width protections.
- Modify `apps/mobile/components/game/GameRoundPanel.tsx`: tighten challenge typography, replace the tall timer panel, and render the overflow cue.
- Modify `apps/mobile/__tests__/game-screen-components.test.tsx`: protect compact dimensions, timer behavior, density, and overflow transitions.
- Modify `apps/mobile/__tests__/readable-font-sizes.test.ts`: document and constrain the five intentional game-metadata exceptions.

---

### Task 1: Compact Session Header and Active Language Selector

**Files:**
- Modify: `apps/mobile/components/game/GameControls.tsx:56-103,212-236`
- Modify: `apps/mobile/components/game/GameSessionChrome.tsx:88-132`
- Test: `apps/mobile/__tests__/game-screen-components.test.tsx:18-23,105-187,224-269`

**Interfaces:**
- Consumes: existing `GameSegmentedControl<T>` prop `compact?: boolean` and `GAME_CONTROL_MIN_SIZE = 44`.
- Produces: compact controls with visible 40-by-36 segments and `hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}`; default controls remain visibly 44 points.

- [ ] **Step 1: Write failing compact-chrome assertions**

Add `GameSurface` to the `GameControls` destructuring in `game-screen-components.test.tsx`:

```tsx
const {
  GAME_CONTROL_MIN_SIZE,
  GameButton,
  GamePill,
  GameSegmentedControl,
  GameSurface,
} = require('../components/game/GameControls');
```

Replace the compact-option assertions in `keeps the active language selector compact, right aligned, and tappable` with:

```tsx
expect(StyleSheet.flatten(selector.props.style)).toMatchObject({
  alignSelf: 'flex-end',
  width: 80,
  minHeight: 36,
});

const options = ['EN', 'ES'].map((label) =>
  tree!.root.find(
    (node) => node.props.accessibilityLabel === `Card language: ${label}`
  )
);
options.forEach((option) => {
  expect(flattenedPressableStyle(option)).toMatchObject({
    minWidth: 40,
    minHeight: 36,
  });
  expect(option.props.hitSlop).toEqual({
    top: 4,
    bottom: 4,
    left: 2,
    right: 2,
  });
});
```

Add this assertion at the start of the Spanish session-header test after rendering:

```tsx
const headerSurface = tree!.root.findByType(GameSurface);
expect(StyleSheet.flatten(headerSurface.props.style)).toMatchObject({
  minHeight: 64,
  paddingVertical: 6,
});
```

- [ ] **Step 2: Run the two compact-chrome tests and verify RED**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx -t "active language selector compact|stable Spanish session header"
```

Expected: FAIL because the active selector is still visibly 44 points tall and the header still has `minHeight: 76` with ten-point vertical padding.

- [ ] **Step 3: Implement the compact selector's visual and effective dimensions**

Add `hitSlop` to the option `Pressable` in `GameSegmentedControl`:

```tsx
<Pressable
  key={option.value}
  accessibilityRole="button"
  accessibilityLabel={`${accessibilityLabel}: ${option.label}`}
  accessibilityState={{ selected }}
  hitSlop={
    compact ? { top: 4, bottom: 4, left: 2, right: 2 } : undefined
  }
  onPress={() => onChange(option.value)}
  style={({ pressed }) => [
    styles.segmentOption,
    compact && styles.segmentOptionCompact,
    selected && styles.segmentOptionSelected,
    pressed && styles.pressed,
  ]}
>
```

Replace the two compact styles with:

```tsx
segmentedCompact: {
  width: 80,
  minHeight: 36,
  alignSelf: 'flex-end',
  borderRadius: 18,
},
segmentOptionCompact: {
  minWidth: 40,
  minHeight: 36,
  paddingHorizontal: 8,
},
```

- [ ] **Step 4: Reduce the session header's default height**

Replace `styles.header` in `GameSessionChrome.tsx` with:

```tsx
header: {
  minHeight: 64,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  paddingHorizontal: 10,
  paddingVertical: 6,
},
```

Keep `headerLead.minWidth = 92`, `headerCenter.minWidth = 100`, and `headerAction.minWidth = 96` unchanged so the Spanish words continue to wrap only at spaces.

- [ ] **Step 5: Run the complete component suite and verify GREEN**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx
```

Expected: PASS; default setup controls remain visibly 44 points, the active selector has a 40-by-36 visible segment plus hit slop, and Spanish header assertions remain green.

- [ ] **Step 6: Commit compact chrome**

```bash
git add apps/mobile/components/game/GameControls.tsx apps/mobile/components/game/GameSessionChrome.tsx apps/mobile/__tests__/game-screen-components.test.tsx
git commit -m "Compact active game chrome"
```

---

### Task 2: Dense Challenge Content and Compact Timer Strip

**Files:**
- Modify: `apps/mobile/components/game/GameRoundPanel.tsx:141-150,174-251,320-455`
- Test: `apps/mobile/__tests__/game-screen-components.test.tsx:327-421`

**Interfaces:**
- Consumes: unchanged `GameTimerDisplay`, `formatGameCardTimerSeconds()`, and `GAME_CONTROL_MIN_SIZE`.
- Produces: timer strip identified by `testID="game-timer-strip"`; timed cards show `timerEstimate` once, while untimed cards retain the existing duration pill.

- [ ] **Step 1: Write failing density and timer-strip tests**

Add this test before `renders urgent timed challenge controls and forwards outcomes`:

```tsx
it('uses dense readable challenge copy and one compact timer estimate', () => {
  const props = roundProps();
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(<GameRoundPanel {...props} />);
  });

  const title = tree!.root.findByProps({ children: 'Challenge Round' });
  expect(StyleSheet.flatten(title.props.style)).toMatchObject({
    fontSize: 28,
    lineHeight: 34,
  });

  const body = tree!.root.findByProps({
    children: 'Ask twenty yes/no questions.',
  });
  expect(StyleSheet.flatten(body.props.style)).toMatchObject({
    fontSize: 16,
    lineHeight: 22,
  });

  const estimates = tree!.root
    .findAllByType(Text)
    .filter((node) => node.props.children === '1 min');
  expect(estimates).toHaveLength(1);

  const strip = tree!.root.findByProps({ testID: 'game-timer-strip' });
  expect(StyleSheet.flatten(strip.props.style)).toMatchObject({
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  });
});
```

Replace `allows localized timer actions to wrap and grow with system text` with:

```tsx
it('keeps localized icon timer actions at least 44 points', () => {
  const props = roundProps();
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(
      <GameRoundPanel
        {...props}
        timer={{
          ...props.timer,
          startLabel: 'Comenzar',
          resetLabel: 'Reiniciar',
        }}
      />
    );
  });

  const actions = ['Comenzar', 'Reiniciar'].map((label) =>
    tree!.root.find((node) => node.props.accessibilityLabel === label)
  );
  actions.forEach((action) => {
    expect(flattenedPressableStyle(action)).toMatchObject({
      minWidth: GAME_CONTROL_MIN_SIZE,
      minHeight: GAME_CONTROL_MIN_SIZE,
    });
  });
  expect(
    tree!.root
      .findAllByType(Text)
      .filter((node) => ['Comenzar', 'Reiniciar'].includes(node.props.children))
  ).toHaveLength(0);
});
```

- [ ] **Step 2: Run the density tests and verify RED**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx -t "dense readable challenge|localized icon timer"
```

Expected: FAIL because title/body sizes are 32/17, the duration appears twice, and the timer still renders visible action labels in a tall panel.

- [ ] **Step 3: Remove the duplicate timed duration pill**

Replace the revealed challenge branch with:

```tsx
<View style={styles.challenge}>
  <AccentBar />
  <Text style={styles.title}>{revealedTitle}</Text>
  <Text style={styles.body}>{revealedBody}</Text>
  {timer ? null : <GamePill label={timerEstimate} tone="warning" />}
</View>
```

The existing `phase === 'revealed' && timer` branch continues rendering `TimerPanel`, so timed cards still present the estimate once.

- [ ] **Step 4: Replace `TimerPanel` with the compact icon strip**

Replace the `TimerPanel` return block with:

```tsx
return (
  <View testID="game-timer-strip" style={styles.timerPanel}>
    <View style={styles.timerMainRow}>
      <View style={styles.timerReadout}>
        <Text
          numberOfLines={1}
          style={[styles.timerEstimate, timeExpired && styles.timesUp]}
        >
          {timeExpired ? timer.timesUpLabel : timerEstimate}
        </Text>
        <Text
          accessibilityLabel={timeExpired ? timer.timesUpLabel : undefined}
          accessibilityLiveRegion={timeExpired ? 'polite' : undefined}
          style={[styles.timerValue, urgent && styles.timerUrgent]}
        >
          {formattedTime}
        </Text>
      </View>
      <View style={styles.timerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={activeLabel}
          onPress={activeAction}
          style={({ pressed }) => [
            styles.timerAction,
            styles.timerActionPrimary,
            pressed && styles.pressed,
          ]}
        >
          <ActiveIcon size={19} color={COLORS.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={timer.resetLabel}
          onPress={timer.onReset}
          style={({ pressed }) => [
            styles.timerAction,
            pressed && styles.pressed,
          ]}
        >
          <RotateCcw size={18} color={COLORS.textSub} />
        </Pressable>
      </View>
    </View>
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: progressWidth },
          urgent && styles.progressUrgent,
        ]}
      />
    </View>
  </View>
);
```

Delete the old `timerHeading` block, the separate expired-label branch, and both `timerActionText` elements.

- [ ] **Step 5: Apply compact challenge and timer styles**

Replace the affected styles with:

```tsx
cardContent: {
  flexGrow: 1,
  paddingHorizontal: 16,
  paddingVertical: 12,
  gap: 10,
},
challenge: {
  gap: 10,
  paddingHorizontal: 4,
  paddingVertical: 4,
  alignItems: 'flex-start',
},
title: {
  color: COLORS.textPrimary,
  fontSize: 28,
  fontWeight: '900',
  lineHeight: 34,
},
body: {
  color: COLORS.textSub,
  fontSize: 16,
  lineHeight: 22,
},
timerPanel: {
  gap: 6,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  backgroundColor: 'rgba(255,255,255,0.045)',
  paddingHorizontal: 10,
  paddingVertical: 8,
},
timerMainRow: {
  minHeight: GAME_CONTROL_MIN_SIZE,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
},
timerReadout: {
  minWidth: 0,
  flex: 1,
  flexDirection: 'row',
  alignItems: 'baseline',
  gap: 9,
},
timerEstimate: {
  flexShrink: 1,
  color: COLORS.textMuted,
  fontSize: 14,
  fontWeight: '800',
},
timerValue: {
  color: COLORS.pink,
  fontSize: 28,
  lineHeight: 32,
  fontWeight: '900',
  fontVariant: ['tabular-nums'],
},
timesUp: {
  color: COLORS.no,
},
progressTrack: {
  height: 5,
  overflow: 'hidden',
  borderRadius: 3,
  backgroundColor: 'rgba(255,255,255,0.1)',
},
timerActions: {
  flexDirection: 'row',
  gap: 8,
},
timerAction: {
  minWidth: GAME_CONTROL_MIN_SIZE,
  minHeight: GAME_CONTROL_MIN_SIZE,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  backgroundColor: 'rgba(255,255,255,0.045)',
},
```

Keep `timerUrgent`, `progressFill`, `progressUrgent`, and `timerActionPrimary` unchanged. Delete the unused `timerHeading` and `timerActionText` styles.

- [ ] **Step 6: Run the component suite and verify GREEN**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx
```

Expected: PASS with one timed estimate, a dense 28/16 challenge hierarchy, 44-point icon actions, and unchanged urgency/expiry tests.

- [ ] **Step 7: Commit dense challenge and timer**

```bash
git add apps/mobile/components/game/GameRoundPanel.tsx apps/mobile/__tests__/game-screen-components.test.tsx
git commit -m "Compact game challenge and timer"
```

---

### Task 3: Conditional Overflow Cue

**Files:**
- Modify: `apps/mobile/components/game/GameRoundPanel.tsx:1-20,71-172,311-506`
- Test: `apps/mobile/__tests__/game-screen-components.test.tsx:1-3,327-430`

**Interfaces:**
- Consumes: `ScrollView` layout, content-size, and scroll events.
- Produces: local `showScrollCue: boolean` and a non-interactive `LinearGradient` identified by `testID="game-round-scroll-cue"`.

- [ ] **Step 1: Add the failing overflow-transition test**

Add `ScrollView` to the React Native test imports:

```tsx
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
```

Add this test after the compact timer test:

```tsx
it('shows the scroll cue only while revealed content remains below', () => {
  const props = roundProps();
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(<GameRoundPanel {...props} />);
  });

  const scrollView = tree!.root.findByType(ScrollView);
  expect(tree!.root.findAllByProps({ testID: 'game-round-scroll-cue' })).toHaveLength(
    0
  );

  TestRenderer.act(() => {
    scrollView.props.onLayout({
      nativeEvent: { layout: { height: 300 } },
    });
    scrollView.props.onContentSizeChange(320, 500);
  });
  expect(tree!.root.findAllByProps({ testID: 'game-round-scroll-cue' })).toHaveLength(
    1
  );

  TestRenderer.act(() => {
    scrollView.props.onScroll({
      nativeEvent: { contentOffset: { y: 200 } },
    });
  });
  expect(tree!.root.findAllByProps({ testID: 'game-round-scroll-cue' })).toHaveLength(
    0
  );
});
```

- [ ] **Step 2: Run the overflow test and verify RED**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx -t "scroll cue only"
```

Expected: FAIL because the current `ScrollView` exposes none of the measurement callbacks and renders no cue.

- [ ] **Step 3: Add local overflow measurement state**

Change the React and Lucide imports in `GameRoundPanel.tsx`:

```tsx
import React, { useState } from 'react';
```

```tsx
import {
  CheckCircle,
  ChevronDown,
  Pause,
  Play,
  RotateCcw,
  X,
  type LucideIcon,
} from 'lucide-react-native';
```

Add this constant below the props type:

```tsx
const SCROLL_END_TOLERANCE = 8;
```

Add this state and derived value at the start of `GameRoundPanel`, before its return:

```tsx
const [contentHeight, setContentHeight] = useState(0);
const [viewportHeight, setViewportHeight] = useState(0);
const [scrollOffset, setScrollOffset] = useState(0);
const showScrollCue =
  phase === 'revealed' &&
  viewportHeight > 0 &&
  contentHeight > viewportHeight + SCROLL_END_TOLERANCE &&
  scrollOffset + viewportHeight < contentHeight - SCROLL_END_TOLERANCE;
```

- [ ] **Step 4: Wire measurement callbacks and render the cue**

Replace the `ScrollView` opening tag with:

```tsx
<ScrollView
  showsVerticalScrollIndicator={false}
  scrollEventThrottle={16}
  onContentSizeChange={(_, height) => setContentHeight(height)}
  onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
  onScroll={(event) => setScrollOffset(event.nativeEvent.contentOffset.y)}
  contentContainerStyle={styles.cardContent}
>
```

Render this block immediately after `</ScrollView>` and before `</GameSurface>`:

```tsx
{showScrollCue ? (
  <LinearGradient
    testID="game-round-scroll-cue"
    accessible={false}
    pointerEvents="none"
    colors={['rgba(13,0,6,0)', COLORS.card]}
    style={styles.scrollCue}
  >
    <ChevronDown size={18} color={COLORS.textSub} strokeWidth={2.5} />
  </LinearGradient>
) : null}
```

Add this style:

```tsx
scrollCue: {
  position: 'absolute',
  right: 0,
  bottom: 0,
  left: 0,
  height: 54,
  alignItems: 'center',
  justifyContent: 'flex-end',
  paddingBottom: 7,
},
```

- [ ] **Step 5: Run the component suite and verify GREEN**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx
```

Expected: PASS; the cue appears after overflow measurement and disappears exactly at the bottom while remaining absent for fitting content.

- [ ] **Step 6: Commit the overflow cue**

```bash
git add apps/mobile/components/game/GameRoundPanel.tsx apps/mobile/__tests__/game-screen-components.test.tsx
git commit -m "Indicate scrollable game challenges"
```

---

### Task 4: Document Compact Game Metadata Exceptions

**Files:**
- Modify: `apps/mobile/__tests__/readable-font-sizes.test.ts:7-25,81-116`
- Verify: `apps/mobile/components/game/GameRoundPanel.tsx`
- Verify: `apps/mobile/components/game/GameSessionChrome.tsx`

**Interfaces:**
- Consumes: existing `ALLOWED_SMALL_TEXT` entries and `isAllowedSmallText()`.
- Produces: five exact exception keys; no challenge body, title, button, or timer-action exception is permitted.

- [ ] **Step 1: Add a failing exception-boundary test**

Add this test before the existing readable-font test:

```tsx
it('limits compact game metadata exceptions to approved styles', () => {
  const gameExceptions = ALLOWED_SMALL_TEXT.filter((allowed) =>
    allowed.file.includes(`${path.sep}game${path.sep}`)
  ).map((allowed) => `${allowed.file}:${allowed.style}:${allowed.minSize}`);

  expect(gameExceptions).toEqual([
    `${path.join('components', 'game', 'GameRoundPanel.tsx')}:kicker:14`,
    `${path.join('components', 'game', 'GameRoundPanel.tsx')}:timerEstimate:14`,
    `${path.join('components', 'game', 'GameRoundPanel.tsx')}:outcomeLabel:14`,
    `${path.join('components', 'game', 'GameSessionChrome.tsx')}:eyebrow:12`,
    `${path.join('components', 'game', 'GameSessionChrome.tsx')}:role:12`,
  ]);
});
```

- [ ] **Step 2: Run the readable-font suite and verify RED**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/readable-font-sizes.test.ts
```

Expected: FAIL because no game metadata exceptions exist and the original test reports the same five baseline violations.

- [ ] **Step 3: Add the five exact documented exceptions**

Insert these entries after the bottom-navbar exception and before the Matches exceptions:

```tsx
  ...[
    {
      file: path.join('components', 'game', 'GameRoundPanel.tsx'),
      style: 'kicker',
      minSize: 14,
    },
    {
      file: path.join('components', 'game', 'GameRoundPanel.tsx'),
      style: 'timerEstimate',
      minSize: 14,
    },
    {
      file: path.join('components', 'game', 'GameRoundPanel.tsx'),
      style: 'outcomeLabel',
      minSize: 14,
    },
    {
      file: path.join('components', 'game', 'GameSessionChrome.tsx'),
      style: 'eyebrow',
      minSize: 12,
    },
    {
      file: path.join('components', 'game', 'GameSessionChrome.tsx'),
      style: 'role',
      minSize: 12,
    },
  ].map((entry) => ({
    ...entry,
    reason: 'Compact game metadata is intentionally secondary to challenge copy.',
  })),
```

- [ ] **Step 4: Run the readable-font and component suites and verify GREEN**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/readable-font-sizes.test.ts __tests__/game-screen-components.test.tsx
```

Expected: PASS; the exception list contains exactly five game metadata styles and the 16px challenge body remains unexcepted.

- [ ] **Step 5: Commit the readability policy update**

```bash
git add apps/mobile/__tests__/readable-font-sizes.test.ts
git commit -m "Document compact game metadata sizes"
```

---

### Task 5: Full Regression and Simulator Verification

**Files:**
- Verify: `apps/mobile/components/game/GameControls.tsx`
- Verify: `apps/mobile/components/game/GameSessionChrome.tsx`
- Verify: `apps/mobile/components/game/GameRoundPanel.tsx`
- Verify: `apps/mobile/__tests__/game-screen-components.test.tsx`
- Verify: `apps/mobile/__tests__/readable-font-sizes.test.ts`

**Interfaces:**
- Consumes: completed Tasks 1-4.
- Produces: automated and visual evidence for branch completion.

- [ ] **Step 1: Run focused game tests**

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx __tests__/game-hub-transition-animation.test.ts __tests__/game-timer.test.ts
```

Expected: PASS for all three suites.

- [ ] **Step 2: Run the complete Jest suite**

```bash
cd apps/mobile
npm test -- --runInBand
```

Expected: PASS for all 69 suites and 326 or more tests, including `readable-font-sizes.test.ts`.

- [ ] **Step 3: Run TypeScript, focused lint, and diff checks**

```bash
cd apps/mobile
npx tsc --noEmit
npx eslint components/game/GameControls.tsx components/game/GameSessionChrome.tsx components/game/GameRoundPanel.tsx __tests__/game-screen-components.test.tsx __tests__/readable-font-sizes.test.ts
cd ../..
git diff main...HEAD --check
git status --short
```

Expected: TypeScript and diff checks exit 0; lint reports 0 errors with only the unchanged pre-existing mock `any` warning; the worktree is clean.

- [ ] **Step 4: Verify a normal English card on iPhone 16e**

Open `Prop Boundary Check` in English and verify:

- the 64-point session header and 80-by-36 visible EN/ES selector are visibly denser;
- `Challenge Round`, the full challenge body, timer estimate, countdown, progress, Start/Pause, and Reset are visible without scrolling;
- each timer and language action remains easy to tap; and
- no overflow cue appears when the complete card fits.

- [ ] **Step 5: Verify a normal Spanish card on iPhone 16e**

Switch the same card to Spanish and verify:

- `NOCHE DE JUEGO`, `Bebiendo`, `Terminar juego`, and `JUGADOR ACTIVO` never split individual words;
- `Ronda de desafío`, the normal Spanish body, and the compact timer fit without scrolling; and
- player labels and names remain centered.

- [ ] **Step 6: Verify overflow behavior with long content**

Use a long card or large accessibility text and verify:

- the fade/down cue appears only while content remains below;
- the cue does not block scrolling or timer controls;
- the cue disappears at the bottom; and
- returning to a fitting card removes the cue.

- [ ] **Step 7: Review branch scope**

```bash
git diff --stat main...HEAD
git log --oneline main..HEAD
```

Expected: implementation changes are limited to the five planned mobile files plus the approved design and plan documents; no game-state, translation, or navigation files changed.
