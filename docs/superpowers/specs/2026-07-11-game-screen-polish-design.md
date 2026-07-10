# Game Screen Polish Design

## Summary

Polish both phases of the SpiceSync game experience—the pre-game setup and active gameplay—into a cohesive, professional, and playful “game-night lounge” presentation. Preserve all existing rules, state transitions, persistence, translations, sounds, and navigation.

The supplied active-game reference is the visual north star: deep burgundy surfaces, restrained pink-to-orange accents, clear player routing, an elevated challenge card, an integrated timer, and confident outcome actions.

## Goals

- Make setup and gameplay feel like two phases of one designed experience.
- Clarify the hierarchy so players can understand the next action at a glance.
- Keep the screen fun through color, glow, motion, and category accents without making it feel noisy.
- Improve spacing, typography, control consistency, and visual balance.
- Support long player names, English and Spanish copy, and smaller iPhone sizes.
- Keep every game-screen pressable and input target at least 44 points tall and wide.

## Non-Goals

- Changing game rules, player rotation, roulette selection, timer behavior, or consequences.
- Changing session persistence, sounds, navigation, custom deck logic, or translations.
- Redesigning the global header or tab bar beyond any spacing needed to integrate this screen.
- Introducing new modes, settings, assets, or data models.

## Visual Direction

Use a refined game-night lounge style:

- A deep wine background and layered burgundy surfaces establish atmosphere.
- Pink is the primary interactive accent; orange appears sparingly in accent gradients.
- Borders are quieter and fewer than in the current screen. Surface contrast and spacing do more of the grouping work.
- Glow is reserved for the primary action, active selection, directional player arrow, and short reveal moments.
- Type hierarchy uses strong, compact labels and large, readable challenge copy.
- Radii, pill shapes, and vertical rhythm are consistent across both phases.
- Card categories may receive subtle accent variation while retaining the core SpiceSync palette.

## Shared Presentation System

Create or reuse small presentation primitives within the game feature:

- `GameSurface`: common fill, border, radius, and shadow treatment.
- `GamePill`: selected, neutral, and status variants for modes, language, and drinking state.
- `GameSectionLabel`: consistent uppercase or compact supporting label treatment.
- `GamePrimaryButton` and `GameSecondaryButton`: consistent sizing, pressed feedback, disabled treatment, and icon alignment.

These can remain local to the game route unless an existing shared app-chrome primitive already provides the same behavior. Do not broaden the refactor to unrelated screens.

## Pre-Game Setup

### Structure

1. A compact hero identifies Game Night and the selected Normal or Intense mode.
2. The mode selector sits near the hero and remains easy to compare.
3. A primary setup surface groups player count and player names.
4. A secondary options area holds drinking mode, language, and custom-deck mix when available.
5. Custom Deck is a quiet secondary action.
6. Start Game is the visually dominant action at the bottom of the setup content.

### Behavior

- Retain the existing 2–4 player selection and name editing.
- Retain the existing drinking-mode toggle and explanatory copy.
- Retain custom deck options only when custom cards exist.
- Preserve the current empty-deck disabled state.
- Allow the setup content to scroll on smaller devices without hiding the primary action or clipping inputs.

## Active Gameplay

### Session Header

Use a slim surface with three clear zones:

- Left: Game Night eyebrow and selected mode.
- Center: drinking status when enabled.
- Right: End Game as a subdued destructive/exit action.

The zones must remain stable when the drinking pill is absent and must accommodate Spanish labels through flexible sizing.

### Player Matchup

Combine the current player and target information into one directional component:

- Player Up uses a warm pink/burgundy surface.
- Target uses a cooler dark surface for contrast.
- A circular gradient arrow connects the two roles.
- Player names are the primary text; role labels remain compact and secondary.
- Long names truncate or scale safely without changing the route’s height dramatically.

### Card Content

- Keep the language selector close to the challenge content but visually secondary.
- Use a short accent marker to introduce the card title.
- Give the category title strong prominence and the challenge copy comfortable line height.
- Keep ready and spinning states visually related to the revealed card so the transition feels continuous.
- Avoid redundant nested outlines around the challenge content.

### Timer

- Present the estimated duration as a small metadata badge near the challenge.
- Integrate countdown, progress, Start/Pause, and Reset within one compact timer surface.
- Use pink for normal progress and a clear urgent color when ten seconds or fewer remain.
- Preserve the no-time-limit presentation for untimed cards.
- Keep Start/Pause and Reset labels accessible even when only icons are visually emphasized.

### Outcome Actions

- Anchor Pass / Risk and Done beneath the challenge card with equal visual weight in layout, while Done remains the positive primary outcome.
- Use distinct icon circles and concise labels.
- Preserve current disabling and consequence behavior.
- Keep controls reachable above the global tab bar and safe-area inset.

## Motion and Feedback

- Retain the existing scene transition and roulette reveal.
- Add subtle pressed-state scale or opacity feedback to primary controls.
- Use gentle surface or content transitions when the round changes from ready to spinning to revealed.
- Keep motion short and purposeful; do not add continuous decorative animation.
- Respect the existing sound cues and avoid triggering duplicate feedback.

## Component Boundaries and State

The existing game route remains the state owner. It continues to manage setup, persisted session state, deck selection, roulette phases, timer state, consequences, and navigation.

Extract focused presentation components for:

- session header;
- mode selector;
- player matchup;
- language selector;
- challenge content;
- timer panel; and
- outcome actions.

Each component accepts display values and callbacks from the route and contains no persistence or game-rule logic. This keeps visual iteration isolated without changing behavior.

## Responsive and Accessibility Requirements

- Verify on iPhone 17 Pro Max and a smaller iPhone viewport.
- Use scrolling where vertical space is constrained rather than shrinking body text below readable sizes.
- Maintain 44-point minimum touch targets for every game-screen pressable and input.
- Preserve accessibility roles, labels, selected states, and disabled states.
- Preserve React Native system font scaling. Multiline challenge and explanatory copy must grow vertically instead of being clipped by fixed-height containers.
- Ensure text and interactive controls maintain readable contrast against dark surfaces.
- English and Spanish card content, labels, and long player names must wrap, truncate, or scale predictably.

## Error and Edge States

- A selected mode with no available cards keeps Start Game disabled and shows the existing explanatory copy.
- Missing or unavailable custom cards fall back to the existing included-deck behavior.
- Untimed cards show the existing no-time-limit state and do not expose unusable timer controls.
- Timer expiry retains the existing “Time’s Up” behavior and urgent styling.
- Consequence acknowledgement remains a modal flow and is not merged into the card layout.
- Persistence failures remain best-effort and must not interrupt the active game.

## Testing and Verification

Automated coverage should protect the existing interaction model and the rendering boundaries most affected by the refactor:

- pre-game setup with 2–4 players;
- mode selection and disabled empty-deck state;
- drinking and custom-deck options;
- active session header and player matchup;
- ready, spinning, and revealed card phases;
- timed and untimed cards;
- timer start, pause, reset, urgency, and expiry;
- Pass / Risk, Done, and drinking consequence behavior;
- English/Spanish switching; and
- player-name rendering with a 24-character name in both the player and target positions.

Before completion, run the targeted Jest tests, lint or type checks appropriate to the mobile package, and visually inspect the updated screen in the iOS Simulator at both large and small phone sizes.

## Success Criteria

- Setup and gameplay clearly share one visual system.
- A new player can identify the current mode, active player, target, challenge, timer, and next action without visual ambiguity.
- The screen feels playful through controlled accent color and feedback while remaining polished and readable.
- No existing game flow, state, persistence, translation, audio, or navigation behavior regresses.
- The layout remains usable on both the reference Pro Max simulator and a smaller iPhone viewport.
