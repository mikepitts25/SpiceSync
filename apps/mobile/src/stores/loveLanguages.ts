import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoveLanguage, QuizResult } from '../lib/loveLanguages';

export interface ProfileLoveLanguage {
  profileId: string;
  result: QuizResult;
  completedAt: number;
}

interface LoveLanguagesState {
  results: Record<string, ProfileLoveLanguage>; // keyed by profileId
  isHydrated: boolean;
}

interface LoveLanguagesActions {
  setResult: (profileId: string, result: QuizResult) => void;
  getResult: (profileId: string) => ProfileLoveLanguage | undefined;
  clearResult: (profileId: string) => void;
  clearAllResults: () => void;
}

export const useLoveLanguagesStore = create<LoveLanguagesState & LoveLanguagesActions>()(
  persist(
    (set, get) => ({
      results: {},
      isHydrated: false,

      setResult: (profileId: string, result: QuizResult) => {
        set((state) => ({
          results: {
            ...state.results,
            [profileId]: {
              profileId,
              result,
              completedAt: Date.now(),
            },
          },
        }));
      },

      getResult: (profileId: string) => {
        return get().results[profileId];
      },

      clearResult: (profileId: string) => {
        set((state) => {
          const { [profileId]: _, ...rest } = state.results;
          return { results: rest };
        });
      },

      clearAllResults: () => {
        set({ results: {} });
      },
    }),
    {
      name: 'love-languages-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      },
    }
  )
);
