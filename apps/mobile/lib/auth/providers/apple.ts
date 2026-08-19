import { AuthFlowError } from '../authConfig';
import type { ProviderCredential } from '../types';

export async function isAppleAvailable(): Promise<boolean> {
  return false;
}

export async function getAppleCredential(): Promise<ProviderCredential> {
  throw new AuthFlowError(
    'PROVIDER_UNAVAILABLE',
    'Apple sign-in is available only on iOS'
  );
}
