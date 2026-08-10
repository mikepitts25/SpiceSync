# Spice Deck Game-Table Polish Design

## Goal

Raise the Spice Deck setup screen from a tidy form to a premium, energetic
pre-game ritual while preserving SpiceSync's existing dark, magenta-forward
visual theme and its one-screen setup experience.

## Scope

This is a presentation and interaction pass for the pre-game `GameSetupPanel`
and its shared game controls. It preserves every existing setup choice,
callback, accessibility label, and minimum touch target. It does not add game
content, decorative graphics, network behavior, or new dependencies.

## Visual Direction: Game-Table Cockpit

- Replace the current slogan with the concise, non-promotional line `Your
  deck. Your pace.` (`Tu mazo. Tu ritmo.` in Spanish).
- Keep the black, pink, and crimson palette, but add controlled depth: a
  subtly layered panel surface, a restrained magenta-to-crimson rim, and
  active-control fills that feel illuminated rather than merely outlined.
- Present the mode and card-language controls as a compact settings strip with
  short labels above each control, not as two unrelated pills.
- Group the setup into clear, compact zones: player setup, play modifiers, and
  deck settings. Use fine dividers and consistent section headers rather than
  more containers.
- Make selected player counts, levels, and card types feel intentional through
  a filled accent treatment, stronger text contrast, and a soft halo; inactive
  options stay quiet.
- Give the primary action more game-specific presence: label it `Deal First
  Card` (`Repartir la primera carta.` in Spanish), include a restrained card
  icon, and add a brief press/selection response. No looping animation or
  illustration is added.

## Interaction and Accessibility

- Use existing press-scale feedback and add only short, interruptible
  transitions for stateful controls. Motion must not block interaction.
- Preserve the 44-point minimum interactive height and current accessibility
  role, label, and selected/disabled state behavior.
- Keep the entire initial setup visible without vertical scrolling on the
  standard phone viewport used by the current screen.

## Implementation Boundaries

- `GameSetupPanel` owns the new visual grouping and any local presentation
  motion.
- `GameControls` gains reusable visual variants only where they benefit both
  the game mode/language strip and the primary action.
- `spice-deck.tsx` continues to own setup state and only passes copy/callbacks.
- English and Spanish localization remain the source of all visible copy.

## Verification

- Extend component tests to cover the grouped compact layout, the new CTA
  label, and preserved actions/accessibility states.
- Run focused component tests, the full mobile Jest suite, lint, and TypeScript
  checks.
- Request an independent visual/code review focused on hierarchy, liveliness,
  non-gimmicky motion, screen fit, and regression risk; address any actionable
  feedback before delivery.
