import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '../../lib/storage/mmkv';

export interface SettingsState {
  language: 'en' | 'es';
  biometricLockEnabled: boolean;
  hapticsEnabled: boolean;
  discreteModeEnabled: boolean;
  drinkingMode: boolean;

  setLanguage: (language: 'en' | 'es') => void;
  setBiometricLockEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setDiscreteModeEnabled: (enabled: boolean) => void;
  setDrinkingMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      biometricLockEnabled: false,
      hapticsEnabled: true,
      discreteModeEnabled: true,
      drinkingMode: false,

      setLanguage: (language) => set({ language }),
      setBiometricLockEnabled: (biometricLockEnabled) =>
        set({ biometricLockEnabled }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setDiscreteModeEnabled: (discreteModeEnabled) =>
        set({ discreteModeEnabled }),
      setDrinkingMode: (drinkingMode) => set({ drinkingMode }),
    }),
    {
      name: 'spicesync-settings-v3',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
