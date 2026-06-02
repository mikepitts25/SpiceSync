# Admin Content QA V1 Design

## Goal

Add a read-only QA surface to the existing admin tool so kink content issues are visible before they reach the mobile app.

## Scope

Admin Content QA V1 applies only to the Kinks tab. It adds:

- A QA summary panel above the content list.
- Issue counts grouped by category.
- Quick filters for all issues, missing translations, pair issues, safety flags, and required-field issues.
- Clickable issue rows that search for the affected kink in the existing list.
- A reusable analyzer that can be tested outside the browser.

The panel is audit-only. It does not auto-edit content and does not block saving.

## Checks

The analyzer flags:

- Duplicate `id`.
- Duplicate `slug`.
- Missing required fields: `id`, `slug`, `title`, `description`, `category`, `intensityScale`, `tier`.
- Missing Spanish fields: `titleEs` or `descriptionEs`.
- Pair issues:
  - `pairMode` set without `pairKey`.
  - `pairMode` set without `pairRole`.
  - `pairRole` set without `pairKey`.
  - complete pair missing a `give` or `receive` role.
  - duplicate role in the same `pairKey`.
- Safety flags:
  - `tier: "xxx"` or `intensityScale >= 3` without any safety-oriented tag from `safety`, `boundaries`, `communication`, `consent`, `aftercare`, `check-in`, `safeword`.

## UX

When the Kinks tab is active, a `Content QA` panel appears between filters and the list.

The panel shows:

- Total issue count.
- Small stat pills by issue group.
- Filter buttons: `All`, `Translations`, `Pairs`, `Safety`, `Required`.
- Issue rows with severity, title, and affected kink IDs.

Clicking an issue fills the existing search input with the first affected kink ID and reapplies filters.

## Architecture

Create `admin/lib/kink-qa.js` with `analyzeKinks(kinks)`.

Use the same module in:

- `admin/server.js` via `GET /api/kinks/qa`.
- `admin/public/app.js` by consuming `payload.qa` returned from `/api/kinks`.

To keep the client simple, `/api/kinks` will include `qa` alongside `data` for the Kinks tab. The dedicated `/api/kinks/qa` endpoint supports tests and future tooling.

## Testing

Add `admin/test/kink-qa.test.js` using Node's built-in test runner.

Run:

- `cd admin && node --test test/kink-qa.test.js`
- `node --check admin/public/app.js`
- `node --check admin/server.js`
- `cd apps/mobile && npm test -- --runInBand __tests__/kinks-content.test.ts __tests__/paired-kinks.test.ts`

## Non-Goals

- No save blocking.
- No approval statuses.
- No reviewer notes.
- No automatic translation repair.
- No content rewrite.
