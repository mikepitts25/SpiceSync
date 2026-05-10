# Main Screen Tours Design

## Context

SpiceSync is an Expo Router mobile app with a custom shared tab bar. The main tab screens are Profiles, Deck, Matches, Conversation, and Game. New users need lightweight guidance on what each screen does and how to move around without blocking the primary workflows.

The approved direction is a compact per-screen coach card rather than a full-screen modal. Each screen owns its own tour state: choosing "Skip tour" dismisses the tour only for the current screen.

## Goals

- Add explanations or short tours to each main screen so users understand the screen from first visit.
- Keep tours non-blocking and visually consistent with the existing dark card interface.
- Provide a clear "Skip tour" option on every tour.
- Persist dismissal per screen, so skipping Profiles does not skip Deck, Matches, Conversation, or Game.
- Keep navigation intuitive by explaining the shared bottom tabs and the main action on the current screen.

## Non-Goals

- No full-screen onboarding replacement.
- No spotlight overlays tied to exact element positions.
- No global "skip all tours" action.
- No server sync or account-level tour state.
- No changes to adult content, card data, matching logic, or profile setup.

## User Experience

Each main screen renders a compact `ScreenTour` panel near the top of its content when that screen's tour is not dismissed. The panel contains:

- A short title.
- One concise explanation for the current step.
- Step progress, such as "1 of 3".
- Primary action: `Next` until the final step, then `Done`.
- Secondary action: `Skip tour`.

The panel should not cover the bottom tab bar, voting buttons, game draw button, or other core controls. Users can continue using the screen while the panel is visible.

## Main Screen Tour Content

Profiles:

1. "This is your hub for active profiles." Explain that the active profile controls votes and preferences.
2. "Use profiles for each person." Explain switching and managing local profiles.
3. "Connect with your partner." Point users toward partner linking or invite code actions.

Deck:

1. "Choose an intensity." Explain the tier filter row.
2. "Vote on each card." Explain pass, yes, and maybe actions plus swipe gestures.
3. "Your votes stay local." Explain that votes are saved to the active profile and feed matches.

Matches:

1. "Compare with your partner." Explain the two-profile comparison banner.
2. "Review shared picks." Explain Mutual Yes and Mutual Maybe sections.
3. "Share a summary." Explain the share results action without implying server sync.

Conversation:

1. "Pick a prompt category." Explain the horizontal category filters.
2. "Use prompts together." Explain next, previous, skip, save, and share.
3. "Love language prompts live here." Explain the quiz module and prompt filter.

Game:

1. "Choose a level." Explain levels 1 through 5 as intensity settings.
2. "Draw a card." Explain draw, skip, and share actions.
3. "Play at your pace." Explain timer labels and no-time-limit cards.

## Architecture

Add a shared `ScreenTour` component under `apps/mobile/components/`. It should be UI-only and receive:

- `screenId`
- `steps`
- optional style props for placement

Add a small persisted Zustand store under `apps/mobile/src/stores/` or `apps/mobile/lib/state/`, following the nearby store conventions. The store tracks dismissed screen ids and exposes:

- `isTourDismissed(screenId)`
- `dismissTour(screenId)`
- `resetTour(screenId)`
- `resetAllTours()`

Use `createJSONStorage(() => mmkvStorage)` for persistence, matching the app's existing local storage pattern.

Each main screen imports `ScreenTour` and passes its local step list. The step lists can live beside the component as exported constants if tests need to inspect them, or beside each screen if that keeps screen copy easier to maintain. The implementation should prefer the structure that creates the least churn in the existing screen files.

## Data Flow

1. A main screen renders.
2. `ScreenTour` asks the tour store whether that screen id is dismissed.
3. If dismissed, `ScreenTour` renders nothing.
4. If not dismissed, it renders the current step.
5. `Next` advances local component state only.
6. `Done` persists dismissal for that screen id.
7. `Skip tour` persists dismissal for that screen id immediately.

Tour progress within a screen does not need to persist between app launches. Only dismissal persists.

## Error Handling

- If `steps` is empty, `ScreenTour` renders nothing.
- If persistent storage is not hydrated yet, default to showing the tour only when the store can answer reliably. Avoid flicker where possible, but do not block the screen.
- Repeated dismiss calls should be idempotent.

## Accessibility

- Use `accessibilityRole="button"` for `Next`, `Done`, and `Skip tour`.
- Provide specific labels, such as "Skip Profiles tour".
- Ensure text wraps inside the panel at small mobile widths.
- Keep tap targets near the existing app button sizes.

## Testing

Add focused Jest tests for the tour store and content contract:

- Skipping one screen marks only that screen dismissed.
- Completing one screen marks only that screen dismissed.
- Resetting one screen does not reset the others.
- Each main screen tour has at least two steps and includes a skip path through the shared component or store contract.

If component rendering tests are practical in the current Jest setup, add a `ScreenTour` test that verifies:

- First step renders when not dismissed.
- `Next` advances to the next step.
- `Skip tour` calls the per-screen dismiss action.

## Implementation Notes

- Keep copy concise and neutral.
- Reuse existing theme tokens from `constants/theme.ts`.
- Avoid adding a new third-party tour library for this version.
- Do not refactor unrelated screen layout while adding the panels.
- Preserve existing uncommitted user edits in the working tree.
