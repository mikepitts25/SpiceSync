const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_KEYS_URL = `${APPLE_ISSUER}/auth/keys`;
const APPLE_TOKEN_URL = `${APPLE_ISSUER}/auth/token`;
const APPLE_REVOKE_URL = `${APPLE_ISSUER}/auth/revoke`;

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

export class AppleRevocationError extends Error {
  constructor(readonly transient: boolean) {
    super("Apple token revocation failed");
    this.name = "AppleRevocationError";
  }
}

export async function exchangeAppleAuthorizationCode(
  code: string,
  credentials: AppleCredentials,
): Promise<AppleTokenExchange> {
  const response = await fetch(APPLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: await createAppleClientSecret(credentials),
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) throw new Error("Apple authorization code exchange failed");

  const body = await response.json();
  if (!isRecord(body) || typeof body.id_token !== "string") {
    throw new Error(
      "Apple authorization code exchange returned no identity token",
    );
  }
  const tokenToRevoke = typeof body.refresh_token === "string"
    ? body.refresh_token
    : typeof body.access_token === "string"
    ? body.access_token
    : null;
  if (tokenToRevoke === null) {
    throw new Error(
      "Apple authorization code exchange returned no revocable token",
    );
  }
  return { idToken: body.id_token, tokenToRevoke };
}

export async function verifyAppleIdentityToken(
  identityToken: string,
  clientId: string,
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

  const response = await fetch(APPLE_KEYS_URL, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error("Apple signing keys are unavailable");
  const keySet = await response.json();
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

  const now = Math.floor(Date.now() / 1000);
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
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(APPLE_REVOKE_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: await createAppleClientSecret(credentials),
        token,
        token_type_hint: "refresh_token",
      }),
    });
  } catch {
    throw new AppleRevocationError(true);
  }
  if (!response.ok) throw new AppleRevocationError(response.status >= 500);
}

async function createAppleClientSecret(
  credentials: AppleCredentials,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
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
      new TextEncoder().encode(`${header}.${payload}`),
    ),
  );
  if (signature.byteLength !== 64) {
    throw new Error("Apple client secret signature has an invalid format");
  }
  return `${header}.${payload}.${base64UrlEncode(signature)}`;
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
