export interface Env {
  UPSTREAM_URL: string;
  GATEWAY_SHARED_SECRET: string;
  RATE_LIMITER: DurableObjectNamespace;
  SECURITY_EVENTS: AnalyticsEngineDataset;
}

export interface GatewayRuntime {
  fetch(request: Request): Promise<Response>;
  now(): number;
}

type SecurityEvent = "allowed" | "rate_limited" | "upstream_error";

export interface FixedWindowState {
  windowStart: number;
  count: number;
}

export interface FixedWindowResult {
  state: FixedWindowState;
  success: boolean;
  retryAfter: number;
}

const ALLOWED_METHODS = "GET, POST, OPTIONS";
const MAX_FORM_BODY_BYTES = 2048;
const RATE_LIMIT_WINDOW_MS = 60_000;
const TRUSTED_BROWSER_ORIGIN = "https://spicesync.app";
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

export function consumeFixedWindow(
  state: FixedWindowState | undefined,
  limit: number,
  now: number,
): FixedWindowResult {
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  const retryAfter = Math.max(
    1,
    Math.ceil((windowStart + RATE_LIMIT_WINDOW_MS - now) / 1_000),
  );
  if (state?.windowStart !== windowStart) {
    return {
      state: { windowStart, count: 1 },
      success: true,
      retryAfter,
    };
  }
  if (state.count >= limit) {
    return { state, success: false, retryAfter };
  }
  return {
    state: { windowStart, count: state.count + 1 },
    success: true,
    retryAfter,
  };
}

export class DeletionRateLimiter {
  constructor(private readonly ctx: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const payload = await request.json<{ limit?: unknown; now?: unknown }>();
    if (
      request.method !== "POST" ||
      !Number.isInteger(payload.limit) ||
      !Number.isFinite(payload.now) ||
      Number(payload.limit) < 1 ||
      Number(payload.now) < 0
    ) {
      return new Response("Invalid rate-limit request", { status: 400 });
    }
    const state = await this.ctx.storage.get<FixedWindowState>("state");
    const result = consumeFixedWindow(
      state,
      Number(payload.limit),
      Number(payload.now),
    );
    if (result.success) {
      await this.ctx.storage.put("state", result.state);
    }
    return Response.json({
      success: result.success,
      retryAfter: result.retryAfter,
    });
  }
}

async function rateLimitObjectName(
  method: string,
  connectingIp: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`rate-limit:v1:${method}:${connectingIp}`),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

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
    return noStoreResponse(null, 204, { allow: ALLOWED_METHODS });
  }
  if (request.method !== "GET" && request.method !== "POST") {
    return noStoreResponse("Method Not Allowed", 405, {
      allow: ALLOWED_METHODS,
    });
  }

  let rateResult: { success: boolean; retryAfter: number };
  try {
    const key = await rateLimitObjectName(
      request.method,
      request.headers.get("cf-connecting-ip") ?? "unknown",
      env.GATEWAY_SHARED_SECRET,
    );
    const limiterId = env.RATE_LIMITER.idFromName(key);
    const limiter = env.RATE_LIMITER.get(limiterId);
    const rateResponse = await limiter.fetch(
      new Request("https://rate-limiter.internal/consume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          limit: request.method === "POST" ? 5 : 30,
          now: runtime.now(),
        }),
      }),
    );
    if (!rateResponse.ok) throw new Error("Rate limiter unavailable");
    const candidate: unknown = await rateResponse.json();
    if (
      typeof candidate !== "object" ||
      candidate === null ||
      typeof (candidate as { success?: unknown }).success !== "boolean" ||
      !Number.isInteger((candidate as { retryAfter?: unknown }).retryAfter) ||
      Number((candidate as { retryAfter?: unknown }).retryAfter) < 1 ||
      Number((candidate as { retryAfter?: unknown }).retryAfter) > 60
    ) {
      throw new Error("Invalid rate limiter response");
    }
    rateResult = candidate as { success: boolean; retryAfter: number };
  } catch {
    recordEvent(env, runtime, "upstream_error", request.method, 503);
    return noStoreResponse("Service Unavailable", 503);
  }
  if (!rateResult.success) {
    recordEvent(env, runtime, "rate_limited", request.method, 429);
    return noStoreResponse("Too Many Requests", 429, {
      "retry-after": String(rateResult.retryAfter),
    });
  }

  let body: ArrayBuffer | undefined;
  if (request.method === "POST") {
    const contentLength = request.headers.get("content-length");
    if (
      contentLength !== null &&
      /^\d+$/.test(contentLength) &&
      Number(contentLength) > MAX_FORM_BODY_BYTES
    ) {
      return noStoreResponse("Request Entity Too Large", 413);
    }
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_FORM_BODY_BYTES) {
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
    if (
      (upstream.status >= 300 && upstream.status < 400) ||
      upstream.status >= 500
    ) {
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
  if (request.headers.get("origin") === TRUSTED_BROWSER_ORIGIN) {
    headers.set("origin", TRUSTED_BROWSER_ORIGIN);
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

export default {
  fetch: (request, env) => handleGatewayRequest(request, env),
} satisfies ExportedHandler<Env>;
