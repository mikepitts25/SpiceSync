# Games Hub Design

## Purpose

Replace the current immediate Spice Deck setup screen with a clear Games menu.
The menu makes the existing game easy to start and creates a truthful entry point
for three additional, independently implemented game modes.

## Scope

### Games menu

- `app/(game)/index.tsx` becomes the Games hub rather than the Spice Deck setup.
- The hub presents one prominent, playable **Spice Deck** card.
- The hub also presents three secondary mode cards:
  - Match Missions
  - Know Me Better
  - Couple Dice
- A mode card is only tappable when its route is marked available in one
  data-driven hub configuration. Before its game is implemented, the card
  displays **Coming soon** and has no navigation action.
- The hub uses the app's existing header, tab bar, theme tokens, accessibility
  patterns, and English/Spanish localization.

### Spice Deck

- Move the existing full game experience from `app/(game)/index.tsx` to
  `app/(game)/spice-deck.tsx` without changing its behavior.
- Rename all user-facing references from **Spice Dice** to **Spice Deck**.
- Preserve its existing setup controls, intensity and type filters, custom-card
  options, solo and group play, match-aware deck construction, timers, audio,
  roulette animation, completion flow, and persisted-session resume behavior.

## Navigation and availability

- The Spice Deck card always navigates to `/(game)/spice-deck`.
- Secondary cards point to their dedicated routes once present:
  - `/(game)/match-missions`
  - `/(game)/know-me-better`
  - `/(game)/couple-dice`
- The hub configuration explicitly marks Match Missions, Know Me Better, and
  Couple Dice unavailable at first. The integrator flips the corresponding flag
  only after its route is implemented and tested. This avoids runtime route
  inspection and ensures the hub never exposes a dead navigation target.
- Existing deep links to the legacy game entry should continue to reach a safe,
  playable destination; no active session may be discarded by the move.

## Components and boundaries

- Introduce a small, data-driven hub-card component under `components/game/` so
  the layout and enabled/disabled behavior are defined once.
- Keep the hub focused on discovery and navigation; it owns no game-session
  state.
- Keep the moved Spice Deck screen self-contained, reusing its current
  components and state logic rather than duplicating them.
- Do not modify the internals of Match Missions, Know Me Better, or Couple Dice;
  their implementations are independent work.

## Failure handling and accessibility

- Unavailable modes show a visible status and are not actionable.
- Every playable card has an accessible label and a button role.
- The active Spice Deck session continues to recover from persisted local state
  after navigation or an app restart, as it does today.

## Verification

- Update or add unit tests for the Games hub's card labels, availability state,
  and Spice Deck route target.
- Run existing game session, component, and route tests to verify the move did
  not change behavior.
- Run lint before handoff.

## Explicit non-goals

- Building the three new game modes themselves.
- Changing Spice Deck rules, content, premium access, or persistence format.
- Adding remote synchronization, notifications, analytics, or new dependencies.
