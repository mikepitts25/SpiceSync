import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';

// App-wide settings (no votes here)
type SettingsState = {
  // Existing flags
  ageConfirmed: boolean;
  discreteMode: boolean;

  // NEW: language for content/UI
  language: 'en' | 'es';

  // Setters
  setAgeConfirmed: (v: boolean) => void;
  setDiscreteMode: (v: boolean) => void;
  setLanguage: (lang: 'en' | 'es') => void;
};

// Persistent settings store
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ageConfirmed: false,
      discreteMode: false,
      language: 'en',

      setAgeConfirmed: (v) => set({ ageConfirmed: v }),
      setDiscreteMode: (v) => set({ discreteMode: v }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'settings-v1',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist the minimal slice needed app-wide
      partialize: (s) => ({
        ageConfirmed: s.ageConfirmed,
        discreteMode: s.discreteMode,
        language: s.language,
      }),
    }
  )
);
