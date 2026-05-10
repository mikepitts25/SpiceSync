import { z } from 'zod';
import type { AcceptInviteInput, AppendEventInput, CreateInviteInput } from './types';

const nonEmpty = z.string().trim().min(1);

const createInviteSchema = z.object({
  inviterDeviceId: nonEmpty,
  inviterPublicKey: nonEmpty,
  inviteSecretHash: nonEmpty,
});

const acceptInviteSchema = z.object({
  accepterDeviceId: nonEmpty,
  accepterPublicKey: nonEmpty,
  inviteProof: nonEmpty,
});

const appendEventSchema = z.object({
  eventId: nonEmpty,
  authorDeviceId: nonEmpty,
  clientSequence: z.number().int().positive(),
  encryptedPayload: nonEmpty,
  payloadHash: nonEmpty,
  signature: nonEmpty,
});

function parseWithMessage<T>(schema: z.ZodSchema<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error('Invalid request body');
  }
  return parsed.data;
}

export function parseCreateInvite(value: unknown): CreateInviteInput {
  return parseWithMessage(createInviteSchema, value);
}

export function parseAcceptInvite(value: unknown): AcceptInviteInput {
  return parseWithMessage(acceptInviteSchema, value);
}

export function parseAppendEvent(value: unknown, maxPayloadBytes: number): AppendEventInput {
  const parsed = parseWithMessage(appendEventSchema, value);
  if (Buffer.byteLength(parsed.encryptedPayload, 'utf8') > maxPayloadBytes) {
    throw new Error('Encrypted payload exceeds maximum size');
  }
  return parsed;
}
