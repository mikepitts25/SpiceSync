import * as AppleAuthentication from 'expo-apple-authentication';

import { AuthFlowError } from '../authConfig';
import { createNonce, sha256Hex } from '../nonce';
import type { ProviderCredential } from '../types';

export async function isAppleAvailable(): Promise<boolean> {
  return AppleAuthentication.isAvailableAsync();
}

export async function getAppleCredential(): Promise<ProviderCredential> {
  const rawNonce = createNonce();
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: sha256Hex(rawNonce),
  });

  if (!credential.identityToken) {
    throw new AuthFlowError('MISSING_TOKEN', 'Apple identity token is missing');
  }

  return {
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
    authorizationCode: credential.authorizationCode ?? undefined,
  };
}
