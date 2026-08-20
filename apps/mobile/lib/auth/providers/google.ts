import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import { AuthFlowError, readAuthConfig } from '../authConfig';
import type { ProviderCredential } from '../types';

export function isGoogleConfigured(
  platform: typeof Platform.OS = Platform.OS,
  config = readAuthConfig()
): boolean {
  return (
    config.googleWebClientId !== null &&
    (platform !== 'ios' || config.googleIosClientId !== null)
  );
}

export async function getGoogleCredential(): Promise<ProviderCredential> {
  const config = readAuthConfig();
  if (
    !config.googleWebClientId ||
    (Platform.OS === 'ios' && !config.googleIosClientId)
  ) {
    throw new AuthFlowError(
      'PROVIDER_NOT_CONFIGURED',
      'Google web client ID is not configured'
    );
  }

  GoogleSignin.configure({
    webClientId: config.googleWebClientId,
    iosClientId: config.googleIosClientId ?? undefined,
    offlineAccess: false,
  });
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (response.type === 'cancelled') {
    throw new AuthFlowError('CANCELLED', 'Google sign-in was cancelled');
  }
  if (!response.data.idToken) {
    throw new AuthFlowError('MISSING_TOKEN', 'Google ID token is missing');
  }

  const tokens = await GoogleSignin.getTokens();
  if (!tokens.accessToken) {
    throw new AuthFlowError(
      'MISSING_ACCESS_TOKEN',
      'Google access token is missing'
    );
  }

  return {
    provider: 'google',
    token: response.data.idToken,
    accessToken: tokens.accessToken,
  };
}
