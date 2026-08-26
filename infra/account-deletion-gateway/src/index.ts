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

type SecurityEvent = "allowed" | "rate_limited" | "upstream_error";

const ALLOWED_METHODS = "GET, POST, OPTIONS";
const MAX_FORM_BODY_BYTES = 2048;
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

  const limiter = request.method === "POST"
    ? env.SUBMIT_RATE_LIMITER
    : env.FORM_RATE_LIMITER;
  const rateResult = await limiter.limit({
    key: `${request.method}:${request.headers.get("cf-connecting-ip") ?? "unknown"}`,
  });
  if (!rateResult.success) {
    recordEvent(env, runtime, "rate_limited", request.method, 429);
    return noStoreResponse("Too Many Requests", 429, {
      "retry-after": "60",
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
