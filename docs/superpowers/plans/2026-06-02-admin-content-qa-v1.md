# Admin Content QA V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only QA panel to the Kinks admin tab for translations, pair integrity, required fields, duplicates, and safety flags.

**Architecture:** Put all audit rules in `admin/lib/kink-qa.js`, expose QA results from the existing Kinks API, and render the panel in `admin/public/app.js` only when the Kinks tab is active.

**Tech Stack:** Express, vanilla browser JavaScript, Node built-in test runner.

---

### Task 1: Analyzer

**Files:**

- Create: `admin/lib/kink-qa.js`
- Create: `admin/test/kink-qa.test.js`

- [ ] Implement `analyzeKinks(kinks)` returning `{ totalIssues, groups, issues }`.
- [ ] Detect duplicate IDs and slugs.
- [ ] Detect missing required fields and missing Spanish fields.
- [ ] Detect pair mode/key/role problems.
- [ ] Detect high-intensity cards missing safety-oriented tags.
- [ ] Add focused Node tests for each issue group.

### Task 2: API

**Files:**

- Modify: `admin/server.js`

- [ ] Import `analyzeKinks`.
- [ ] Add `qa` to `GET /api/kinks` response.
- [ ] Add `GET /api/kinks/qa` returning only QA output.

### Task 3: Admin UI

**Files:**

- Modify: `admin/public/index.html`
- Modify: `admin/public/app.js`
- Modify: `admin/public/style.css`

- [ ] Add `qa-panel` placeholder between filters and content list.
- [ ] Store `state.qa` from API responses.
- [ ] Render the panel only on Kinks tab.
- [ ] Add filter buttons for all, translation, pair, safety, required.
- [ ] Clicking an issue fills search with the first affected kink ID and reapplies filters.

### Task 4: Verification and Commit

**Commands:**

- `cd admin && node --test test/kink-qa.test.js`
- `node --check admin/public/app.js`
- `node --check admin/server.js`
- `cd apps/mobile && npm test -- --runInBand __tests__/kinks-content.test.ts __tests__/paired-kinks.test.ts`
- `git diff --check`

- [ ] Run all verification commands.
- [ ] Commit and push the Admin QA V1 implementation.

### Self-Review

The plan covers all approved QA checks and keeps the feature read-only. It deliberately avoids save blocking, workflow state, and automatic content changes.
