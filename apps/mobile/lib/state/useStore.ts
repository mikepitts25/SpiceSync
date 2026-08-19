import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';

let pendingSettingsWrite: Promise<void> = Promise.resolve();

const settingsStorage = {
  ...mmkvStorage,
  setItem: (name: string, value: string): Promise<void> => {
    const write = mmkvStorage.setItem(name, value);
    pendingSettingsWrite = write;
    return write;
  },
  removeItem: (name: string): Promise<void> => {
    const write = mmkvStorage.removeItem(name);
    pendingSettingsWrite = write;
    return write;
  },
};

// App-wide settings (no votes here)
type SettingsState = {
  ageConfirmed: boolean;

  language: 'en' | 'es';

  setAgeConfirmed: (v: boolean) => void;
  setLanguage: (lang: 'en' | 'es') => void;
};

// Persistent settings store
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ageConfirmed: false,
      language: 'en',

      setAgeConfirmed: (v) => set({ ageConfirmed: v }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'settings-v1',
      storage: createJSONStorage(() => settingsStorage),
      // Only persist the minimal slice needed app-wide
      partialize: (s) => ({
        ageConfirmed: s.ageConfirmed,
        language: s.language,
      }),
    }
  )
);

export async function waitForSettingsPersistence(): Promise<void> {
  await pendingSettingsWrite;
}

export function useSettingsHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const stopHydrate = useSettings.persist.onHydrate(onStoreChange);
      const stopFinish = useSettings.persist.onFinishHydration(onStoreChange);
      return () => {
        stopHydrate();
        stopFinish();
      };
    },
    () => useSettings.persist.hasHydrated(),
    () => false
  );
}

export { useVotesStore as useVotes } from '../../src/stores/votes';
export type { VoteValue } from '../../src/stores/votes';

export { useShareCodes } from './shareCodes';
export type { ShareCode, DecodedMatch } from './shareCodes';
