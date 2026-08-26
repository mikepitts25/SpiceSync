import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";

import { type DeletionPageDependencies, handleDeletionPage } from "./index.ts";

const URL =
  "https://project.supabase.co/functions/v1/spicesync-account-deletion";
const GATEWAY_SECRET = "test-gateway-secret";

function dependencies(
  overrides: Partial<DeletionPageDependencies> = {},
): DeletionPageDependencies {
  return {
    gatewaySecret: GATEWAY_SECRET,
    insertDeletionRequest: async () => ({ requestId: "req_Gf7iZ2OkiQ" }),
    ...overrides,
  };
}

function authorizedRequest(request: Request): Request {
  const headers = new Headers(request.headers);
  headers.set("x-spicesync-gateway", GATEWAY_SECRET);
  return new Request(request, { headers });
}

function formRequest(
  fields: Record<string, string>,
  method = "POST",
): Request {
  return authorizedRequest(
    new Request(URL, {
      method,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields),
    }),
  );
}

Deno.test("rejects direct requests before reading the body or using storage", async () => {
  let inserted = false;
  const request = new Request(URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "provider=apple&contact=person%40example.test",
  });

  const response = await handleDeletionPage(
    request,
    dependencies({
      insertDeletionRequest: async () => {
        inserted = true;
        return { requestId: "req_unused" };
      },
    }),
  );

  assertEquals(response.status, 403);
  assertEquals(request.bodyUsed, false);
  assertEquals(inserted, false);
});

Deno.test("rejects an incorrect gateway secret", async () => {
  const response = await handleDeletionPage(
    new Request(URL, {
      headers: { "x-spicesync-gateway": "incorrect-secret" },
    }),
    dependencies(),
  );

  assertEquals(response.status, 403);
});

Deno.test("accepts the configured gateway secret", async () => {
  const response = await handleDeletionPage(
    authorizedRequest(new Request(URL)),
    dependencies(),
  );

  assertEquals(response.status, 200);
});

Deno.test("serves a branded no-store deletion request form with security headers", async () => {
  const response = await handleDeletionPage(
    authorizedRequest(new Request(URL)),
    dependencies(),
  );
  const body = await response.text();

  assertEquals(response.status, 200);
  assertStringIncludes(body, "SpiceSync");
  assertStringIncludes(body, "within 30 days");
  assertStringIncludes(body, "encrypted relay events");
  assertStringIncludes(body, "other devices remain");
  assertStringIncludes(body, "does not restore local profiles");
  assertStringIncludes(body, "provider email or identifier");
  assertStringIncludes(body, "subscription cancellation are separate");
  assertEquals(response.headers.get("cache-control"), "no-store");
  assertEquals(response.headers.get("x-content-type-options"), "nosniff");
  assertEquals(response.headers.get("referrer-policy"), "no-referrer");
  assertStringIncludes(
    response.headers.get("content-security-policy") ?? "",
    "default-src 'none'",
  );
  assertStringIncludes(
    response.headers.get("content-security-policy") ?? "",
    "style-src 'unsafe-inline'",
  );
});

Deno.test("accepts a validated deletion request and escapes submitted values", async () => {
  const response = await handleDeletionPage(
    formRequest({ provider: "apple", contact: "<script>alert(1)</script>" }),
    dependencies(),
  );
  const body = await response.text();

  assertEquals(response.status, 202);
  assertEquals(body.includes("<script>"), false);
  assertStringIncludes(body, "req_Gf7iZ2OkiQ");
  assertStringIncludes(body, "manual verification");
  assertStringIncludes(body, "within 30 days");
  assertStringIncludes(body, "manual request record");
});

Deno.test("rejects malformed methods, content types, and form fields", async () => {
  const method = await handleDeletionPage(
    authorizedRequest(new Request(URL, { method: "PUT" })),
    dependencies(),
  );
  const contentType = await handleDeletionPage(
    authorizedRequest(new Request(URL, { method: "POST", body: "{}" })),
    dependencies(),
  );
  const unexpected = await handleDeletionPage(
    formRequest({
      provider: "apple",
      contact: "person@example.test",
      extra: "no",
    }),
    dependencies(),
  );
  const duplicate = await handleDeletionPage(
    authorizedRequest(
      new Request(URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "provider=apple&provider=google&contact=person%40example.test",
      }),
    ),
    dependencies(),
  );

  assertEquals(method.status, 405);
  assertEquals(contentType.status, 415);
  assertEquals(unexpected.status, 400);
  assertEquals(duplicate.status, 400);
});

Deno.test("validates strict provider and contact length bounds before storage", async () => {
  let inserted = false;
  const invalidProvider = await handleDeletionPage(
    formRequest({ provider: "email", contact: "person@example.test" }),
    dependencies({
      insertDeletionRequest: async () => {
        inserted = true;
        return { requestId: "req_unused" };
      },
    }),
  );
  const invalidContact = await handleDeletionPage(
    formRequest({ provider: "google", contact: "x".repeat(321) }),
    dependencies({
      insertDeletionRequest: async () => {
        inserted = true;
        return { requestId: "req_unused" };
      },
    }),
  );

  assertEquals(invalidProvider.status, 422);
  assertEquals(invalidContact.status, 422);
  assertEquals(inserted, false);
});

Deno.test("rejects oversized form bodies before materializing them", async () => {
  const response = await handleDeletionPage(
    authorizedRequest(
      new Request(URL, {
        method: "POST",
        headers: {
          "content-length": "2049",
          "content-type": "application/x-www-form-urlencoded",
        },
        body: "provider=apple&contact=person@example.test",
      }),
    ),
    dependencies(),
  );

  assertEquals(response.status, 413);
});

Deno.test("rejects streamed oversized bodies and invisible contact controls", async () => {
  const oversized = await handleDeletionPage(
    authorizedRequest(
      new Request(URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("x".repeat(2049)));
            controller.close();
          },
        }),
      }),
    ),
    dependencies(),
  );
  const control = await handleDeletionPage(
    formRequest({ provider: "apple", contact: "person\u0001@example.test" }),
    dependencies(),
  );
  const bidi = await handleDeletionPage(
    formRequest({ provider: "google", contact: "person\u202E@example.test" }),
    dependencies(),
  );

  assertEquals(oversized.status, 413);
  assertEquals(control.status, 422);
  assertEquals(bidi.status, 422);
});

Deno.test("returns a safe failure when deletion-request storage fails", async () => {
  const secret = "service-role-secret-should-not-leak";
  const response = await handleDeletionPage(
    formRequest({ provider: "google", contact: "person@example.test" }),
    dependencies({
      insertDeletionRequest: async () => {
        throw new Error(secret);
      },
    }),
  );

  assertEquals(response.status, 503);
  assertEquals((await response.text()).includes(secret), false);
});

Deno.test("does not reflect an unsafe Origin in CORS headers", async () => {
  const response = await handleDeletionPage(
    authorizedRequest(
      new Request(URL, { headers: { origin: "https://attacker.example" } }),
    ),
    dependencies(),
  );

  assertEquals(response.status, 403);
  assertEquals(response.headers.get("access-control-allow-origin"), null);
});
