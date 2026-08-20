import { assert, assertEquals } from "jsr:@std/assert@1";

import {
  type DeleteAccountDependencies,
  handleDeleteAccount,
  type VerifiedUser,
} from "./index.ts";

const URL = "https://project.supabase.co/functions/v1/spicesync-delete-account";
const USER_ID = "b58294a7-e4ca-4e8d-8d87-f5d4857c8e47";
const APPLE_SUBJECT = "001234.abcdef.1234";

function user(overrides: Partial<VerifiedUser> = {}): VerifiedUser {
  return {
    id: USER_ID,
    isAnonymous: false,
    identities: [{ provider: "apple", subject: APPLE_SUBJECT }],
    ...overrides,
  };
}

function dependencies(
  overrides: Partial<DeleteAccountDependencies> = {},
): DeleteAccountDependencies {
  return {
    getUser: async () => user(),
    exchangeAppleAuthorizationCode: async () => ({
      idToken: "apple-identity-token",
      tokenToRevoke: "apple-refresh-token",
    }),
    verifyAppleIdentityToken: async () => ({ subject: APPLE_SUBJECT }),
    revokeAppleToken: async () => undefined,
    cleanupUserData: async () => undefined,
    deleteUser: async () => undefined,
    logError: () => undefined,
    ...overrides,
  };
}

function authenticatedRequest(
  body: Record<string, unknown> = { appleAuthorizationCode: "fresh-code" },
): Request {
  return new Request(URL, {
    method: "POST",
    headers: {
      authorization: "Bearer verified-user-token",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function record(calls: string[], value: string): Promise<void> {
  calls.push(value);
}

Deno.test("rejects account deletion without a bearer token", async () => {
  const response = await handleDeleteAccount(
    new Request(URL, { method: "POST" }),
    dependencies(),
  );

  assertEquals(response.status, 401);
});

Deno.test("rejects invalid and anonymous identities", async () => {
  const invalid = await handleDeleteAccount(
    authenticatedRequest(),
    dependencies({ getUser: async () => null }),
  );
  const anonymous = await handleDeleteAccount(
    authenticatedRequest(),
    dependencies({ getUser: async () => user({ isAnonymous: true }) }),
  );

  assertEquals(invalid.status, 401);
  assertEquals(anonymous.status, 403);
});

Deno.test("rejects unsupported methods and malformed JSON", async () => {
  const method = await handleDeleteAccount(
    new Request(URL, { method: "GET" }),
    dependencies(),
  );
  const malformed = await handleDeleteAccount(
    new Request(URL, {
      method: "POST",
      headers: {
        authorization: "Bearer verified-user-token",
        "content-type": "application/json",
      },
      body: "{not json}",
    }),
    dependencies(),
  );

  assertEquals(method.status, 405);
  assertEquals(malformed.status, 400);
});

Deno.test("requires a fresh Apple authorization code when Apple is linked", async () => {
  let cleanupCalled = false;
  const response = await handleDeleteAccount(
    authenticatedRequest({}),
    dependencies({
      cleanupUserData: async () => {
        cleanupCalled = true;
      },
    }),
  );

  assertEquals(response.status, 422);
  assertEquals(cleanupCalled, false);
});

Deno.test("fails closed when a linked Apple identity has no usable subject", async () => {
  let cleanupCalled = false;
  const response = await handleDeleteAccount(
    authenticatedRequest(),
    dependencies({
      getUser: async () =>
        user({ identities: [{ provider: "apple", subject: null }] }),
      cleanupUserData: async () => {
        cleanupCalled = true;
      },
    }),
  );

  assertEquals(response.status, 422);
  assertEquals(cleanupCalled, false);
});

Deno.test("blocks deletion when the cryptographically verified Apple subject differs", async () => {
  const calls: string[] = [];
  const response = await handleDeleteAccount(
    authenticatedRequest(),
    dependencies({
      verifyAppleIdentityToken: async () => ({ subject: "another-apple-user" }),
      revokeAppleToken: () => record(calls, "apple"),
      cleanupUserData: () => record(calls, "cleanup"),
      deleteUser: () => record(calls, "user"),
    }),
  );

  assertEquals(response.status, 403);
  assertEquals(calls, []);
});

Deno.test("revokes Apple before cleaning up and deleting the Supabase user", async () => {
  const calls: string[] = [];
  const response = await handleDeleteAccount(
    authenticatedRequest(),
    dependencies({
      revokeAppleToken: () => record(calls, "apple"),
      cleanupUserData: () => record(calls, "cleanup"),
      deleteUser: () => record(calls, "user"),
    }),
  );

  assertEquals(response.status, 204);
  assertEquals(calls, ["apple", "cleanup", "user"]);
});

Deno.test("logs Apple revocation failure but still deletes the Supabase user", async () => {
  const calls: string[] = [];
  const logs: unknown[] = [];
  const response = await handleDeleteAccount(
    authenticatedRequest(),
    dependencies({
      revokeAppleToken: async () => {
        await record(calls, "apple");
        throw new Error("temporarily unavailable");
      },
      cleanupUserData: () => record(calls, "cleanup"),
      deleteUser: () => record(calls, "user"),
      logError: (event: unknown) => logs.push(event),
    }),
  );

  assertEquals(response.status, 204);
  assertEquals(calls, ["apple", "cleanup", "user"]);
  assertEquals(logs.length, 1);
});

Deno.test("blocks deletion if Apple exchange or verification fails", async () => {
  let cleanupCalled = false;
  const exchangeFailure = await handleDeleteAccount(
    authenticatedRequest(),
    dependencies({
      exchangeAppleAuthorizationCode: async () => {
        throw new Error("invalid_grant");
      },
      cleanupUserData: async () => {
        cleanupCalled = true;
      },
    }),
  );
  const verificationFailure = await handleDeleteAccount(
    authenticatedRequest(),
    dependencies({
      verifyAppleIdentityToken: async () => {
        throw new Error("invalid signature");
      },
      cleanupUserData: async () => {
        cleanupCalled = true;
      },
    }),
  );

  assertEquals(exchangeFailure.status, 422);
  assertEquals(verificationFailure.status, 422);
  assertEquals(cleanupCalled, false);
});

Deno.test("deletes Google-only accounts without an Apple authorization code", async () => {
  const calls: string[] = [];
  const response = await handleDeleteAccount(
    authenticatedRequest({}),
    dependencies({
      getUser: async () =>
        user({ identities: [{ provider: "google", subject: "google-sub" }] }),
      exchangeAppleAuthorizationCode: async () => {
        throw new Error("Apple exchange must not run");
      },
      revokeAppleToken: async () => {
        throw new Error("Apple revocation must not run");
      },
      cleanupUserData: () => record(calls, "cleanup"),
      deleteUser: () => record(calls, "user"),
    }),
  );

  assertEquals(response.status, 204);
  assertEquals(calls, ["cleanup", "user"]);
});

Deno.test("does not return success when cleanup or Auth deletion fails", async () => {
  let deleteCalled = false;
  const cleanupFailure = await handleDeleteAccount(
    authenticatedRequest(),
    dependencies({
      cleanupUserData: async () => {
        throw new Error("cleanup failed");
      },
      deleteUser: async () => {
        deleteCalled = true;
      },
    }),
  );
  const deleteFailure = await handleDeleteAccount(
    authenticatedRequest(),
    dependencies({
      deleteUser: async () => {
        throw new Error("service-role-secret-should-not-leak");
      },
    }),
  );

  assertEquals(cleanupFailure.status, 500);
  assertEquals(deleteCalled, false);
  assertEquals(deleteFailure.status, 500);
  assertEquals(
    (await deleteFailure.text()).includes(
      "service-role-secret-should-not-leak",
    ),
    false,
  );
});

Deno.test("keeps credentials and Apple tokens out of all error responses", async () => {
  const secret = "service-role-and-apple-private-key";
  const response = await handleDeleteAccount(
    authenticatedRequest(),
    dependencies({
      getUser: async () => {
        throw new Error(secret);
      },
    }),
  );

  const text = await response.text();
  assertEquals(response.status, 401);
  assertEquals(text.includes(secret), false);
  assert(text.includes("error"));
});
