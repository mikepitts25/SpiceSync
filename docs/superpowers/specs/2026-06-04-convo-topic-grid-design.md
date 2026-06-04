# Convo Topic Grid Design

Date: 2026-06-04

## Goal

Change the Convo tab from an inline category picker plus prompt card into a topic-first grid. Users should choose a square topic tile, then enter that topic's dedicated conversation screen. Love Languages should also appear as a square tile and open a hub that offers both guided prompts and the existing quiz/results flow.

## Current Context

The Convo tab is implemented by `apps/mobile/app/(conversation)/index.tsx` and re-exported from `apps/mobile/app/(tabs)/conversation.tsx`. It currently renders the Love Languages module, a horizontal category filter row, and one active prompt card on the same screen.

The Love Languages quiz already behaves like a separate screen through `apps/mobile/app/(conversation)/love-languages.tsx`, which currently re-exports the settings quiz implementation.

Conversation categories are centralized in `apps/mobile/lib/conversationExperience.ts` through `CONVERSATION_CATEGORY_FILTERS`.

## Approved Interaction

- The Convo tab becomes a 2-column square grid of conversation topics.
- Each standard topic tile opens a dedicated topic prompt screen.
- The topic prompt screen keeps the existing card interaction: previous, next, random/skip, save, and share.
- Love Languages is also a square grid tile.
- Tapping Love Languages opens a Love Languages hub with two choices:
  - Use prompts
  - Take quiz or view quiz results
- The existing quiz remains a full-screen flow, moved behind a separate conversation route.

## Implementation Shape

- Extend conversation topic metadata with route, subtitle, visual mark, and optional topic type.
- Replace the inline category row in `/(conversation)/index.tsx` with a square `FlatList` grid.
- Extract reusable prompt-card behavior into a topic screen or component so standard topics do not duplicate logic.
- Add `/(conversation)/topic/[category].tsx` for standard conversation prompt topics.
- Change `/(conversation)/love-languages.tsx` into a Love Languages hub screen.
- Add `/(conversation)/love-languages-quiz.tsx` for the existing quiz implementation.
- Update `LOVE_LANGUAGE_QUIZ_ROUTE` to point at the quiz route while keeping all Love Languages entry points in the conversation route group.

## Testing

- Update conversation metadata tests to cover topic routes and Love Languages hub/quiz routing.
- Add route-file coverage for the new dynamic topic route and quiz route if existing router tests require explicit entries.
- Run focused Jest tests for conversation metadata and any route tests touched by the change.

## Out of Scope

- New conversation content.
- New persistent state.
- Changes to saved favorites/history behavior beyond preserving existing behavior in the new screens.
