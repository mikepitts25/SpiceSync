# Game Language and Player Alignment Design

## Summary

Refine the active game screen so its EN/ES selector is compact and right-aligned, Spanish labels wrap cleanly without splitting words, and both player boxes center their labels and names consistently.

## Scope

- Add a compact presentation option to the existing game segmented control.
- Use the compact option for the active round's EN/ES selector only.
- Keep the selector at the top of the round card, aligned to the right, with two equal-width options.
- Preserve a minimum 44-point touch target for each language option.
- Allow Spanish multi-word labels in the session header and player matchup to wrap to at most two centered lines when necessary.
- Ensure layout widths prevent individual words from being split.
- Center player-role labels and player names horizontally and vertically within both player boxes.
- Preserve one-line, scale-to-fit behavior for long player names.

## Non-Goals

- Changing language-selection behavior or persistence.
- Changing translations, game rules, navigation, or card content.
- Resizing segmented controls elsewhere, including the setup screen.
- Redesigning the overall game screen.

## Component Changes

### Game Segmented Control

The shared `GameSegmentedControl` receives a scoped compact presentation option. The default presentation remains unchanged. Compact mode sizes the container to its content while retaining equal options and the existing selected, pressed, and accessibility states.

### Active Round Panel

The round panel places the compact language selector in a right-aligned wrapper at the top of the existing card-content area. The selector remains visually secondary to the challenge content and does not occupy the full card width.

### Session Header

Header zones use flexible widths appropriate to their content. Multi-word labels may wrap onto two centered lines, but no individual word is intentionally broken. The end-game control retains its minimum touch target and supports Spanish copy without the current mid-word split.

### Player Matchup

Both role labels and player names use centered text alignment. Each player box centers its full text group on both axes. Role labels may wrap naturally to two lines; player names remain limited to one line and scale down for long names.

## Accessibility and Responsive Behavior

- Every language option and header action remains at least 44 points tall and wide.
- Existing accessibility labels, selected states, and button roles remain unchanged.
- Text continues to honor system font scaling.
- English and Spanish layouts remain stable on the iPhone 16e viewport shown in the reference and on larger iPhones.

## Testing and Verification

Automated component tests will verify:

- the active EN/ES selector uses compact, right-aligned styling;
- compact language options retain 44-point minimum touch targets;
- Spanish header controls allow clean two-line wrapping;
- player labels and names are centered in both boxes; and
- long player names retain their existing one-line scale-to-fit behavior.

Before completion, run the targeted Jest component tests, the relevant TypeScript or lint checks, and visually inspect the active game screen in both English and Spanish in the iOS Simulator.

## Success Criteria

- The active EN/ES selector occupies only the top-right portion of its current row.
- Spanish multi-word labels wrap cleanly without splitting a word.
- Labels and names look centered in both player boxes in English and Spanish.
- No game behavior or unrelated segmented control changes regress.
