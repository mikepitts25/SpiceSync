import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';

// Tiny JS-only UUID v4 (not crypto-strong, but fine for local ids)
function uuidv4(): string {
  // RFC4122-ish using Math.random; adequate for local profile ids
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type UserProfile = {
  id: string;
  displayName: string;
  emoji: string;
  color: string;
  pin: string; // TODO: upgrade to a hashed PIN (Argon2id) later
  createdAt: number;
};

type ProfilesState = {
  profiles: UserProfile[];        // up to 2
  currentUserId: string | null;   // active viewer
  addProfile: (p: Omit<UserProfile, 'id'|'createdAt'>) => string;
  updateProfile: (id: string, patch: Partial<UserProfile>) => void;
  deleteProfile: (id: string) => void;
  switchTo: (id: string) => void;   // UI handles PIN check
  verifyPin: (id: string, pin: string) => boolean;
  ensureTwoSlots: () => void;
};

export const useProfiles = create<ProfilesState>()(
  persist(
    (set, get) => ({
      profiles: [],
      currentUserId: null,
      addProfile: (p) => {
        const id = uuidv4();
        const it: UserProfile = { id, createdAt: Date.now(), ...p };
        set(s => ({ profiles: [...s.profiles, it].slice(0, 2), currentUserId: s.currentUserId ?? id }));
        return id;
      },
      updateProfile: (id, patch) => set(s => ({
        profiles: s.profiles.map(x => (x.id === id ? { ...x, ...patch } : x)),
      })),
      deleteProfile: (id) => set(s => {
        const rest = s.profiles.filter(x => x.id !== id);
        const currentUserId = s.currentUserId === id ? (rest[0]?.id ?? null) : s.currentUserId;
        return { profiles: rest, currentUserId };
      }),
      switchTo: (id) => set({ currentUserId: id }),
      verifyPin: (id, pin) => {
        const u = get().profiles.find(p => p.id === id);
        if (!u) return false;
        return (u.pin || '') === (pin || '');
      },
      ensureTwoSlots: () => {
        const s = get();
        if (s.profiles.length > 2) set({ profiles: s.profiles.slice(0, 2) });
      },
    }),
    {
      name: 'profiles-v1',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({ profiles: s.profiles, currentUserId: s.currentUserId }),
    }
  )
);
