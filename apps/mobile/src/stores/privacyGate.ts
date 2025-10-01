import { create } from 'zustand';

type PrivacyGateState = {
  verified: Record<string, boolean>;
  lastVerifiedAt?: number;
  ttlMs: number;
  verify: (profileId: string) => void;
  clear: () => void;
  isExpired: () => boolean;
  isBothVerified: (aId?: string, bId?: string) => boolean;
  closeForPair?: (aId?: string, bId?: string) => void;
};

export const usePrivacyGate = create<PrivacyGateState>((set, get) => ({
  verified: {},
  lastVerifiedAt: undefined,
  ttlMs: 15 * 60 * 1000,
  verify: (profileId) =>
    set((state) => ({
      verified: { ...state.verified, [profileId]: true },
      lastVerifiedAt: Date.now(),
    })),
  clear: () => set({ verified: {}, lastVerifiedAt: undefined }),
  isExpired: () => {
    const { lastVerifiedAt, ttlMs } = get();
    if (!lastVerifiedAt || ttlMs <= 0) return false;
    return Date.now() - lastVerifiedAt > ttlMs;
  },
  isBothVerified: (aId, bId) => {
    if (!aId || !bId) return false;
    const { verified } = get();
    if (get().isExpired()) return false;
    return !!verified[aId] && !!verified[bId];
  },
  closeForPair: (aId, bId) =>
    set((state) => {
      const nextVerified = { ...state.verified };
      if (aId) {
        delete nextVerified[aId];
      }
      if (bId) {
        delete nextVerified[bId];
      }
      return { verified: nextVerified };
    }),
}));
