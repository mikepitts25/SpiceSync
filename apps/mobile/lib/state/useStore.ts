import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';

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
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist the minimal slice needed app-wide
      partialize: (s) => ({
        ageConfirmed: s.ageConfirmed,
        language: s.language,
      }),
    }
  )
);

export { useVotesStore as useVotes } from '../../src/stores/votes';
export type { VoteValue } from '../../src/stores/votes';

export { useShareCodes } from './shareCodes';
export type { ShareCode, DecodedMatch } from './shareCodes';
