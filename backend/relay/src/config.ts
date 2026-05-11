export type RelayConfig = {
  port: number;
  databasePath: string;
  publicBaseUrl: string;
  inviteTtlSeconds: number;
  eventRetentionDays: number;
  maxPayloadBytes: number;
  rateLimitWindowSeconds: number;
  rateLimitMaxRequests: number;
};

type Env = Record<string, string | undefined>;

function numberSetting(env: Env, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined || raw.trim() === '') return fallback;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${key} must be an integer`);
  }

  return parsed;
}

function positiveSetting(env: Env, key: string, fallback: number): number {
  const value = numberSetting(env, key, fallback);
  if (value <= 0) {
    throw new Error(`${key} must be positive`);
  }

  return value;
}

export function loadConfig(env: Env = process.env): RelayConfig {
  const port = numberSetting(env, 'RELAY_PORT', 8787);
  if (port < 1 || port > 65535) {
    throw new Error('RELAY_PORT must be between 1 and 65535');
  }

  return {
    port,
    databasePath: env.RELAY_DATABASE_PATH || './data/relay.sqlite',
    publicBaseUrl: env.RELAY_PUBLIC_BASE_URL || 'http://localhost:8787',
    inviteTtlSeconds: positiveSetting(env, 'RELAY_INVITE_TTL_SECONDS', 7 * 24 * 60 * 60),
    eventRetentionDays: positiveSetting(env, 'RELAY_EVENT_RETENTION_DAYS', 90),
    maxPayloadBytes: positiveSetting(env, 'RELAY_MAX_PAYLOAD_BYTES', 16 * 1024),
    rateLimitWindowSeconds: positiveSetting(env, 'RELAY_RATE_LIMIT_WINDOW_SECONDS', 60),
    rateLimitMaxRequests: positiveSetting(env, 'RELAY_RATE_LIMIT_MAX_REQUESTS', 120),
  };
}
