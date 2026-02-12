import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  hydrated: boolean;
  hydrate: () => void;
  getProfiles: () => Profile[];
  getActiveProfileId: () => string | undefined;
  setActiveProfile: (id: string | undefined) => void;
  createProfile: (input: CreateProfileInput) => Profile;
  updateProfile: (
    id: string,
    patch: Partial<Pick<Profile, 'name' | 'emoji' | 'color'>>
  ) => void;
  deleteProfile: (id: string) => void;
  setPin: (id: string, pin: string) => void;
  clearPin: (id: string) => void;
  hasPin: (id: string) => boolean;
  verifyPin: (id: string, pin: string) => boolean;
  hasActiveProfile: () => boolean;
  getActiveProfile: () => Profile | undefined;
  isHydrated: () => boolean;
};

const PROFILES_KEY = 'profiles';
const ACTIVE_ID_KEY = 'activeProfileId';
const LEGACY_ACTIVE_KEY = 'currentUserId';

const ALLOWED_EMOJI = new Set<string>(EMOJI_CHOICES);

const isDigits4 = (value?: string | null): boolean =>
  !!value && /^[0-9]{4}$/.test(value);

function ensureEmoji(input: string | null | undefined): string {
  if (typeof input !== 'string' || !ALLOWED_EMOJI.has(input)) {
    throw new Error('Invalid emoji');
  }
  return input;
}

function sanitizeEmoji(input: string | null | undefined): string {
  if (typeof input === 'string' && ALLOWED_EMOJI.has(input)) {
    return input;
  }
  return EMOJI_CHOICES[0];
}

async function loadAsync<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('[profiles] failed to load key', key, error);
    return fallback;
  }
}

async function saveAsync<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('[profiles] failed to save key', key, error);
  }
}

// Sync versions for compatibility
function load<T>(key: string, fallback: T): T {
  // Return fallback immediately - actual load happens in hydrate
  return fallback;
}

function save<T>(key: string, value: T) {
  saveAsync(key, value).catch(() => {});
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
    const fallbackName =
      item.displayName && item.displayName.trim()
        ? item.displayName.trim()
        : 'Partner';
    const nameRaw = typeof item.name === 'string' ? item.name : fallbackName;
    const name = nameRaw.trim() || 'Partner';
    const emoji = sanitizeEmoji(item.emoji);
    const pin =
      typeof item.pin === 'string' && item.pin.length === 4
        ? item.pin
        : undefined;

    return {
      id,
      name,
      displayName: item.displayName ?? name,
      emoji,
      pin,
      createdAt:
        typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      updatedAt:
        typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
      color: item.color,
    } satisfies Profile;
  });
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const defaultState = {
  profiles: [] as Profile[],
  activeProfileId: null as string | null,
  currentUserId: null as string | null,
  hydrated: false,
};

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  ...defaultState,

  hydrate: async () => {
    if (get().hydrated) return;

    const persistedProfiles = migrateProfiles(
      await loadAsync<PersistedProfile[]>(PROFILES_KEY, [])
    );

    const legacyActiveRaw = await AsyncStorage.getItem(LEGACY_ACTIVE_KEY);
    const legacyActive = legacyActiveRaw ? JSON.parse(legacyActiveRaw) : null;
    const storedActive = await loadAsync<string | null>(ACTIVE_ID_KEY, legacyActive);

    let nextActive: string | null =
      typeof storedActive === 'string' ? storedActive : null;
    if (
      nextActive &&
      !persistedProfiles.some((profile) => profile.id === nextActive)
    ) {
      nextActive = persistedProfiles[0]?.id ?? null;
    }

    set({
      profiles: persistedProfiles,
      activeProfileId: nextActive,
      currentUserId: nextActive,
      hydrated: true,
    });

    if (nextActive) {
      await saveAsync(ACTIVE_ID_KEY, nextActive);
    } else {
      await AsyncStorage.removeItem(ACTIVE_ID_KEY);
    }

    await AsyncStorage.removeItem(LEGACY_ACTIVE_KEY);
  },

  getProfiles: () => get().profiles,

  getActiveProfileId: () => get().activeProfileId ?? undefined,

  setActiveProfile: async (id) => {
    const { profiles, hydrated } = get();
    if (!hydrated) return;

    if (!id) {
      set({ activeProfileId: null, currentUserId: null });
      await AsyncStorage.removeItem(ACTIVE_ID_KEY);
      await AsyncStorage.removeItem(LEGACY_ACTIVE_KEY);
      return;
    }

    const exists = profiles.some((profile) => profile.id === id);
    if (!exists) {
      return;
    }

    set({ activeProfileId: id, currentUserId: id });
    await saveAsync(ACTIVE_ID_KEY, id);
    await AsyncStorage.removeItem(LEGACY_ACTIVE_KEY);
  },

  createProfile: (input) => {
    const safeName = (input.name ?? '').trim();
    if (!safeName) {
      throw new Error('Profile name is required');
    }

    const safeEmoji = ensureEmoji(input.emoji ?? null);
    const totalProfiles = get().profiles.length;
    const rawPin = typeof input.pin === 'string' ? input.pin.trim() : '';
    let safePin: string | undefined;

    if (totalProfiles === 0) {
      if (rawPin) {
        if (!isDigits4(rawPin)) {
          throw new Error('PIN must be 4 digits');
        }
        safePin = rawPin;
      }
    } else if (totalProfiles === 1) {
      if (!isDigits4(rawPin)) {
        throw new Error('PIN required and must be 4 digits');
      }
      safePin = rawPin;
    } else {
      if (rawPin) {
        if (!isDigits4(rawPin)) {
          throw new Error('PIN must be 4 digits');
        }
        safePin = rawPin;
      }
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

      saveAsync(PROFILES_KEY, nextProfiles).catch(() => {});
      saveAsync(ACTIVE_ID_KEY, nextActive).catch(() => {});
      AsyncStorage.removeItem(LEGACY_ACTIVE_KEY).catch(() => {});

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
        if (typeof patch.emoji === 'string' && ALLOWED_EMOJI.has(patch.emoji)) {
          nextEmoji = patch.emoji;
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

      saveAsync(PROFILES_KEY, next).catch(() => {});
      return { profiles: next };
    });
  },

  deleteProfile: (id) => {
    set((state) => {
      const nextProfiles = state.profiles.filter(
        (profile) => profile.id !== id
      );

      if (nextProfiles.length === state.profiles.length) {
        // no change
        return state;
      }

      let nextActiveId: string | null = state.activeProfileId;
      if (state.activeProfileId === id) {
        nextActiveId = nextProfiles[0]?.id ?? null;
      }

      saveAsync(PROFILES_KEY, nextProfiles).catch(() => {});

      if (nextActiveId) {
        saveAsync(ACTIVE_ID_KEY, nextActiveId).catch(() => {});
      } else {
        AsyncStorage.removeItem(ACTIVE_ID_KEY).catch(() => {});
      }

      AsyncStorage.removeItem(LEGACY_ACTIVE_KEY).catch(() => {});

      return {
        profiles: nextProfiles,
        activeProfileId: nextActiveId,
        currentUserId: nextActiveId,
      };
    });
  },

  setPin: (id, pin) => {
    const digits = pin.replace(/\D/g, '');
    if (!isDigits4(digits)) {
      throw new Error('PIN must be 4 digits');
    }

    set((state) => {
      const next = state.profiles.map((profile) =>
        profile.id === id
          ? { ...profile, pin: digits, updatedAt: Date.now() }
          : profile
      );

      saveAsync(PROFILES_KEY, next).catch(() => {});
      return { profiles: next };
    });
  },

  clearPin: (id) => {
    set((state) => {
      const next = state.profiles.map((profile) =>
        profile.id === id
          ? { ...profile, pin: undefined, updatedAt: Date.now() }
          : profile
      );

      saveAsync(PROFILES_KEY, next).catch(() => {});
      return { profiles: next };
    });
  },

  hasPin: (id) => {
    const { profiles } = get();
    return profiles.some(
      (profile) => profile.id === id && typeof profile.pin === 'string'
    );
  },

  verifyPin: (id, pin) => {
    const { profiles } = get();
    const profile = profiles.find((item) => item.id === id);
    if (!profile?.pin) return false;
    return profile.pin === pin;
  },

  hasActiveProfile: () => {
    const { hydrated, activeProfileId, profiles } = get();
    if (!hydrated || !activeProfileId) return false;
    return profiles.some((profile) => profile.id === activeProfileId);
  },

  getActiveProfile: () => {
    const { activeProfileId, profiles } = get();
    if (!activeProfileId) return undefined;
    return profiles.find((profile) => profile.id === activeProfileId);
  },

  isHydrated: () => get().hydrated,
}));

export const useProfiles = useProfilesStore;

// Auto-hydrate on load
useProfilesStore.getState().hydrate();

export const EMOJI_OPTIONS = EMOJI_CHOICES;

export function getProfiles(): Profile[] {
  return useProfilesStore.getState().getProfiles();
}

export function getActiveProfileId(): string | undefined {
  return useProfilesStore.getState().getActiveProfileId();
}

export function getActiveProfile(): Profile | undefined {
  return useProfilesStore.getState().getActiveProfile();
}

export function hasActiveProfile(): boolean {
  return useProfilesStore.getState().hasActiveProfile();
}

export function isHydrated(): boolean {
  return useProfilesStore.getState().isHydrated();
}

export function setActiveProfile(id: string | undefined): void {
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
