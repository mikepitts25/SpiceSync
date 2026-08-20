import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1";

import {
  type AppleCredentials,
  type AppleFetch,
  AppleRevocationError,
  AppleTransientRevocationError,
  createAppleClientSecret,
  exchangeAppleAuthorizationCode,
  revokeAppleToken,
  verifyAppleIdentityToken,
} from "./apple.ts";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_CLIENT_ID = "com.spicesync.app";
const NOW = 1_700_000_000;
type AppleJwk = JsonWebKey & { alg: string; kid: string };

Deno.test("creates a verifiable ES256 Apple client secret with required claims", async () => {
  const fixture = await p256Credentials();
  const token = await createAppleClientSecret(fixture.credentials, () => NOW);
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  const header = decodeJson(encodedHeader);
  const payload = decodeJson(encodedPayload);

  assertEquals(header, { alg: "ES256", kid: "apple-key-id", typ: "JWT" });
  assertEquals(payload, {
    aud: APPLE_ISSUER,
    exp: NOW + 300,
    iat: NOW,
    iss: "apple-team-id",
    sub: APPLE_CLIENT_ID,
  });
  assert(
    await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      fixture.publicKey,
      arrayBuffer(bytes(encodedSignature)),
      arrayBuffer(
        new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
      ),
    ),
  );
});

Deno.test("exchanges Apple codes with form encoding and rejects malformed token responses", async () => {
  const fixture = await p256Credentials();
  let captured: URLSearchParams | undefined;
  const result = await exchangeAppleAuthorizationCode(
    "code+with&reserved=characters",
    fixture.credentials,
    {
      fetch: async (input, init) => {
        assertEquals(String(input), `${APPLE_ISSUER}/auth/token`);
        assertEquals(init?.method, "POST");
        assert(init?.body instanceof URLSearchParams);
        captured = init.body;
        return Response.json({
          access_token: "access-token",
          id_token: "identity-token",
          refresh_token: "refresh-token",
        });
      },
      now: () => NOW,
    },
  );

  assertEquals(result, {
    idToken: "identity-token",
    tokenToRevoke: "refresh-token",
  });
  assertEquals(captured?.get("client_id"), APPLE_CLIENT_ID);
  assertEquals(captured?.get("code"), "code+with&reserved=characters");
  assertEquals(captured?.get("grant_type"), "authorization_code");
  assert(typeof captured?.get("client_secret") === "string");
  await assertRejects(
    () =>
      exchangeAppleAuthorizationCode("code", fixture.credentials, {
        fetch: async () => Response.json({ id_token: "identity-token" }),
        now: () => NOW,
      }),
  );
});

Deno.test("verifies a signed Apple identity token against its matching JWKS key", async () => {
  const fixture = await rsaFixture();
  const token = await signIdentityToken(fixture.privateKey, {
    aud: APPLE_CLIENT_ID,
    exp: NOW + 60,
    iat: NOW - 1,
    iss: APPLE_ISSUER,
    nbf: NOW - 1,
    sub: "apple-linked-subject",
  });

  const result = await verifyAppleIdentityToken(token, APPLE_CLIENT_ID, {
    fetch: appleKeysFetch(fixture.jwk),
    now: () => NOW,
  });

  assertEquals(result, { subject: "apple-linked-subject" });
});

Deno.test("rejects invalid Apple identity algorithms, signatures, and claims", async () => {
  const fixture = await rsaFixture();
  const validClaims = {
    aud: APPLE_CLIENT_ID,
    exp: NOW + 60,
    iat: NOW - 1,
    iss: APPLE_ISSUER,
    sub: "apple-linked-subject",
  };
  const invalidCases = [
    await signIdentityToken(fixture.privateKey, validClaims, {
      alg: "HS256",
      kid: "apple-rsa-kid",
    }),
    corruptSignature(await signIdentityToken(fixture.privateKey, validClaims)),
    await signIdentityToken(fixture.privateKey, {
      ...validClaims,
      iss: "https://attacker.example",
    }),
    await signIdentityToken(fixture.privateKey, {
      ...validClaims,
      aud: "wrong-client",
    }),
    await signIdentityToken(fixture.privateKey, {
      ...validClaims,
      exp: NOW - 61,
    }),
    await signIdentityToken(fixture.privateKey, {
      ...validClaims,
      nbf: NOW + 61,
    }),
    await signIdentityToken(fixture.privateKey, { ...validClaims, sub: "" }),
  ];

  for (const token of invalidCases) {
    await assertRejects(
      () =>
        verifyAppleIdentityToken(token, APPLE_CLIENT_ID, {
          fetch: appleKeysFetch(fixture.jwk),
          now: () => NOW,
        }),
    );
  }
});

Deno.test("classifies only revoke transport and 5xx failures as transient", async () => {
  const fixture = await p256Credentials();
  let captured: URLSearchParams | undefined;
  await revokeAppleToken("refresh+token", fixture.credentials, {
    fetch: async (input, init) => {
      assertEquals(String(input), `${APPLE_ISSUER}/auth/revoke`);
      assertEquals(init?.method, "POST");
      assert(init?.body instanceof URLSearchParams);
      captured = init.body;
      return new Response(null, { status: 200 });
    },
    now: () => NOW,
  });
  assertEquals(captured?.get("token"), "refresh+token");
  assertEquals(captured?.get("token_type_hint"), "refresh_token");

  const transientFetches: AppleFetch[] = [
    async () => {
      throw new TypeError("network down");
    },
    async () => new Response(null, { status: 503 }),
  ];
  for (const fetch of transientFetches) {
    await assertRejects(
      () =>
        revokeAppleToken("refresh-token", fixture.credentials, {
          fetch,
          now: () => NOW,
        }),
      AppleTransientRevocationError,
    );
  }

  await assertRejects(
    () =>
      revokeAppleToken("refresh-token", fixture.credentials, {
        fetch: async () => new Response(null, { status: 400 }),
        now: () => NOW,
      }),
    AppleRevocationError,
  );
  let fetchCalled = false;
  await assertRejects(
    () =>
      revokeAppleToken("refresh-token", {
        ...fixture.credentials,
        privateKey: "not-a-private-key",
      }, {
        fetch: async () => {
          fetchCalled = true;
          return new Response(null, { status: 200 });
        },
        now: () => NOW,
      }),
  );
  assertEquals(fetchCalled, false);
});

async function p256Credentials(): Promise<
  { credentials: AppleCredentials; publicKey: CryptoKey }
> {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  ) as CryptoKeyPair;
  const privateKey = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", pair.privateKey),
  );
  return {
    credentials: {
      clientId: APPLE_CLIENT_ID,
      keyId: "apple-key-id",
      privateKey: pem(privateKey),
      teamId: "apple-team-id",
    },
    publicKey: pair.publicKey,
  };
}

async function rsaFixture(): Promise<{ jwk: AppleJwk; privateKey: CryptoKey }> {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
    },
    true,
    ["sign", "verify"],
  ) as CryptoKeyPair;
  return {
    jwk: {
      ...await crypto.subtle.exportKey("jwk", pair.publicKey),
      alg: "RS256",
      kid: "apple-rsa-kid",
    } as AppleJwk,
    privateKey: pair.privateKey,
  };
}

async function signIdentityToken(
  privateKey: CryptoKey,
  claims: Record<string, unknown>,
  header: Record<string, unknown> = { alg: "RS256", kid: "apple-rsa-kid" },
): Promise<string> {
  const encodedHeader = encodeJson(header);
  const encodedClaims = encodeJson(claims);
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      privateKey,
      new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`),
    ),
  );
  return `${encodedHeader}.${encodedClaims}.${base64Url(signature)}`;
}

function appleKeysFetch(jwk: AppleJwk): AppleFetch {
  return async (input) => {
    assertEquals(String(input), `${APPLE_ISSUER}/auth/keys`);
    return Response.json({ keys: [jwk] });
  };
}

function pem(value: Uint8Array): string {
  const base64 = toBase64(value);
  return `-----BEGIN PRIVATE KEY-----\n${
    base64.match(/.{1,64}/g)?.join("\n")
  }\n-----END PRIVATE KEY-----`;
}

function encodeJson(value: Record<string, unknown>): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodeJson(value: string): unknown {
  return JSON.parse(new TextDecoder().decode(bytes(value)));
}

function base64Url(value: Uint8Array): string {
  return toBase64(value).replaceAll("+", "-").replaceAll("/", "_").replaceAll(
    "=",
    "",
  );
}

function toBase64(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function bytes(value: string): Uint8Array {
  const binary = atob(
    value.replaceAll("-", "+").replaceAll("_", "/") +
      "=".repeat((4 - value.length % 4) % 4),
  );
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function corruptSignature(token: string): string {
  const [header, claims, signature] = token.split(".");
  const first = signature[0];
  return `${header}.${claims}.${first === "A" ? "B" : "A"}${
    signature.slice(1)
  }`;
}

function arrayBuffer(value: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
}
