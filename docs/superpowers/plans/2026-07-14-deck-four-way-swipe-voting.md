# Deck Four-Way Swipe Voting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Hard No, Not Now, Curious, and Yes matching swipe directions, button affordances, drag previews, and bilingual Deck tour guidance.

**Architecture:** Put the direction/readiness contract in a pure helper so threshold and dominant-axis behavior are unit tested independently. The Deck will pass an explicit `Readiness` through gesture and button animation callbacks, eliminating queued overrides and screen-level direction inference. Four Reanimated badges will preview the candidate vote during a drag.

**Tech Stack:** TypeScript 5.9, React Native 0.81, Expo 54, React Native Gesture Handler 2.28, React Native Reanimated 4.1, Jest 29.

## Global Constraints

- Fixed mapping: left = `hard_no`, down = `not_now`, up = `curious`, right = `yes`.
- Gestures and buttons submit explicit `Readiness` values through one Deck handler.
- Direction controls animation only after an explicit readiness is selected.
- Buttons display matching directional arrows.
- Dragging previews the localized candidate label and its existing vote color.
- Sub-threshold drags return without voting; input remains locked during exits.
- English and Spanish tours name all four directions and the button alternative.
- Do not add dependencies or modify swipe behavior outside the main Deck.
- Preserve the existing uncommitted reset-confirmation edits in `deck.tsx`, `en.ts`, and `es.ts`.

---

### Task 1: Define and test the four-way swipe contract

**Files:**
- Create: `apps/mobile/lib/votes/swipeVoting.ts`
- Create: `apps/mobile/__tests__/swipe-voting.test.ts`

**Interfaces:**
- Consumes: `Readiness` from `apps/mobile/lib/votes/rolePreferences.ts`.
- Produces: `SwipeDirection`, `SwipeVote`, `readinessForSwipeDirection`, `dominantSwipeDirection`, and `swipeVoteForDelta`.

- [ ] **Step 1: Write the failing helper test**

```ts
import {
  dominantSwipeDirection,
  readinessForSwipeDirection,
  swipeVoteForDelta,
} from '../lib/votes/swipeVoting';

describe('four-way swipe voting', () => {
  it.each([
    ['left', 'hard_no'],
    ['down', 'not_now'],
    ['up', 'curious'],
    ['right', 'yes'],
  ] as const)('maps %s to %s', (direction, readiness) => {
    expect(readinessForSwipeDirection(direction)).toBe(readiness);
  });

  it.each([
    [-101, 0, { direction: 'left', readiness: 'hard_no' }],
    [0, 81, { direction: 'down', readiness: 'not_now' }],
    [0, -81, { direction: 'up', readiness: 'curious' }],
    [101, 0, { direction: 'right', readiness: 'yes' }],
  ] as const)('commits threshold drag (%s, %s)', (dx, dy, expected) => {
    expect(swipeVoteForDelta(dx, dy)).toEqual(expected);
  });

  it('rejects sub-threshold drags', () => {
    expect(swipeVoteForDelta(-100, 0)).toBeNull();
    expect(swipeVoteForDelta(100, 0)).toBeNull();
    expect(swipeVoteForDelta(0, -80)).toBeNull();
    expect(swipeVoteForDelta(0, 80)).toBeNull();
  });

  it('uses the dominant axis and handles a stationary card', () => {
    expect(dominantSwipeDirection(-120, 90)).toBe('left');
    expect(dominantSwipeDirection(70, 110)).toBe('down');
    expect(dominantSwipeDirection(70, -110)).toBe('up');
    expect(dominantSwipeDirection(120, -90)).toBe('right');
    expect(dominantSwipeDirection(0, 0)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and confirm the missing-module failure**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/swipe-voting.test.ts`

Expected: FAIL because `../lib/votes/swipeVoting` does not exist.

- [ ] **Step 3: Implement the worklet-safe helper**

```ts
import type { Readiness } from './rolePreferences';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
export type SwipeVote = { direction: SwipeDirection; readiness: Readiness };

export const HORIZONTAL_SWIPE_THRESHOLD = 100;
export const VERTICAL_SWIPE_THRESHOLD = 80;

export function readinessForSwipeDirection(
  direction: SwipeDirection
): Readiness {
  'worklet';
  switch (direction) {
    case 'left': return 'hard_no';
    case 'down': return 'not_now';
    case 'up': return 'curious';
    case 'right': return 'yes';
  }
}

export function dominantSwipeDirection(
  dx: number,
  dy: number
): SwipeDirection | null {
  'worklet';
  if (dx === 0 && dy === 0) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

export function swipeVoteForDelta(dx: number, dy: number): SwipeVote | null {
  'worklet';
  const direction = dominantSwipeDirection(dx, dy);
  if (!direction) return null;
  const horizontal = direction === 'left' || direction === 'right';
  const distance = horizontal ? Math.abs(dx) : Math.abs(dy);
  const threshold = horizontal
    ? HORIZONTAL_SWIPE_THRESHOLD
    : VERTICAL_SWIPE_THRESHOLD;
  if (distance <= threshold) return null;
  return { direction, readiness: readinessForSwipeDirection(direction) };
}
```

- [ ] **Step 4: Run the helper test**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/swipe-voting.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the isolated helper**

```bash
git add apps/mobile/lib/votes/swipeVoting.ts apps/mobile/__tests__/swipe-voting.test.ts
git commit -m "feat: define four-way swipe votes"
```

---

### Task 2: Route Deck gestures and buttons through explicit readiness

**Files:**
- Modify: `apps/mobile/app/(tabs)/deck.tsx:31-140,273-433,536-700,1068-1121,1370-1540`
- Modify: `apps/mobile/__tests__/deck-intensity-filter-layout.test.ts:41-60`

**Interfaces:**
- Consumes: `SwipeDirection` and `swipeVoteForDelta(dx, dy)` from Task 1.
- Produces: `SwipeDeckHandle.programmaticVote(direction, readiness)`, `onVote(readiness)`, and `SwipeVotePreview`.

- [ ] **Step 1: Add failing Deck contract tests**

```ts
it('gives every readiness choice one matching swipe direction', () => {
  expect(deckSource).toMatch(/readiness: 'hard_no',[\s\S]*?direction: 'left'/);
  expect(deckSource).toMatch(/readiness: 'not_now',[\s\S]*?direction: 'down'/);
  expect(deckSource).toMatch(/readiness: 'curious',[\s\S]*?direction: 'up'/);
  expect(deckSource).toMatch(/readiness: 'yes',[\s\S]*?direction: 'right'/);
});

it('submits explicit readiness without queued button overrides', () => {
  expect(deckSource).toContain('swipeVoteForDelta(dx, dy)');
  expect(deckSource).toContain('runOnJS(onVote)(readiness)');
  expect(deckSource).toContain(
    'handle.programmaticVote(action.direction, action.readiness)'
  );
  expect(deckSource).not.toContain('queuedReadinessRef');
  expect(deckSource).not.toContain('directionToReadiness');
});

it('previews localized votes and displays arrow affordances', () => {
  expect(deckSource).toContain('SwipeVotePreview');
  expect(deckSource).toContain('readinessLabels[action.readiness]');
  expect(deckSource).toContain('ArrowLeft');
  expect(deckSource).toContain('ArrowDown');
  expect(deckSource).toContain('ArrowUp');
  expect(deckSource).toContain('ArrowRight');
});
```

- [ ] **Step 2: Run the Deck test and confirm the new failures**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/deck-intensity-filter-layout.test.ts`

Expected: FAIL for the missing down mapping, direct submission, previews, and arrows.

- [ ] **Step 3: Import arrows and the helper, then update the action contract**

Use `ArrowLeft`, `ArrowDown`, `ArrowUp`, and `ArrowRight` in place of `X`,
`Clock3`, `Ellipsis`, and `Check`. Import `swipeVoteForDelta` and
`SwipeDirection` from `../../lib/votes/swipeVoting`. Update the Not Now action
to `direction: 'down'` and change the action icon type to `typeof ArrowLeft`.

- [ ] **Step 4: Add the shared drag preview component**

```tsx
function SwipeVotePreview({ direction, label, color, x, y }: {
  direction: SwipeDirection;
  label: string;
  color: string;
  x: SharedValue<number>;
  y: SharedValue<number>;
}) {
  const previewStyle = useAnimatedStyle(() => {
    const horizontal = direction === 'left' || direction === 'right';
    const axis = horizontal ? x.value : y.value;
    const signedDistance =
      direction === 'left' || direction === 'up' ? -axis : axis;
    const dominant = horizontal
      ? Math.abs(x.value) > Math.abs(y.value)
      : Math.abs(y.value) >= Math.abs(x.value);
    const progress = Math.max(0, Math.min(1, (signedDistance - 12) / 68));
    return {
      opacity: dominant ? progress : 0,
      transform: [{ scale: 0.9 + progress * 0.1 }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.swipeVotePreview, { borderColor: color }, previewStyle]}
    >
      <Text style={[styles.swipeVotePreviewText, { color }]}>{label}</Text>
    </Animated.View>
  );
}
```

Add `SharedValue` to the Reanimated type imports. Add an absolute centered
`swipeVotePreview` style at `top: 18`, `zIndex: 6`, with a two-pixel colored
border, `COLORS.cardAlt` background, and 14x7 padding. Add
`swipeVotePreviewText` with 16px, weight 900, uppercase text.

- [ ] **Step 5: Carry readiness through both horizontal and vertical exits**

Change the imperative method to:

```ts
programmaticVote: (dir: SwipeDirection, readiness: Readiness) => void;
```

Change the card callback to `onVote: (readiness: Readiness) => void`. Rename
`triggerSwipe` to `triggerVote`, and make both it and `performSwipe` accept
readiness. Set target Y with:

```ts
const targetY = dir === 'up' ? -OFFSCREEN_Y : dir === 'down' ? OFFSCREEN_Y : 0;
```

For left/right, finish on the X timing; for up/down, finish on the Y timing.
The completion callback must use:

```ts
if (finished) runOnJS(onVote)(readiness);
```

Replace the manual axis checks in `handleEnd` with:

```ts
const vote = swipeVoteForDelta(dx, dy);
if (vote) {
  runOnJS(triggerVote)(vote.direction, vote.readiness);
  return;
}
reset();
```

- [ ] **Step 6: Render all previews on the animated card**

Add `readinessLabels: Record<Readiness, string>` to the card props and render:

```tsx
{READINESS_ACTIONS.map((action) => (
  <SwipeVotePreview
    key={action.readiness}
    direction={action.direction}
    label={readinessLabels[action.readiness]}
    color={action.color}
    x={x}
    y={y}
  />
))}
```

Pass `hard_no`, `not_now`, `curious`, and `yes` labels from `t.deck` when
rendering `SwipeableKinkCard`.

- [ ] **Step 7: Remove readiness queuing from the screen**

Delete `queuedReadinessRef` and `directionToReadiness`. Rename
`handleSwipeResult` to `handleReadinessVoteResult`, accept
`(readiness: Readiness)`, and retain its existing history, store, match pulse,
and completion logic using that parameter. Update the empty-state guard to
only clear `cardAnimating`. Make buttons call:

```ts
playGameSound('cardFlip');
handle.programmaticVote(action.direction, action.readiness);
```

Connect the card with `onVote={handleReadinessVoteResult}`.

- [ ] **Step 8: Run the focused feature tests**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/swipe-voting.test.ts __tests__/deck-intensity-filter-layout.test.ts __tests__/readiness-votes.test.ts`

Expected: PASS.

- [ ] **Step 9: Review without staging the pre-existing reset changes**

Run: `git diff -- apps/mobile/app/'(tabs)'/deck.tsx apps/mobile/__tests__/deck-intensity-filter-layout.test.ts`

Expected: swipe-voting hunks plus the preserved reset-confirmation hunks. Do
not stage the full Deck file while those owner changes are mixed into it.

---

### Task 3: Teach the mapping in English and Spanish

**Files:**
- Modify: `apps/mobile/lib/i18n/en.ts:220-245,601-613`
- Modify: `apps/mobile/lib/i18n/es.ts:225-253,608-620`
- Modify: `apps/mobile/__tests__/i18n-ui.test.ts:1-17`

**Interfaces:**
- Consumes: typed `en` and `es` translation objects.
- Produces: complete `deck.swipeHint` and `tours.deck[1].body` instructions.

- [ ] **Step 1: Add failing bilingual copy assertions**

```ts
import { en } from '../lib/i18n/en';
import { es } from '../lib/i18n/es';

it('teaches every Deck direction and the button alternative', () => {
  expect(en.deck.swipeHint).toBe(
    'Swipe left for Hard No, down for Not Now, up for Curious, or right for Yes.'
  );
  expect(en.tours.deck[1].body).toBe(
    'Swipe left for Hard No, down for Not Now, up for Curious, or right for Yes. You can also tap any button.'
  );
  expect(es.deck.swipeHint).toBe(
    'Desliza a la izquierda para No rotundo, hacia abajo para Ahora no, hacia arriba para Curiosidad o a la derecha para Sí.'
  );
  expect(es.tours.deck[1].body).toBe(
    'Desliza a la izquierda para No rotundo, hacia abajo para Ahora no, hacia arriba para Curiosidad o a la derecha para Sí. También puedes tocar cualquier botón.'
  );
});
```

- [ ] **Step 2: Run the i18n test and confirm the old copy fails**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/i18n-ui.test.ts`

Expected: FAIL with the incomplete left/right hint and three-way tour copy.

- [ ] **Step 3: Replace the incomplete copy in both locales**

Use the four exact strings asserted in Step 1 for `deck.swipeHint` and the
second Deck tour body. Preserve the adjacent reset-confirmation strings.

- [ ] **Step 4: Run the i18n test and scan for conflicts**

Run:

```bash
cd apps/mobile && npm test -- --runInBand __tests__/i18n-ui.test.ts
rg -n "Swipe right for Yes|swipe left, right, or up|Desliza derecha para Sí|izquierda, derecha o hacia arriba" lib/i18n/en.ts lib/i18n/es.ts
```

Expected: test PASS, then no ripgrep matches.

---

### Task 4: Verify the integrated feature

**Files:**
- Verify all files from Tasks 1-3.

**Interfaces:**
- Consumes: the tested mapping, Deck integration, and localized tour copy.
- Produces: a release-ready implementation plus a device-QA checklist.

- [ ] **Step 1: Run focused regression tests**

```bash
cd apps/mobile && npm test -- --runInBand \
  __tests__/swipe-voting.test.ts \
  __tests__/deck-intensity-filter-layout.test.ts \
  __tests__/i18n-ui.test.ts \
  __tests__/readiness-votes.test.ts \
  __tests__/action-buckets.test.ts
```

Expected: all suites pass.

- [ ] **Step 2: Type-check and lint touched files**

```bash
cd apps/mobile && npx tsc --noEmit
npx eslint 'app/(tabs)/deck.tsx' lib/votes/swipeVoting.ts lib/i18n/en.ts \
  lib/i18n/es.ts __tests__/swipe-voting.test.ts \
  __tests__/deck-intensity-filter-layout.test.ts __tests__/i18n-ui.test.ts
```

Expected: both commands exit 0.

- [ ] **Step 3: Run the complete Jest suite**

Run: `cd apps/mobile && npm test -- --runInBand`

Expected: all suites pass. Report any unrelated pre-existing failure by suite
and exact error instead of attributing it to this feature.

- [ ] **Step 4: Inspect scope and whitespace**

```bash
git diff --check
git status --short
git diff -- apps/mobile/app/'(tabs)'/deck.tsx \
  apps/mobile/lib/votes/swipeVoting.ts apps/mobile/lib/i18n/en.ts \
  apps/mobile/lib/i18n/es.ts apps/mobile/__tests__/swipe-voting.test.ts \
  apps/mobile/__tests__/deck-intensity-filter-layout.test.ts \
  apps/mobile/__tests__/i18n-ui.test.ts
```

Expected: no whitespace errors; the scoped diff contains four-way voting plus
the preserved reset-confirmation edits already present before this work.

- [ ] **Step 5: Perform simulator QA when a simulator is available**

1. Swipe left/down/up/right past threshold and verify Hard No/Not Now/Curious/Yes.
2. Release each direction below threshold and verify no vote.
3. Tap each button and verify the matching directional exit and readiness.
4. Attempt rapid duplicate input during an exit and verify one vote.
5. Undo a Hard No and verify the previous card state returns.
6. Open the Deck tour in English and Spanish and verify all four directions.
