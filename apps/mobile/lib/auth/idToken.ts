import type { ProviderCredential } from './types';
import { bytesToUtf8, decodeBase64 } from '../sync/base64';

export type IdTokenCredentialPayload = {
  provider: ProviderCredential['provider'];
  token: string;
  access_token?: string;
  nonce?: string;
};

function readClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => part.length === 0))
    return null;
  try {
    const claims = JSON.parse(bytesToUtf8(decodeBase64(parts[1])));
    return claims && typeof claims === 'object' && !Array.isArray(claims)
      ? claims
      : null;
  } catch {
    return null;
  }
}

/**
 * Supabase must receive a raw nonce iff the provider ID token contains its
 * corresponding nonce claim. Native providers are inconsistent about whether
 * they return that claim, so derive the request shape from the returned token.
 */
export function credentialPayloadForIdToken(
  input: ProviderCredential
): IdTokenCredentialPayload {
  const claims = readClaims(input.token);
  if (!claims) {
    // Keep compatibility with providers/tests that do not need nonce handling,
    // but never forward a nonce alongside a token we cannot inspect.
    if (input.nonce) throw new Error('Provider returned an invalid ID token');
    return {
      provider: input.provider,
      token: input.token,
      access_token: input.accessToken ?? input.authorizationCode,
    };
  }

  const tokenHasNonce =
    typeof claims.nonce === 'string' && claims.nonce.length > 0;
  if (tokenHasNonce && !input.nonce) {
    throw new Error('Provider ID token requires its matching raw nonce');
  }

  return {
    provider: input.provider,
    token: input.token,
    access_token: input.accessToken ?? input.authorizationCode,
    ...(tokenHasNonce ? { nonce: input.nonce } : {}),
  };
}
