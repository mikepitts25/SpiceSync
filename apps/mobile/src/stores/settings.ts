import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../../lib/storage/mmkv';

export type SettingsState = {
  ageGateAccepted: boolean;
  acceptAgeGate: () => void;
  resetAgeGate: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ageGateAccepted: false,
      acceptAgeGate: () => set({ ageGateAccepted: true }),
      resetAgeGate: () => set({ ageGateAccepted: false }),
    }),
    {
      name: 'settings-age-gate',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
