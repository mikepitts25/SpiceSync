# Concrete Game Cards and Target Rotation Design

## Goal

Make action cards feel immediate, definitive, and playful, while ensuring games with three or four players rotate targets instead of permanently pairing each player with the next player in the setup list.

## Card Language

English card bodies use the role labels `Player up` and `Target`, matching the matchup header that displays the corresponding player names. Spanish cards use the localized header labels `Jugador activo` and `Objetivo`. Cards do not interpolate player names into their content.

The existing `lvl5-c-007` “Prop Boundary Check” card becomes `Collar Claim`: Player up puts a collar on Target, Target wears it for the next two rounds, and Player up then removes it. The existing discussion-only `lvl5-c-014` fantasy-ranking challenge becomes `Lipstick Mark`: Player up applies lipstick to Target as a bold lip, cheek mark, or kiss print, and Target keeps it for the next two rounds. Both cards declare their required prop and state a definite action and outcome.

All runtime dare, challenge, and roleplay cards receive the same focused audit. An action card must instruct players to do something during the current game. A card whose primary activity is only discussing, negotiating, ranking, or planning a later activity is rewritten as a short, specific action. Truth and fantasy cards may remain conversational because discussion is their intended behavior.

Cards remain non-graphic and compatible with the existing pass/risk control. Physical props retain appropriate requirements and safety notes. Collar instructions must require a loose, decorative fit and immediate removal on discomfort. The audit does not introduce high-risk activities or explicit sex-act instructions.

English runtime data is the source of truth. The JSON card mirror, translation CSV, generated Spanish translation JSON, and any explicit content assertions stay synchronized for every changed card.

## Target Rotation

The acting player continues to advance in setup order. Two-player games keep the current behavior: each player always targets the other player.

For three- and four-player games, target selection uses a deterministic balanced rotation. During one pass through the player list, every acting player uses the same target offset. On the next pass, the offset advances to the next non-self player. This continues until every acting player has targeted every other player, then repeats.

For three players, the first two passes are:

- Player 1 → Player 2, Player 2 → Player 3, Player 3 → Player 1
- Player 1 → Player 3, Player 2 → Player 1, Player 3 → Player 2

For four players, three passes cover all possible directed, non-self pairings. This is preferred over independent random selection because it prevents immediate repeats, guarantees fair coverage, and produces the same matchup after restoring a saved session.

The session turn index becomes a monotonically increasing completed-turn counter instead of wrapping after the final player. The acting player and displayed “Player N of N” value still use the index modulo player count. The completed-pass count selects the target offset. Existing persisted sessions remain valid because their stored indices are already valid starting points.

## Components and Data Flow

- `apps/mobile/lib/gameSession.ts` calculates the acting player, balanced target, and next monotonically increasing turn index.
- `apps/mobile/app/(game)/index.tsx` continues consuming `getGameTurn`; no new UI state or target-specific persistence field is required.
- Runtime card source files contain revised English action prompts and metadata.
- Card JSON and EN/ES translation artifacts mirror the revised content.

No random generator, shuffled matchup schedule, or persistence schema change is introduced.

## Testing

Test-first changes cover:

- two-player targeting remaining unchanged;
- three-player rotation covering both possible targets for every acting player before repeating;
- four-player rotation covering all three possible targets for every acting player before repeating;
- turn advancement remaining monotonic while displayed player positions wrap correctly;
- the collar and lipstick/makeup cards containing concrete `Player up` and `Target` instructions in English and Spanish;
- action-card content policy rejecting prompts whose main result is deferred planning or open-ended negotiation;
- runtime TypeScript data, JSON data, CSV translations, and generated Spanish translations remaining synchronized.

The focused Jest suites run first, followed by the complete mobile test suite, TypeScript checking, and linting.
