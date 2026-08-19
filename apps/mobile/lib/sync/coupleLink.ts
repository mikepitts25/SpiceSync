import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CoupleLink = {
  coupleId: string;
  myDeviceId: string;
  partnerDeviceId: string;
  partnerSigningPublicKey: string;
  partnerEncryptionPublicKey: string;
  partnerProfileName?: string | null;
  partnerProfileAvatar?: string | null;
  linkedAt: number;
  lastPulledServerSequence: number;
  lastSyncedAt: number | null;
  status: 'active' | 'unlinked';
};

type CoupleLinkState = {
  link: CoupleLink | null;
  pendingInviteId: string | null;
  pendingInviteExpiresAt: number | null;
  coupleRecoveryEnabled: boolean;
  setLink: (link: CoupleLink) => void;
  setPendingInvite: (inviteId: string, expiresAt?: number) => void;
  clearPendingInvite: () => void;
  unlink: () => void;
  clear: () => void;
  updateCursor: (serverSequence: number) => void;
  markSynced: (at: number) => void;
};

export const useCoupleLinkStore = create<CoupleLinkState>()(
  persist(
    (set, get) => ({
      link: null,
      pendingInviteId: null,
      pendingInviteExpiresAt: null,
      coupleRecoveryEnabled: true,
      setLink: (link) =>
        set({
          link,
          pendingInviteId: null,
          pendingInviteExpiresAt: null,
          coupleRecoveryEnabled: true,
        }),
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
        });
      },
      clear: () =>
        set({
          link: null,
          pendingInviteId: null,
          pendingInviteExpiresAt: null,
          coupleRecoveryEnabled: false,
        }),
      updateCursor: (serverSequence) => {
        const current = get().link;
        if (!current) return;
        if (serverSequence <= current.lastPulledServerSequence) return;
        set({ link: { ...current, lastPulledServerSequence: serverSequence } });
      },
      markSynced: (at) => {
        const current = get().link;
        if (!current) return;
        set({ link: { ...current, lastSyncedAt: at } });
      },
    }),
    {
      name: 'spicesync-couple-link',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
