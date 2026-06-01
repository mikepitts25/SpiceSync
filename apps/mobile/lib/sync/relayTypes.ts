export type CreateInviteRequest = {
  inviterDeviceId: string;
  inviterPublicKey: string;
  inviteSecretHash: string;
  inviterProfileName?: string | null;
  inviterProfileAvatar?: string | null;
};

export type CreateInviteResponse = {
  inviteId: string;
  inviteUrl: string;
  expiresAt?: number;
};

export type InviteStatus = 'pending' | 'accepted' | 'expired';

export type InviteResponse = {
  inviteId: string;
  inviterDeviceId: string;
  inviterPublicKey: string;
  inviterProfileName?: string | null;
  inviterProfileAvatar?: string | null;
  expiresAt: number;
  acceptedAt: number | null;
  coupleId: string | null;
  status: InviteStatus;
};

export type AcceptInviteRequest = {
  accepterDeviceId: string;
  accepterPublicKey: string;
  inviteProof: string;
  accepterProfileName?: string | null;
  accepterProfileAvatar?: string | null;
};

export type AcceptInviteResponse = {
  coupleId: string;
  memberADeviceId: string;
  memberBDeviceId: string;
  memberAPublicKey: string;
  memberBPublicKey: string;
  memberAProfileName?: string | null;
  memberBProfileName?: string | null;
  memberAProfileAvatar?: string | null;
  memberBProfileAvatar?: string | null;
  createdAt: number;
};

export type CoupleResponse = {
  coupleId: string;
  memberADeviceId: string;
  memberBDeviceId: string;
  memberAPublicKey: string;
  memberBPublicKey: string;
  memberAProfileName?: string | null;
  memberBProfileName?: string | null;
  memberAProfileAvatar?: string | null;
  memberBProfileAvatar?: string | null;
  createdAt: number;
  revokedAt: number | null;
};

export type AppendEventRequest = {
  eventId: string;
  authorDeviceId: string;
  clientSequence: number;
  encryptedPayload: string;
  payloadHash: string;
  signature: string;
};

export type SyncEventResponse = {
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

export type ListEventsResponse = {
  events: SyncEventResponse[];
  cursor: number;
};

export type RelayErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};
