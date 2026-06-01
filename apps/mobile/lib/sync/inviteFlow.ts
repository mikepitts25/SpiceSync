import { encodeBase64Url } from './base64';
import { useCoupleLinkStore } from './coupleLink';
import { randomBytes, sha256Base64 } from './crypto';
import { getOrCreateIdentity } from './identity';
import { getRelayClient } from './relayConfig';

const INVITE_SECRET_BYTES = 32;

export type InviteHandle = {
  inviteId: string;
  inviteSecret: string;
  inviteUrl: string;
  appUrl: string;
  expiresAt?: number;
};

export type InviteProfile = {
  profileName?: string | null;
  profileAvatar?: string | null;
};

export type ParsedInviteUrl = {
  inviteId: string;
  inviteSecret: string;
};

function buildAppLink(inviteId: string, inviteSecret: string): string {
  return `spicesync://link/${encodeURIComponent(inviteId)}#${encodeURIComponent(inviteSecret)}`;
}

export function parseInviteUrl(input: string): ParsedInviteUrl | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const hashIndex = trimmed.indexOf('#');
  if (hashIndex === -1) return null;
  const fragment = trimmed.slice(hashIndex + 1);
  const base = trimmed.slice(0, hashIndex);
  if (!fragment) return null;

  let pathPart: string;
  try {
    const url = new URL(base);
    pathPart = (url.host ? '/' + url.host : '') + url.pathname;
  } catch {
    pathPart = base;
  }

  const match = pathPart.match(/\/link\/([^/?#]+)/);
  if (!match) return null;
  try {
    return {
      inviteId: decodeURIComponent(match[1]),
      inviteSecret: decodeURIComponent(fragment),
    };
  } catch {
    return null;
  }
}

export async function createInvite(
  profile: InviteProfile = {}
): Promise<InviteHandle> {
  const { identity } = await getOrCreateIdentity();
  const inviteSecret = encodeBase64Url(randomBytes(INVITE_SECRET_BYTES));
  const inviteSecretHash = sha256Base64(inviteSecret);
  const client = getRelayClient();
  const response = await client.createInvite({
    inviterDeviceId: identity.deviceId,
    inviterPublicKey: identity.encryptionPublicKey,
    inviteSecretHash,
    inviterProfileName: profile.profileName ?? null,
    inviterProfileAvatar: profile.profileAvatar ?? null,
  });
  return {
    inviteId: response.inviteId,
    inviteSecret,
    inviteUrl: response.inviteUrl,
    appUrl: buildAppLink(response.inviteId, inviteSecret),
    expiresAt: response.expiresAt,
  };
}

export type InviteLookup =
  | {
      kind: 'pending';
      inviterPublicKey: string;
      inviterProfileName?: string | null;
      inviterProfileAvatar?: string | null;
      expiresAt: number;
    }
  | { kind: 'accepted'; coupleId: string }
  | { kind: 'expired' };

export async function lookupInvite(inviteId: string): Promise<InviteLookup> {
  const response = await getRelayClient().getInvite(inviteId);
  if (response.status === 'expired') return { kind: 'expired' };
  if (response.status === 'accepted' && response.coupleId) {
    return { kind: 'accepted', coupleId: response.coupleId };
  }
  return {
    kind: 'pending',
    inviterPublicKey: response.inviterPublicKey,
    inviterProfileName: response.inviterProfileName ?? null,
    inviterProfileAvatar: response.inviterProfileAvatar ?? null,
    expiresAt: response.expiresAt,
  };
}

export type AcceptInviteResult = {
  coupleId: string;
};

export async function acceptInvite(
  parsed: ParsedInviteUrl,
  profile: InviteProfile = {}
): Promise<AcceptInviteResult> {
  const { identity } = await getOrCreateIdentity();
  const client = getRelayClient();
  const lookup = await client.getInvite(parsed.inviteId);
  if (lookup.status === 'expired') throw new Error('Invite expired');
  if (lookup.status === 'accepted') throw new Error('Invite already accepted');
  const proof = sha256Base64(parsed.inviteSecret);
  const result = await client.acceptInvite(parsed.inviteId, {
    accepterDeviceId: identity.deviceId,
    accepterPublicKey: identity.encryptionPublicKey,
    inviteProof: proof,
    accepterProfileName: profile.profileName ?? null,
    accepterProfileAvatar: profile.profileAvatar ?? null,
  });
  const isMemberA = result.memberADeviceId === identity.deviceId;
  const partnerDeviceId = isMemberA
    ? result.memberBDeviceId
    : result.memberADeviceId;
  const partnerEncryptionPublicKey = isMemberA
    ? result.memberBPublicKey
    : result.memberAPublicKey;
  const partnerProfileName = isMemberA
    ? result.memberBProfileName
    : result.memberAProfileName;
  const partnerProfileAvatar = isMemberA
    ? result.memberBProfileAvatar
    : result.memberAProfileAvatar;
  useCoupleLinkStore.getState().setLink({
    coupleId: result.coupleId,
    myDeviceId: identity.deviceId,
    partnerDeviceId,
    partnerSigningPublicKey: '',
    partnerEncryptionPublicKey,
    partnerProfileName: partnerProfileName ?? null,
    partnerProfileAvatar: partnerProfileAvatar ?? null,
    linkedAt: result.createdAt * 1000,
    lastPulledServerSequence: 0,
    lastSyncedAt: null,
    status: 'active',
  });
  return { coupleId: result.coupleId };
}

export async function finalizePendingInvite(
  inviteId: string
): Promise<AcceptInviteResult | null> {
  const { identity } = await getOrCreateIdentity();
  const client = getRelayClient();
  const lookup = await client.getInvite(inviteId);
  if (lookup.status !== 'accepted' || !lookup.coupleId) return null;
  const couple = await client.getCouple(lookup.coupleId);
  const isMemberA = couple.memberADeviceId === identity.deviceId;
  if (!isMemberA && couple.memberBDeviceId !== identity.deviceId) return null;
  const partnerDeviceId = isMemberA
    ? couple.memberBDeviceId
    : couple.memberADeviceId;
  const partnerEncryptionPublicKey = isMemberA
    ? couple.memberBPublicKey
    : couple.memberAPublicKey;
  const partnerProfileName = isMemberA
    ? couple.memberBProfileName
    : couple.memberAProfileName;
  const partnerProfileAvatar = isMemberA
    ? couple.memberBProfileAvatar
    : couple.memberAProfileAvatar;
  useCoupleLinkStore.getState().setLink({
    coupleId: couple.coupleId,
    myDeviceId: identity.deviceId,
    partnerDeviceId,
    partnerSigningPublicKey: '',
    partnerEncryptionPublicKey,
    partnerProfileName: partnerProfileName ?? null,
    partnerProfileAvatar: partnerProfileAvatar ?? null,
    linkedAt: couple.createdAt * 1000,
    lastPulledServerSequence: 0,
    lastSyncedAt: null,
    status: 'active',
  });
  return { coupleId: couple.coupleId };
}
