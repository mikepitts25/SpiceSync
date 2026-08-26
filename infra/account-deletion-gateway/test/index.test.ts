import { describe, expect, it, vi } from "vitest";

import * as gatewayModule from "../src/index";
import {
  type Env,
  type GatewayRuntime,
  handleGatewayRequest,
} from "../src/index";

const PUBLIC_URL = "https://gateway.example/account-deletion";
const ORIGIN_URL =
  "https://gewxwyvjcdplbdkygnib.supabase.co/functions/v1/spicesync-account-deletion";

type ConsumeFixedWindow = (
  state: { windowStart: number; count: number } | undefined,
  limit: number,
  now: number,
) => {
  state: { windowStart: number; count: number };
  success: boolean;
  retryAfter: number;
};

function fixedWindowCounter(): ConsumeFixedWindow | undefined {
  return (gatewayModule as unknown as {
    consumeFixedWindow?: ConsumeFixedWindow;
  }).consumeFixedWindow;
}

interface FixtureOptions {
  fetch?: (request: Request) => Promise<Response>;
  formAllowed?: boolean;
  limiterFetch?: (request: Request) => Promise<Response>;
  submitAllowed?: boolean;
}

function fixture(options: FixtureOptions = {}): {
  env: Env;
  runtime: GatewayRuntime;
} {
  const defaultLimiterFetch = async (request: Request) => {
    const { limit } = await request.json<{ limit: number }>();
    return Response.json({
      success: limit === 5
        ? (options.submitAllowed ?? true)
        : (options.formAllowed ?? true),
      retryAfter: 60,
    });
  };
  const limiterFetch = vi.fn(options.limiterFetch ?? defaultLimiterFetch);
  const env: Env = {
    UPSTREAM_URL: ORIGIN_URL,
    GATEWAY_SHARED_SECRET: "test-gateway-secret",
    RATE_LIMITER: {
      idFromName: vi.fn(() => "rate-id"),
      get: vi.fn(() => ({ fetch: limiterFetch })),
    } as unknown as DurableObjectNamespace,
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

describe("account deletion gateway", () => {
  it("deterministically denies the request after the fixed-window limit", () => {
    const consume = fixedWindowCounter();
    expect(consume).toBeTypeOf("function");
    if (!consume) return;

    const first = consume(undefined, 2, 1_000);
    const second = consume(first.state, 2, 2_000);
    const denied = consume(second.state, 2, 3_000);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(denied).toEqual({
      state: { windowStart: 0, count: 2 },
      success: false,
      retryAfter: 57,
    });
  });

  it("starts a fresh count at the next minute boundary", () => {
    const consume = fixedWindowCounter();
    expect(consume).toBeTypeOf("function");
    if (!consume) return;

    const result = consume({ windowStart: 0, count: 30 }, 30, 60_000);

    expect(result).toEqual({
      state: { windowStart: 60_000, count: 1 },
      success: true,
      retryAfter: 60,
    });
  });

  it("persists the count through the Durable Object storage path", async () => {
    const values = new Map<string, unknown>();
    const ctx = {
      storage: {
        get: vi.fn(async (key: string) => values.get(key)),
        put: vi.fn(async (key: string, value: unknown) => {
          values.set(key, value);
        }),
      },
    } as unknown as DurableObjectState;
    const limiter = new gatewayModule.DeletionRateLimiter(ctx);
    const consume = (now: number) => limiter.fetch(new Request(
      "https://rate-limiter.internal/consume",
      {
        method: "POST",
        body: JSON.stringify({ limit: 2, now }),
      },
    ));

    expect(await (await consume(1_000)).json()).toEqual({
      success: true,
      retryAfter: 59,
    });
    expect(await (await consume(2_000)).json()).toEqual({
      success: true,
      retryAfter: 58,
    });
    expect(await (await consume(3_000)).json()).toEqual({
      success: false,
      retryAfter: 57,
    });
    expect(values.get("state")).toEqual({ windowStart: 0, count: 2 });
  });

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
          authorization: "Bearer attacker-value",
          cookie: "session=attacker-value",
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
    expect(forwarded?.headers.get("authorization")).toBeNull();
    expect(forwarded?.headers.get("cookie")).toBeNull();
    expect(forwarded?.headers.get("origin")).toBeNull();
    expect(forwarded?.headers.get("x-forwarded-for")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-security-policy")).toBe(
      "default-src 'none'",
    );
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("preserves only the approved SpiceSync browser Origin", async () => {
    let forwardedOrigin: string | null = null;
    const { env, runtime } = fixture({
      fetch: async (request) => {
        forwardedOrigin = request.headers.get("origin");
        return new Response("ok", {
          headers: { "access-control-allow-origin": "https://spicesync.app" },
        });
      },
    });

    const response = await handleGatewayRequest(
      new Request(PUBLIC_URL, {
        headers: { origin: "https://spicesync.app" },
      }),
      env,
      runtime,
    );

    expect(forwardedOrigin).toBe("https://spicesync.app");
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://spicesync.app",
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
        headers: {
          "cf-connecting-ip": "203.0.113.10",
          "content-type": "application/x-www-form-urlencoded",
        },
        body: "provider=google&contact=person%40example.test",
      }),
      env,
      runtime,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses one privacy-safe deterministic limiter key per method and IP", async () => {
    const fetch = vi.fn(async () => new Response("ok"));
    const limiterFetch = vi.fn(async (_request: Request) =>
      Response.json({ success: false, retryAfter: 23 }));
    const idFromName = vi.fn((_name: string) => "stable-rate-id");
    const get = vi.fn(() => ({ fetch: limiterFetch }));
    const { env: legacyEnv, runtime } = fixture({ fetch });
    const env = {
      ...legacyEnv,
      RATE_LIMITER: { idFromName, get },
    } as unknown as Env;

    const request = () => new Request(PUBLIC_URL, {
      method: "POST",
      headers: {
        "cf-connecting-ip": "203.0.113.10",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "provider=google&contact=person%40example.test",
    });
    const response = await handleGatewayRequest(request(), env, runtime);
    await handleGatewayRequest(request(), env, runtime);

    const firstKey = idFromName.mock.calls[0]?.[0];
    expect(firstKey).toMatch(/^[a-f0-9]{64}$/);
    expect(firstKey).not.toContain("203.0.113.10");
    expect(idFromName.mock.calls[1]?.[0]).toBe(firstKey);
    expect(get).toHaveBeenNthCalledWith(1, "stable-rate-id");
    const limiterRequest = limiterFetch.mock.calls[0]?.[0];
    expect(await limiterRequest?.json()).toEqual({
      limit: 5,
      now: 1_787_699_200_000,
    });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("23");
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["throws", async () => { throw new Error("limiter offline"); }],
    ["returns an error", async () => new Response("error", { status: 500 })],
    ["returns malformed JSON", async () => Response.json({ success: "yes" })],
  ])("fails closed with a no-store 503 when the limiter %s", async (_label, limiterFetch) => {
    const fetch = vi.fn();
    const { env, runtime } = fixture({ fetch, limiterFetch });

    const response = await handleGatewayRequest(
      new Request(PUBLIC_URL, {
        headers: { "cf-connecting-ip": "203.0.113.10" },
      }),
      env,
      runtime,
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects oversized forms before contacting the origin", async () => {
    const fetch = vi.fn();
    const { env, runtime } = fixture({ fetch });

    const response = await handleGatewayRequest(
      new Request(PUBLIC_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "x".repeat(2049),
      }),
      env,
      runtime,
    );

    expect(response.status).toBe(413);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["https://gateway.example/other", "GET", 404],
    [PUBLIC_URL, "PUT", 405],
  ])("rejects unsupported route %s or method %s", async (url, method, status) => {
    const { env, runtime } = fixture();

    const response = await handleGatewayRequest(
      new Request(url, { method }),
      env,
      runtime,
    );

    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("no-store");
    if (status === 405) {
      expect(response.headers.get("allow")).toBe("GET, POST, OPTIONS");
    }
  });

  it.each([302, 503])(
    "converts upstream status %s into a no-store 502",
    async (status) => {
      const { env, runtime } = fixture({
        fetch: async () => new Response(null, { status }),
      });

      const response = await handleGatewayRequest(
        new Request(PUBLIC_URL),
        env,
        runtime,
      );

      expect(response.status).toBe(502);
      expect(response.headers.get("cache-control")).toBe("no-store");
    },
  );

  it("emits security telemetry without request identifiers", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { env, runtime } = fixture();
    const contact = "private-person@example.test";

    await handleGatewayRequest(
      new Request(PUBLIC_URL, {
        method: "POST",
        headers: {
          "cf-connecting-ip": "203.0.113.10",
          "content-type": "application/x-www-form-urlencoded",
        },
        body: `provider=google&contact=${encodeURIComponent(contact)}`,
      }),
      env,
      runtime,
    );

    const structuredLog = JSON.parse(String(log.mock.calls[0]?.[0])) as {
      event: string;
      method: string;
      status: number;
      timestamp: number;
    };
    const serializedLogs = JSON.stringify(log.mock.calls);
    expect(structuredLog).toEqual({
      event: "allowed",
      method: "POST",
      status: 200,
      timestamp: 1_787_699_200_000,
    });
    expect(serializedLogs).not.toContain(contact);
    expect(serializedLogs).not.toContain("203.0.113.10");
    expect(serializedLogs).not.toContain("test-gateway-secret");
    log.mockRestore();
  });
});
