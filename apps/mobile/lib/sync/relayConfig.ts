import type { RelayTransport } from './relayClient';
import { isSupabaseRelayConfigured } from './supabaseConfig';

declare const require: <T = unknown>(path: string) => T;

let cachedClient: RelayTransport | null = null;

export function getRelayClient(): RelayTransport {
  if (cachedClient) return cachedClient;
  if (!isSupabaseRelayConfigured()) {
    throw new Error('Supabase partner sync is not configured');
  }

  const { getConfiguredSupabaseRelayClient } = require<
    typeof import('./supabaseClient')
  >('./supabaseClient');
  cachedClient = getConfiguredSupabaseRelayClient();
  return cachedClient;
}

export function _resetRelayClientForTests(client?: RelayTransport): void {
  cachedClient = client ?? null;
}
