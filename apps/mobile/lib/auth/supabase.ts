import 'react-native-url-polyfill/auto';

import { processLock } from '@supabase/auth-js';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus } from 'react-native';

import { readSupabaseRelayConfig } from '../sync/supabaseConfig';
import { secureSessionStorage } from './secureSessionStorage';

let cachedClient: SupabaseClient | null = null;
let appStateSubscription: { remove(): void } | null = null;

function syncAutoRefresh(
  supabase: SupabaseClient,
  state: AppStateStatus
): void {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
}

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const config = readSupabaseRelayConfig();
  if (!config) {
    throw new Error('Supabase relay is not configured');
  }

  const supabase = createClient(config.url, config.anonKey, {
    auth: {
      storage: secureSessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });

  appStateSubscription = AppState.addEventListener('change', (state) => {
    syncAutoRefresh(supabase, state);
  });
  syncAutoRefresh(supabase, AppState.currentState);

  cachedClient = supabase;
  return cachedClient;
}

/**
 * Creates a short-lived client for destructive reauthentication. It must not
 * share the app's persisted session or AppState-driven refresh lifecycle.
 */
export function createIsolatedSupabaseClientForDeletion(): SupabaseClient {
  const config = readSupabaseRelayConfig();
  if (!config) {
    throw new Error('Supabase relay is not configured');
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function _resetSupabaseClientForTests(): void {
  cachedClient?.auth.stopAutoRefresh();
  appStateSubscription?.remove();
  appStateSubscription = null;
  cachedClient = null;
}

/** Removes the persisted session without making a network sign-out request. */
export async function clearSupabaseSessionOnDevice(): Promise<void> {
  if (!cachedClient) return;

  const { error } = await cachedClient.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
