// apps/mobile/lib/storage/mmkv.ts
import { MMKV } from 'react-native-mmkv';

export const mmkv = new MMKV({
  id: 'spicesync',
  encryptionKey: 'spicesync-local-only',
});

// Lightweight adapter for zustand/persist
export const mmkvStorage = {
  getItem: (name: string) => {
    const v = mmkv.getString(name);
    return v ?? null;
  },
  setItem: (name: string, value: string) => {
    mmkv.set(name, value);
  },
  removeItem: (name: string) => {
    mmkv.delete(name);
  },
};
