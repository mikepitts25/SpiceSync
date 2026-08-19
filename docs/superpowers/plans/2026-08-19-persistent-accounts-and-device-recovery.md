# Persistent Accounts and Device Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add recoverable Apple/Google accounts for remote partner users, transactional one-device recovery after reinstall, safe key rotation, and compliant account deletion without uploading plaintext votes or private keys.

**Architecture:** A single Supabase client owns session persistence and is shared by a focused account service and the existing relay adapter. Native Apple/Google provider adapters either link the current anonymous user or sign into an existing permanent user; a Postgres device registry and versioned append RPC recover couple membership by `auth.uid()` while rejecting ciphertext addressed to a replaced key. Account/deletion UI remains separate from local profiles, and remote vote sync stays paused until a recovered account has an explicitly confirmed local profile.

**Tech Stack:** Expo SDK 54, React Native 0.81, Expo Router 6, TypeScript 5.9, Jest 29, Zustand 4, `@supabase/supabase-js` 2.106+, Expo SecureStore, Expo Apple Authentication, React Native Google Sign-In, Supabase Postgres/RLS/RPC, Supabase Edge Functions with Deno 2.

**Spec:** `docs/superpowers/specs/2026-08-19-persistent-accounts-and-device-recovery-design.md`

## Global Constraints

- Solo use remains account-free; only new remote partner creation/acceptance requires a permanent account.
- Phase one restores account and couple membership, not profiles, votes, preferences, achievements, custom content, or old-key ciphertext.
- Apple is available only on iOS; Google is available on iOS and Android; no email, OTP, phone, or password auth is added.
- One active device is allowed per Supabase user.
- Existing anonymous couples continue syncing and can upgrade in place without changing `auth.users.id`.
- No private signing/encryption key or plaintext vote may leave the device.
- Never authorize from `user_metadata`; use `auth.uid()` and the validated `is_anonymous` JWT claim.
- Every exposed table has RLS; every security-definer function uses a fixed empty `search_path`, fully qualified names, explicit auth checks, revoked `PUBLIC`/`anon` execution, and a narrow `authenticated` grant.
- Preserve all pre-existing uncommitted work. Before editing an already-modified file, inspect `git diff -- <path>`; never reset or replace the user's changes.
- Stage only task-owned files/hunks. If a task overlaps a pre-existing dirty file and safe partial staging is impractical, leave that task uncommitted and report it rather than absorbing unrelated work.
- Generate migrations with `supabase migration new <name>` during execution; do not hand-invent migration timestamps.

---

### Task 1: Shared Supabase Client and Migrating Secure Session Storage

**Files:**
- Create: `apps/mobile/lib/auth/secureSessionStorage.ts`
- Create: `apps/mobile/lib/auth/supabase.ts`
- Create: `apps/mobile/__tests__/auth-secure-session-storage.test.ts`
- Modify: `apps/mobile/lib/sync/supabaseClient.ts`
- Modify: `apps/mobile/lib/sync/relayConfig.ts`
- Modify: `apps/mobile/jest.config.js`

**Interfaces:**
- Produces: `secureSessionStorage` implementing async `getItem`, `setItem`, and `removeItem`.
- Produces: `getSupabaseClient(): SupabaseClient` and `_resetSupabaseClientForTests()`.
- Preserves: `getConfiguredSupabaseRelayClient(): SupabaseRelayClient`, now wrapping the shared client.

- [ ] **Step 1: Write failing chunking and legacy-session migration tests**

```ts
import { createSecureSessionStorage } from '../lib/auth/secureSessionStorage';

it('chunks values and reconstructs them from SecureStore', async () => {
  const secure = memorySecureStore();
  const legacy = memoryAsyncStorage();
  const storage = createSecureSessionStorage({ secure, legacy, chunkSize: 8 });
  await storage.setItem('sb-session', 'abcdefghijklmnopqrstuvwxyz');
  await expect(storage.getItem('sb-session')).resolves.toBe('abcdefghijklmnopqrstuvwxyz');
  expect([...secure.values.keys()].filter((key) => key.includes('.chunk.'))).toHaveLength(4);
});

it('moves an existing AsyncStorage session into SecureStore on first read', async () => {
  const secure = memorySecureStore();
  const legacy = memoryAsyncStorage({ 'sb-session': 'legacy-token' });
  const storage = createSecureSessionStorage({ secure, legacy, chunkSize: 8 });
  await expect(storage.getItem('sb-session')).resolves.toBe('legacy-token');
  await expect(legacy.getItem('sb-session')).resolves.toBeNull();
  await expect(storage.getItem('sb-session')).resolves.toBe('legacy-token');
});
```

- [ ] **Step 2: Run the focused test and verify the missing module failure**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/auth-secure-session-storage.test.ts`

Expected: FAIL because `lib/auth/secureSessionStorage.ts` does not exist.

- [ ] **Step 3: Implement chunked SecureStore persistence with AsyncStorage migration**

```ts
const MANIFEST_SUFFIX = '.manifest';
const CHUNK_SUFFIX = '.chunk.';

export function createSecureSessionStorage({ secure, legacy, chunkSize = 1800 }: Deps) {
  return {
    async getItem(key: string): Promise<string | null> {
      const manifest = await secure.getItemAsync(key + MANIFEST_SUFFIX);
      if (manifest) {
        const count = Number(manifest);
        const chunks = await Promise.all(
          Array.from({ length: count }, (_, index) =>
            secure.getItemAsync(`${key}${CHUNK_SUFFIX}${index}`)
          )
        );
        return chunks.every((value): value is string => value !== null)
          ? chunks.join('')
          : null;
      }
      const legacyValue = await legacy.getItem(key);
      if (legacyValue === null) return null;
      await this.setItem(key, legacyValue);
      await legacy.removeItem(key);
      return legacyValue;
    },
    async setItem(key: string, value: string): Promise<void> {
      await this.removeItem(key);
      const chunks = value.match(new RegExp(`.{1,${chunkSize}}`, 'gs')) ?? [''];
      await Promise.all(
        chunks.map((chunk, index) =>
          secure.setItemAsync(`${key}${CHUNK_SUFFIX}${index}`, chunk)
        )
      );
      await secure.setItemAsync(key + MANIFEST_SUFFIX, String(chunks.length));
    },
    async removeItem(key: string): Promise<void> {
      const count = Number((await secure.getItemAsync(key + MANIFEST_SUFFIX)) ?? 0);
      await Promise.all([
        ...Array.from({ length: count }, (_, index) =>
          secure.deleteItemAsync(`${key}${CHUNK_SUFFIX}${index}`)
        ),
        secure.deleteItemAsync(key + MANIFEST_SUFFIX),
        legacy.removeItem(key),
      ]);
    },
  };
}
```

Create the shared client with `storage: secureSessionStorage`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`, and Supabase's `processLock`. Register exactly one native `AppState` listener: call `auth.startAutoRefresh()` while active and `auth.stopAutoRefresh()` otherwise. Change `sync/supabaseClient.ts` to call `getSupabaseClient()` rather than `createClient()` so auth and relay never construct competing GoTrue clients.

- [ ] **Step 4: Run storage, relay-config, and Supabase-client tests**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/auth-secure-session-storage.test.ts __tests__/relay-config.test.ts __tests__/supabase-relay-client.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the isolated auth-client foundation**

```bash
git add apps/mobile/lib/auth/secureSessionStorage.ts apps/mobile/lib/auth/supabase.ts apps/mobile/__tests__/auth-secure-session-storage.test.ts apps/mobile/lib/sync/supabaseClient.ts apps/mobile/lib/sync/relayConfig.ts apps/mobile/jest.config.js
git commit -m "refactor: share secure Supabase auth client"
```

---

### Task 2: Account Domain Service and Explicit Session Ownership

**Files:**
- Create: `apps/mobile/lib/auth/types.ts`
- Create: `apps/mobile/lib/auth/accountService.ts`
- Create: `apps/mobile/lib/auth/accountStore.ts`
- Create: `apps/mobile/lib/auth/index.ts`
- Create: `apps/mobile/__tests__/account-service.test.ts`
- Modify: `apps/mobile/lib/sync/supabaseRelayClient.ts`
- Modify: `apps/mobile/lib/purchases/storeKitAccountToken.ts`
- Modify: `apps/mobile/__tests__/supabase-relay-client.test.ts`
- Modify: `apps/mobile/__tests__/store-kit-account-token.test.ts`

**Interfaces:**
- Produces: `ProviderCredential`, `AccountSnapshot`, `AccountStatus`, and `AccountServiceLike`.
- Produces: `getAccountService()`, `useAccountStore`, and `bootstrapAccountState()`.
- Consumes: `getSupabaseClient()` from Task 1.

- [ ] **Step 1: Write account classification, upgrade, collision, and sign-in tests**

```ts
it('classifies a provider-backed user as permanent', async () => {
  client.auth.getUser.mockResolvedValue({
    data: { user: { id: 'user-1', is_anonymous: false, identities: [{ provider: 'google' }] } },
    error: null,
  });
  await expect(service.getSnapshot()).resolves.toMatchObject({
    status: 'permanent', userId: 'user-1', providers: ['google'],
  });
});

it('links the provider without changing the anonymous user id', async () => {
  client.auth.getUser
    .mockResolvedValueOnce({ data: { user: anonymousUser('user-1') }, error: null })
    .mockResolvedValueOnce({ data: { user: permanentUser('user-1', 'apple') }, error: null });
  await expect(service.linkProvider({ provider: 'apple', token: 'id-token', nonce: 'raw' }))
    .resolves.toMatchObject({ status: 'permanent', userId: 'user-1' });
});

it('maps an identity-already-exists response to ACCOUNT_EXISTS', async () => {
  client.auth.linkIdentity.mockResolvedValue({
    data: null, error: { code: 'identity_already_exists', message: 'linked' },
  });
  await expect(service.linkProvider(googleCredential())).rejects.toMatchObject({
    code: 'ACCOUNT_EXISTS',
  });
});
```

- [ ] **Step 2: Run the focused service test**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/account-service.test.ts`

Expected: FAIL because the account service does not exist.

- [ ] **Step 3: Implement explicit account operations**

```ts
export type ProviderCredential = {
  provider: 'apple' | 'google';
  token: string;
  nonce?: string;
  accessToken?: string;
  authorizationCode?: string;
};

export type AccountSnapshot = {
  status: 'local-only' | 'anonymous' | 'permanent' | 'recovering' | 'error';
  userId: string | null;
  providers: Array<'apple' | 'google'>;
  error: { code: string; message: string } | null;
};

export interface AccountServiceLike {
  getSnapshot(): Promise<AccountSnapshot>;
  ensureAnonymousUser(): Promise<string>;
  requirePermanentUser(): Promise<string>;
  linkProvider(input: ProviderCredential): Promise<AccountSnapshot>;
  signIn(input: ProviderCredential): Promise<AccountSnapshot>;
  signOut(): Promise<void>;
}
```

Implement `linkProvider()` with the native-token overload `auth.linkIdentity({ provider, token, access_token, nonce })`, `signIn()` with `auth.signInWithIdToken({ provider, token, access_token, nonce })`, and a post-operation `auth.getUser()` check. Map `input.accessToken ?? input.authorizationCode` to Supabase's `access_token` field at this boundary; Apple supplies its authorization code there, while Google supplies the native access token. `requirePermanentUser()` throws `ACCOUNT_REQUIRED` unless `is_anonymous === false` and at least one Apple/Google identity is present. Keep `ensureAnonymousUser()` for grandfathered sync and StoreKit token creation.

Remove auth methods from `SupabaseRelayClientLike`; inject `ensureSession: () => Promise<string>` into `SupabaseRelayClient` and call it before RPCs. Update StoreKit account-token lookup to use `getAccountService().ensureAnonymousUser()` so it no longer reaches through the relay.

- [ ] **Step 4: Run account, relay, and purchase regression tests**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/account-service.test.ts __tests__/supabase-relay-client.test.ts __tests__/store-kit-account-token.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the account domain**

```bash
git add apps/mobile/lib/auth apps/mobile/lib/sync/supabaseRelayClient.ts apps/mobile/lib/purchases/storeKitAccountToken.ts apps/mobile/__tests__/account-service.test.ts apps/mobile/__tests__/supabase-relay-client.test.ts apps/mobile/__tests__/store-kit-account-token.test.ts
git commit -m "feat: add explicit account service"
```

---

### Task 3: Native Apple and Google Provider Adapters

**Files:**
- Create: `apps/mobile/lib/auth/authConfig.ts`
- Create: `apps/mobile/lib/auth/nonce.ts`
- Create: `apps/mobile/lib/auth/providers/apple.ios.ts`
- Create: `apps/mobile/lib/auth/providers/apple.ts`
- Create: `apps/mobile/lib/auth/providers/google.ts`
- Create: `apps/mobile/lib/auth/providers/index.ts`
- Create: `apps/mobile/__tests__/auth-providers.test.ts`
- Create: `apps/mobile/__mocks__/expo-apple-authentication.js`
- Create: `apps/mobile/__mocks__/@react-native-google-signin-google-signin.js`
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/package-lock.json`
- Modify: `apps/mobile/app.json`
- Modify: `apps/mobile/jest.config.js`
- Modify: `apps/mobile/__tests__/release-config.test.ts`

**Interfaces:**
- Produces: `getAppleCredential(): Promise<ProviderCredential>` on iOS.
- Produces: `getGoogleCredential(): Promise<ProviderCredential>` on iOS/Android.
- Produces: `isAppleAvailable()` and `isGoogleConfigured()`.

- [ ] **Step 1: Install SDK-compatible native provider packages**

Run: `cd apps/mobile && npx expo install expo-apple-authentication @react-native-google-signin/google-signin`

Expected: `package.json` and `package-lock.json` contain pinned versions compatible with Expo SDK 54.

- [ ] **Step 2: Write provider and native configuration tests**

```ts
it('returns the raw nonce alongside the Apple identity token', async () => {
  mockAppleCredential({ identityToken: 'apple-token', authorizationCode: 'apple-code' });
  await expect(getAppleCredential()).resolves.toMatchObject({
    provider: 'apple', token: 'apple-token', nonce: expect.any(String),
    authorizationCode: 'apple-code',
  });
});

it('maps Google cancellation without treating it as an auth failure', async () => {
  mockGoogleCancelled();
  await expect(getGoogleCredential()).rejects.toMatchObject({ code: 'CANCELLED' });
});
```

Also extend `release-config.test.ts` to assert `ios.usesAppleSignIn === true`, the `expo-apple-authentication` plugin exists, and the Google plugin exists.

- [ ] **Step 3: Run provider tests and verify failure**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/auth-providers.test.ts __tests__/release-config.test.ts`

Expected: FAIL because the provider adapters and config entries do not exist.

- [ ] **Step 4: Implement provider adapters and configuration validation**

```ts
export async function getAppleCredential(): Promise<ProviderCredential> {
  const rawNonce = createNonce();
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: sha256Hex(rawNonce),
  });
  if (!credential.identityToken) throw new AuthFlowError('MISSING_TOKEN');
  return {
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
    authorizationCode: credential.authorizationCode ?? undefined,
  };
}

export async function getGoogleCredential(): Promise<ProviderCredential> {
  GoogleSignin.configure({
    webClientId: readAuthConfig().googleWebClientId,
    iosClientId: readAuthConfig().googleIosClientId ?? undefined,
    offlineAccess: false,
  });
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (response.type === 'cancelled') throw new AuthFlowError('CANCELLED');
  if (!response.data.idToken) throw new AuthFlowError('MISSING_TOKEN');
  const tokens = await GoogleSignin.getTokens();
  return {
    provider: 'google',
    token: response.data.idToken,
    accessToken: tokens.accessToken,
  };
}
```

Pass the SHA-256 hexadecimal nonce to Apple's native request and retain the raw nonce for Supabase. Cover this contract with a test that captures the `signInAsync()` arguments.

Add `ios.usesAppleSignIn`, both config plugins, and public Google client-ID reads from `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`. Never add actual credential values to `app.json`.

- [ ] **Step 5: Run provider tests, typecheck, and commit**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/auth-providers.test.ts __tests__/release-config.test.ts && npx tsc --noEmit`

Expected: PASS.

```bash
git add apps/mobile/package.json apps/mobile/package-lock.json apps/mobile/app.json apps/mobile/jest.config.js apps/mobile/lib/auth apps/mobile/__mocks__ apps/mobile/__tests__/auth-providers.test.ts apps/mobile/__tests__/release-config.test.ts
git commit -m "feat: add Apple and Google account providers"
```

---

### Task 4: Partner Account Gate and Anonymous Upgrade UX

**Files:**
- Create: `apps/mobile/components/auth/AccountProviderButtons.tsx`
- Create: `apps/mobile/components/auth/PartnerAccountGate.tsx`
- Create: `apps/mobile/__tests__/partner-account-gate.test.tsx`
- Modify: `apps/mobile/app/(onboarding)/partner-connect.tsx`
- Modify: `apps/mobile/app/(settings)/partner-sync.tsx`
- Modify: `apps/mobile/lib/i18n/en.ts`
- Modify: `apps/mobile/lib/i18n/es.ts`
- Modify: `apps/mobile/lib/i18n/uiLiteral.ts`
- Modify: `apps/mobile/__tests__/partner-connect-recovery.test.ts`

**Interfaces:**
- Produces: `PartnerAccountGate({ intent, onComplete, onCancel })`.
- Consumes: provider adapters from Task 3 and `AccountServiceLike` from Task 2.
- Guarantees: create/accept callbacks execute only after `requirePermanentUser()` succeeds.

- [ ] **Step 1: Write UI tests for platform buttons, cancellation, and deferred partner actions**

```tsx
it('does not create an invite until provider linking completes', async () => {
  const createInvite = jest.fn();
  const screen = render(<PartnerAccountGate intent="protect" onComplete={createInvite} onCancel={jest.fn()} />);
  fireEvent.press(screen.getByText('Continue with Google'));
  expect(createInvite).not.toHaveBeenCalled();
  resolveGoogleLink(permanentAccount('user-1'));
  await waitFor(() => expect(createInvite).toHaveBeenCalledTimes(1));
});

it('treats provider cancellation as a return to partner setup', async () => {
  const onCancel = jest.fn();
  const screen = render(<PartnerAccountGate intent="protect" onComplete={jest.fn()} onCancel={onCancel} />);
  fireEvent.press(screen.getByText('Not now'));
  expect(onCancel).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the gate tests and verify failure**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/partner-account-gate.test.tsx __tests__/partner-connect-recovery.test.ts`

Expected: FAIL because the gate is absent.

- [ ] **Step 3: Implement the reusable gate and defer both remote actions**

```ts
const runAfterPermanentAccount = async (action: () => Promise<void>) => {
  try {
    await getAccountService().requirePermanentUser();
    await action();
  } catch (error) {
    if (isAccountRequired(error)) {
      setDeferredRemoteAction(() => action);
      setAccountGateVisible(true);
      return;
    }
    throw error;
  }
};
```

Wrap both `handleCreateRemoteInvite` and `handleAcceptRemote` with this helper. The gate links a provider for an anonymous user; `ACCOUNT_EXISTS` switches copy to **Sign into existing account** and calls `accountService.signIn()` only after explicit confirmation using a freshly obtained provider credential. Add a non-blocking **Protect your connection** card to the existing partner-sync settings screen for grandfathered anonymous couples. After that card links successfully, call `recoverPermanentAccount({ requireProfileConfirmation: false })` with the existing local keys so the current device is registered without pausing its already-associated profile.

- [ ] **Step 4: Run account-gate and existing partner-connect tests**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/partner-account-gate.test.tsx __tests__/partner-connect-recovery.test.ts __tests__/sync-invite-flow.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the protection gate without staging unrelated partner-connect changes**

Inspect: `git diff -- apps/mobile/app/'(onboarding)'/partner-connect.tsx`

Stage the task-owned hunks and new files, then commit:

```bash
git commit -m "feat: protect remote partner connections"
```

---

### Task 5: Device Registry, Permanent Invite Enforcement, and Versioned Append Migration

**Files:**
- Create: the timestamped migration path printed by `supabase migration new persistent_accounts_device_recovery`
- Create: `supabase/tests/database/persistent_accounts_device_recovery.test.sql`
- Create if absent via `supabase init`: `supabase/config.toml`

**Interfaces:**
- Produces RPC: `spicesync_register_or_recover_device(text,text,text) -> jsonb`.
- Produces RPC: `spicesync_revoke_device(text) -> void`.
- Produces RPC: `spicesync_append_event_v2(text,text,text,text,integer,text,text,text) -> jsonb`.
- Extends couple JSON with `memberAKeyVersion`, `memberBKeyVersion`.
- Extends event JSON with `recipientDeviceId`.

- [ ] **Step 1: Initialize local Supabase test configuration and generate the migration**

Run:

```bash
test -f supabase/config.toml || supabase init
supabase migration new persistent_accounts_device_recovery
```

Expected: the CLI prints the exact generated migration path under `supabase/migrations/`.

- [ ] **Step 2: Write failing pgTAP authorization and rotation tests**

```sql
begin;
select plan(9);

select tests.create_supabase_user('anonymous-user', is_anonymous := true);
select tests.create_supabase_user('permanent-a', is_anonymous := false);
select tests.create_supabase_user('permanent-b', is_anonymous := false);

select tests.authenticate_as('anonymous-user');
select throws_ok(
  $$ select public.spicesync_register_or_recover_device('dev_x','enc_x','sign_x') $$,
  '28000', 'Permanent account required'
);

select tests.authenticate_as('permanent-a');
select lives_ok(
  $$ select public.spicesync_register_or_recover_device('dev_a2','enc_a2','sign_a2') $$,
  'owner can replace their device'
);
select is((select count(*) from public.spicesync_devices where user_id = tests.get_supabase_uid('permanent-a') and status = 'active'), 1::bigint);

select is(
  (select status from public.spicesync_devices where device_id = 'dev_a1'),
  'revoked',
  'the replaced device is revoked'
);

select is(
  (select member_a_key_version from public.spicesync_couples where couple_id = 'cpl_test'),
  2,
  'the recovering member key version increments'
);

select tests.authenticate_as('permanent-b');
select throws_ok(
  $$ select public.spicesync_append_event_v2('cpl_test','evt_stale','dev_b','dev_a1',1,'cipher','hash','sig') $$,
  'P0001', 'RECIPIENT_KEY_CHANGED'
);

select tests.authenticate_as('permanent-a');
select throws_ok(
  $$ select public.spicesync_append_event('cpl_test','evt_legacy','dev_a2',1,'cipher','hash','sig') $$,
  'P0001', 'CLIENT_UPGRADE_REQUIRED'
);

select lives_ok(
  $$ select public.spicesync_revoke_device('dev_a2') $$,
  'the owner can explicitly revoke the current device'
);

select is(
  (select count(*) from public.spicesync_devices where user_id = tests.get_supabase_uid('permanent-a') and status = 'active'),
  0::bigint,
  'explicit revocation leaves no active device'
);

select * from finish();
rollback;
```

The test file must create deterministic UUID-backed `auth.users` rows, an initial `dev_a1`/`dev_b` device pair, and `cpl_test` before these assertions. Define `tests.create_supabase_user`, `tests.authenticate_as`, and `tests.get_supabase_uid` in the file; `tests.authenticate_as` sets `request.jwt.claims` with `sub`, `role: authenticated`, and the requested `is_anonymous` boolean. Keep the entire fixture and assertions inside the transaction so `rollback` removes them.

- [ ] **Step 3: Run the database test and verify missing objects**

Run: `supabase start && supabase test db supabase/tests/database/persistent_accounts_device_recovery.test.sql`

Expected: FAIL because the table and RPCs do not exist.

- [ ] **Step 4: Implement the migration transaction and security boundaries**

The migration must include these exact schema changes:

```sql
create table public.spicesync_devices (
  device_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  signing_public_key text not null,
  encryption_public_key text not null,
  status text not null check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index spicesync_devices_one_active_per_user
  on public.spicesync_devices(user_id) where status = 'active';
alter table public.spicesync_devices enable row level security;

alter table public.spicesync_couples
  add column member_a_key_version integer not null default 1 check (member_a_key_version > 0),
  add column member_b_key_version integer not null default 1 check (member_b_key_version > 0);
alter table public.spicesync_events add column recipient_device_id text;
```

`spicesync_register_or_recover_device` must first lock the caller's `auth.users` row, which serializes concurrent first registrations as well as replacements. It then locks the caller's active device and couple rows, revokes the old device only when its ID or keys differ, inserts/upserts the new device, updates only the caller's member side, increments that side's key version only for an actual key/device replacement, and returns the maximum existing sequence for that couple as `recoveryCursor`. A permanent user with no couple receives `couple: null` and cursor `0` rather than an error. `spicesync_revoke_device` must accept only the caller's active device ID, lock it, mark it revoked, and be idempotent when it is already revoked. `spicesync_append_event_v2` must lock the couple row, validate the author's active registered device, reject a stale opposite-member device ID with `RECIPIENT_KEY_CHANGED` before payload-hash validation, then verify the hash and insert `recipient_device_id`. Replace create/accept invite functions with versions that reject `coalesce((auth.jwt()->>'is_anonymous')::boolean, true)` and register/upsert the caller's current device from their existing device/key parameters in the same transaction.

Keep the legacy append signature but reject it when either key version is greater than `1` with `raise exception 'CLIENT_UPGRADE_REQUIRED' using errcode = 'P0001'`.

Update every couple-returning RPC (`spicesync_create_invite`, `spicesync_accept_invite`, `spicesync_get_couple`, and recovery) to emit both key-version fields. Update append-v2 and `spicesync_pull_events` to emit `recipientDeviceId`; legacy rows emit JSON null. Revoke table privileges from `PUBLIC`, `anon`, and `authenticated`, expose device operations only through the RPCs, and apply the global fixed-search-path/function-grant rules to every replaced function.

- [ ] **Step 5: Verify the migration and commit**

Run:

```bash
supabase db reset
supabase test db supabase/tests/database/persistent_accounts_device_recovery.test.sql
supabase migration list --local
```

Expected: all pgTAP assertions pass and the new migration is applied locally.

```bash
git add supabase/config.toml supabase/migrations supabase/tests/database/persistent_accounts_device_recovery.test.sql
git commit -m "feat: add recoverable account device registry"
```

---

### Task 6: Relay Types and Durable Couple Recovery Client

**Files:**
- Modify: `apps/mobile/lib/sync/relayTypes.ts`
- Modify: `apps/mobile/lib/sync/relayClient.ts`
- Modify: `apps/mobile/lib/sync/supabaseRelayClient.ts`
- Modify: `apps/mobile/lib/sync/coupleLink.ts`
- Modify: `apps/mobile/lib/sync/inviteFlow.ts`
- Modify: `apps/mobile/test-support/relayTestClient.ts`
- Create: `apps/mobile/__tests__/durable-account-recovery.test.ts`
- Modify: `apps/mobile/__tests__/supabase-relay-client.test.ts`
- Modify: `apps/mobile/__tests__/sync-invite-flow.test.ts`

**Interfaces:**
- Produces: `DeviceRecoveryResponse`, `recoverDevice(body)`, `revokeDevice(deviceId)`, and `recoverPermanentAccount()`.
- Extends: `AppendEventRequest.recipientDeviceId` and `SyncEventResponse.recipientDeviceId`.
- Extends: `CoupleLink` with key versions, `requiresProfileConfirmation`, and `securityNotice`.

- [ ] **Step 1: Write failing RPC mapping and reinstall recovery tests**

```ts
it('registers the replacement keys and maps the recovery cursor', async () => {
  supabase.rpc.mockResolvedValue({ data: recoveryResponse({ recoveryCursor: 42 }), error: null });
  await expect(client.recoverDevice({
    deviceId: 'dev_new', encryptionPublicKey: 'enc_new', signingPublicKey: 'sign_new',
  })).resolves.toMatchObject({ couple: { coupleId: 'cpl_1' }, recoveryCursor: 42 });
  expect(supabase.rpc).toHaveBeenCalledWith('spicesync_register_or_recover_device', {
    p_device_id: 'dev_new', p_encryption_public_key: 'enc_new', p_signing_public_key: 'sign_new',
  });
});

it('rebuilds a couple link from auth uid without reading the old device id', async () => {
  account.requirePermanentUser.mockResolvedValue('user-a');
  relay.recoverDevice.mockResolvedValue(recoveryResponse({ recoveryCursor: 42 }));
  await recoverPermanentAccount({ requireProfileConfirmation: false });
  expect(useCoupleLinkStore.getState().link).toMatchObject({
    coupleId: 'cpl_1', myDeviceId: 'dev_new', lastPulledServerSequence: 42,
  });
});
```

- [ ] **Step 2: Run focused relay/recovery tests**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/durable-account-recovery.test.ts __tests__/supabase-relay-client.test.ts`

Expected: FAIL because the recovery interfaces are absent.

- [ ] **Step 3: Implement typed recovery and couple-link reconstruction**

```ts
export type DeviceRecoveryResponse = {
  couple: CoupleResponse | null;
  recoveryCursor: number;
  myDeviceId: string;
  myKeyVersion: number;
  partnerKeyVersion: number | null;
};

export type AppendEventRequest = {
  eventId: string;
  authorDeviceId: string;
  recipientDeviceId: string;
  clientSequence: number;
  encryptedPayload: string;
  payloadHash: string;
  signature: string;
};
```

Implement `recoverPermanentAccount()` as: require permanent auth, call `getOrCreateIdentity()`, call `relay.recoverDevice()`, and, when `response.couple` exists, write a link whose cursor equals `recoveryCursor`. Return `{ kind: 'no-couple' }` without creating a link when it is null. Keep the current device-ID repair path under a distinct name for grandfathered anonymous startup recovery.

- [ ] **Step 4: Run relay, invite, identity, and recovery tests**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/durable-account-recovery.test.ts __tests__/supabase-relay-client.test.ts __tests__/sync-invite-flow.test.ts __tests__/sync-identity.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit task-owned recovery changes**

Review each pre-existing diff first, stage only the recovery hunks, and commit:

```bash
git commit -m "feat: recover couples through permanent accounts"
```

---

### Task 7: Key Refresh, Recipient Binding, and Safe Re-encryption

**Files:**
- Modify: `apps/mobile/lib/sync/syncLoop.ts`
- Modify: `apps/mobile/lib/sync/coupleLink.ts`
- Modify: `apps/mobile/lib/sync/relayTypes.ts`
- Modify: `apps/mobile/lib/sync/eventQueue.ts`
- Modify: `apps/mobile/__tests__/sync-loop.test.ts`
- Create: `apps/mobile/__tests__/partner-key-refresh.test.ts`

**Interfaces:**
- Produces: `refreshCoupleMetadata(): Promise<'unchanged' | 'partner-key-changed'>`.
- Changes signature input to include recipient device for v2 events.
- Handles relay code `RECIPIENT_KEY_CHANGED` by refreshing and re-encrypting queued plaintext once.

- [ ] **Step 1: Write stale-recipient and security-notice tests**

```ts
it('re-encrypts queued plaintext after a recipient-key conflict', async () => {
  relay.appendEvent
    .mockRejectedValueOnce(new RelayHttpError(409, 'RECIPIENT_KEY_CHANGED', 'changed'))
    .mockResolvedValueOnce(syncEvent({ recipientDeviceId: 'dev_partner_new' }));
  relay.getCouple.mockResolvedValue(couple({
    memberBDeviceId: 'dev_partner_new', memberBPublicKey: partnerNewPublicKey,
    memberBKeyVersion: 2,
  }));
  await flushPending();
  expect(relay.appendEvent).toHaveBeenCalledTimes(2);
  expect(relay.appendEvent.mock.calls[1][1].recipientDeviceId).toBe('dev_partner_new');
  expect(relay.appendEvent.mock.calls[1][1].encryptedPayload)
    .not.toBe(relay.appendEvent.mock.calls[0][1].encryptedPayload);
});

it('records a persistent notice when the partner key version changes', async () => {
  await refreshCoupleMetadata();
  expect(useCoupleLinkStore.getState().securityNotice).toMatchObject({
    kind: 'partner-device-restored', acknowledged: false,
  });
});
```

- [ ] **Step 2: Run sync tests and verify failure**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/sync-loop.test.ts __tests__/partner-key-refresh.test.ts`

Expected: FAIL because append requests have no recipient binding or refresh path.

- [ ] **Step 3: Bind signatures and ciphertext to the current recipient**

```ts
function signaturePayload(
  eventId: string,
  clientSequence: number,
  payloadHash: string,
  recipientDeviceId?: string
): string {
  return recipientDeviceId
    ? `${eventId}:${clientSequence}:${payloadHash}:${recipientDeviceId}`
    : `${eventId}:${clientSequence}:${payloadHash}`;
}
```

Refresh couple metadata on foreground and before the first queued upload. On `RECIPIENT_KEY_CHANGED`, fetch once, update the stored partner device/keys/version, re-encrypt the unchanged queued plaintext, re-sign with the new recipient device ID, and retry once. Do not persist ciphertext in the queue and do not recursively retry.

For incoming v2 events, require `event.recipientDeviceId === myDeviceId` and verify the v2 signature payload. Preserve v1 verification only for events whose `recipientDeviceId` is null.

- [ ] **Step 4: Run all sync tests**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/sync-loop.test.ts __tests__/sync-event-queue.test.ts __tests__/partner-key-refresh.test.ts __tests__/vote-sync.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the safe key-rotation sync path**

```bash
git add apps/mobile/lib/sync apps/mobile/__tests__/sync-loop.test.ts apps/mobile/__tests__/sync-event-queue.test.ts apps/mobile/__tests__/partner-key-refresh.test.ts apps/mobile/__tests__/vote-sync.test.ts
git commit -m "feat: rotate partner encryption keys safely"
```

---

### Task 8: Welcome Restoration and Explicit Profile Association

**Files:**
- Create: `apps/mobile/app/(auth)/_layout.tsx`
- Create: `apps/mobile/app/(auth)/restore.tsx`
- Create: `apps/mobile/app/(auth)/confirm-profile.tsx`
- Create: `apps/mobile/lib/auth/recoveryRouting.ts`
- Create: `apps/mobile/__tests__/account-recovery-routing.test.ts`
- Modify: `apps/mobile/app/welcome/WelcomeFlow.tsx`
- Modify: `apps/mobile/app/_layout.tsx`
- Modify: `apps/mobile/lib/sync/coupleLink.ts`
- Modify: `apps/mobile/lib/sync/voteSync.ts`
- Modify: `apps/mobile/lib/welcome/routing.ts`
- Modify: `apps/mobile/__tests__/welcome-routing.test.ts`
- Modify: `apps/mobile/__tests__/router-files.test.ts`

**Interfaces:**
- Produces routes: `/(auth)/restore` and `/(auth)/confirm-profile`.
- Produces: `getRecoveryDestination({ profileCount, requiresConfirmation })`.
- Changes: `startVoteSync(profileId): Promise<boolean>` returns `false` without enqueueing or starting the loop while the stored couple link requires profile confirmation.

- [ ] **Step 1: Write routing and sync-pause tests**

```ts
it('routes a recovered account with no profile to profile creation', () => {
  expect(getRecoveryDestination({ profileCount: 0, requiresConfirmation: true }))
    .toEqual({ pathname: '/(settings)/profiles/new', params: { from: 'account-recovery' } });
});

it('routes populated devices to explicit profile confirmation', () => {
  expect(getRecoveryDestination({ profileCount: 2, requiresConfirmation: true }))
    .toBe('/(auth)/confirm-profile');
});

it('does not enqueue or start vote sync before profile confirmation', async () => {
  useCoupleLinkStore.setState({
    link: coupleLink({ requiresProfileConfirmation: true }),
  });
  await expect(startVoteSync('profile-1')).resolves.toBe(false);
  expect(useEventQueueStore.getState().pending).toHaveLength(0);
});
```

- [ ] **Step 2: Run routing and vote-sync tests**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/account-recovery-routing.test.ts __tests__/welcome-routing.test.ts __tests__/vote-sync.test.ts __tests__/router-files.test.ts`

Expected: FAIL because recovery routes and the pause guard do not exist.

- [ ] **Step 3: Implement restore and profile-confirmation screens**

Add a secondary **Restore existing account** action to the welcome brand screen. The restore route offers Apple on iOS and Google on both platforms, calls `accountService.signIn()`, then `recoverPermanentAccount()`. If recovery returns `{ kind: 'no-couple' }`, keep the permanent account session and route to normal partner setup; do not manufacture a couple link.

The profile confirmation screen lists local profiles and uses this explicit completion:

```ts
async function confirmRecoveredProfile(profileId: string): Promise<void> {
  useVoteSyncStore.getState().setLocalProfileId(profileId);
  useCoupleLinkStore.getState().confirmLocalProfile(profileId);
  await startVoteSync(profileId);
  startSyncLoop();
  router.replace('/(tabs)/deck');
}
```

If there are no profiles, route through existing profile creation with `from=account-recovery`, then return to confirmation before starting sync.

- [ ] **Step 4: Run route, welcome, and sync tests**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/account-recovery-routing.test.ts __tests__/welcome-routing.test.ts __tests__/welcome-age-gate-layout.test.tsx __tests__/vote-sync.test.ts __tests__/router-files.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit recovery navigation hunks**

Inspect existing diffs in `_layout.tsx`, `WelcomeFlow.tsx`, `welcome/routing.ts`, and `voteSync.ts`; stage only owned hunks, then commit:

```bash
git commit -m "feat: restore accounts from welcome"
```

---

### Task 9: Account Settings, Linked Providers, Device Removal, and Notices

**Files:**
- Create: `apps/mobile/app/(settings)/account.tsx`
- Create: `apps/mobile/components/auth/AccountStatusCard.tsx`
- Create: `apps/mobile/__tests__/account-settings.test.tsx`
- Modify: `apps/mobile/app/(settings)/_layout.tsx`
- Modify: `apps/mobile/app/(settings)/index.tsx`
- Modify: `apps/mobile/app/(settings)/partner-sync.tsx`
- Modify: `apps/mobile/lib/auth/accountService.ts`
- Modify: `apps/mobile/lib/safety/localDataControls.ts`
- Modify: `apps/mobile/lib/i18n/en.ts`
- Modify: `apps/mobile/lib/i18n/es.ts`
- Modify: `apps/mobile/__tests__/router-files.test.ts`

**Interfaces:**
- Produces settings route `/(settings)/account`.
- Produces: `forgetCurrentDevice(): Promise<void>` in the account service.
- Consumes: linked identities and partner security notice from prior tasks.

- [ ] **Step 1: Write account-settings behavior tests**

```tsx
it('warns an Apple-only account to link Google for Android recovery', () => {
  mockAccount({ status: 'permanent', providers: ['apple'] });
  const screen = render(<AccountSettingsScreen />);
  expect(screen.getByText('Link Google for Android recovery')).toBeTruthy();
});

it('signing out preserves local profiles and device keys', async () => {
  fireEvent.press(screen.getByText('Sign out'));
  confirmAlert();
  await waitFor(() => expect(account.signOut).toHaveBeenCalled());
  expect(resetAppOnDevice).not.toHaveBeenCalled();
  expect(clearIdentity).not.toHaveBeenCalled();
});

it('forgetting this device revokes it before clearing local keys', async () => {
  await account.forgetCurrentDevice();
  expect(relay.revokeDevice.mock.invocationCallOrder[0])
    .toBeLessThan(clearIdentity.mock.invocationCallOrder[0]);
});
```

- [ ] **Step 2: Run settings tests and verify failure**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/account-settings.test.tsx __tests__/router-files.test.ts`

Expected: FAIL because the account screen and route do not exist.

- [ ] **Step 3: Implement account status, provider linking, sign-out, and forget-device actions**

Show account protection status, provider rows, active-device last-seen value, sign out, forget device, and delete account. On iOS allow linking the missing Apple/Google provider. On Android show Google only. Render the partner key-change notice in partner-sync settings until `acknowledgeSecurityNotice()` is called.

`forgetCurrentDevice()` must call the authenticated revoke-device RPC, await success, sign out, clear identity keys, clear couple link/partner event stores, and leave profiles/votes/settings intact.

- [ ] **Step 4: Run account settings, safety, and router tests**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/account-settings.test.tsx __tests__/safety-controls.test.ts __tests__/router-files.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit account management UI**

```bash
git add apps/mobile/app/'(settings)' apps/mobile/components/auth apps/mobile/lib/auth apps/mobile/lib/safety/localDataControls.ts apps/mobile/lib/i18n apps/mobile/__tests__/account-settings.test.tsx apps/mobile/__tests__/router-files.test.ts apps/mobile/__tests__/safety-controls.test.ts
git commit -m "feat: add account and device controls"
```

---

### Task 10: Authenticated Account Deletion and External Request Endpoint

**Files:**
- Create: the timestamped migration path printed by `supabase migration new account_deletion_requests`
- Create: `supabase/functions/spicesync-delete-account/index.ts`
- Create: `supabase/functions/spicesync-delete-account/index_test.ts`
- Create: `supabase/functions/spicesync-account-deletion/index.ts`
- Create: `supabase/functions/spicesync-account-deletion/index_test.ts`
- Create: `supabase/functions/_shared/cors.ts`
- Create: `supabase/functions/_shared/apple.ts`
- Modify: `supabase/config.toml`

**Interfaces:**
- Produces authenticated `POST /spicesync-delete-account`.
- Produces public `GET|POST /spicesync-account-deletion` page/form.
- Requires function secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APPLE_TEAM_ID`, `APPLE_CLIENT_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`.

- [ ] **Step 1: Generate the private deletion-request migration**

Run: `supabase migration new account_deletion_requests`

Add a private-by-default table with no `anon`/`authenticated` grants:

```sql
create table public.spicesync_account_deletion_requests (
  request_id uuid primary key default extensions.gen_random_uuid(),
  provider text not null check (provider in ('apple','google')),
  contact text not null,
  status text not null default 'pending' check (status in ('pending','verified','completed','rejected')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.spicesync_account_deletion_requests enable row level security;
revoke all on public.spicesync_account_deletion_requests from public, anon, authenticated;
```

- [ ] **Step 2: Write Deno tests for auth, cleanup order, Apple revocation, and form safety**

```ts
Deno.test('rejects account deletion without a bearer token', async () => {
  const response = await handleDeleteAccount(new Request(URL, { method: 'POST' }), deps());
  assertEquals(response.status, 401);
});

Deno.test('revokes Apple before deleting the Supabase user', async () => {
  const calls: string[] = [];
  const response = await handleDeleteAccount(authenticatedRequest({ appleAuthorizationCode: 'code' }),
    deps({ revokeApple: async () => calls.push('apple'), deleteUser: async () => calls.push('user') }));
  assertEquals(response.status, 204);
  assertEquals(calls, ['apple', 'user']);
});

Deno.test('logs Apple revocation failure but still deletes the Supabase user', async () => {
  const calls: string[] = [];
  const response = await handleDeleteAccount(authenticatedRequest({ appleAuthorizationCode: 'code' }),
    deps({
      revokeApple: async () => { calls.push('apple'); throw new Error('temporarily unavailable'); },
      deleteUser: async () => calls.push('user'),
    }));
  assertEquals(response.status, 204);
  assertEquals(calls, ['apple', 'user']);
});

Deno.test('escapes submitted deletion-request values', async () => {
  const response = await handleDeletionPage(formRequest({ contact: '<script>alert(1)</script>' }), deps());
  assertEquals(response.status, 202);
  assertEquals((await response.text()).includes('<script>'), false);
});
```

- [ ] **Step 3: Run Edge Function tests and verify missing handlers**

Run: `deno test --allow-env supabase/functions/spicesync-delete-account/index_test.ts supabase/functions/spicesync-account-deletion/index_test.ts`

Expected: FAIL because the functions do not exist.

- [ ] **Step 4: Implement deletion handlers with injected dependencies**

The authenticated function must call `auth.getUser(bearerToken)`, reject anonymous users, require an Apple authorization code whenever Apple is linked, exchange it server-side, and verify the returned Apple subject matches that user's linked Apple identity before attempting revocation. It then revokes the couple/device rows and calls `auth.admin.deleteUser(user.id)`. Apple revocation is attempted first; if Apple's revocation endpoint is temporarily unavailable after the subject check, record a structured server-side error and continue deleting the SpiceSync account. Return `204` only after the Auth user is deleted. Do not expose the service-role key or Apple private key in any response or client bundle.

The public function serves a branded no-store HTML form on GET. POST validates provider and contact length, escapes reflected text, inserts via the server-only client, and returns a request reference plus the expected manual verification process. Add `content-security-policy`, `x-content-type-options: nosniff`, `referrer-policy: no-referrer`, and `cache-control: no-store` headers. Configure only `[functions.spicesync-account-deletion] verify_jwt = false` in `supabase/config.toml`; keep JWT verification enabled for `spicesync-delete-account`, which also validates the bearer token inside the handler.

- [ ] **Step 5: Run function/database tests and commit**

Run:

```bash
deno fmt --check supabase/functions
deno test --allow-env supabase/functions/spicesync-delete-account/index_test.ts supabase/functions/spicesync-account-deletion/index_test.ts
supabase db reset
supabase test db supabase/tests/database/persistent_accounts_device_recovery.test.sql
```

Expected: PASS.

```bash
git add supabase/migrations supabase/functions
git commit -m "feat: add compliant account deletion service"
```

---

### Task 11: Deletion UI, Local Cleanup, and Privacy Disclosures

**Files:**
- Modify: `apps/mobile/app/(settings)/account.tsx`
- Modify: `apps/mobile/lib/auth/accountService.ts`
- Modify: `apps/mobile/lib/safety/localDataControls.ts`
- Modify: `apps/mobile/app/(settings)/privacy-policy.tsx`
- Modify: `apps/mobile/lib/i18n/uiLiteral.ts`
- Create: `apps/mobile/__tests__/account-deletion.test.tsx`
- Modify: `apps/mobile/__tests__/release-privacy-copy.test.ts`
- Modify: `apps/mobile/__tests__/safety-controls.test.ts`

**Interfaces:**
- Produces: `deleteAccount(credential: ProviderCredential): Promise<void>`.
- Consumes: account-deletion Edge Function from Task 10.
- Guarantees: local reset runs only after confirmed server deletion.

- [ ] **Step 1: Write deletion ordering and disclosure tests**

```tsx
it('reauthenticates and clears local state only after server deletion succeeds', async () => {
  provider.getCredential.mockResolvedValue(freshGoogleCredential());
  deleteFunction.mockResolvedValue({ status: 204 });
  fireEvent.press(screen.getByText('Delete account'));
  confirmDestructiveAlert();
  await waitFor(() => expect(resetAppOnDevice).toHaveBeenCalledTimes(1));
  expect(deleteFunction.mock.invocationCallOrder[0])
    .toBeLessThan(resetAppOnDevice.mock.invocationCallOrder[0]);
});

it('keeps local state when server deletion fails', async () => {
  deleteFunction.mockRejectedValue(new Error('offline'));
  await attemptDelete();
  expect(resetAppOnDevice).not.toHaveBeenCalled();
});
```

Extend privacy-copy tests to require `Apple`, `Google`, `account deletion`, `device public keys`, and the statement that reinstall recovery does not restore local history.

- [ ] **Step 2: Run deletion/privacy tests and verify failure**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/account-deletion.test.tsx __tests__/release-privacy-copy.test.ts __tests__/safety-controls.test.ts`

Expected: FAIL because deletion orchestration and disclosures are absent.

- [ ] **Step 3: Implement destructive confirmation and provider-specific reauthentication**

If Apple is linked, obtain a fresh Apple credential containing `authorizationCode` even when Google initiated the current session. Reauthenticate with its ID token and nonce but omit `authorizationCode`/`access_token` from the Supabase call, preserving the one-time code for the Edge Function. Assert that the resulting Supabase user ID equals the account being deleted. For a Google-only account, the fresh native sign-in is the reauthentication step; do not revoke Google locally before the server confirms deletion, because that could strand a still-existing account after a network failure. Invoke the Edge Function with the refreshed bearer token and the untouched Apple authorization code when present. On `204`, call `resetAppOnDevice()` and route to `/welcome`; on any failure, retain local state and show a retryable error.

Update the privacy policy to distinguish provider identifiers/server metadata from local-only intimate data and to state exactly what reinstall recovery restores.

- [ ] **Step 4: Run deletion, privacy, safety, and account tests**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/account-deletion.test.tsx __tests__/release-privacy-copy.test.ts __tests__/safety-controls.test.ts __tests__/account-settings.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit deletion UX and disclosures**

```bash
git add apps/mobile/app/'(settings)'/account.tsx apps/mobile/app/'(settings)'/privacy-policy.tsx apps/mobile/lib/auth/accountService.ts apps/mobile/lib/safety/localDataControls.ts apps/mobile/lib/i18n/uiLiteral.ts apps/mobile/__tests__/account-deletion.test.tsx apps/mobile/__tests__/release-privacy-copy.test.ts apps/mobile/__tests__/safety-controls.test.ts
git commit -m "feat: expose account deletion controls"
```

---

### Task 12: Provider Setup Documentation and Full Verification

**Files:**
- Create: `apps/mobile/.env.example`
- Create: `docs/apple-google-account-setup.md`
- Modify: `apps/mobile/scripts/release-check.js`
- Modify: `apps/mobile/__tests__/release-check-script.test.ts`
- Modify: `README.md`

**Interfaces:**
- Documents exact external configuration needed to activate Apple/Google auth and account deletion.
- Adds release-check failures for missing production provider configuration.

- [ ] **Step 1: Write failing release-check assertions**

```ts
it('requires production social-auth configuration when partner sync is enabled', () => {
  const result = runReleaseCheck({
    EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'publishable',
  });
  expect(result.stderr).toContain('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  expect(result.stderr).toContain('Apple Sign In capability');
});
```

- [ ] **Step 2: Run release-check tests and verify failure**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/release-check-script.test.ts`

Expected: FAIL because provider configuration is not checked.

- [ ] **Step 3: Document and validate external setup**

The setup guide must list:

- Supabase Apple and Google provider enablement;
- Supabase manual identity linking enablement;
- Apple App ID Sign in with Apple capability, Services ID/client ID, team ID, key ID, private key, and function secrets;
- Google web, iOS, and Android OAuth client IDs, Android package `com.spicesync.app`, and release/debug SHA fingerprints;
- EAS production environment variables;
- Supabase function deployment commands;
- Google Play external deletion URL; and
- physical-device reinstall test steps.

`.env.example` contains names only:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
```

- [ ] **Step 4: Run complete automated verification**

Run:

```bash
cd apps/mobile
npm test -- --runInBand
npx tsc --noEmit
npm run lint
npm run release:check
cd ../..
deno fmt --check supabase/functions
deno test --allow-env supabase/functions/spicesync-invite-link/index_test.ts supabase/functions/spicesync-delete-account/index_test.ts supabase/functions/spicesync-account-deletion/index_test.ts
supabase db reset
supabase test db supabase/tests/database/persistent_accounts_device_recovery.test.sql
supabase migration list --local
```

Expected: every command exits `0`; no test is skipped to obtain a green run.

- [ ] **Step 5: Perform configuration-gated physical-device smoke tests**

Use release-signed builds and record results in the implementation handoff:

1. Apple protect/link/cancel/reinstall/restore/delete on physical iPhone.
2. Google protect/link/cancel/reinstall/restore/delete on physical iPhone.
3. Google protect/link/cancel/reinstall/restore/delete on physical Android.
4. Replace one partner device and verify the other partner sees the key-change notice and can send a newly encrypted event.
5. Confirm the old installation receives an authorization failure when it next tries to append.

- [ ] **Step 6: Commit documentation and release checks**

```bash
git add apps/mobile/.env.example docs/apple-google-account-setup.md apps/mobile/scripts/release-check.js apps/mobile/__tests__/release-check-script.test.ts README.md
git commit -m "docs: add persistent account release setup"
```

## Completion Gate

Do not claim completion until all automated commands in Task 12 pass. If Apple/Google console credentials are unavailable, report automated completion separately from the blocked physical-device/provider verification and do not represent native sign-in as production-ready.
