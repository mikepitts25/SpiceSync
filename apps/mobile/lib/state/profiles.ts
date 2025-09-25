
import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'spicesync', encryptionKey: 'device-bound-key' });

// Allowed emoji options (15 total: 5 men, 5 women, 5 gender-neutral)
export const EMOJI_OPTIONS = [
  '👨🏻','👨🏼','👨🏽','👨🏾','👨🏿',
  '👩🏻','👩🏼','👩🏽','👩🏾','👩🏿',
  '🧑🏻','🧑🏼','🧑🏽','🧑🏾','🧑🏿',
] as const;
export type EmojiOption = typeof EMOJI_OPTIONS[number];

// Tiny ID helper (no deps)
function makeId() {
  const r = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}${r}`;
}

export type UserProfile = {
  id: string;
  displayName: string;
  emoji: EmojiOption;
  color?: string;
  createdAt: number;
  pin?: string | null; // optional 4–6 digits
};

type ProfilesState = {
  profiles: UserProfile[];
  currentUserId: string | null;

  setCurrentUser: (id: string) => void;
  createProfile: (displayName: string, emoji: EmojiOption, pin?: string | null) => string;
  updateProfile: (id: string, patch: Partial<UserProfile>) => void;
  deleteProfile: (id: string) => void;

  setPin: (id: string, pin: string | null) => void;
  hasPin: (id: string) => boolean;
  verifyPin: (id: string, pin: string) => boolean;
};

function load<T>(key: string, def: T): T {
  try {
    const s = storage.getString(key);
    return s ? (JSON.parse(s) as T) : def;
  } catch {
    return def;
  }
}
function save<T>(key: string, val: T) {
  storage.set(key, JSON.stringify(val));
}

export const useProfiles = create<ProfilesState>((set, get) => ({
  // Start EMPTY by default; welcome flow will create the first profile
  profiles: load<UserProfile[]>('profiles', []),
  currentUserId: load<string | null>('currentUserId', null),

  setCurrentUser: (id) => {
    const exists = get().profiles.some((p) => p.id === id);
    if (!exists) return;
    set({ currentUserId: id });
    save('currentUserId', id);
  },

  createProfile: (displayName, emoji, pin = null) => {
    // Validate emoji choice
    const safeEmoji: EmojiOption = (EMOJI_OPTIONS as readonly string[]).includes(emoji) ? (emoji as EmojiOption) : '👨🏻';
    const id = makeId();
    const p: UserProfile = {
      id,
      displayName: (displayName || 'Partner').trim(),
      emoji: safeEmoji,
      createdAt: Date.now(),
      pin: pin ? String(pin) : null,
    };
    const next = [...get().profiles, p];
    set({ profiles: next, currentUserId: id });
    save('profiles', next);
    save('currentUserId', id);
    return id;
  },

  updateProfile: (id, patch) => {
    const next = get().profiles.map((p) => {
      if (p.id !== id) return p;
      const out = { ...p, ...patch };
      if (patch.emoji && !(EMOJI_OPTIONS as readonly string[]).includes(patch.emoji)) {
        out.emoji = p.emoji;
      }
      return out;
    });
    set({ profiles: next });
    save('profiles', next);
  },

  deleteProfile: (id) => {
    const { profiles, currentUserId } = get();
    const next = profiles.filter((p) => p.id !== id);
    const newCurrent = currentUserId === id ? (next[0]?.id ?? null) : currentUserId;
    set({ profiles: next, currentUserId: newCurrent });
    save('profiles', next);
    save('currentUserId', newCurrent);
  },

  setPin: (id, pin) => {
    const next = get().profiles.map((p) => (p.id === id ? { ...p, pin: pin ? String(pin) : null } : p));
    set({ profiles: next });
    save('profiles', next);
  },

  hasPin: (id) => {
    const p = get().profiles.find((x) => x.id === id);
    return !!(p && p.pin && p.pin.length > 0);
  },

  verifyPin: (id, pin) => {
    const p = get().profiles.find((x) => x.id === id);
    if (!p) return false;
    if (!p.pin) return true; // no PIN set
    return String(pin) === String(p.pin);
  },
}));
