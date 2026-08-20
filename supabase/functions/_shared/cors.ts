const ALLOWED_ORIGINS = new Set(["https://spicesync.app"]);

export function responseHeaders(
  request: Request,
  contentType: string,
  methods: string,
): Headers {
  const headers = new Headers({
    "cache-control": "no-store",
    "content-security-policy":
      "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    "content-type": contentType,
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
  });
  const origin = request.headers.get("origin");
  if (origin !== null && ALLOWED_ORIGINS.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", methods);
    headers.set("access-control-allow-headers", "authorization, content-type");
    headers.set("vary", "origin");
  }
  return headers;
}

export function isAllowedCorsOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === null || ALLOWED_ORIGINS.has(origin);
}
