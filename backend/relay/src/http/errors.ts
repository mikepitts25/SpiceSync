import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'INVITE_EXPIRED'
  | 'INVITE_ACCEPTED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

const statusByCode: Record<ErrorCode, ContentfulStatusCode> = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INVITE_EXPIRED: 410,
  INVITE_ACCEPTED: 409,
  FORBIDDEN: 403,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class HttpError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function errorResponse(c: Context, error: unknown): Response {
  if (error instanceof HttpError) {
    return c.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      statusByCode[error.code],
    );
  }

  if (error instanceof Error) {
    if (error.message === 'Invalid request body') {
      return c.json({ error: { code: 'BAD_REQUEST', message: error.message } }, 400);
    }
    if (error.message === 'Encrypted payload exceeds maximum size') {
      return c.json({ error: { code: 'BAD_REQUEST', message: error.message } }, 400);
    }
    if (error.message === 'Duplicate sync event') {
      return c.json({ error: { code: 'CONFLICT', message: error.message } }, 409);
    }
    if (error.message === 'Author is not a couple member') {
      return c.json({ error: { code: 'FORBIDDEN', message: error.message } }, 403);
    }
    if (error.message === 'Couple not found') {
      return c.json({ error: { code: 'NOT_FOUND', message: error.message } }, 404);
    }
  }

  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    },
    500,
  );
}
