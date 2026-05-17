# Kink Match Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add missing Kink Match concepts to SpiceSync's primary kink datasets while excluding taboo/extreme, incest, blood, urine, and scat content.

**Architecture:** This is a static content update. `apps/mobile/data/kinks.en.json` and `apps/mobile/data/kinks.es.json` remain the source loaded by `apps/mobile/lib/data.ts`; `apps/mobile/__tests__/kinks-content.test.ts` guards the required inclusions and exclusions.

**Tech Stack:** JSON static content, Jest.

---

### Task 1: Content Coverage Test

**Files:**
- Modify: `apps/mobile/__tests__/kinks-content.test.ts`

- [ ] **Step 1: Write the failing test**

Add assertions that the new allowed slugs exist in both EN and ES data, and that disallowed slugs are absent.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/mobile && npm test -- --runTestsByPath __tests__/kinks-content.test.ts`
Expected: FAIL because the new allowed slugs are not in the datasets yet.

### Task 2: Add Primary Dataset Entries

**Files:**
- Modify: `apps/mobile/data/kinks.en.json`
- Modify: `apps/mobile/data/kinks.es.json`

- [ ] **Step 1: Add missing allowed entries**

Append new stable IDs after the existing `0158` entries. Use existing fields: `id`, `slug`, `title`, `titleEs`, `description`, `descriptionEs`, `tags`, `category`, `intensityScale`, and `tier`.

- [ ] **Step 2: Run test to verify it passes**

Run: `cd apps/mobile && npm test -- --runTestsByPath __tests__/kinks-content.test.ts`
Expected: PASS.

### Task 3: Verify Data Loads

**Files:**
- Read: `apps/mobile/lib/data.ts`

- [ ] **Step 1: Run a JSON/data sanity check**

Run a Node script that parses both data files, checks for duplicate IDs/slugs, and confirms both language files contain the same slug set.

- [ ] **Step 2: Review diff**

Run: `git diff -- apps/mobile/__tests__/kinks-content.test.ts apps/mobile/data/kinks.en.json apps/mobile/data/kinks.es.json`
Expected: only the test and JSON content changed.
