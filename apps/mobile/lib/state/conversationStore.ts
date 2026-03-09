// apps/mobile/lib/state/conversationStore.ts
// State management for conversation starters feature

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConversationState {
  // Favorites
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  
  // History of viewed starters
  history: string[];
  addToHistory: (id: string) => void;
  clearHistory: () => void;
  
  // Date night mode settings
  dateNightSettings: {
    timerEnabled: boolean;
    timerMinutes: number;
    includeSpicy: boolean;
    backgroundTheme: 'dark' | 'romantic' | 'cozy';
  };
  updateDateNightSettings: (settings: Partial<ConversationState['dateNightSettings']>) => void;
  
  // Daily notification settings
  dailyNotificationsEnabled: boolean;
  toggleDailyNotifications: () => void;
  lastDailyPromptDate: string | null;
  setLastDailyPromptDate: (date: string) => void;
  
  // Stats
  stats: {
    totalViewed: number;
    totalFavorites: number;
    categoriesExplored: string[];
    streakDays: number;
    lastUsedDate: string | null;
  };
  updateStats: () => void;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      // Favorites
      favorites: [],
      toggleFavorite: (id: string) => {
        set((state) => {
          const isFav = state.favorites.includes(id);
          const newFavorites = isFav
            ? state.favorites.filter((fav) => fav !== id)
            : [...state.favorites, id];
          return { favorites: newFavorites };
        });
      },
      isFavorite: (id: string) => {
        return get().favorites.includes(id);
      },

      // History
      history: [],
      addToHistory: (id: string) => {
        set((state) => {
          // Avoid duplicates at the start, keep max 100 items
          const newHistory = [id, ...state.history.filter((h) => h !== id)].slice(0, 100);
          return { history: newHistory };
        });
        // Update stats when adding to history
        get().updateStats();
      },
      clearHistory: () => set({ history: [] }),

      // Date Night Settings
      dateNightSettings: {
        timerEnabled: true,
        timerMinutes: 5,
        includeSpicy: true,
        backgroundTheme: 'romantic',
      },
      updateDateNightSettings: (settings) => {
        set((state) => ({
          dateNightSettings: { ...state.dateNightSettings, ...settings },
        }));
      },

      // Daily Notifications
      dailyNotificationsEnabled: false,
      toggleDailyNotifications: () => {
        set((state) => ({
          dailyNotificationsEnabled: !state.dailyNotificationsEnabled,
        }));
      },
      lastDailyPromptDate: null,
      setLastDailyPromptDate: (date: string) => {
        set({ lastDailyPromptDate: date });
      },

      // Stats
      stats: {
        totalViewed: 0,
        totalFavorites: 0,
        categoriesExplored: [],
        streakDays: 0,
        lastUsedDate: null,
      },
      updateStats: () => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const lastDate = state.stats.lastUsedDate;
          
          // Calculate streak
          let newStreak = state.stats.streakDays;
          if (lastDate) {
            const last = new Date(lastDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              newStreak += 1; // Continue streak
            } else if (diffDays > 1) {
              newStreak = 1; // Reset streak
            }
          } else {
            newStreak = 1;
          }

          return {
            stats: {
              totalViewed: state.history.length,
              totalFavorites: state.favorites.length,
              categoriesExplored: state.stats.categoriesExplored,
              streakDays: newStreak,
              lastUsedDate: today,
            },
          };
        });
      },
    }),
    {
      name: 'conversation-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useConversationStore;
