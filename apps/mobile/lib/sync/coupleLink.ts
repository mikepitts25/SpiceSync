import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { getRelayClient } from './relayConfig';
import type { CoupleResponse } from './relayTypes';

export type CoupleLink = {
  coupleId: string;
  myDeviceId: string;
  myKeyVersion?: number;
  partnerDeviceId: string;
  partnerKeyVersion?: number;
  partnerSigningPublicKey: string;
  partnerEncryptionPublicKey: string;
  partnerProfileName?: string | null;
  partnerProfileAvatar?: string | null;
  linkedAt: number;
  lastPulledServerSequence: number;
  lastSyncedAt: number | null;
  requiresProfileConfirmation?: boolean;
  status: 'active' | 'unlinked';
};

export type SecurityNotice = {
  kind: 'partner-device-restored';
  occurredAt: number;
  acknowledged: boolean;
  partnerName: string | null;
};

type CoupleLinkInput = Omit<
  CoupleLink,
  'myKeyVersion' | 'partnerKeyVersion' | 'requiresProfileConfirmation'
> &
  Partial<
    Pick<
      CoupleLink,
      'myKeyVersion' | 'partnerKeyVersion' | 'requiresProfileConfirmation'
    >
  >;

type CoupleLinkState = {
  link: CoupleLink | null;
  /**
   * A runtime-only handoff used by the recovery confirmation screen. The
   * persisted link remains paused until that screen has successfully
   * bootstrapped the selected local profile.
   */
  profileConfirmationInProgress: string | null;
  securityNotice: SecurityNotice | null;
  pendingInviteId: string | null;
  pendingInviteExpiresAt: number | null;
  coupleRecoveryEnabled: boolean;
  setLink: (link: CoupleLinkInput) => void;
  beginProfileConfirmation: (profileId: string) => boolean;
  cancelProfileConfirmation: (profileId?: string) => void;
  confirmLocalProfile: (profileId: string) => boolean;
  setPendingInvite: (inviteId: string, expiresAt?: number) => void;
  clearPendingInvite: () => void;
  unlink: () => void;
  clear: () => void;
  updateCursor: (serverSequence: number) => void;
  markSynced: (at: number) => void;
  setSecurityNotice: (notice: SecurityNotice | null) => void;
  acknowledgeSecurityNotice: () => void;
};

type PersistedCoupleLinkState = Pick<
  CoupleLinkState,
  | 'link'
  | 'securityNotice'
  | 'pendingInviteId'
  | 'pendingInviteExpiresAt'
  | 'coupleRecoveryEnabled'
>;

export function isCoupleLinkSyncable(
  link: CoupleLink | null | undefined
): link is CoupleLink {
  return link?.status === 'active' && link.requiresProfileConfirmation !== true;
}

/**
 * A confirmation release is intentionally not an automatic-loop trigger.
 * The confirmation screen owns that handoff and starts the loop only after
 * its awaited local vote bootstrap has succeeded.
 */
export function shouldStartRemoteSyncForLinkTransition(
  previous: CoupleLink | null | undefined,
  next: CoupleLink | null | undefined
): boolean {
  return (
    isCoupleLinkSyncable(next) && previous?.requiresProfileConfirmation !== true
  );
}

/**
 * Ensures an awaited sync operation is still operating on the same,
 * confirmation-approved link before it can make a relay request or write
 * sync state. A key/device change is intentionally treated as stale so a
 * later loop run uses fresh public material.
 */
export function isCurrentSyncableCoupleLink(snapshot: CoupleLink): boolean {
  const current = useCoupleLinkStore.getState().link;
  return (
    isCurrentSyncableCouple(snapshot, current) &&
    current.partnerDeviceId === snapshot.partnerDeviceId &&
    current.partnerEncryptionPublicKey ===
      snapshot.partnerEncryptionPublicKey &&
    current.partnerSigningPublicKey === snapshot.partnerSigningPublicKey &&
    (current.partnerKeyVersion ?? 1) === (snapshot.partnerKeyVersion ?? 1)
  );
}

/**
 * A partner key refresh changes the recipient material without changing the
 * locally owned couple. Callers that only need to make a durable local queue
 * mutation may accept that refresh, while relay requests use the stricter
 * full-link check above.
 */
export function isCurrentSyncableCouple(
  snapshot: CoupleLink,
  current: CoupleLink | null | undefined = useCoupleLinkStore.getState().link
): current is CoupleLink {
  return (
    isCoupleLinkSyncable(current) &&
    current.coupleId === snapshot.coupleId &&
    current.myDeviceId === snapshot.myDeviceId
  );
}

function mergePersistedCoupleLinkState(
  persistedState: unknown,
  currentState: CoupleLinkState
): CoupleLinkState {
  const {
    // This value is deliberately never persisted. A process restart must
    // resume in the conservative, persisted-paused state.
    profileConfirmationInProgress: _profileConfirmationInProgress,
    ...persisted
  } = (persistedState ?? {}) as Partial<CoupleLinkState>;
  const savedLink = persisted.link;
  const link =
    savedLink === null
      ? null
      : savedLink
        ? {
            ...savedLink,
            myKeyVersion: savedLink.myKeyVersion ?? 1,
            partnerKeyVersion: savedLink.partnerKeyVersion ?? 1,
            requiresProfileConfirmation:
              savedLink.requiresProfileConfirmation ?? false,
          }
        : currentState.link;

  return {
    ...currentState,
    ...persisted,
    link,
    profileConfirmationInProgress: null,
  };
}

export const useCoupleLinkStore = create<CoupleLinkState>()(
  persist(
    (set, get) => ({
      link: null,
      profileConfirmationInProgress: null,
      securityNotice: null,
      pendingInviteId: null,
      pendingInviteExpiresAt: null,
      coupleRecoveryEnabled: true,
      setLink: (link) =>
        set({
          link: {
            ...link,
            myKeyVersion: link.myKeyVersion ?? 1,
            partnerKeyVersion: link.partnerKeyVersion ?? 1,
            requiresProfileConfirmation:
              link.requiresProfileConfirmation ?? false,
          },
          pendingInviteId: null,
          pendingInviteExpiresAt: null,
          coupleRecoveryEnabled: true,
          profileConfirmationInProgress: null,
        }),
      beginProfileConfirmation: (profileId) => {
        const current = get().link;
        if (
          !profileId ||
          !current ||
          current.status !== 'active' ||
          current.requiresProfileConfirmation !== true
        ) {
          return false;
        }
        set({ profileConfirmationInProgress: profileId });
        return true;
      },
      cancelProfileConfirmation: (profileId) => {
        if (
          profileId !== undefined &&
          get().profileConfirmationInProgress !== profileId
        ) {
          return;
        }
        set({ profileConfirmationInProgress: null });
      },
      confirmLocalProfile: (profileId) => {
        const current = get().link;
        if (
          !profileId ||
          !current ||
          current.status !== 'active' ||
          current.requiresProfileConfirmation !== true ||
          get().profileConfirmationInProgress !== profileId
        ) {
          return false;
        }
        set({
          link: { ...current, requiresProfileConfirmation: false },
          profileConfirmationInProgress: null,
        });
        return true;
      },
      setPendingInvite: (inviteId, expiresAt) =>
        set({
          pendingInviteId: inviteId,
          pendingInviteExpiresAt: expiresAt ?? null,
          coupleRecoveryEnabled: true,
        }),
      clearPendingInvite: () =>
        set({ pendingInviteId: null, pendingInviteExpiresAt: null }),
      unlink: () => {
        const current = get().link;
        if (!current) return;
        set({
          link: { ...current, status: 'unlinked' },
          coupleRecoveryEnabled: false,
          profileConfirmationInProgress: null,
        });
      },
      clear: () =>
        set({
          link: null,
          securityNotice: null,
          pendingInviteId: null,
          pendingInviteExpiresAt: null,
          coupleRecoveryEnabled: false,
          profileConfirmationInProgress: null,
        }),
      updateCursor: (serverSequence) => {
        const current = get().link;
        if (!isCoupleLinkSyncable(current)) return;
        if (serverSequence <= current.lastPulledServerSequence) return;
        set({ link: { ...current, lastPulledServerSequence: serverSequence } });
      },
      markSynced: (at) => {
        const current = get().link;
        if (!isCoupleLinkSyncable(current)) return;
        set({ link: { ...current, lastSyncedAt: at } });
      },
      setSecurityNotice: (securityNotice) => set({ securityNotice }),
      acknowledgeSecurityNotice: () => {
        const current = get().securityNotice;
        if (!current || current.acknowledged) return;
        set({ securityNotice: { ...current, acknowledged: true } });
      },
    }),
    {
      name: 'spicesync-couple-link',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedCoupleLinkState => ({
        link: state.link,
        securityNotice: state.securityNotice,
        pendingInviteId: state.pendingInviteId,
        pendingInviteExpiresAt: state.pendingInviteExpiresAt,
        coupleRecoveryEnabled: state.coupleRecoveryEnabled,
      }),
      // Legacy links predate recovery metadata. Normalize only a saved link,
      // leaving a persisted null link and all other persisted fields intact.
      merge: mergePersistedCoupleLinkState,
    }
  )
);

function isValidCoupleResponse(
  value: CoupleResponse,
  current: CoupleLink
): boolean {
  return (
    value.coupleId === current.coupleId &&
    typeof value.memberADeviceId === 'string' &&
    typeof value.memberBDeviceId === 'string' &&
    typeof value.memberAPublicKey === 'string' &&
    typeof value.memberBPublicKey === 'string' &&
    typeof value.memberASigningPublicKey === 'string' &&
    typeof value.memberBSigningPublicKey === 'string'
  );
}

/**
 * Refreshes the public material used to address and verify the active partner.
 * A missing/foreign response is deliberately ignored: it must never rewrite a
 * locally established link with data for a different device or couple.
 */
export async function refreshCoupleMetadata(): Promise<
  'unchanged' | 'partner-key-changed'
> {
  const current = useCoupleLinkStore.getState().link;
  if (!isCoupleLinkSyncable(current)) return 'unchanged';
  const capturedPartner = {
    deviceId: current.partnerDeviceId,
    encryptionPublicKey: current.partnerEncryptionPublicKey,
    signingPublicKey: current.partnerSigningPublicKey,
    keyVersion: current.partnerKeyVersion ?? 1,
  };

  const couple = await getRelayClient().getCouple(current.coupleId);
  if (!isValidCoupleResponse(couple, current)) return 'unchanged';

  const isMemberA = couple.memberADeviceId === current.myDeviceId;
  if (!isMemberA && couple.memberBDeviceId !== current.myDeviceId) {
    return 'unchanged';
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
  const partnerKeyVersion = isMemberA
    ? (couple.memberBKeyVersion ?? 1)
    : (couple.memberAKeyVersion ?? 1);
  const myKeyVersion = isMemberA
    ? (couple.memberAKeyVersion ?? 1)
    : (couple.memberBKeyVersion ?? 1);
  const partnerProfileName = isMemberA
    ? couple.memberBProfileName
    : couple.memberAProfileName;
  const partnerProfileAvatar = isMemberA
    ? couple.memberBProfileAvatar
    : couple.memberAProfileAvatar;
  const partnerMetadataChanged =
    current.partnerDeviceId !== partnerDeviceId ||
    current.partnerEncryptionPublicKey !== partnerEncryptionPublicKey ||
    current.partnerSigningPublicKey !== partnerSigningPublicKey ||
    (current.partnerKeyVersion ?? 1) !== partnerKeyVersion;
  const partnerVersionChanged =
    (current.partnerKeyVersion ?? 1) !== partnerKeyVersion;

  let applied = false;
  useCoupleLinkStore.setState((state) => {
    const latest = state.link;
    if (
      !latest ||
      !isCoupleLinkSyncable(latest) ||
      latest.coupleId !== current.coupleId ||
      latest.myDeviceId !== current.myDeviceId
    ) {
      return {};
    }

    const latestPartnerVersion = latest.partnerKeyVersion ?? 1;
    const partnerSnapshotIsCurrent =
      latest.partnerDeviceId === capturedPartner.deviceId &&
      latest.partnerEncryptionPublicKey ===
        capturedPartner.encryptionPublicKey &&
      latest.partnerSigningPublicKey === capturedPartner.signingPublicKey &&
      latestPartnerVersion === capturedPartner.keyVersion;
    if (!partnerSnapshotIsCurrent || partnerKeyVersion < latestPartnerVersion) {
      return {};
    }

    const nextLink: CoupleLink = {
      ...latest,
      myKeyVersion,
      partnerDeviceId,
      partnerKeyVersion,
      partnerEncryptionPublicKey,
      partnerSigningPublicKey,
      partnerProfileName:
        partnerProfileName ?? latest.partnerProfileName ?? null,
      partnerProfileAvatar:
        partnerProfileAvatar ?? latest.partnerProfileAvatar ?? null,
    };
    applied = true;
    return {
      link: nextLink,
      securityNotice:
        latestPartnerVersion !== partnerKeyVersion
          ? {
              kind: 'partner-device-restored',
              occurredAt: Date.now(),
              acknowledged: false,
              partnerName: nextLink.partnerProfileName ?? null,
            }
          : state.securityNotice,
    };
  });

  if (!applied) return 'unchanged';
  return partnerMetadataChanged || partnerVersionChanged
    ? 'partner-key-changed'
    : 'unchanged';
}
