const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_KEYS_URL = `${APPLE_ISSUER}/auth/keys`;
const APPLE_TOKEN_URL = `${APPLE_ISSUER}/auth/token`;
const APPLE_REVOKE_URL = `${APPLE_ISSUER}/auth/revoke`;

export type AppleFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface AppleRuntime {
  fetch?: AppleFetch;
  now?: () => number;
}

export interface AppleCredentials {
  clientId: string;
  keyId: string;
  privateKey: string;
  teamId: string;
}

export interface AppleTokenExchange {
  idToken: string;
  tokenToRevoke: string;
}

export interface VerifiedAppleIdentity {
  subject: string;
}

/** A revocation response Apple explicitly rejected and that must block deletion. */
export class AppleRevocationError extends Error {
  constructor(readonly reason: "client_4xx") {
    super("Apple token revocation was rejected");
    this.name = "AppleRevocationError";
  }
}

/** Only transport errors and Apple 5xx responses may be retried after deletion. */
export class AppleTransientRevocationError extends Error {
  constructor(readonly reason: "network" | "server_5xx") {
    super("Apple token revocation is temporarily unavailable");
    this.name = "AppleTransientRevocationError";
  }
}

export class AppleTokenExchangeError extends Error {
  constructor() {
    super("Apple authorization code exchange failed");
    this.name = "AppleTokenExchangeError";
  }
}

export async function exchangeAppleAuthorizationCode(
  code: string,
  credentials: AppleCredentials,
  runtime: AppleRuntime = {},
): Promise<AppleTokenExchange> {
  // Keep key import/signing outside the transport catch: bad local credentials
  // are not transient Apple endpoint failures and must never be misclassified.
  const clientSecret = await createAppleClientSecret(credentials, runtime.now);
  let response: Response;
  try {
    response = await appleFetch(runtime)(APPLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });
  } catch {
    throw new AppleTokenExchangeError();
  }
  if (!response.ok) throw new AppleTokenExchangeError();

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AppleTokenExchangeError();
  }
  if (
    !isRecord(body) || typeof body.id_token !== "string" ||
    body.id_token.length === 0 || typeof body.refresh_token !== "string" ||
    body.refresh_token.length === 0
  ) {
    throw new AppleTokenExchangeError();
  }
  return { idToken: body.id_token, tokenToRevoke: body.refresh_token };
}

export async function verifyAppleIdentityToken(
  identityToken: string,
  clientId: string,
  runtime: AppleRuntime = {},
): Promise<VerifiedAppleIdentity> {
  const parts = identityToken.split(".");
  if (parts.length !== 3) throw new Error("Apple identity token is malformed");

  const header = parseJsonPart(parts[0]);
  const claims = parseJsonPart(parts[1]);
  if (
    header.alg !== "RS256" || typeof header.kid !== "string" ||
    header.kid.length === 0
  ) {
    throw new Error("Apple identity token uses an unsupported signature");
  }

  const response = await appleFetch(runtime)(APPLE_KEYS_URL, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error("Apple signing keys are unavailable");
  let keySet: unknown;
  try {
    keySet = await response.json();
  } catch {
    throw new Error("Apple signing keys are malformed");
  }
  if (!isRecord(keySet) || !Array.isArray(keySet.keys)) {
    throw new Error("Apple signing keys are malformed");
  }
  const jwk = keySet.keys.find((candidate) =>
    isRecord(candidate) && candidate.kid === header.kid &&
    candidate.kty === "RSA" &&
    (candidate.alg === undefined || candidate.alg === "RS256")
  );
  if (!isRecord(jwk)) throw new Error("Apple signing key was not found");

  let verificationKey: CryptoKey;
  try {
    verificationKey = await crypto.subtle.importKey(
      "jwk",
      jwk as JsonWebKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
  } catch {
    throw new Error("Apple signing key is invalid");
  }
  const valid = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    verificationKey,
    toArrayBuffer(base64UrlToBytes(parts[2])),
    toArrayBuffer(new TextEncoder().encode(`${parts[0]}.${parts[1]}`)),
  );
  if (!valid) throw new Error("Apple identity token signature is invalid");

  const now = currentUnixTime(runtime.now);
  const audienceMatches = claims.aud === clientId ||
    (Array.isArray(claims.aud) && claims.aud.includes(clientId));
  if (
    claims.iss !== APPLE_ISSUER || !audienceMatches ||
    typeof claims.sub !== "string" || claims.sub.length === 0 ||
    !isValidExpiration(claims.exp, now) || !isValidIssuedAt(claims.iat, now) ||
    !isValidNotBefore(claims.nbf, now)
  ) {
    throw new Error("Apple identity token claims are invalid");
  }
  return { subject: claims.sub };
}

export async function revokeAppleToken(
  token: string,
  credentials: AppleCredentials,
  runtime: AppleRuntime = {},
): Promise<void> {
  // It is deliberate that this happens before the catch. Private-key parsing,
  // signing, and configuration faults must block rather than continue cleanup.
  const clientSecret = await createAppleClientSecret(credentials, runtime.now);
  let response: Response;
  try {
    response = await appleFetch(runtime)(APPLE_REVOKE_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: clientSecret,
        token,
        token_type_hint: "refresh_token",
      }),
    });
  } catch {
    throw new AppleTransientRevocationError("network");
  }
  if (response.status >= 500) {
    throw new AppleTransientRevocationError("server_5xx");
  }
  if (!response.ok) throw new AppleRevocationError("client_4xx");
}

export async function createAppleClientSecret(
  credentials: AppleCredentials,
  nowSource?: () => number,
): Promise<string> {
  const now = currentUnixTime(nowSource);
  const header = base64UrlJson({
    alg: "ES256",
    kid: credentials.keyId,
    typ: "JWT",
  });
  const payload = base64UrlJson({
    aud: APPLE_ISSUER,
    exp: now + 300,
    iat: now,
    iss: credentials.teamId,
    sub: credentials.clientId,
  });
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    toArrayBuffer(pemToBytes(credentials.privateKey)),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      privateKey,
      toArrayBuffer(new TextEncoder().encode(`${header}.${payload}`)),
    ),
  );
  if (signature.byteLength !== 64) {
    throw new Error("Apple client secret signature has an invalid format");
  }
  return `${header}.${payload}.${base64UrlEncode(signature)}`;
}

function appleFetch(runtime: AppleRuntime): AppleFetch {
  return runtime.fetch ?? ((input, init) => {
    if (input instanceof Request) return fetch(input);
    return fetch(input, init);
  });
}

function currentUnixTime(nowSource?: () => number): number {
  return nowSource === undefined
    ? Math.floor(Date.now() / 1000)
    : Math.floor(nowSource());
}

function parseJsonPart(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(value)),
    );
    if (!isRecord(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new Error("Apple identity token is malformed");
  }
}

function pemToBytes(value: string): Uint8Array {
  const normalized = value.replaceAll("\\n", "\n").trim();
  const pem = normalized.replace(
    /-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,
    "",
  );
  if (pem.length === 0) throw new Error("Apple private key is malformed");
  return base64ToBytes(pem);
}

function base64UrlJson(value: Record<string, unknown>): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlEncode(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll(
    "=",
    "",
  );
}

function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url");
  return base64ToBytes(
    value.replaceAll("-", "+").replaceAll("_", "/") +
      "=".repeat((4 - value.length % 4) % 4),
  );
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidExpiration(value: unknown, now: number): boolean {
  return typeof value === "number" && Number.isFinite(value) &&
    value >= now - 60;
}

function isValidIssuedAt(value: unknown, now: number): boolean {
  return typeof value === "number" && Number.isFinite(value) &&
    value <= now + 300;
}

function isValidNotBefore(value: unknown, now: number): boolean {
  return value === undefined ||
    (typeof value === "number" && Number.isFinite(value) && value <= now + 60);
}
