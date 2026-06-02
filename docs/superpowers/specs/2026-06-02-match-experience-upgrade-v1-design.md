# Match Experience Upgrade V1 Design

## Goal

Make matches actionable after discovery by adding filtering, clear paired-role context, and a lightweight try-tonight planning panel inside the Matches tab.

## Scope

The Matches tab keeps its existing buckets: Mutual Yes, Partial Match, and Mutual Maybe. V1 adds:

- Filter chips for all/unseen, category, intensity, and paired-role compatibility.
- Tappable revealed match rows.
- An in-screen match detail panel for the selected match.
- Paired-card copy that explains each partner's Give, Receive, or Both selection.
- A short try-tonight checklist for setup, boundaries, first action, check-in, and aftercare.

Locked buckets continue to hide individual row details until consent unlocks them.

## Non-Goals

- No calendar, reminders, or saved date-night plans.
- No new database tables.
- No remote sync for viewed/unseen state.
- No route restructure outside the current Matches tab.
- No content rewrite.

## Data

`computeRevealBuckets()` will return richer match rows while keeping current bucket names. Each row includes title, description, category, intensity, tier, tags, vote values, paired preferences, and role summary.

Viewed match state is local only and keyed by match id. It supports the unseen filter and is marked when a revealed match detail is opened.

## UX

Filters appear below the partner banner. They use compact segmented chip rows:

- Visibility: All, Unseen.
- Category: All plus categories present in current matches.
- Intensity: All, 1, 2, 3.
- Role: All roles, Paired, You give, You receive, Both.

Selecting a match opens a detail panel before the bucket list. The panel shows:

- Title and category/intensity metadata.
- Your vote and partner vote.
- Paired-role explanation when applicable.
- Description and tags.
- Try-tonight checklist with tappable check states.

## Testing

Add unit tests for:

- Paired-role summary text, including Both/Both.
- Match plan generation.
- Filtering by unseen, category, intensity, and role.
- Reveal rows include role metadata from vote records.

Run:

- `cd apps/mobile && npm test -- --runInBand __tests__/match-experience.test.ts __tests__/match-reveal.test.ts`
- `cd apps/mobile && npm test -- --runInBand`
- `cd apps/mobile && npx tsc -p tsconfig.json --noEmit`
