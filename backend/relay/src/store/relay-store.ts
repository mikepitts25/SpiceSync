import type { CoupleRecord, InviteRecord, SyncEventRecord } from '../domain/types';

export type CreateInviteStoreInput = {
  inviterDeviceId: string;
  inviterPublicKey: string;
  inviterSigningPublicKey: string;
  inviteSecretHash: string;
  now: number;
  expiresAt: number;
};

export type AcceptInviteStoreInput = {
  inviteId: string;
  accepterDeviceId: string;
  accepterPublicKey: string;
  accepterSigningPublicKey: string;
  now: number;
};

export type AppendEventStoreInput = {
  coupleId: string;
  authorDeviceId: string;
  eventId: string;
  clientSequence: number;
  encryptedPayload: string;
  payloadHash: string;
  signature: string;
  now: number;
  expiresAt: number | null;
};

export type AcceptInviteResult = {
  invite: InviteRecord;
  couple: CoupleRecord;
};

export interface RelayStore {
  createInvite(input: CreateInviteStoreInput): InviteRecord;
  getInvite(inviteId: string): InviteRecord | null;
  acceptInvite(input: AcceptInviteStoreInput): AcceptInviteResult;
  getCouple(coupleId: string): CoupleRecord | null;
  appendEvent(input: AppendEventStoreInput): SyncEventRecord;
  listEventsAfter(coupleId: string, afterServerSequence: number, limit: number): SyncEventRecord[];
  revokeCouple(coupleId: string, now: number): CoupleRecord | null;
  cleanupExpired(now: number): { invitesDeleted: number; eventsDeleted: number };
  close(): void;
}
