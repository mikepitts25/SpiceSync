export type InviteRecord = {
  inviteId: string;
  inviterDeviceId: string;
  inviterPublicKey: string;
  inviteSecretHash: string;
  createdAt: number;
  expiresAt: number;
  acceptedAt: number | null;
  coupleId: string | null;
};

export type CoupleRecord = {
  coupleId: string;
  memberADeviceId: string;
  memberBDeviceId: string;
  memberAPublicKey: string;
  memberBPublicKey: string;
  createdAt: number;
  revokedAt: number | null;
};

export type SyncEventRecord = {
  serverSequence: number;
  eventId: string;
  coupleId: string;
  authorDeviceId: string;
  clientSequence: number;
  encryptedPayload: string;
  payloadHash: string;
  createdAt: number;
  expiresAt: number | null;
};

export type CreateInviteInput = {
  inviterDeviceId: string;
  inviterPublicKey: string;
  inviteSecretHash: string;
};

export type AcceptInviteInput = {
  accepterDeviceId: string;
  accepterPublicKey: string;
  inviteProof: string;
};

export type AppendEventInput = {
  eventId: string;
  authorDeviceId: string;
  clientSequence: number;
  encryptedPayload: string;
  payloadHash: string;
  signature: string;
};
