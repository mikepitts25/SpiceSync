import { isSupabaseRelayConfigured } from '../sync/supabaseConfig';

const CANONICAL_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeStoreKitAppAccountToken(
  userId: string | null | undefined
): string | null {
  const trimmed = userId?.trim();
  if (!trimmed || !CANONICAL_UUID_PATTERN.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

export async function getStoreKitAppAccountToken(): Promise<string | null> {
  if (!isSupabaseRelayConfigured()) return null;

  const { getConfiguredSupabaseRelayClient } = require(
    '../sync/supabaseClient'
  ) as typeof import('../sync/supabaseClient');
  const userId =
    await getConfiguredSupabaseRelayClient().getAuthenticatedUserId();
  const appAccountToken = normalizeStoreKitAppAccountToken(userId);
  if (!appAccountToken) {
    throw new Error(
      'Supabase auth user id is not a valid StoreKit appAccountToken UUID.'
    );
  }

  return appAccountToken;
}
