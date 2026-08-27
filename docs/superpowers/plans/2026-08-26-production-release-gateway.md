# SpiceSync Production Release Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Secure the public account-deletion endpoint, finish Google and Apple production authentication configuration, pass every release gate, and deliver a signed SpiceSync iOS archive to TestFlight.

**Architecture:** A Cloudflare Worker at a stable `workers.dev/account-deletion` URL is the only public entry point for the deletion form. It rate-limits requests, emits privacy-safe security signals, removes spoofable inbound headers, and authenticates to the existing Supabase Edge Function with a server-only shared secret; the Edge Function rejects direct traffic before reading bodies or using storage. Google and Apple credentials are configured in their provider consoles, Supabase, EAS production variables, and the checked-in iOS URL schemes before EAS builds and submits the archive.

**Tech Stack:** Expo SDK 54, React Native, TypeScript, native iOS/Xcode configuration, Deno Supabase Edge Functions, Supabase CLI 2.100.0, Cloudflare Workers, Wrangler 4.126.0, Vitest 4.1.11, TypeScript 7.0.2, EAS CLI, App Store Connect

**Spec:** `docs/superpowers/specs/2026-08-26-production-release-gateway-design.md`

## Global Constraints

- The App Store bundle identifier remains exactly `com.spicesync.app`; the App Store Connect app ID remains exactly `6802104241`.
- Use Node `20.19.4` for the Expo mobile app because its package engine excludes Node 24; use Node 22 or newer only inside the isolated Worker package.
- The Google web callback is exactly `https://gewxwyvjcdplbdkygnib.supabase.co/auth/v1/callback`; the Google iOS client is bound to `com.spicesync.app`.
- The Supabase origin is exactly `https://gewxwyvjcdplbdkygnib.supabase.co/functions/v1/spicesync-account-deletion` and must never be published as the App Store deletion URL.
- The public route is exactly `/account-deletion`; every other Worker path returns `404`.
- The gateway header is exactly `x-spicesync-gateway`; browser-supplied values are discarded and only the Worker may inject the shared secret.
- The shared gateway secret, OAuth client secrets, Apple private key, and Apple client secret are never committed, printed, logged, or stored in shell history.
- The Worker never logs request bodies, contact values, IP addresses, authorization values, cookies, or the shared gateway secret.
- Preserve `Cache-Control: no-store`, the existing CSP, `Referrer-Policy: no-referrer`, and `X-Content-Type-Options: nosniff` on deletion responses.
- Keep `verify_jwt = false` for the deletion Edge Function because the Worker secret is the origin authentication mechanism.
- Production EAS keeps `EXPO_PUBLIC_PURCHASES_ENABLED=false` and `EXPO_PUBLIC_FREE_BETA_ACCESS=true`.
- Do not bypass or weaken `apps/mobile/scripts/release-check.js`; a failed release check blocks the build.
- Do not delete or overwrite unrelated working-tree changes. Use `apply_patch` for repository file edits.
- Completion means App Store Connect accepted the archive and the build appears in TestFlight as processing or available; an EAS upload attempt alone is not completion.

> **Approved TestFlight monitoring amendment (2026-08-27):** The account's
> scheduled Log Explorer alert requires a paid add-on. The owner explicitly
> approved leaving that alert out for the current TestFlight release. Keep
> privacy-safe Worker telemetry enabled and retain the verified deterministic
> limiter; automated error notification is deferred and is not a Task 6 build
> blocker. Reassess monitoring before public production launch.

---

### Task 1: Reject Direct Traffic at the Supabase Origin

**Files:**
- Modify: `supabase/functions/spicesync-account-deletion/index.ts:5-105`
- Modify: `supabase/functions/spicesync-account-deletion/index_test.ts:1-205`
- Test: `supabase/functions/spicesync-account-deletion/index_test.ts`

**Interfaces:**
- Consumes: existing `handleDeletionPage(request: Request, dependencies?: DeletionPageDependencies): Promise<Response>` and existing deletion form/storage behavior.
- Produces: `GATEWAY_HEADER = "x-spicesync-gateway"`, `DeletionPageDependencies.gatewaySecret: string`, and `hasValidGatewaySecret(request: Request, expectedSecret: string): Promise<boolean>` for origin authentication.

- [ ] **Step 1: Add failing tests for missing, incorrect, and valid gateway authentication**

  Add `gatewaySecret: "test-gateway-secret"` to the `dependencies()` fixture. Add an `authorizedRequest()` helper that clones a request and sets `x-spicesync-gateway: test-gateway-secret`, then route every existing positive or validation-path request through that helper. Keep the unsafe-Origin test authenticated so it still exercises CORS rather than failing at the new gate.

  Add these focused tests before the existing form test:

  ```ts
  Deno.test("rejects direct requests before reading the body or using storage", async () => {
    let pulled = false;
    let inserted = false;
    const body = new ReadableStream<Uint8Array>({
      pull() {
        pulled = true;
        throw new Error("body must not be read");
      },
    });
    const response = await handleDeletionPage(
      new Request(URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      }),
      dependencies({
        insertDeletionRequest: async () => {
          inserted = true;
          return { requestId: "req_unused" };
        },
      }),
    );

    assertEquals(response.status, 403);
    assertEquals(pulled, false);
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
  ```

- [ ] **Step 2: Run the focused Edge Function tests and confirm the new test fails**

  Run:

  ```bash
  deno test --allow-env --lock=supabase/functions/deno.lock --frozen supabase/functions/spicesync-account-deletion/index_test.ts
  ```

  Expected: FAIL because `DeletionPageDependencies` has no `gatewaySecret` and unauthenticated requests still reach the current handler.

- [ ] **Step 3: Implement constant-time gateway authentication before every other request check**

  Add the header constant, dependency property, digest comparison, and first handler branch:

  ```ts
  export const GATEWAY_HEADER = "x-spicesync-gateway";

  export interface DeletionPageDependencies {
    gatewaySecret: string;
    insertDeletionRequest(
      request: DeletionRequest,
    ): Promise<{ requestId: string }>;
  }

  export async function hasValidGatewaySecret(
    request: Request,
    expectedSecret: string,
  ): Promise<boolean> {
    const suppliedSecret = request.headers.get(GATEWAY_HEADER);
    if (suppliedSecret === null || suppliedSecret.length === 0) return false;
    const encoder = new TextEncoder();
    const [suppliedDigest, expectedDigest] = await Promise.all([
      crypto.subtle.digest("SHA-256", encoder.encode(suppliedSecret)),
      crypto.subtle.digest("SHA-256", encoder.encode(expectedSecret)),
    ]);
    const suppliedBytes = new Uint8Array(suppliedDigest);
    const expectedBytes = new Uint8Array(expectedDigest);
    let mismatch = suppliedBytes.length ^ expectedBytes.length;
    for (let index = 0; index < suppliedBytes.length; index += 1) {
      mismatch |= suppliedBytes[index] ^ expectedBytes[index];
    }
    return mismatch === 0;
  }
  ```

  Make the first statement in `handleDeletionPage`:

  ```ts
  if (!(await hasValidGatewaySecret(request, dependencies.gatewaySecret))) {
    return textResponse(request, 403, "Forbidden");
  }
  ```

  Add this property to `createDeletionPageDependencies()`:

  ```ts
  gatewaySecret: requiredEnvironment("SPICESYNC_DELETION_GATEWAY_SECRET"),
  ```

  This branch must remain before `isAllowedCorsOrigin`, method routing, content-type checks, body parsing, and `insertDeletionRequest`.

- [ ] **Step 4: Run all Edge Function tests and type checks**

  Run:

  ```bash
  deno fmt --check supabase/functions/spicesync-account-deletion/index.ts supabase/functions/spicesync-account-deletion/index_test.ts
  deno test --allow-env --lock=supabase/functions/deno.lock --frozen supabase/functions/spicesync-account-deletion/index_test.ts
  ```

  Expected: formatting and all deletion-function tests PASS, including proof that an unauthenticated request neither reads its body nor invokes storage.

- [ ] **Step 5: Review the origin hardening diff and commit it**

  Run:

  ```bash
  git diff --check
  git diff -- supabase/functions/spicesync-account-deletion/index.ts supabase/functions/spicesync-account-deletion/index_test.ts
  git add supabase/functions/spicesync-account-deletion/index.ts supabase/functions/spicesync-account-deletion/index_test.ts
  git commit -m "feat: authenticate deletion gateway origin"
  ```

  Confirm the diff contains no literal production secret and no logging of `GATEWAY_HEADER` values.

---

### Task 2: Implement the Cloudflare Account-Deletion Gateway

> **Approved production amendment (2026-08-26):** Live tests showed that the
> account's native `RateLimit` bindings did not enforce even diagnostic limits.
> Replace every `FORM_RATE_LIMITER`/`SUBMIT_RATE_LIMITER` design and code sample
> below with one SQLite Durable Object binding named `RATE_LIMITER`. Partition
> objects by an HMAC-SHA-256 digest of method plus trusted
> `cf-connecting-ip`, using `GATEWAY_SHARED_SECRET` with a domain-separated
> message; never use the raw IP as the durable name. The object enforces fixed
> 60-second windows at 30 GETs and 5 POSTs, and returns the remaining integer
> `Retry-After` from 1 through 60. Regenerate `worker-configuration.d.ts` with
> `npm run types`. Durable Object lifecycle migrations cannot be rolled back to
> a pre-migration version: recover forward while retaining the class, migration,
> and binding, or disable the public route while repairing it. This amendment
> is authoritative wherever the earlier Task 2 examples conflict with it.

**Files:**
- Create: `infra/account-deletion-gateway/.gitignore`
- Create: `infra/account-deletion-gateway/package.json`
- Create: `infra/account-deletion-gateway/package-lock.json`
- Create: `infra/account-deletion-gateway/tsconfig.json`
- Create: `infra/account-deletion-gateway/wrangler.jsonc`
- Create: `infra/account-deletion-gateway/worker-configuration.d.ts`
- Create: `infra/account-deletion-gateway/src/index.ts`
- Create: `infra/account-deletion-gateway/test/index.test.ts`
- Test: `infra/account-deletion-gateway/test/index.test.ts`

**Interfaces:**
- Consumes: the Task 1 header `x-spicesync-gateway` and Supabase origin URL `https://gewxwyvjcdplbdkygnib.supabase.co/functions/v1/spicesync-account-deletion`.
- Produces: `handleGatewayRequest(request: Request, env: Env, runtime?: GatewayRuntime): Promise<Response>`, a default `ExportedHandler<Env>`, the public `/account-deletion` route, two Cloudflare rate-limit bindings, and privacy-safe Analytics Engine events.

- [ ] **Step 1: Scaffold the isolated Worker package and install pinned development dependencies**

  Create `package.json` with this exact content:

  ```json
  {
    "name": "@spicesync/account-deletion-gateway",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "engines": { "node": ">=22" },
    "scripts": {
      "check": "npm run typecheck && npm test",
      "deploy": "wrangler deploy",
      "test": "vitest run",
      "typecheck": "tsc --noEmit",
      "types": "wrangler types"
    },
    "devDependencies": {
      "typescript": "7.0.2",
      "vitest": "4.1.11",
      "wrangler": "4.126.0"
    }
  }
  ```

  Create `.gitignore`:

  ```gitignore
  .dev.vars
  .wrangler/
  coverage/
  node_modules/
  ```

  Create `tsconfig.json`:

  ```json
  {
    "compilerOptions": {
      "allowJs": false,
      "lib": ["ES2024", "WebWorker"],
      "module": "ESNext",
      "moduleResolution": "Bundler",
      "noEmit": true,
      "skipLibCheck": true,
      "strict": true,
      "target": "ES2024",
      "types": ["./worker-configuration.d.ts", "vitest/globals"]
    },
    "include": ["src/**/*.ts", "test/**/*.ts"]
  }
  ```

  Run from `infra/account-deletion-gateway`:

  ```bash
  npm install
  ```

  Expected: `package-lock.json` is generated with only the three declared development dependencies and their transitive dependencies.

- [ ] **Step 2: Define exact Cloudflare bindings and generate Worker types**

  Create `wrangler.jsonc`:

  ```jsonc
  {
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "spicesync-account-deletion-gateway",
    "main": "src/index.ts",
    "compatibility_date": "2026-08-26",
    "workers_dev": true,
    "preview_urls": false,
    "observability": {
      "enabled": true,
      "head_sampling_rate": 1
    },
    "vars": {
      "UPSTREAM_URL": "https://gewxwyvjcdplbdkygnib.supabase.co/functions/v1/spicesync-account-deletion"
    },
    "ratelimits": [
      {
        "name": "FORM_RATE_LIMITER",
        "namespace_id": "1001",
        "simple": { "limit": 30, "period": 60 }
      },
      {
        "name": "SUBMIT_RATE_LIMITER",
        "namespace_id": "1002",
        "simple": { "limit": 5, "period": 60 }
      }
    ],
    "analytics_engine_datasets": [
      {
        "binding": "SECURITY_EVENTS",
        "dataset": "spicesync_account_deletion_gateway"
      }
    ]
  }
  ```

  Run:

  ```bash
  npm run types
  ```

  Expected: `worker-configuration.d.ts` declares the configured public variable, rate-limit bindings, Analytics Engine binding, and Cloudflare runtime types. The server-only `GATEWAY_SHARED_SECRET` is declared only by the explicit `Env` interface in `src/index.ts`, because secrets intentionally do not appear in `wrangler.jsonc`.

- [ ] **Step 3: Write failing gateway contract tests**

  Create `test/index.test.ts` with fakes for `RateLimit`, `AnalyticsEngineDataset`, and injected `fetch`. Cover these exact cases:

  ```ts
  import { describe, expect, it, vi } from "vitest";
  import {
    type Env,
    type GatewayRuntime,
    handleGatewayRequest,
  } from "../src/index";

  const PUBLIC_URL = "https://gateway.example/account-deletion";
  const ORIGIN_URL =
    "https://gewxwyvjcdplbdkygnib.supabase.co/functions/v1/spicesync-account-deletion";

  describe("account deletion gateway", () => {
    it("injects origin authentication and removes spoofable headers", async () => {
      let forwarded: Request | undefined;
      const { env, runtime } = fixture({
        fetch: async (request) => {
          forwarded = request;
          return new Response("<h1>SpiceSync</h1>", {
            status: 200,
            headers: {
              "cache-control": "no-store",
              "content-security-policy": "default-src 'none'",
              "content-type": "text/html; charset=utf-8",
              "referrer-policy": "no-referrer",
              "x-content-type-options": "nosniff",
            },
          });
        },
      });
      const response = await handleGatewayRequest(
        new Request(PUBLIC_URL, {
          headers: {
            origin: "https://attacker.example",
            "x-forwarded-for": "203.0.113.10",
            "x-spicesync-gateway": "attacker-value",
          },
        }),
        env,
        runtime,
      );

      expect(response.status).toBe(200);
      expect(forwarded?.url).toBe(ORIGIN_URL);
      expect(forwarded?.headers.get("x-spicesync-gateway")).toBe(
        "test-gateway-secret",
      );
      expect(forwarded?.headers.get("origin")).toBeNull();
      expect(forwarded?.headers.get("x-forwarded-for")).toBeNull();
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("content-security-policy")).toBe(
        "default-src 'none'",
      );
    });

    it("forwards an allowed form body unchanged", async () => {
      let forwardedBody = "";
      const { env, runtime } = fixture({
        fetch: async (request) => {
          forwardedBody = await request.text();
          return new Response("accepted", { status: 202 });
        },
      });
      const body = "provider=apple&contact=person%40example.test";
      const response = await handleGatewayRequest(
        new Request(PUBLIC_URL, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body,
        }),
        env,
        runtime,
      );
      expect(response.status).toBe(202);
      expect(forwardedBody).toBe(body);
    });

    it("returns 429 without contacting the origin when the limit is exceeded", async () => {
      const fetch = vi.fn();
      const { env, runtime } = fixture({ fetch, submitAllowed: false });
      const response = await handleGatewayRequest(
        new Request(PUBLIC_URL, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "provider=google&contact=person%40example.test",
        }),
        env,
        runtime,
      );
      expect(response.status).toBe(429);
      expect(response.headers.get("retry-after")).toBe("60");
      expect(fetch).not.toHaveBeenCalled();
    });

    it.each([
      ["https://gateway.example/other", "GET", 404],
      [PUBLIC_URL, "PUT", 405],
    ])("rejects unsupported routes and methods", async (url, method, status) => {
      const { env, runtime } = fixture();
      const response = await handleGatewayRequest(
        new Request(url, { method }),
        env,
        runtime,
      );
      expect(response.status).toBe(status);
    });

    it("converts upstream redirects and failures into a no-store 502", async () => {
      const { env, runtime } = fixture({
        fetch: async () => new Response(null, { status: 302 }),
      });
      const response = await handleGatewayRequest(
        new Request(PUBLIC_URL),
        env,
        runtime,
      );
      expect(response.status).toBe(502);
      expect(response.headers.get("cache-control")).toBe("no-store");
    });
  });
  ```

  Use this deterministic fixture in the same test file:

  ```ts
  interface FixtureOptions {
    fetch?: (request: Request) => Promise<Response>;
    formAllowed?: boolean;
    submitAllowed?: boolean;
  }

  function fixture(options: FixtureOptions = {}): {
    env: Env;
    runtime: GatewayRuntime;
  } {
    const limiter = (success: boolean) => ({
      limit: vi.fn(async () => ({ success })),
    }) as unknown as RateLimit;
    const env: Env = {
      UPSTREAM_URL: ORIGIN_URL,
      GATEWAY_SHARED_SECRET: "test-gateway-secret",
      FORM_RATE_LIMITER: limiter(options.formAllowed ?? true),
      SUBMIT_RATE_LIMITER: limiter(options.submitAllowed ?? true),
      SECURITY_EVENTS: {
        writeDataPoint: vi.fn(),
      } as unknown as AnalyticsEngineDataset,
    };
    const runtime: GatewayRuntime = {
      fetch: options.fetch ?? (async () => new Response("ok")),
      now: () => 1_787_699_200_000,
    };
    return { env, runtime };
  }
  ```

- [ ] **Step 4: Run tests to verify the Worker implementation is absent**

  Run:

  ```bash
  npm test
  ```

  Expected: FAIL because `src/index.ts` and its exported interfaces do not exist.

- [ ] **Step 5: Implement the minimal gateway with strict forwarding and privacy-safe telemetry**

  Create `src/index.ts` with these public interfaces:

  ```ts
  export interface Env {
    UPSTREAM_URL: string;
    GATEWAY_SHARED_SECRET: string;
    FORM_RATE_LIMITER: RateLimit;
    SUBMIT_RATE_LIMITER: RateLimit;
    SECURITY_EVENTS: AnalyticsEngineDataset;
  }

  export interface GatewayRuntime {
    fetch(request: Request): Promise<Response>;
    now(): number;
  }

  export async function handleGatewayRequest(
    request: Request,
    env: Env,
    runtime: GatewayRuntime = {
      fetch: (outbound) => fetch(outbound),
      now: () => Date.now(),
    },
  ): Promise<Response>;
  ```

  Implement these exact rules around small `noStoreResponse`, `recordEvent`, `copyResponseHeaders`, and `trustedUpstreamUrl` helpers:

  1. Parse `new URL(request.url)` and return a no-store `404` unless `pathname === "/account-deletion"` and `search === ""`.
  2. Return local `204` for `OPTIONS`; return a no-store `405` plus `Allow: GET, POST, OPTIONS` for every other unsupported method.
  3. Choose `FORM_RATE_LIMITER` for `GET` and `SUBMIT_RATE_LIMITER` for `POST`. Call `limit({ key: `${request.method}:${request.headers.get("cf-connecting-ip") ?? "unknown"}` })`. Return `429`, `Retry-After: 60`, and `Cache-Control: no-store` when `success` is false.
  4. Validate `env.UPSTREAM_URL` by requiring protocol `https:`, hostname `gewxwyvjcdplbdkygnib.supabase.co`, and pathname `/functions/v1/spicesync-account-deletion`; throw before forwarding if deployment configuration differs.
  5. Build outbound headers from an empty `Headers`. Copy only `accept`, `content-type`, and `user-agent` when present. Copy `origin` only when it equals the existing allowlisted origin `https://spicesync.app`; discard every other Origin value. Set `x-spicesync-gateway` from `env.GATEWAY_SHARED_SECRET`. Never copy `cookie`, `authorization`, `host`, any `cf-*` header, or any `x-forwarded-*` header.
  6. Reject a numeric `Content-Length` greater than `2048` before reading the body. For `POST`, read one `ArrayBuffer`, reject it with `413` if `byteLength > 2048`, and forward those exact bytes. Set `redirect: "manual"` and use `AbortSignal.timeout(10_000)`.
  7. Treat thrown fetches, `3xx`, and `5xx` as `502`. Preserve upstream status/body for `2xx` and `4xx` responses.
  8. Copy only `content-type`, `cache-control`, `content-security-policy`, `referrer-policy`, `x-content-type-options`, `allow`, `access-control-allow-origin`, `access-control-allow-methods`, `access-control-allow-headers`, and `vary` from the origin. Force `Cache-Control: no-store` on every response.
  9. Call `SECURITY_EVENTS.writeDataPoint` with only `blobs: [event, request.method]`, `doubles: [status]`, and `indexes: [event]`, where event is `allowed`, `rate_limited`, or `upstream_error`. Log only `{ event, method, status, timestamp }`; never log the URL query, headers, body, IP, or secret.
  10. Export `default { fetch: (request, env) => handleGatewayRequest(request, env) } satisfies ExportedHandler<Env>`.

  The central handler control flow is:

  ```ts
  export async function handleGatewayRequest(
    request: Request,
    env: Env,
    runtime: GatewayRuntime = {
      fetch: (outbound) => fetch(outbound),
      now: () => Date.now(),
    },
  ): Promise<Response> {
    const publicUrl = new URL(request.url);
    if (publicUrl.pathname !== "/account-deletion" || publicUrl.search !== "") {
      return noStoreResponse("Not Found", 404);
    }
    if (request.method === "OPTIONS") {
      return noStoreResponse(null, 204, { allow: "GET, POST, OPTIONS" });
    }
    if (request.method !== "GET" && request.method !== "POST") {
      return noStoreResponse("Method Not Allowed", 405, {
        allow: "GET, POST, OPTIONS",
      });
    }

    const limiter = request.method === "POST"
      ? env.SUBMIT_RATE_LIMITER
      : env.FORM_RATE_LIMITER;
    const rateResult = await limiter.limit({
      key: `${request.method}:${request.headers.get("cf-connecting-ip") ?? "unknown"}`,
    });
    if (!rateResult.success) {
      recordEvent(env, runtime, "rate_limited", request.method, 429);
      return noStoreResponse("Too Many Requests", 429, { "retry-after": "60" });
    }

    let body: ArrayBuffer | undefined;
    if (request.method === "POST") {
      const contentLength = request.headers.get("content-length");
      if (contentLength !== null && /^\d+$/.test(contentLength) && Number(contentLength) > 2048) {
        return noStoreResponse("Request Entity Too Large", 413);
      }
      body = await request.arrayBuffer();
      if (body.byteLength > 2048) {
        return noStoreResponse("Request Entity Too Large", 413);
      }
    }

    try {
      const outbound = new Request(trustedUpstreamUrl(env.UPSTREAM_URL), {
        method: request.method,
        headers: outboundHeaders(request, env.GATEWAY_SHARED_SECRET),
        body,
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      const upstream = await runtime.fetch(outbound);
      if (upstream.status >= 300 && upstream.status < 400 || upstream.status >= 500) {
        recordEvent(env, runtime, "upstream_error", request.method, 502);
        return noStoreResponse("Service Unavailable", 502);
      }
      recordEvent(env, runtime, "allowed", request.method, upstream.status);
      return new Response(upstream.body, {
        status: upstream.status,
        headers: copyResponseHeaders(upstream.headers),
      });
    } catch {
      recordEvent(env, runtime, "upstream_error", request.method, 502);
      return noStoreResponse("Service Unavailable", 502);
    }
  }
  ```

  Use these exact helpers:

  ```ts
  type SecurityEvent = "allowed" | "rate_limited" | "upstream_error";
  const COPIED_RESPONSE_HEADERS = [
    "content-type",
    "content-security-policy",
    "referrer-policy",
    "x-content-type-options",
    "allow",
    "access-control-allow-origin",
    "access-control-allow-methods",
    "access-control-allow-headers",
    "vary",
  ] as const;

  function noStoreResponse(
    body: BodyInit | null,
    status: number,
    extraHeaders: HeadersInit = {},
  ): Response {
    const headers = new Headers(extraHeaders);
    headers.set("cache-control", "no-store");
    headers.set("content-type", "text/plain; charset=utf-8");
    return new Response(body, { status, headers });
  }

  function trustedUpstreamUrl(value: string): URL {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "gewxwyvjcdplbdkygnib.supabase.co" ||
      url.port !== "" ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/functions/v1/spicesync-account-deletion" ||
      url.search !== "" ||
      url.hash !== ""
    ) {
      throw new Error("Invalid account-deletion origin configuration");
    }
    return url;
  }

  function outboundHeaders(request: Request, gatewaySecret: string): Headers {
    const headers = new Headers();
    for (const name of ["accept", "content-type", "user-agent"]) {
      const value = request.headers.get(name);
      if (value !== null) headers.set(name, value);
    }
    if (request.headers.get("origin") === "https://spicesync.app") {
      headers.set("origin", "https://spicesync.app");
    }
    headers.set("x-spicesync-gateway", gatewaySecret);
    return headers;
  }

  function copyResponseHeaders(upstream: Headers): Headers {
    const headers = new Headers();
    for (const name of COPIED_RESPONSE_HEADERS) {
      const value = upstream.get(name);
      if (value !== null) headers.set(name, value);
    }
    headers.set("cache-control", "no-store");
    return headers;
  }

  function recordEvent(
    env: Env,
    runtime: GatewayRuntime,
    event: SecurityEvent,
    method: string,
    status: number,
  ): void {
    const timestamp = runtime.now();
    env.SECURITY_EVENTS.writeDataPoint({
      blobs: [event, method],
      doubles: [status],
      indexes: [event],
    });
    console.log(JSON.stringify({ event, method, status, timestamp }));
  }
  ```

  Add a sixth Vitest case that sends a 2049-byte POST, expects `413`, and asserts the injected fetch was not called.

- [ ] **Step 6: Run Worker tests, type checks, and Wrangler validation**

  Run:

  ```bash
  npm run check
  npx wrangler deploy --dry-run --outdir .wrangler/dry-run
  ```

  Expected: all Vitest cases PASS, TypeScript reports zero errors, and Wrangler bundles the Worker without deploying it.

- [ ] **Step 7: Review dependency and gateway diffs, then commit**

  Run from the repository root:

  ```bash
  git diff --check
  git diff -- infra/account-deletion-gateway
  git add infra/account-deletion-gateway
  git commit -m "feat: add managed deletion gateway"
  ```

  Confirm the lockfile pins Wrangler `4.126.0`, Vitest `4.1.11`, and TypeScript `7.0.2`, and confirm no `.dev.vars` file or literal secret is staged.

---

### Task 3: Configure Production Google and Apple Identity

**Files:**
- Modify: `apps/mobile/ios/SpiceSync/Info.plist:25-47`
- Modify: `docs/apple-google-account-setup.md`
- Test: `apps/mobile/__tests__/release-config.test.ts`
- Test: `apps/mobile/__tests__/release-check-script.test.ts`

**Interfaces:**
- Consumes: bundle ID `com.spicesync.app`, Supabase callback URL, existing dynamic Google scheme logic in `apps/mobile/app.config.js`, and Apple team ID `33YM89B48D` from the established EAS credentials.
- Produces: valid `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, Supabase Google provider configuration, verified Apple native/web identifiers, Supabase Apple provider configuration, and a checked-in reversed Google iOS URL scheme.

- [ ] **Step 1: Record a failing production-config baseline without exposing values**

  Run from `apps/mobile` under Node `20.19.4`:

  ```bash
  npx eas-cli env:list production --scope project
  EAS_BUILD_PROFILE=testflight npm run eas-build-pre-install
  ```

  Expected: the environment inventory lacks both Google public client IDs, and preflight exits nonzero naming `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `SPICESYNC_ACCOUNT_DELETION_URL`, and `SPICESYNC_DELETION_RATE_LIMIT_VERIFIED` without printing secret values.

- [ ] **Step 2: Create or reuse the exact Google OAuth clients**

  In the Google Cloud project that owns SpiceSync's production OAuth consent screen, or in a newly created project named exactly `SpiceSync Production` when no SpiceSync project exists in the authenticated operator account:

  1. Verify the consent screen is in Production and includes only `openid`, `email`, and `profile`.
  2. Create or reuse a Web application client whose authorized redirect URI is exactly `https://gewxwyvjcdplbdkygnib.supabase.co/auth/v1/callback`.
  3. Create or reuse an iOS client whose bundle ID is exactly `com.spicesync.app`.
  4. Store the web client secret only in the Supabase Google provider screen; record the web and iOS client IDs as public deployment values.
  5. In Supabase Authentication > Providers > Google, enable the provider, set the web client ID and web client secret, and add the iOS client ID to the accepted client IDs.

  Stop and request the user's interactive completion only if Google requires a fresh sign-in, CAPTCHA, security-key touch, or MFA prompt. Do not create a second client merely to avoid an interactive security check.

- [ ] **Step 3: Verify or complete Apple Sign in configuration**

  In Apple Developer and Supabase:

  1. Verify App ID `com.spicesync.app` belongs to team `33YM89B48D`, has Sign in with Apple enabled, and the active distribution provisioning profile includes the `com.apple.developer.applesignin` entitlement.
  2. Create or reuse Services ID `com.spicesync.app.auth`; set its domain to `gewxwyvjcdplbdkygnib.supabase.co` and return URL to `https://gewxwyvjcdplbdkygnib.supabase.co/auth/v1/callback`.
  3. Reuse an accessible Sign in with Apple key only when its downloaded `.p8` private key is available and its access is scoped to `com.spicesync.app`; otherwise create a new key named `SpiceSync Supabase Auth` and immediately store the one-time `.p8` download outside the repository.
  4. Generate a maximum-six-month Apple client-secret JWT with issuer `33YM89B48D`, subject `com.spicesync.app.auth`, audience `https://appleid.apple.com`, and the selected key ID.
  5. In Supabase Authentication > Providers > Apple, enable the provider, set client IDs in this order to `com.spicesync.app.auth,com.spicesync.app`, and set the generated client-secret JWT.
  6. Set Supabase Edge Function secrets `APPLE_TEAM_ID=33YM89B48D`, `APPLE_CLIENT_ID=com.spicesync.app`, `APPLE_KEY_ID` to the selected key ID, and `APPLE_PRIVATE_KEY` to the full `.p8` contents using Supabase's secret manager UI so the private value never appears in shell history.

  Stop for the user's interaction only for Apple sign-in, license acceptance, MFA, or security-key confirmation.

- [ ] **Step 4: Set public Google deployment values and the function audience**

  From `apps/mobile`, use the exact public client IDs obtained in Step 2 with EAS's value prompt rather than placing them in shell history:

  ```bash
  npx eas-cli env:set production --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --visibility plaintext
  npx eas-cli env:set production --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --visibility plaintext
  ```

  `env:set` creates or updates the exact name and prompts for the value when `--value` is omitted. In Supabase's function secret manager, set `GOOGLE_WEB_CLIENT_ID` to the same web client ID. These identifiers are public, but still avoid pasting values into the plan or commit history.

- [ ] **Step 5: Add the actual reversed Google URL scheme to checked-in native iOS configuration**

  Derive the public scheme locally from the configured iOS client ID:

  ```bash
  node -e 'const id=process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID; if(!/^[-A-Za-z0-9]+\.apps\.googleusercontent\.com$/.test(id ?? "")) process.exit(1); console.log(`com.googleusercontent.apps.${id.slice(0,-".apps.googleusercontent.com".length)}`)'
  ```

  Use `apply_patch` to add that command's exact single-line output as a third `CFBundleURLTypes` dictionary in `apps/mobile/ios/SpiceSync/Info.plist`. Do not add the client ID or web secret as a plist key.

  Update `docs/apple-google-account-setup.md` to document:

  - callback `https://gewxwyvjcdplbdkygnib.supabase.co/auth/v1/callback`;
  - native bundle ID `com.spicesync.app`;
  - Apple Services ID `com.spicesync.app.auth`;
  - the exact EAS and Supabase variable names above;
  - the six-month Apple client-secret renewal requirement;
  - the rule that no credential value or `.p8` file belongs in git.

- [ ] **Step 6: Run identity and native-config verification**

  Run from `apps/mobile` with production public values loaded into the process and Node `20.19.4`:

  ```bash
  npm test -- --runInBand __tests__/release-config.test.ts __tests__/release-check-script.test.ts __tests__/auth-providers.test.ts
  plutil -lint ios/SpiceSync/Info.plist
  node -e 'const fs=require("node:fs"); const id=process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID; const scheme=`com.googleusercontent.apps.${id.slice(0,-".apps.googleusercontent.com".length)}`; if(!fs.readFileSync("ios/SpiceSync/Info.plist","utf8").includes(`<string>${scheme}</string>`)) process.exit(1)'
  ```

  Expected: all Jest suites PASS, `plutil` reports `OK`, and the scheme assertion exits zero.

- [ ] **Step 7: Review and commit only the public native/documentation changes**

  Run:

  ```bash
  git diff --check
  git diff -- apps/mobile/ios/SpiceSync/Info.plist docs/apple-google-account-setup.md
  git add apps/mobile/ios/SpiceSync/Info.plist docs/apple-google-account-setup.md
  git commit -m "chore: configure production identity metadata"
  ```

  Confirm no OAuth secret, Apple JWT, Apple private key, or `.p8` path appears in the staged diff.

---

### Task 4: Deploy and Verify the Protected Deletion Path

**Files:**
- Modify: `docs/apple-google-account-setup.md`
- Test: `infra/account-deletion-gateway/test/index.test.ts`
- Test: `supabase/functions/spicesync-account-deletion/index_test.ts`

**Interfaces:**
- Consumes: the Task 1 origin gate, Task 2 Worker, Cloudflare account authentication, and Supabase project `gewxwyvjcdplbdkygnib`.
- Produces: the deployed `$GATEWAY_BASE_URL/account-deletion` URL reported by Wrangler, synchronized server-only gateway secrets, verified rate limiting, security telemetry, and production EAS deletion-policy values.

- [ ] **Step 1: Re-run both deployment units before touching production**

  Run:

  ```bash
  deno test --allow-env --lock=supabase/functions/deno.lock --frozen supabase/functions/spicesync-account-deletion/index_test.ts
  npm --prefix infra/account-deletion-gateway run check
  ```

  Expected: all origin and gateway tests PASS.

- [ ] **Step 2: Generate one shared secret in memory and set both secret stores**

  In a shell with history disabled for the current session, generate 48 random bytes and keep the result only in a shell variable:

  ```bash
  unset HISTFILE
  GATEWAY_SHARED_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
  test "${#GATEWAY_SHARED_SECRET}" -ge 64
  ```

  From `infra/account-deletion-gateway`, set `GATEWAY_SHARED_SECRET` through Wrangler's interactive secret input:

  ```bash
  printf '%s' "$GATEWAY_SHARED_SECRET" | npx wrangler secret put GATEWAY_SHARED_SECRET
  ```

  Open Supabase project `gewxwyvjcdplbdkygnib` > Edge Functions > Secrets and set `SPICESYNC_DELETION_GATEWAY_SECRET` to the same in-memory value. Do not use a CLI argument that exposes the value in the process list. After both stores confirm success, run `unset GATEWAY_SHARED_SECRET`.

- [ ] **Step 3: Record rollback points, then deploy the hardened Supabase function and Cloudflare Worker**

  Record the current repository commit and current Cloudflare deployment without altering either system:

  ```bash
  PRE_GATEWAY_COMMIT="$(git rev-parse HEAD)"
  npm --prefix infra/account-deletion-gateway exec -- wrangler deployments list
  ```

  If an existing Worker deployment is listed, record its deployment ID as `PREVIOUS_WORKER_DEPLOYMENT_ID`. If the Worker has never been deployed, record that no Cloudflare rollback target exists; deleting a failed first deployment is then the recoverable Worker action.

  Run from the repository root:

  ```bash
  supabase functions deploy spicesync-account-deletion --project-ref gewxwyvjcdplbdkygnib
  npm --prefix infra/account-deletion-gateway run deploy
  ```

  Expected: Supabase reports the function deployed; Wrangler reports `spicesync-account-deletion-gateway` deployed and prints one stable `workers.dev` URL. Record the URL locally as `GATEWAY_BASE_URL` without adding a trailing slash.

  If either deploy or any verification in Steps 4–6 fails, leave the EAS release gate closed. Because the SQLite Durable Object migration cannot roll back to a pre-migration deployment, deploy a forward fix that retains the class, migration, and binding; if safe forward recovery is not ready, disable the `workers.dev` route in Cloudflare. Keep the hardened Supabase origin closed while repairing the Worker rather than redeploying the previously public origin. Rotate both copies of the shared secret after any suspected exposure. Never use `git reset`, overwrite the active working tree, or expose the secret during rollback.

- [ ] **Step 4: Prove the raw Supabase origin is closed**

  Run:

  ```bash
  curl --silent --show-error --dump-header - --output /dev/null https://gewxwyvjcdplbdkygnib.supabase.co/functions/v1/spicesync-account-deletion
  curl --silent --show-error --dump-header - --output /dev/null --request POST --header 'content-type: application/x-www-form-urlencoded' --data 'provider=google&contact=release-verification%40spicesync.invalid' https://gewxwyvjcdplbdkygnib.supabase.co/functions/v1/spicesync-account-deletion
  ```

  Expected: both requests return `403`; the POST does not create a deletion row.

- [ ] **Step 5: Verify the public gateway contract and security headers**

  Run against `$GATEWAY_BASE_URL/account-deletion`:

  ```bash
  curl --silent --show-error --dump-header /tmp/spicesync-gateway-get.headers --output /tmp/spicesync-gateway-get.html "$GATEWAY_BASE_URL/account-deletion"
  curl --silent --show-error --dump-header /tmp/spicesync-gateway-post.headers --output /tmp/spicesync-gateway-post.html --request POST --header 'content-type: application/x-www-form-urlencoded' --data 'provider=google&contact=release-verification%40spicesync.invalid' "$GATEWAY_BASE_URL/account-deletion"
  curl --silent --show-error --dump-header - --output /dev/null --header 'origin: https://spicesync.app' "$GATEWAY_BASE_URL/account-deletion"
  curl --silent --show-error --dump-header - --output /dev/null --request PUT "$GATEWAY_BASE_URL/account-deletion"
  ```

  Assert the GET is `200`, the POST is `202`, and both include `Cache-Control: no-store`, the existing CSP, `Referrer-Policy: no-referrer`, and `X-Content-Type-Options: nosniff`. Assert the allowed-Origin response contains `Access-Control-Allow-Origin: https://spicesync.app`; assert PUT is `405` with `Allow: GET, POST, OPTIONS`. Assert the GET form action remains same-origin and the POST response contains a request reference but does not contain unescaped input.

  In Supabase SQL Editor, run this read-only confirmation:

  ```sql
  select request_id, contact, provider, status, created_at
  from public.spicesync_account_deletion_requests
  where contact = 'release-verification@spicesync.invalid'
  order by created_at desc
  limit 1;
  ```

  Expected: one row matches the POST response reference, provider `google`, and the initial request status. Keep the `.invalid` verification row as an explicitly labeled operational audit record unless the existing deletion-request process requires removal.

- [ ] **Step 6: Prove rate limiting and privacy-safe telemetry**

  Send 31 GET requests from one connection within 60 seconds:

  ```bash
  for request_number in {1..31}; do curl --silent --output /dev/null --write-out '%{http_code}\n' "$GATEWAY_BASE_URL/account-deletion"; done
  ```

  Expected: exactly 30 responses are `200`, the 31st is `429`, its headers include an integer `Retry-After` from 1 through 60, and the origin remains healthy afterward. Repeat with POST and expect exactly five `202` responses followed by `429`. In Cloudflare Workers Observability and the `spicesync_account_deletion_gateway` Analytics Engine dataset, confirm `allowed` and `rate_limited` events exist and contain only event, method, status, and timestamp fields. Search Worker logs for `release-verification`, `x-spicesync-gateway`, and `cf-connecting-ip`; all three searches must return zero matching log payloads.

  A scheduled Log Explorer alert was evaluated but requires a paid add-on on
  this account. Per the approved TestFlight monitoring amendment above, leave
  the paid alert unconfigured for this TestFlight release. Confirm privacy-safe
  telemetry remains enabled and reassess automated notification before public
  production launch.

- [ ] **Step 7: Publish the verified public URL to EAS production**

  In `apps/mobile`, set these values with EAS interactive prompts:

  ```bash
  npx eas-cli env:set production --scope project --name SPICESYNC_ACCOUNT_DELETION_URL --visibility plaintext
  npx eas-cli env:set production --scope project --name SPICESYNC_DELETION_RATE_LIMIT_VERIFIED --visibility plaintext
  ```

  Enter the exact `$GATEWAY_BASE_URL/account-deletion` for the first and `true` for the second. `env:set` updates an existing value in place. Then run `npx eas-cli env:list production --scope project` and confirm both names exist without exposing secrets.

- [ ] **Step 8: Record the stable URL and commit deployment documentation**

  Use `apply_patch` to add the deployed public URL, the Cloudflare Worker name, the verification date `2026-08-26`, and the log/alert inspection path to `docs/apple-google-account-setup.md`.

  Run:

  ```bash
  git diff --check
  git diff -- docs/apple-google-account-setup.md
  git add docs/apple-google-account-setup.md
  git commit -m "docs: record production deletion gateway"
  ```

  Confirm the raw Supabase function URL is labeled as private origin infrastructure, not as a user-facing deletion URL.

---

### Task 5: Pass the Complete Mobile Release Gate and Simulator Smoke Test

**Files:**
- Test: `apps/mobile/__tests__/**/*.test.ts`
- Test: `apps/mobile/ios/SpiceSync/Info.plist`
- Test: `apps/mobile/scripts/release-check.js`

**Interfaces:**
- Consumes: all Task 3 identity values, Task 4 managed deletion URL/verification flag, EAS `testflight` profile, and the current Expo native project.
- Produces: a clean 131-suite release gate (or the then-current larger suite), a valid Expo config, a clean iOS simulator build, and evidence that no app source change is required before release.

- [ ] **Step 1: Pull production values into a protected temporary environment file**

  Create a temporary directory with owner-only permissions, let EAS write the production environment into it, and arrange cleanup:

  ```bash
  RELEASE_ENV_DIR="$(mktemp -d)"
  chmod 700 "$RELEASE_ENV_DIR"
  cd apps/mobile
  npx eas-cli env:pull production --path "$RELEASE_ENV_DIR/production.env"
  chmod 600 "$RELEASE_ENV_DIR/production.env"
  ```

  Inspect only variable names with `sed 's/=.*$/=[redacted]/'`; confirm the four release prerequisites and existing Supabase variables are present. Never print the file contents.

- [ ] **Step 2: Run the full fail-closed release check with Node 20.19.4**

  Load the protected file without command tracing and run:

  ```bash
  set -a
  source "$RELEASE_ENV_DIR/production.env"
  set +a
  EAS_BUILD_PROFILE=testflight npm run release:check
  npx expo-doctor
  ```

  Expected: all Jest suites pass, TypeScript passes, Expo config validation passes, checked-in native Google scheme validation passes, and TestFlight profile validation passes. `expo-doctor` reports the established 16/18 result or better; review the native-folder/config warnings and confirm they remain nonblocking for this checked-in native project. Any new doctor failure or release-check failure blocks Task 6 and is fixed at its owning task rather than bypassed.

- [ ] **Step 3: Rebuild and launch the app on the existing iPhone simulator**

  Run:

  ```bash
  npm run ios -- --device 169C7049-000A-469D-B989-E2F97FF1E181
  ```

  Expected: Xcode builds with zero errors, Metro serves the bundle, and the SpiceSync main screen renders on the iPhone 17 Pro Max simulator. Confirm sign-in UI offers Google and Apple and no immediate JavaScript exception or native crash occurs. The known `expo-av` deprecation and simulator StoreKit no-account warnings do not block this release.

- [ ] **Step 4: Remove the temporary environment material and verify repository cleanliness**

  Explicitly validate the temporary path before removing it:

  ```bash
  test -n "$RELEASE_ENV_DIR" && test "$RELEASE_ENV_DIR" != "/" && rm -rf -- "$RELEASE_ENV_DIR"
  unset RELEASE_ENV_DIR
  git status --short
  git diff --check
  ```

  Expected: temporary credentials are removed; only already-known unrelated user files may remain untracked or modified.

- [ ] **Step 5: Create a release-readiness evidence note in the active task, not in git**

  Record the exact release-check suite/test totals, simulator device, build result, current `git rev-parse HEAD`, and any nonblocking warnings. Do not create a repository file or commit when verification itself changes no tracked files.

---

### Task 6: Build, Submit, and Monitor TestFlight

**Files:**
- Test: `apps/mobile/eas.json`
- Test: EAS build metadata and App Store Connect/TestFlight build status

**Interfaces:**
- Consumes: clean Task 5 release evidence, EAS account `mikepitts25`, `testflight` build profile, `production` submit profile, remote iOS build-number source, and ASC app ID `6802104241`.
- Produces: one new iOS build with build number greater than `10`, an EAS submission record, and an accepted TestFlight build.

- [ ] **Step 1: Reconfirm EAS and Apple submission identities**

  Run from `apps/mobile`:

  ```bash
  npx eas-cli whoami
  npx eas-cli credentials --platform ios
  npx eas-cli env:list production --scope project
  ```

  Expected: EAS reports `mikepitts25`; the distribution certificate and provisioning profile target `com.spicesync.app`; the production environment lists both Google client IDs, the managed deletion URL, and the verified rate-limit flag. Do not revoke or replace valid Apple credentials during this check.

- [ ] **Step 2: Start one clean production archive with automatic submission**

  Run:

  ```bash
  npx eas-cli build --platform ios --profile testflight --auto-submit --submit-profile production --non-interactive
  ```

  Expected: EAS assigns remote build number `11` or higher, creates one build URL and one submission URL, passes `eas-build-pre-install`, compiles/signs the archive, and uploads it to App Store Connect. Do not start a duplicate build while this one is queued or running.

- [ ] **Step 3: Monitor EAS through build and submission completion**

  Use the build and submission URLs emitted by Step 2 or run:

  ```bash
  npx eas-cli build:list --platform ios --limit 1 --json
  npx eas-cli submit:list --platform ios --limit 1 --json
  ```

  Poll at intervals of at least 30 seconds. If a phase fails, inspect that phase's logs, apply the systematic-debugging skill, fix the root cause, rerun Task 5, and then create exactly one replacement build. Do not retry unchanged credentials or configuration repeatedly.

  If the archive reaches EAS `FINISHED` but only the submission fails, reuse that exact archive instead of consuming another build number:

  ```bash
  FINISHED_BUILD_ID="$(npx eas-cli build:list --platform ios --status finished --limit 1 --json --non-interactive | node -e 'let input=""; process.stdin.on("data",chunk=>input+=chunk); process.stdin.on("end",()=>{const builds=JSON.parse(input); if(!Array.isArray(builds)||typeof builds[0]?.id!=="string") process.exit(1); process.stdout.write(builds[0].id);});')"
  test -n "$FINISHED_BUILD_ID"
  npx eas-cli submit --platform ios --id "$FINISHED_BUILD_ID" --profile production --non-interactive
  ```

  Confirm the selected build ID matches the failed submission record before running the retry, then `unset FINISHED_BUILD_ID`.

- [ ] **Step 4: Confirm App Store Connect accepted the archive**

  Open App Store Connect app `6802104241` and inspect TestFlight. Match the build by version `1.0.0`, remote build number, upload timestamp, and EAS submission ID.

  Expected: the build is visible as `Processing`, `Ready to Submit`, `Ready to Test`, or another non-rejected TestFlight state. If export-compliance questions appear, answer consistently with `ITSAppUsesNonExemptEncryption=false`. If App Store Connect reports a binary, entitlement, privacy, or metadata rejection, capture the exact message and fix it before declaring completion.

- [ ] **Step 5: Deliver final release evidence**

  Report the EAS build URL, EAS submission URL, version/build number, App Store Connect state, commit SHA, release-check totals, and whether internal testers can install immediately or must wait for processing/review. Mention the earlier failed build `042b69ab-eac0-4f81-a288-bd1ae92db823` only as superseded history; the new accepted build is the release artifact.

---

## Final Self-Review Gate

- [ ] Map every section of `docs/superpowers/specs/2026-08-26-production-release-gateway-design.md` to Tasks 1–6: origin lock, managed gateway, abuse control, privacy-safe telemetry, the approved TestFlight alert deferral, Google, Apple, native scheme, EAS values, simulator validation, release check, build, submission, and TestFlight acceptance must all be covered.
- [ ] Run the following placeholder scan; expected output is empty:

  ```bash
  node - <<'NODE'
  const fs = require("node:fs");
  const plan = fs.readFileSync("docs/superpowers/plans/2026-08-26-production-release-gateway.md", "utf8");
  const forbidden = [
    "T" + "BD",
    "T" + "ODO",
    "implement" + " later",
    "appropriate" + " error handling",
    "similar" + " to Task",
  ];
  for (const phrase of forbidden) {
    if (plan.includes(phrase)) console.log(phrase);
  }
  NODE
  ```
- [ ] Verify type/name consistency across tasks: `x-spicesync-gateway`, `SPICESYNC_DELETION_GATEWAY_SECRET`, `GATEWAY_SHARED_SECRET`, `RATE_LIMITER`, `SECURITY_EVENTS`, and `handleGatewayRequest` must have exactly one spelling each.
- [ ] Verify the plan contains no credential values, sample private keys, Apple client-secret JWTs, or commands that print secret stores.
- [ ] Run `git diff --check` before committing this plan.
