import Constants from 'expo-constants';

import { RelayClient, type RelayTransport } from './relayClient';
import { isSupabaseRelayConfigured } from './supabaseConfig';

declare const require: <T = unknown>(path: string) => T;

const DEFAULT_BASE_URL = 'https://relay.spicesync.app';

function readBaseUrl(): string {
  const extra =
    (Constants.expoConfig?.extra as { relayBaseUrl?: string } | undefined) ??
    {};
  return (
    extra.relayBaseUrl ||
    process.env.EXPO_PUBLIC_RELAY_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/, '');
}

let cachedClient: RelayTransport | null = null;
let overrideBaseUrl: string | null = null;

export function getRelayBaseUrl(): string {
  return overrideBaseUrl || readBaseUrl();
}

export function setRelayBaseUrl(url: string | null): void {
  overrideBaseUrl = url ? url.replace(/\/+$/, '') : null;
  cachedClient = null;
}

export function getRelayClient(): RelayTransport {
  if (cachedClient) return cachedClient;
  if (!overrideBaseUrl && isSupabaseRelayConfigured()) {
    const { getConfiguredSupabaseRelayClient } = require<
      typeof import('./supabaseClient')
    >('./supabaseClient');
    cachedClient = getConfiguredSupabaseRelayClient();
    return cachedClient;
  }
  cachedClient = new RelayClient(getRelayBaseUrl());
  return cachedClient;
}

export function _resetRelayClientForTests(client?: RelayTransport): void {
  cachedClient = client ?? null;
}
