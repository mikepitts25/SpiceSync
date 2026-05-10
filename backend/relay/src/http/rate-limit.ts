import type { MiddlewareHandler } from 'hono';
import type { RelayConfig } from '../config';

type Bucket = {
  count: number;
  resetAt: number;
};

export function createRateLimit(config: RelayConfig, now: () => number): MiddlewareHandler {
  const buckets = new Map<string, Bucket>();

  return async (c, next) => {
    const key =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      'local';
    const current = now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= current) {
      buckets.set(key, {
        count: 1,
        resetAt: current + config.rateLimitWindowSeconds,
      });
      await next();
      return;
    }

    existing.count += 1;
    if (existing.count > config.rateLimitMaxRequests) {
      return c.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
          },
        },
        429,
      );
    }

    await next();
  };
}
