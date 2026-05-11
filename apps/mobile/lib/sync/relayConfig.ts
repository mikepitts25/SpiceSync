import Constants from 'expo-constants';

import { RelayClient } from './relayClient';

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

let cachedClient: RelayClient | null = null;
let overrideBaseUrl: string | null = null;

export function getRelayBaseUrl(): string {
  return overrideBaseUrl || readBaseUrl();
}

export function setRelayBaseUrl(url: string | null): void {
  overrideBaseUrl = url ? url.replace(/\/+$/, '') : null;
  cachedClient = null;
}

export function getRelayClient(): RelayClient {
  if (!cachedClient) cachedClient = new RelayClient(getRelayBaseUrl());
  return cachedClient;
}

export function _resetRelayClientForTests(client?: RelayClient): void {
  cachedClient = client ?? null;
}
