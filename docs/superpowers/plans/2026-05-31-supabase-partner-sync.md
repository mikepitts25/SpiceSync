# Supabase Partner Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a free-first Supabase durable relay path for partner syncing without removing the existing HTTP/VPS relay fallback.

**Architecture:** Keep the mobile sync loop and encrypted event queue unchanged. Add a Supabase transport implementing the existing relay client methods through anonymous auth and Postgres RPC functions, then choose that transport when Supabase config is present.

**Tech Stack:** Expo React Native, TypeScript, Jest, Supabase JS client, Supabase Auth anonymous sign-in, Postgres SQL/RLS/RPC migrations.

---

### Task 1: Document Supabase Relay Schema

**Files:**
- Create: `supabase/migrations/20260531000000_partner_sync_relay.sql`

- [ ] **Step 1: Add migration**

Create SQL tables `spicesync_invites`, `spicesync_couples`, and `spicesync_events`; enable RLS; deny direct access by default; add RPC functions for invite, couple, event append/list, and revoke operations.

- [ ] **Step 2: Review migration for free-tier fit**

Confirm no Realtime publication or Edge Function dependency is introduced in the MVP migration.

### Task 2: Add Supabase Dependencies And Config

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/package-lock.json`
- Create: `apps/mobile/lib/sync/supabaseConfig.ts`

- [ ] **Step 1: Install dependencies**

Run:

```bash
npm install @supabase/supabase-js react-native-url-polyfill
```

Expected: dependencies are added to `apps/mobile/package.json` and lockfile.

- [ ] **Step 2: Add config module**

Create `supabaseConfig.ts` that reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, supports Expo `extra.supabaseUrl` and `extra.supabaseAnonKey`, and exports `isSupabaseRelayConfigured()`.

### Task 3: Build Supabase Relay Adapter With TDD

**Files:**
- Create: `apps/mobile/lib/sync/supabaseRelayClient.ts`
- Create: `apps/mobile/__tests__/supabase-relay-client.test.ts`

- [ ] **Step 1: Write failing test**

Test that `createInvite()` signs in anonymously when no Supabase session exists, calls `spicesync_create_invite`, and maps the response into the existing `CreateInviteResponse` shape.

- [ ] **Step 2: Verify red**

Run:

```bash
npm test -- --runInBand __tests__/supabase-relay-client.test.ts
```

Expected: fail because `supabaseRelayClient.ts` does not exist yet.

- [ ] **Step 3: Implement minimal adapter**

Add `SupabaseRelayClient` with `createInvite`, `getInvite`, `acceptInvite`, `getCouple`, `appendEvent`, `listEvents`, and `revokeCouple`, each calling the matching RPC and throwing `RelayHttpError` on RPC errors.

- [ ] **Step 4: Verify green**

Run:

```bash
npm test -- --runInBand __tests__/supabase-relay-client.test.ts
```

Expected: test file passes.

### Task 4: Wire Transport Selection

**Files:**
- Modify: `apps/mobile/lib/sync/relayClient.ts`
- Modify: `apps/mobile/lib/sync/relayConfig.ts`
- Test: `apps/mobile/__tests__/relay-client.test.ts`

- [ ] **Step 1: Add relay interface**

Export a `RelayTransport` type from `relayClient.ts` matching the current method set.

- [ ] **Step 2: Select Supabase transport**

Update `getRelayClient()` to return `SupabaseRelayClient` when Supabase config is present and the HTTP `RelayClient` otherwise.

- [ ] **Step 3: Verify existing relay tests**

Run:

```bash
npm test -- --runInBand __tests__/relay-client.test.ts __tests__/sync-invite-flow.test.ts __tests__/sync-loop.test.ts
```

Expected: existing HTTP relay injection and sync behavior still pass.

### Task 5: Final Focused Verification

**Files:**
- All files touched above.

- [ ] **Step 1: Run focused mobile tests**

Run:

```bash
npm test -- --runInBand __tests__/supabase-relay-client.test.ts __tests__/relay-client.test.ts __tests__/sync-identity.test.ts __tests__/sync-invite-flow.test.ts __tests__/sync-event-queue.test.ts __tests__/sync-loop.test.ts
```

Expected: all listed tests pass.

- [ ] **Step 2: Review diff**

Run:

```bash
git diff -- docs/superpowers/specs/2026-05-31-supabase-partner-sync-design.md docs/superpowers/plans/2026-05-31-supabase-partner-sync.md supabase apps/mobile/lib/sync apps/mobile/__tests__/supabase-relay-client.test.ts apps/mobile/package.json apps/mobile/package-lock.json
```

Expected: diff is limited to Supabase relay docs, schema, adapter/config, tests, and dependency metadata.
