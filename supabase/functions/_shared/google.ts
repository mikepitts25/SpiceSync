const GOOGLE_KEYS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set([
  "accounts.google.com",
  "https://accounts.google.com",
]);
const CLOCK_SKEW_SECONDS = 60;
const MAX_TOKEN_AGE_SECONDS = 300;

export interface GoogleRuntime {
  fetch?: typeof fetch;
  now?: () => number;
}

export async function verifyGoogleIdentityToken(
  identityToken: string,
  webClientId: string,
  runtime: GoogleRuntime = {},
): Promise<{ subject: string }> {
  const parts = identityToken.split(".");
  if (parts.length !== 3) throw new Error("Google identity token is malformed");
  const header = parseJsonPart(parts[0]);
  const claims = parseJsonPart(parts[1]);
  if (
    header.alg !== "RS256" || typeof header.kid !== "string" ||
    header.kid.length === 0
  ) {
    throw new Error("Google identity token uses an unsupported signature");
  }

  const response = await (runtime.fetch ?? fetch)(GOOGLE_KEYS_URL, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error("Google signing keys are unavailable");
  let keySet: unknown;
  try {
    keySet = await response.json();
  } catch {
    throw new Error("Google signing keys are malformed");
  }
  if (!isRecord(keySet) || !Array.isArray(keySet.keys)) {
    throw new Error("Google signing keys are malformed");
  }
  const jwk = keySet.keys.find((candidate) =>
    isRecord(candidate) && candidate.kid === header.kid &&
    candidate.kty === "RSA" &&
    (candidate.alg === undefined || candidate.alg === "RS256")
  );
  if (!isRecord(jwk)) throw new Error("Google signing key was not found");

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "jwk",
      jwk as JsonWebKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
  } catch {
    throw new Error("Google signing key is invalid");
  }
  const valid = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    toArrayBuffer(base64UrlToBytes(parts[2])),
    toArrayBuffer(new TextEncoder().encode(`${parts[0]}.${parts[1]}`)),
  );
  if (!valid) throw new Error("Google identity token signature is invalid");

  const now = Math.floor((runtime.now?.() ?? Date.now()) / 1000);
  if (
    typeof webClientId !== "string" || webClientId.length === 0 ||
    !GOOGLE_ISSUERS.has(String(claims.iss)) ||
    claims.aud !== webClientId ||
    typeof claims.sub !== "string" || claims.sub.length === 0 ||
    !isInteger(claims.exp) || claims.exp < now - CLOCK_SKEW_SECONDS ||
    (claims.nbf !== undefined &&
      (!isInteger(claims.nbf) || claims.nbf > now + CLOCK_SKEW_SECONDS)) ||
    !isInteger(claims.iat) || claims.iat > now + CLOCK_SKEW_SECONDS ||
    now - claims.iat > MAX_TOKEN_AGE_SECONDS
  ) {
    throw new Error("Google identity token claims are invalid");
  }
  return { subject: claims.sub };
}

function parseJsonPart(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(value)),
    );
    if (isRecord(parsed)) return parsed;
  } catch {
    // Normalize all parse failures below.
  }
  throw new Error("Google identity token is malformed");
}

function base64UrlToBytes(value: string): Uint8Array {
  const binary = atob(
    value.replaceAll("-", "+").replaceAll("_", "/") +
      "=".repeat((4 - value.length % 4) % 4),
  );
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(
    value.byteOffset,
    value.byteOffset + value.byteLength,
  ) as ArrayBuffer;
}
