import { encodeBase64Url } from './base64';
import { getAccountService } from '../auth/accountService';
import { useCoupleLinkStore } from './coupleLink';
import { clearRemoteOwnedState } from './remoteOwnership';
import { randomBytes, sha256Base64 } from './crypto';
import { getOrCreateIdentity } from './identity';
import type { ParsedInviteUrl } from './inviteUrl';
import { getRelayClient } from './relayConfig';
import type { DeviceRecoveryResponse } from './relayTypes';

export { parseInviteUrl } from './inviteUrl';
export type { ParsedInviteUrl } from './inviteUrl';

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

export type InviteShareContent = {
  message: string;
};

function buildAppLink(inviteId: string, inviteSecret: string): string {
  return `spicesync://link/${encodeURIComponent(inviteId)}#${encodeURIComponent(inviteSecret)}`;
}

export function buildInviteShareUrl(invite: InviteHandle): string {
  const baseUrl = invite.inviteUrl.split('#', 1)[0];
  return `${baseUrl}#${encodeURIComponent(invite.inviteSecret)}`;
}

export function buildInviteShareContent(
  invite: InviteHandle
): InviteShareContent {
  return {
    message: `Join me on SpiceSync\n${buildInviteShareUrl(invite)}`,
  };
}

export async function createInvite(
  profile: InviteProfile = {}
): Promise<InviteHandle> {
  await getAccountService().ensureAnonymousUser();
  const { identity } = await getOrCreateIdentity();
  const inviteSecret = encodeBase64Url(randomBytes(INVITE_SECRET_BYTES));
  const inviteSecretHash = sha256Base64(inviteSecret);
  const client = getRelayClient();
  const response = await client.createInvite({
    inviterDeviceId: identity.deviceId,
    inviterPublicKey: identity.encryptionPublicKey,
    inviterSigningPublicKey: identity.signingPublicKey,
    inviteSecretHash,
    inviterProfileName: profile.profileName ?? null,
    inviterProfileAvatar: profile.profileAvatar ?? null,
  });
  useCoupleLinkStore
    .getState()
    .setPendingInvite(response.inviteId, response.expiresAt);
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
      inviterSigningPublicKey: string;
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
    inviterSigningPublicKey: response.inviterSigningPublicKey,
    inviterProfileName: response.inviterProfileName ?? null,
    inviterProfileAvatar: response.inviterProfileAvatar ?? null,
    expiresAt: response.expiresAt,
  };
}

export type AcceptInviteResult = {
  coupleId: string;
};

export type PermanentAccountRecoveryResult =
  | { kind: 'recovered'; coupleId: string }
  | { kind: 'no-couple' };

export type PermanentAccountRecoveryOptions = {
  requireProfileConfirmation?: boolean;
};

export async function acceptInvite(
  parsed: ParsedInviteUrl,
  profile: InviteProfile = {}
): Promise<AcceptInviteResult> {
  const ownerUserId = await getAccountService().ensureAnonymousUser();
  const { identity } = await getOrCreateIdentity();
  const client = getRelayClient();
  const lookup = await client.getInvite(parsed.inviteId);
  if (lookup.status === 'expired') throw new Error('Invite expired');
  if (lookup.status === 'accepted') throw new Error('Invite already accepted');
  const proof = sha256Base64(parsed.inviteSecret);
  const result = await client.acceptInvite(parsed.inviteId, {
    accepterDeviceId: identity.deviceId,
    accepterPublicKey: identity.encryptionPublicKey,
    accepterSigningPublicKey: identity.signingPublicKey,
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
  const partnerSigningPublicKey = isMemberA
    ? result.memberBSigningPublicKey
    : result.memberASigningPublicKey;
  const partnerProfileName = isMemberA
    ? result.memberBProfileName
    : result.memberAProfileName;
  const partnerProfileAvatar = isMemberA
    ? result.memberBProfileAvatar
    : result.memberAProfileAvatar;
  useCoupleLinkStore.getState().setLink({
    coupleId: result.coupleId,
    ownerUserId,
    myDeviceId: identity.deviceId,
    myKeyVersion: isMemberA
      ? (result.memberAKeyVersion ?? 1)
      : (result.memberBKeyVersion ?? 1),
    partnerDeviceId,
    partnerKeyVersion: isMemberA
      ? (result.memberBKeyVersion ?? 1)
      : (result.memberAKeyVersion ?? 1),
    partnerSigningPublicKey,
    partnerEncryptionPublicKey,
    partnerProfileName: partnerProfileName ?? null,
    partnerProfileAvatar: partnerProfileAvatar ?? null,
    linkedAt: result.createdAt * 1000,
    lastPulledServerSequence: 0,
    lastSyncedAt: null,
    requiresProfileConfirmation: false,
    status: 'active',
  });
  return { coupleId: result.coupleId };
}

export async function finalizePendingInvite(
  inviteId?: string
): Promise<AcceptInviteResult | null> {
  const resolvedInviteId =
    inviteId ?? useCoupleLinkStore.getState().pendingInviteId;
  if (!resolvedInviteId) return null;
  const ownerUserId = await getAccountService().ensureAnonymousUser();
  const { identity } = await getOrCreateIdentity();
  const client = getRelayClient();
  const lookup = await client.getInvite(resolvedInviteId);
  if (lookup.status === 'expired') {
    useCoupleLinkStore.getState().clearPendingInvite();
    return null;
  }
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
  const partnerSigningPublicKey = isMemberA
    ? couple.memberBSigningPublicKey
    : couple.memberASigningPublicKey;
  const partnerProfileName = isMemberA
    ? couple.memberBProfileName
    : couple.memberAProfileName;
  const partnerProfileAvatar = isMemberA
    ? couple.memberBProfileAvatar
    : couple.memberAProfileAvatar;
  useCoupleLinkStore.getState().setLink({
    coupleId: couple.coupleId,
    ownerUserId,
    myDeviceId: identity.deviceId,
    myKeyVersion: isMemberA
      ? (couple.memberAKeyVersion ?? 1)
      : (couple.memberBKeyVersion ?? 1),
    partnerDeviceId,
    partnerKeyVersion: isMemberA
      ? (couple.memberBKeyVersion ?? 1)
      : (couple.memberAKeyVersion ?? 1),
    partnerSigningPublicKey,
    partnerEncryptionPublicKey,
    partnerProfileName: partnerProfileName ?? null,
    partnerProfileAvatar: partnerProfileAvatar ?? null,
    linkedAt: couple.createdAt * 1000,
    lastPulledServerSequence: 0,
    lastSyncedAt: null,
    requiresProfileConfirmation: false,
    status: 'active',
  });
  useCoupleLinkStore.getState().clearPendingInvite();
  return { coupleId: couple.coupleId };
}

export async function recoverGrandfatheredCouple(): Promise<AcceptInviteResult | null> {
  const linkState = useCoupleLinkStore.getState();
  if (!linkState.coupleRecoveryEnabled) return null;
  const current = linkState.link;
  if (current?.status === 'active' && current.ownerUserId) {
    return { coupleId: current.coupleId };
  }

  const ownerUserId = await getAccountService().ensureAnonymousUser();
  const { identity } = await getOrCreateIdentity();
  const couple = await getRelayClient().findCoupleForDevice(identity.deviceId);
  if (!couple) return null;

  const isMemberA = couple.memberADeviceId === identity.deviceId;
  if (!isMemberA && couple.memberBDeviceId !== identity.deviceId) return null;
  const partnerDeviceId = isMemberA
    ? couple.memberBDeviceId
    : couple.memberADeviceId;
  const partnerEncryptionPublicKey = isMemberA
    ? couple.memberBPublicKey
    : couple.memberAPublicKey;
  const partnerSigningPublicKey = isMemberA
    ? couple.memberBSigningPublicKey
    : couple.memberASigningPublicKey;
  const partnerProfileName = isMemberA
    ? couple.memberBProfileName
    : couple.memberAProfileName;
  const partnerProfileAvatar = isMemberA
    ? couple.memberBProfileAvatar
    : couple.memberAProfileAvatar;

  useCoupleLinkStore.getState().setLink({
    coupleId: couple.coupleId,
    ownerUserId,
    myDeviceId: identity.deviceId,
    myKeyVersion: isMemberA
      ? (couple.memberAKeyVersion ?? 1)
      : (couple.memberBKeyVersion ?? 1),
    partnerDeviceId,
    partnerKeyVersion: isMemberA
      ? (couple.memberBKeyVersion ?? 1)
      : (couple.memberAKeyVersion ?? 1),
    partnerSigningPublicKey,
    partnerEncryptionPublicKey,
    partnerProfileName: partnerProfileName ?? null,
    partnerProfileAvatar: partnerProfileAvatar ?? null,
    linkedAt: couple.createdAt * 1000,
    lastPulledServerSequence: 0,
    lastSyncedAt: null,
    requiresProfileConfirmation: false,
    status: 'active',
  });
  return { coupleId: couple.coupleId };
}

// Keep the existing export for current startup callers while making the
// anonymous, device-ID-only repair path explicit beside durable recovery.
export const recoverExistingCouple = recoverGrandfatheredCouple;

function restoreCoupleLink(
  response: DeviceRecoveryResponse,
  ownerUserId: string,
  requireProfileConfirmation: boolean
): AcceptInviteResult {
  const couple = response.couple;
  if (!couple) {
    throw new Error('Cannot restore a missing couple');
  }

  const isMemberA = couple.memberADeviceId === response.myDeviceId;
  if (!isMemberA && couple.memberBDeviceId !== response.myDeviceId) {
    throw new Error('Recovered device is not a member of this couple');
  }

  const partnerDeviceId = isMemberA
    ? couple.memberBDeviceId
    : couple.memberADeviceId;
  const partnerEncryptionPublicKey = isMemberA
    ? couple.memberBPublicKey
    : couple.memberAPublicKey;
  const partnerSigningPublicKey = isMemberA
    ? couple.memberBSigningPublicKey
    : couple.memberASigningPublicKey;
  const partnerProfileName = isMemberA
    ? couple.memberBProfileName
    : couple.memberAProfileName;
  const partnerProfileAvatar = isMemberA
    ? couple.memberBProfileAvatar
    : couple.memberAProfileAvatar;

  useCoupleLinkStore.getState().setLink({
    coupleId: couple.coupleId,
    ownerUserId,
    myDeviceId: response.myDeviceId,
    myKeyVersion: response.myKeyVersion,
    partnerDeviceId,
    partnerKeyVersion: response.partnerKeyVersion ?? 1,
    partnerSigningPublicKey,
    partnerEncryptionPublicKey,
    partnerProfileName: partnerProfileName ?? null,
    partnerProfileAvatar: partnerProfileAvatar ?? null,
    linkedAt: couple.createdAt * 1000,
    lastPulledServerSequence: response.recoveryCursor,
    lastSyncedAt: null,
    requiresProfileConfirmation: requireProfileConfirmation,
    status: 'active',
  });
  return { coupleId: couple.coupleId };
}

export async function recoverPermanentAccount(
  options: PermanentAccountRecoveryOptions = {}
): Promise<PermanentAccountRecoveryResult> {
  const ownerUserId = await getAccountService().requirePermanentUser();
  useCoupleLinkStore.getState().setAuthenticatedUser(ownerUserId);
  const { identity } = await getOrCreateIdentity();
  const response = await getRelayClient().recoverDevice({
    deviceId: identity.deviceId,
    encryptionPublicKey: identity.encryptionPublicKey,
    signingPublicKey: identity.signingPublicKey,
  });

  if (!response.couple) {
    clearRemoteOwnedState('no-couple', ownerUserId);
    return { kind: 'no-couple' };
  }
  if (response.myDeviceId !== identity.deviceId) {
    throw new Error('Recovered device does not match this installation');
  }

  const previous = useCoupleLinkStore.getState();
  const sameOwnedRelationship =
    previous.link?.ownerUserId === ownerUserId &&
    previous.link.coupleId === response.couple.coupleId &&
    previous.link.myDeviceId === response.myDeviceId;
  const relationshipChanged = !!previous.link && !sameOwnedRelationship;
  const accountSwitchNeedsConfirmation =
    previous.pendingProfileConfirmationOwnerUserId === ownerUserId;
  if (relationshipChanged) {
    clearRemoteOwnedState('couple-changed', ownerUserId);
  }
  const result = restoreCoupleLink(
    response,
    ownerUserId,
    sameOwnedRelationship
      ? false
      : relationshipChanged ||
          accountSwitchNeedsConfirmation ||
          (options.requireProfileConfirmation ?? false)
  );
  return { kind: 'recovered', ...result };
}
