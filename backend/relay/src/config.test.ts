import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('uses safe defaults for local development', () => {
    const config = loadConfig({});

    expect(config.port).toBe(8787);
    expect(config.databasePath).toBe('./data/relay.sqlite');
    expect(config.publicBaseUrl).toBe('http://localhost:8787');
    expect(config.inviteTtlSeconds).toBe(7 * 24 * 60 * 60);
    expect(config.eventRetentionDays).toBe(90);
    expect(config.maxPayloadBytes).toBe(16 * 1024);
    expect(config.rateLimitWindowSeconds).toBe(60);
    expect(config.rateLimitMaxRequests).toBe(120);
  });

  it('parses environment overrides', () => {
    const config = loadConfig({
      RELAY_PORT: '9000',
      RELAY_DATABASE_PATH: '/var/lib/spicesync/relay.sqlite',
      RELAY_PUBLIC_BASE_URL: 'https://relay.spicesync.app',
      RELAY_INVITE_TTL_SECONDS: '3600',
      RELAY_EVENT_RETENTION_DAYS: '14',
      RELAY_MAX_PAYLOAD_BYTES: '2048',
      RELAY_RATE_LIMIT_WINDOW_SECONDS: '10',
      RELAY_RATE_LIMIT_MAX_REQUESTS: '20',
    });

    expect(config).toMatchObject({
      port: 9000,
      databasePath: '/var/lib/spicesync/relay.sqlite',
      publicBaseUrl: 'https://relay.spicesync.app',
      inviteTtlSeconds: 3600,
      eventRetentionDays: 14,
      maxPayloadBytes: 2048,
      rateLimitWindowSeconds: 10,
      rateLimitMaxRequests: 20,
    });
  });

  it('rejects invalid numeric settings', () => {
    expect(() => loadConfig({ RELAY_PORT: '0' })).toThrow(
      'RELAY_PORT must be between 1 and 65535',
    );
    expect(() => loadConfig({ RELAY_MAX_PAYLOAD_BYTES: '0' })).toThrow(
      'RELAY_MAX_PAYLOAD_BYTES must be positive',
    );
  });
});
