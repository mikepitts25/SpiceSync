import { Hono } from 'hono';
import type { Context } from 'hono';
import type { RelayConfig } from '../config';
import { parseAcceptInvite, parseAppendEvent, parseCreateInvite } from '../domain/validation';
import type { RelayStore } from '../store/relay-store';
import { errorResponse, HttpError } from './errors';
import { createRateLimit } from './rate-limit';

type Dependencies = {
  store: RelayStore;
  config: RelayConfig;
  now?: () => number;
};

type InviteStatus = 'pending' | 'accepted' | 'expired';

function readNow(now: () => number): number {
  return Math.floor(now());
}

function inviteStatus(
  invite: { acceptedAt: number | null; expiresAt: number },
  now: number,
): InviteStatus {
  if (invite.acceptedAt !== null) return 'accepted';
  if (invite.expiresAt <= now) return 'expired';
  return 'pending';
}

async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new HttpError('BAD_REQUEST', 'Invalid JSON body');
  }
}

export function createRelayApp({ store, config, now = () => Date.now() / 1000 }: Dependencies): Hono {
  const app = new Hono();

  app.use('*', createRateLimit(config, () => readNow(now)));

  app.onError((error, c) => errorResponse(c, error));

  app.get('/healthz', (c) => c.json({ ok: true }));

  app.post('/invites', async (c) => {
    const body = parseCreateInvite(await readJson(c));
    const current = readNow(now);
    const invite = store.createInvite({
      ...body,
      now: current,
      expiresAt: current + config.inviteTtlSeconds,
    });

    return c.json(
      {
        inviteId: invite.inviteId,
        inviteUrl: `${config.publicBaseUrl.replace(/\/$/, '')}/link/${invite.inviteId}`,
        expiresAt: invite.expiresAt,
      },
      201,
    );
  });

  app.get('/invites/:inviteId', (c) => {
    const invite = store.getInvite(c.req.param('inviteId'));
    if (!invite) throw new HttpError('NOT_FOUND', 'Invite not found');

    return c.json({
      inviteId: invite.inviteId,
      inviterDeviceId: invite.inviterDeviceId,
      inviterPublicKey: invite.inviterPublicKey,
      expiresAt: invite.expiresAt,
      acceptedAt: invite.acceptedAt,
      coupleId: invite.coupleId,
      status: inviteStatus(invite, readNow(now)),
    });
  });

  app.post('/invites/:inviteId/accept', async (c) => {
    const inviteId = c.req.param('inviteId');
    const invite = store.getInvite(inviteId);
    if (!invite) throw new HttpError('NOT_FOUND', 'Invite not found');

    const current = readNow(now);
    const status = inviteStatus(invite, current);
    if (status === 'expired') throw new HttpError('INVITE_EXPIRED', 'Invite expired');
    if (status === 'accepted') throw new HttpError('INVITE_ACCEPTED', 'Invite already accepted');

    const body = parseAcceptInvite(await readJson(c));
    if (body.inviteProof !== invite.inviteSecretHash) {
      throw new HttpError('FORBIDDEN', 'Invite proof did not match');
    }

    const result = store.acceptInvite({
      inviteId,
      accepterDeviceId: body.accepterDeviceId,
      accepterPublicKey: body.accepterPublicKey,
      now: current,
    });

    return c.json(
      {
        coupleId: result.couple.coupleId,
        memberADeviceId: result.couple.memberADeviceId,
        memberBDeviceId: result.couple.memberBDeviceId,
        memberAPublicKey: result.couple.memberAPublicKey,
        memberBPublicKey: result.couple.memberBPublicKey,
        createdAt: result.couple.createdAt,
      },
      201,
    );
  });

  app.get('/couples/:coupleId', (c) => {
    const couple = store.getCouple(c.req.param('coupleId'));
    if (!couple || couple.revokedAt !== null) throw new HttpError('NOT_FOUND', 'Couple not found');

    return c.json(couple);
  });

  app.post('/couples/:coupleId/events', async (c) => {
    const coupleId = c.req.param('coupleId');
    const body = parseAppendEvent(await readJson(c), config.maxPayloadBytes);
    const current = readNow(now);
    const event = store.appendEvent({
      coupleId,
      authorDeviceId: body.authorDeviceId,
      eventId: body.eventId,
      clientSequence: body.clientSequence,
      encryptedPayload: body.encryptedPayload,
      payloadHash: body.payloadHash,
      now: current,
      expiresAt: current + config.eventRetentionDays * 24 * 60 * 60,
    });

    return c.json(event, 201);
  });

  app.get('/couples/:coupleId/events', (c) => {
    const coupleId = c.req.param('coupleId');
    const couple = store.getCouple(coupleId);
    if (!couple || couple.revokedAt !== null) throw new HttpError('NOT_FOUND', 'Couple not found');

    const after = Number(c.req.query('after') || '0');
    if (!Number.isInteger(after) || after < 0) {
      throw new HttpError('BAD_REQUEST', 'Invalid after cursor');
    }

    const limit = Math.min(Number(c.req.query('limit') || '100'), 100);
    if (!Number.isInteger(limit) || limit < 1) {
      throw new HttpError('BAD_REQUEST', 'Invalid limit');
    }

    const events = store.listEventsAfter(coupleId, after, limit);
    const cursor = events.length > 0 ? events[events.length - 1].serverSequence : after;
    return c.json({ events, cursor });
  });

  app.post('/couples/:coupleId/revoke', (c) => {
    const couple = store.revokeCouple(c.req.param('coupleId'), readNow(now));
    if (!couple) throw new HttpError('NOT_FOUND', 'Couple not found');
    return c.json({ coupleId: couple.coupleId, revokedAt: couple.revokedAt });
  });

  return app;
}
