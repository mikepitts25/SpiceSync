# Game Card Density and Scroll Affordance Design

## Summary

Make common active-game challenges fully visible on the iPhone 16e without scrolling by reclaiming space from surrounding chrome, tightening challenge typography, and replacing the tall timer panel with a compact timer strip. Preserve scrolling for genuinely long content and show a clear cue whenever more content remains.

## Goals

- Show the complete challenge and timer for ordinary English and Spanish cards without scrolling on iPhone 16e.
- Make the session header and EN/ES selector visually smaller so the round card receives more vertical space.
- Preserve readable challenge text and 44-point interactive targets.
- Make overflow obvious when unusually long content still requires scrolling.

## Non-Goals

- Changing game rules, timer behavior, language persistence, player rotation, or outcome actions.
- Removing scrolling entirely or forcing long Spanish cards into unreadably small text.
- Changing setup-screen segmented controls or unrelated application chrome.
- Redesigning the player matchup row beyond any vertical position change caused by the smaller session header.

## Session Header

Set the session header's default minimum height to 64 points, down from 76, by tightening vertical padding and inter-zone spacing. Keep the existing three-zone structure and intrinsic width protections for `NOCHE DE JUEGO`, `Bebiendo`, and `Terminar juego`, so Spanish phrases wrap only at spaces and individual words never split.

The End Game action retains a minimum 44-point touch target. The smaller header must not truncate English or Spanish text.

## Language Selector

The active-round EN/ES control remains in the upper-right corner of its current row. At default text size, its visible chrome is 80 points wide by 36 points high, with tighter internal padding and type. Each option retains at least a 44-by-44-point interactive area through an outer pressable area or hit slop; the setup-screen selector remains unchanged.

## Challenge Content Density

- Reduce the revealed challenge title from 32px to 28px with a proportionate line height.
- Reduce the challenge body from 17px to the repository minimum of 16px with a compact but readable line height.
- Tighten challenge padding and vertical gaps without crowding the accent bar, title, or body.
- Remove the duration pill from the challenge body when the compact timer strip presents the same estimate.
- Preserve natural vertical growth for larger accessibility text settings.

Ready and spinning phases continue to use the same round-card structure. Their typography may share the denser title treatment where doing so does not weaken the tap target or roulette presentation.

## Compact Timer Strip

Replace the current tall timer panel with a compact strip containing:

- the duration estimate and current countdown;
- a thin progress track;
- Start/Pause and Reset actions with existing accessible labels; and
- the existing urgent and expired states.

At default text size, the strip uses one compact information/action row with the progress track directly below and stays at or below 76 points tall. Start/Pause and Reset each retain a minimum 44-point target. Timer behavior, callbacks, formatting, urgency threshold, and expiry announcement remain unchanged.

## Overflow Affordance

The round content remains a `ScrollView` for long translations, large accessibility text, and unusually verbose cards. The component compares content height with viewport height and tracks the scroll position.

When more content remains below the viewport, show a subtle bottom fade with a compact downward cue. Hide the cue when content fits, while the user is at the bottom, and during phases that have no hidden content. The cue must not intercept gestures or obscure timer controls.

## Readability Policy

Challenge body text never drops below 16px. Compact uppercase game metadata that intentionally remains below 16px—session eyebrow, player role, card kicker, timer estimate, and outcome label—receives narrow, documented exceptions in `readable-font-sizes.test.ts`. No exception applies to challenge titles, body copy, buttons, or timer actions.

The compact End Game label remains at least 16px. This removes the branch's only newly introduced readability violation while documenting the five pre-existing game-metadata sizes already present on `main`.

## Component Boundaries and State

`GameRoundPanel` remains the presentation owner for round scrolling, the overflow cue, challenge content, and timer layout. Overflow measurement is local transient UI state and does not enter the game-session store.

`GameSessionHeader` owns only its denser layout. `GameSegmentedControl` exposes an active-round visual-density option without changing the default setup-screen presentation.

No game-state data flow changes: the route continues passing display strings, timer values, and callbacks into presentation components.

## Accessibility and Responsive Behavior

- Preserve existing accessibility roles, labels, selected states, disabled states, and timer expiry announcements.
- Keep all buttons and language options at least 44 points in each interactive dimension.
- Allow system font scaling; overflow scrolling remains the fallback when larger text no longer fits.
- Do not use clipping or fixed challenge heights to force content into the card.
- Verify English and Spanish on iPhone 16e and confirm larger iPhones remain balanced.

## Testing and Verification

Automated component tests will verify:

- the denser header and active-round language selector do not affect setup-screen controls;
- visible selector styling is compact while touch targets remain 44 points;
- revealed title and body use the approved sizes and line heights;
- the duration estimate appears once in timed revealed content;
- timer callbacks, progress, urgency, and expiry behavior remain intact;
- the overflow cue appears only when content exceeds the viewport and hides at the bottom; and
- readability policy exceptions are limited to the five named game metadata styles.

Before completion, run the focused game suites, the full Jest suite, TypeScript, focused lint, and diff checks. Visually inspect a normal-length and long card in both English and Spanish on the iPhone 16e.

## Success Criteria

- A normal card like `Prop Boundary Check` shows its full challenge and timer without scrolling on iPhone 16e.
- The session header and EN/ES selector are visibly smaller than the current implementation.
- Long cards clearly indicate that more content is available below.
- English and Spanish labels never split individual words.
- Player labels and names remain centered.
- The full test suite passes with no undocumented readability exceptions.
