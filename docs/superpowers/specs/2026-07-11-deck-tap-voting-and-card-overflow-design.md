# Deck Tap Voting and Card Overflow Design

## Goal

Prevent long Deck cards from overlapping their role and partner controls, and make the four readiness choices unambiguous by replacing Deck swipe voting with explicit buttons.

## Scope

This change applies only to the main Deck screen at `apps/mobile/app/(tabs)/deck.tsx` and its Deck-specific copy and tests. Swipe interactions in other experiences, including Date Night conversation navigation, remain unchanged.

## Interaction Design

The Deck card will no longer respond to pan gestures. The four visible readiness buttons—Hard No, Not Now, Curious, and Yes—will each submit their own readiness value directly.

After a button is pressed, the current card will use a neutral fade-out transition. Once its vote is stored and the next card becomes current, the next card will fade in. The transition will not move in a direction because directional motion would continue to imply swipe semantics.

While a transition is active, additional button presses will be ignored so one card cannot receive multiple readiness submissions.

## Card Layout

The card will use three vertically ordered regions:

1. A fixed category and intensity header.
2. A flexible `ScrollView` containing the accent, title, and description.
3. A fixed footer containing the Give/Receive/Both selector when the card has a pair mode, followed by partner vote status.

Only the middle region scrolls. The role selector and partner status remain visible and cannot overlap long copy. Short cards remain centered within the available middle region. The scroll indicator appears when content exceeds the available space.

## Data Flow

Each readiness button calls one submission handler with its `Readiness` value. The handler:

1. Rejects the press if no current card exists or a transition is already running.
2. Plays the existing card transition sound.
3. Fades out the current card.
4. Stores the readiness and pair preference through `setReadiness`.
5. Lets the existing queue select the next unvoted card.
6. Fades in the next card and re-enables the controls.

No readiness values are inferred from animation directions.

## Copy

Deck-specific user-facing language will describe choosing, voting, or reviewing instead of swiping. This includes the Deck tour, profile-selection guidance, Deck subtitle or hint strings, and caught-up text in both English and Spanish where those strings exist.

Internal Deck component and transition names will also stop using swipe terminology. Components and copy belonging to unrelated swipe-enabled screens are out of scope.

## Testing

Regression coverage will verify that:

- The Deck has no pan gesture handler, directional readiness mapping, or programmatic swipe interface.
- All four buttons submit their explicit readiness values through one tap handler.
- The card contains a flexible vertical scroll region for title and description.
- The role selector and partner block are outside that scroll region.
- The card transition is a neutral fade rather than a directional exit.
- Deck-specific English and Spanish copy no longer instructs users to swipe.
- Existing Deck filter, partner status, and transition behavior tests continue to pass after being updated for tap-only interaction.

## Success Criteria

- Long title or description copy never overlaps the role selector or partner status on the iPhone 16e layout.
- Users can reach all long content by scrolling the card body.
- Dragging the card does not record a vote or change cards.
- Each visible readiness button records the matching readiness value exactly once.
- Short cards preserve the existing visual hierarchy and do not require scrolling.
