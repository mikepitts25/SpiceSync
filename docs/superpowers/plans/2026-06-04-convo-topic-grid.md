# Convo Topic Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a square topic grid on the Convo tab where each tile opens its own conversation topic screen, with Love Languages opening a hub for prompts or quiz.

**Architecture:** Keep conversation topic metadata centralized in `lib/conversationExperience.ts`. Reuse the existing prompt-card behavior by moving it into a category route driven by route params. Keep the quiz full-screen by moving the current quiz export to a dedicated route and making `love-languages.tsx` the hub.

**Tech Stack:** Expo Router, React Native, TypeScript, Jest.

---

## File Map

- Modify `apps/mobile/lib/conversationExperience.ts`: add topic metadata, routes, and category lookup helpers.
- Modify `apps/mobile/__tests__/conversation-experience.test.ts`: test the new metadata and Love Languages hub/quiz route split.
- Modify `apps/mobile/app/(conversation)/index.tsx`: replace inline prompt flow with a square topic grid.
- Create `apps/mobile/app/(conversation)/topic/[category].tsx`: render the selected category's prompt screen.
- Modify `apps/mobile/app/(conversation)/love-languages.tsx`: make this the Love Languages hub.
- Create `apps/mobile/app/(conversation)/love-languages-quiz.tsx`: preserve the existing quiz screen route.

## Tasks

### Task 1: Topic Metadata

**Files:**
- Modify: `apps/mobile/lib/conversationExperience.ts`
- Modify: `apps/mobile/__tests__/conversation-experience.test.ts`

- [ ] Write failing tests that expect topic metadata to include routes, square-grid labels, the Love Languages hub route, and a separate quiz route.
- [ ] Run `cd apps/mobile && npm test -- --runTestsByPath __tests__/conversation-experience.test.ts` and confirm the new tests fail because metadata does not exist yet.
- [ ] Extend `conversationExperience.ts` with route constants, tile metadata, and lookup helpers.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Convo Grid

**Files:**
- Modify: `apps/mobile/app/(conversation)/index.tsx`

- [ ] Replace the inline Love Languages card, category pills, and prompt card with a 2-column square `FlatList`.
- [ ] Use the metadata from `CONVERSATION_TOPIC_TILES`.
- [ ] Navigate each tile to its configured route with `router.push`.
- [ ] Keep `AppHeader`, `ScreenTour`, and `AppTabBar active="convo"`.

### Task 3: Standard Topic Screen

**Files:**
- Create: `apps/mobile/app/(conversation)/topic/[category].tsx`

- [ ] Implement a route-param driven screen that validates the category through `getConversationTopicTile`.
- [ ] Reuse the existing prompt-card behavior: category pool, history, favorite, previous, next, random, share.
- [ ] Add a back button and keep the conversation card visually aligned with the current design.
- [ ] Route invalid categories back to the conversation index.

### Task 4: Love Languages Hub And Quiz Route

**Files:**
- Modify: `apps/mobile/app/(conversation)/love-languages.tsx`
- Create: `apps/mobile/app/(conversation)/love-languages-quiz.tsx`

- [ ] Make `love-languages-quiz.tsx` re-export the existing settings quiz.
- [ ] Make `love-languages.tsx` a hub with result summary, `Use prompts`, and `Take quiz` or `View results` actions.
- [ ] Route `Use prompts` to the dynamic topic route for `love_languages`.
- [ ] Route quiz action to `LOVE_LANGUAGE_QUIZ_ROUTE`.

### Task 5: Verification

**Files:**
- All files touched above.

- [ ] Run `cd apps/mobile && npm test -- --runTestsByPath __tests__/conversation-experience.test.ts`.
- [ ] Run `cd apps/mobile && npm test -- --runTestsByPath __tests__/router-files.test.ts` if route coverage needs updates.
- [ ] Run `cd apps/mobile && npm test -- --runTestsByPath __tests__/conversation-card-text.test.ts` to confirm prompt text behavior still passes.
- [ ] Run `cd apps/mobile && npx tsc --noEmit` if time permits; otherwise report why it was skipped.

## Self-Review

- Spec coverage: The plan covers topic grid, standard topic route, Love Languages hub, quiz route, metadata tests, and focused verification.
- Placeholder scan: No placeholder tasks remain.
- Type consistency: Route constants and topic lookup helpers are defined before screens use them.
