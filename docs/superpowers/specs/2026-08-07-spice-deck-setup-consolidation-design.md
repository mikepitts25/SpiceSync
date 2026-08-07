# Spice Deck Setup Consolidation Design

## Goal

Make the Spice Deck setup screen feel lighter and ensure every required setup
control, including the start action, is visible on a standard phone screen
without scrolling.

## Scope

The change is limited to the pre-game setup panel. It does not change game
state, card filtering, player setup behavior, or game-session behavior.

## Layout

- Keep the existing `GAME NIGHT` label.
- Replace the current large, multi-line intro with the one-line headline:
  `Pick your vibe. Draw a card.`
- Remove the Truth, Dare, and Challenge labels above the headline.
- Remove the dynamic card-availability sentence (for example, `266 cards ready
  for Normal.`).
- Place the card-language choice and Normal/Intense mode choice in a single,
  horizontal control row. Both controls remain accessible and retain their
  current behavior.
- Use compact segmented pills: smaller horizontal and vertical padding, a
  smaller label size, and reduced control height while preserving a practical
  touch target.
- Reduce setup-panel spacing and the heights of its nonessential decorative
  elements enough that the initial screen exposes the Start Playing action with
  no scrolling on a standard phone viewport.

## Visual Direction

Maintain the existing dark, pink-accented visual system. The reduced controls
and typography should make the panel read as an efficient setup surface rather
than a promotional card.

## Accessibility and Responsiveness

- Keep existing accessibility labels and selected states on all controls.
- Preserve readable type and adequate touch targets despite the visual
  compaction.
- On narrower screens, keep the language and intensity controls on one row by
  using concise labels and balanced widths; only the setup-panel layout changes,
  not its controls or selectable options.

## Verification

- Add a focused component test that confirms the removed labels do not render,
  the replacement headline does render, and the compact controls share one
  layout row.
- Run the focused test, the mobile test suite, lint, and a TypeScript/build
  check if provided by the project scripts.
