import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

import { EMOJI_CHOICES } from '../../src/constants/emojis';

export type Profile = {
  id: string;
  name: string;
  displayName?: string;
  emoji: string;
  pin?: string;
  createdAt: number;
  updatedAt: number;
  color?: string;
};

type CreateProfileInput = {
  name?: string | null;
  emoji?: string | null;
  pin?: string | null;
};

type ProfilesState = {
  profiles: Profile[];
  activeProfileId: string | null;
  currentUserId: string | null;
  isHydrated: boolean;
  hydrate: () => void;
  setActiveProfile: (id: string) => void;
  createProfile: (input: CreateProfileInput) => Profile;
  updateProfile: (id: string, patch: Partial<Pick<Profile, 'name' | 'emoji' | 'color'>>) => void;
  deleteProfile: (id: string) => void;
  setPin: (id: string, pin: string) => void;
  clearPin: (id: string) => void;
  hasPin: (id: string) => boolean;
  verifyPin: (id: string, pin: string) => boolean;
  hasActiveProfile: () => boolean;
  getActiveProfile: () => Profile | undefined;
};

const storage = new MMKV({ id: 'spicesync', encryptionKey: 'device-bound-key' });

const PROFILES_KEY = 'profiles';
const ACTIVE_ID_KEY = 'activeProfileId';
const LEGACY_ACTIVE_KEY = 'currentUserId';

const ALLOWED_EMOJI = new Set<string>(EMOJI_CHOICES);

function ensureEmoji(input: string | null | undefined): string {
  if (typeof input !== 'string' || !ALLOWED_EMOJI.has(input)) {
    throw new Error('Profile emoji must be one of the preset choices.');
  }
  return input;
}

function sanitizeEmoji(input: string | null | undefined): string {
  if (typeof input === 'string' && ALLOWED_EMOJI.has(input)) {
    return input;
  }
  return EMOJI_CHOICES[0];
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getString(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('[profiles] failed to load key', key, error);
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  storage.set(key, JSON.stringify(value));
}

type PersistedProfile = Partial<Profile> & {
  id?: string;
  displayName?: string;
  name?: string;
  emoji?: string;
  pin?: string | null;
  pinHash?: string | null;
  createdAt?: number;
  updatedAt?: number;
};

function migrateProfiles(raw: PersistedProfile[]): Profile[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const id = typeof item.id === 'string' ? item.id : generateId();
    const fallbackName = item.displayName && item.displayName.trim() ? item.displayName.trim() : 'Partner';
    const nameRaw = typeof item.name === 'string' ? item.name : fallbackName;
    const name = nameRaw.trim() || 'Partner';
    const emoji = sanitizeEmoji(item.emoji);
    const pin = typeof item.pin === 'string' && item.pin.length === 4 ? item.pin : undefined;

    return {
      id,
      name,
      displayName: item.displayName ?? name,
      emoji,
      pin,
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
      color: item.color,
    } satisfies Profile;
  });
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const defaultState: Pick<ProfilesState, 'profiles' | 'activeProfileId' | 'currentUserId' | 'isHydrated'> = {
  profiles: [],
  activeProfileId: null,
  currentUserId: null,
  isHydrated: false,
};

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  ...defaultState,

  hydrate: () => {
    if (get().isHydrated) return;

    const persistedProfiles = migrateProfiles(load<PersistedProfile[]>(PROFILES_KEY, []));

    const legacyActiveRaw = storage.getString(LEGACY_ACTIVE_KEY);
    const legacyActive = legacyActiveRaw ? JSON.parse(legacyActiveRaw) : null;
    const storedActive = load<string | null>(ACTIVE_ID_KEY, legacyActive);

    let nextActive: string | null = typeof storedActive === 'string' ? storedActive : null;
    if (nextActive && !persistedProfiles.some((profile) => profile.id === nextActive)) {
      nextActive = persistedProfiles[0]?.id ?? null;
    }

    set({
      profiles: persistedProfiles,
      activeProfileId: nextActive,
      currentUserId: nextActive,
      isHydrated: true,
    });

    if (nextActive) {
      save(ACTIVE_ID_KEY, nextActive);
    } else {
      storage.delete(ACTIVE_ID_KEY);
    }

    storage.delete(LEGACY_ACTIVE_KEY);
  },

  setActiveProfile: (id) => {
    const { profiles, isHydrated } = get();
    if (!isHydrated) return;
    const exists = profiles.some((profile) => profile.id === id);
    if (!exists) return;

    set({ activeProfileId: id, currentUserId: id });
    save(ACTIVE_ID_KEY, id);
    storage.delete(LEGACY_ACTIVE_KEY);
  },

  createProfile: (input) => {
    const safeName = (input.name ?? '').trim();
    if (!safeName) {
      throw new Error('Profile name is required');
    }

    const safeEmoji = ensureEmoji(input.emoji ?? null);

    let safePin: string | undefined;
    if (typeof input.pin === 'string' && input.pin.trim()) {
      const digits = input.pin.replace(/\D/g, '');
      if (digits.length !== 4) {
        throw new Error('PIN must be a 4-digit code');
      }
      safePin = digits;
    }

    const now = Date.now();
    const profile: Profile = {
      id: generateId(),
      name: safeName,
      displayName: safeName,
      emoji: safeEmoji,
      pin: safePin,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const nextProfiles = [...state.profiles, profile];
      const nextActive = state.activeProfileId ?? profile.id;

      save(PROFILES_KEY, nextProfiles);
      save(ACTIVE_ID_KEY, nextActive);
      storage.delete(LEGACY_ACTIVE_KEY);

      return {
        profiles: nextProfiles,
        activeProfileId: nextActive,
        currentUserId: nextActive,
      };
    });

    return profile;
  },

  updateProfile: (id, patch) => {
    set((state) => {
      const next = state.profiles.map((profile) => {
        if (profile.id !== id) return profile;

        let nextName = profile.name;
        if (typeof patch.name === 'string') {
          const trimmed = patch.name.trim();
          if (trimmed) {
            nextName = trimmed;
          }
        }

        let nextEmoji = profile.emoji;
        if (typeof patch.emoji === 'string') {
          if (ALLOWED_EMOJI.has(patch.emoji)) {
            nextEmoji = patch.emoji;
          }
        }

        return {
          ...profile,
          name: nextName,
          displayName: nextName,
          emoji: nextEmoji,
          color: patch.color ?? profile.color,
          updatedAt: Date.now(),
        } satisfies Profile;
      });

      save(PROFILES_KEY, next);
      return { profiles: next };
    });
  },

  deleteProfile: (id) => {
    set((state) => {
      const next = state.profiles.filter((profile) => profile.id !== id);
      let nextActive = state.activeProfileId;

      if (state.activeProfileId === id) {
        nextActive = next[0]?.id ?? null;
      }

      save(PROFILES_KEY, next);

      if (nextActive) {
        save(ACTIVE_ID_KEY, nextActive);
      } else {
        storage.delete(ACTIVE_ID_KEY);
      }

      storage.delete(LEGACY_ACTIVE_KEY);

      return { profiles: next, activeProfileId: nextActive, currentUserId: nextActive };
    });
  },

  setPin: (id, pin) => {
    const digits = pin.replace(/\D/g, '').slice(0, 4);
    if (digits.length !== 4) return;

    set((state) => {
      const next = state.profiles.map((profile) =>
        profile.id === id ? { ...profile, pin: digits, updatedAt: Date.now() } : profile
      );

      save(PROFILES_KEY, next);
      return { profiles: next };
    });
  },

  clearPin: (id) => {
    set((state) => {
      const next = state.profiles.map((profile) =>
        profile.id === id ? { ...profile, pin: undefined, updatedAt: Date.now() } : profile
      );

      save(PROFILES_KEY, next);
      return { profiles: next };
    });
  },

  hasPin: (id) => {
    const { profiles } = get();
    return profiles.some((profile) => profile.id === id && typeof profile.pin === 'string');
  },

  verifyPin: (id, pin) => {
    const { profiles } = get();
    const profile = profiles.find((item) => item.id === id);
    if (!profile?.pin) return false;
    return profile.pin === pin;
  },

  hasActiveProfile: () => {
    const { isHydrated, activeProfileId, profiles } = get();
    if (!isHydrated || !activeProfileId) return false;
    return profiles.some((profile) => profile.id === activeProfileId);
  },

  getActiveProfile: () => {
    const { activeProfileId, profiles } = get();
    if (!activeProfileId) return undefined;
    return profiles.find((profile) => profile.id === activeProfileId);
  },
}));

export const useProfiles = useProfilesStore;

useProfilesStore.getState().hydrate();

export const EMOJI_OPTIONS = EMOJI_CHOICES;

export function getProfiles(): Profile[] {
  return useProfilesStore.getState().profiles;
}

export function getActiveProfileId(): string | undefined {
  const id = useProfilesStore.getState().activeProfileId;
  return id ?? undefined;
}

export function getActiveProfile(): Profile | undefined {
  return useProfilesStore.getState().getActiveProfile();
}

export function hasActiveProfile(): boolean {
  return useProfilesStore.getState().hasActiveProfile();
}

export function isHydrated(): boolean {
  return useProfilesStore.getState().isHydrated;
}

export function setActiveProfile(id: string): void {
  useProfilesStore.getState().setActiveProfile(id);
}

export function createProfile(input: CreateProfileInput): Profile {
  return useProfilesStore.getState().createProfile(input);
}

export function setPin(id: string, pin: string): void {
  useProfilesStore.getState().setPin(id, pin);
}

export function clearPin(id: string): void {
  useProfilesStore.getState().clearPin(id);
}

export function hasPin(id: string): boolean {
  return useProfilesStore.getState().hasPin(id);
}

export function verifyPin(id: string, pin: string): boolean {
  return useProfilesStore.getState().verifyPin(id, pin);
}

