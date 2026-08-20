import { assertEquals, assertRejects } from "jsr:@std/assert@1";

import { verifyGoogleIdentityToken } from "./google.ts";

const NOW = 1_787_264_000;
const AUDIENCE = "web-client.apps.googleusercontent.com";

Deno.test("verifies a hermetic RSA-signed recent Google identity token", async () => {
  const fixture = await rsaFixture();
  const token = await signToken(fixture.privateKey, {
    iss: "https://accounts.google.com",
    aud: AUDIENCE,
    sub: "google-subject",
    exp: NOW + 300,
    nbf: NOW - 1,
    iat: NOW - 10,
  });

  assertEquals(
    await verifyGoogleIdentityToken(token, AUDIENCE, {
      now: () => NOW * 1000,
      fetch: keysFetch(fixture.jwk),
    }),
    { subject: "google-subject" },
  );
});

Deno.test("rejects bad signatures, issuer, exact audience, and stale or future claims", async () => {
  const fixture = await rsaFixture();
  const other = await rsaFixture();
  const valid = {
    iss: "accounts.google.com",
    aud: AUDIENCE,
    sub: "google-subject",
    exp: NOW + 300,
    nbf: NOW - 1,
    iat: NOW - 10,
  };
  const cases = [
    await signToken(other.privateKey, valid),
    await signToken(fixture.privateKey, { ...valid, iss: "https://evil.test" }),
    await signToken(fixture.privateKey, { ...valid, aud: "ios-client" }),
    await signToken(fixture.privateKey, { ...valid, aud: [AUDIENCE] }),
    await signToken(fixture.privateKey, { ...valid, exp: NOW - 61 }),
    await signToken(fixture.privateKey, { ...valid, nbf: NOW + 61 }),
    await signToken(fixture.privateKey, { ...valid, iat: NOW - 301 }),
    await signToken(fixture.privateKey, { ...valid, iat: NOW + 61 }),
  ];

  for (const token of cases) {
    await assertRejects(() =>
      verifyGoogleIdentityToken(token, AUDIENCE, {
        now: () => NOW * 1000,
        fetch: keysFetch(fixture.jwk),
      })
    );
  }
});

type GoogleJwk = JsonWebKey & { alg: string; kid: string };

async function rsaFixture(): Promise<{
  jwk: GoogleJwk;
  privateKey: CryptoKey;
}> {
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
      kid: "google-test-key",
    } as GoogleJwk,
    privateKey: pair.privateKey,
  };
}

async function signToken(
  privateKey: CryptoKey,
  claims: Record<string, unknown>,
): Promise<string> {
  const header = encodeJson({ alg: "RS256", kid: "google-test-key" });
  const payload = encodeJson(claims);
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      privateKey,
      new TextEncoder().encode(`${header}.${payload}`),
    ),
  );
  return `${header}.${payload}.${base64Url(signature)}`;
}

function keysFetch(jwk: GoogleJwk): typeof fetch {
  return (async (input: string | URL | Request) => {
    assertEquals(String(input), "https://www.googleapis.com/oauth2/v3/certs");
    return Response.json({ keys: [jwk] });
  }) as typeof fetch;
}

function encodeJson(value: Record<string, unknown>): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function base64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll(
    "=",
    "",
  );
}
