# Deck Four-Way Swipe Voting Design

## Goal

Make every visible readiness choice available through both a button and an
unambiguous swipe gesture on the main Deck.

## Scope

This change applies to `apps/mobile/app/(tabs)/deck.tsx`, its Deck-specific
English and Spanish tour copy, and its tests. Other swipe-enabled experiences
remain unchanged.

This design supersedes the tap-only voting decision in
`2026-07-11-deck-tap-voting-and-card-overflow-design.md`. Vertical scrolling
inside the voting card is outside this change because it would compete with
the approved up/down vote gestures. Long-card overflow should be handled in a
separate interaction design that does not use vertical scrolling on the
swipeable surface.

## Vote Mapping

The Deck uses one fixed mapping:

```text
             Up: Curious

Left: Hard No    Card    Right: Yes

             Down: Not Now
```

The mapping reflects the ordered readiness scale: the horizontal directions
are the definitive endpoints, while the vertical directions are the softer
intermediate choices. The existing left, right, and up behavior remains
stable; down supplies the missing fourth vote.

The four visible buttons show their corresponding directional arrows so the
gesture mapping remains discoverable:

- Hard No: left arrow
- Not Now: down arrow
- Curious: up arrow
- Yes: right arrow

Buttons remain the accessible and explicit alternative to gestures.

## Gesture Feedback and Submission

While the user drags a card, the card previews the candidate vote with its
localized label and existing vote color. The preview changes as the dominant
drag direction changes. Releasing past the configured threshold commits that
vote and animates the card off-screen in the same direction. Releasing before
the threshold returns the card to its resting position without voting.

All four gestures and all four buttons call one submission path with an
explicit `Readiness` value:

```ts
submitReadiness('hard_no' | 'not_now' | 'curious' | 'yes')
```

Button actions may trigger the matching directional exit animation, but the
vote value is passed directly. It is never recovered from animation direction
or stored in a queued override.

While a card exit is active, further gestures and button presses are ignored.
The existing undo action remains available for accidental votes, including
Hard No.

## Existing Behavior Preserved

Submitting a readiness value continues to:

- store the active card's pair preference when applicable;
- update potential-match feedback using the selected readiness;
- advance to the next unvoted card;
- trigger starter-pack or tier-completion feedback when the queue empties; and
- keep votes isolated to the active profile.

## Tour Copy

The Deck tour must teach both input methods and name every mapping explicitly.
The voting step should convey the following meaning in localized copy:

- English: Swipe left for Hard No, down for Not Now, up for Curious, or right
  for Yes. You can also tap any button.
- Spanish: Desliza a la izquierda para No rotundo, hacia abajo para Ahora no,
  hacia arriba para Curiosidad o a la derecha para Sí. También puedes tocar
  cualquier botón.

Other Deck copy that gives an incomplete left/right or three-way mapping must
be updated or removed so the app never teaches conflicting gestures.

## Testing

Regression coverage will verify that:

- left submits `hard_no`;
- down submits `not_now`;
- up submits `curious`;
- right submits `yes`;
- each button submits the matching readiness through the same submission path;
- button-triggered animations use their matching directions without changing
  the submitted value;
- sub-threshold drags return the card without recording a vote;
- repeated input during an active transition cannot create duplicate votes;
- the button labels expose the matching directional affordances; and
- English and Spanish Deck tours describe all four directions and the button
  alternative.

Existing readiness storage, undo, match-momentum, pair-preference, and Deck
completion tests must continue to pass.

## Success Criteria

- Every one of the four visible readiness choices has exactly one documented
  swipe direction.
- A swipe and its corresponding button always persist the same readiness.
- Users see the prospective vote before releasing the card.
- The tour and visible controls make the four-way mapping discoverable without
  experimentation.
- Accidental or incomplete gestures never record a vote.
