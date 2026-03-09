// Achievements and Streaks System
// Tracks user engagement, streaks, and unlocks achievements

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Achievement types
export type AchievementId = 
  | 'seven_day_explorer'
  | 'first_match'
  | 'tried_10_things'
  | 'deep_dive'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  category: 'engagement' | 'exploration' | 'streak';
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'seven_day_explorer',
    title: '7-Day Explorer',
    description: 'Use the app for 7 days',
    icon: '📅',
    category: 'engagement',
  },
  {
    id: 'first_match',
    title: 'First Match',
    description: 'Get your first activity match with your partner',
    icon: '💕',
    category: 'exploration',
  },
  {
    id: 'tried_10_things',
    title: 'Adventurous Soul',
    description: 'Complete 10 activities',
    icon: '🔥',
    category: 'exploration',
  },
  {
    id: 'deep_dive',
    title: 'Deep Dive',
    description: 'Complete all activities in a category',
    icon: '🎯',
    category: 'exploration',
  },
  {
    id: 'streak_3',
    title: 'On Fire',
    description: '3-day streak',
    icon: '🔥',
    category: 'streak',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: '7-day streak',
    icon: '⚡',
    category: 'streak',
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: '30-day streak',
    icon: '👑',
    category: 'streak',
  },
];

// Streak and achievement state
interface StreakState {
  // Streak tracking
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  
  // Activity tracking
  daysActive: string[]; // ISO date strings
  activitiesCompleted: string[]; // Activity IDs
  categoriesCompleted: Record<string, string[]>; // category -> activity IDs
  matchCount: number;
  
  // Achievements
  unlockedAchievements: AchievementId[];
  
  // Actions
  recordActivity: (activityId: string, category: string) => void;
  recordMatch: () => void;
  checkAndUpdateStreak: () => { streakUpdated: boolean; streakBroken: boolean };
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  getProgress: (achievementId: AchievementId) => number;
}

// Helper to get today's date string (YYYY-MM-DD)
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper to check if two dates are consecutive
function areConsecutive(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// Helper to check if date is today
function isToday(dateStr: string): boolean {
  return dateStr === getTodayString();
}

// Helper to check if date was yesterday
function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().split('T')[0];
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      daysActive: [],
      activitiesCompleted: [],
      categoriesCompleted: {},
      matchCount: 0,
      unlockedAchievements: [],

      recordActivity: (activityId: string, category: string) => {
        const state = get();
        const today = getTodayString();
        
        // Add to completed activities if not already there
        const newActivities = state.activitiesCompleted.includes(activityId)
          ? state.activitiesCompleted
          : [...state.activitiesCompleted, activityId];
        
        // Add to category tracking
        const categoryActivities = state.categoriesCompleted[category] || [];
        const newCategoryActivities = categoryActivities.includes(activityId)
          ? categoryActivities
          : [...categoryActivities, activityId];
        
        // Record day as active
        const newDaysActive = state.daysActive.includes(today)
          ? state.daysActive
          : [...state.daysActive, today];
        
        set({
          activitiesCompleted: newActivities,
          categoriesCompleted: {
            ...state.categoriesCompleted,
            [category]: newCategoryActivities,
          },
          daysActive: newDaysActive,
        });
        
        // Check for achievements
        get().checkAchievements();
      },

      recordMatch: () => {
        const state = get();
        set({ matchCount: state.matchCount + 1 });
        get().checkAchievements();
      },

      checkAndUpdateStreak: () => {
        const state = get();
        const today = getTodayString();
        
        // Already active today
        if (state.lastActiveDate === today) {
          return { streakUpdated: false, streakBroken: false };
        }
        
        // First activity ever
        if (!state.lastActiveDate) {
          set({
            currentStreak: 1,
            lastActiveDate: today,
            longestStreak: 1,
          });
          get().checkAchievements();
          return { streakUpdated: true, streakBroken: false };
        }
        
        // Check if streak continues (was active yesterday)
        if (isYesterday(state.lastActiveDate)) {
          const newStreak = state.currentStreak + 1;
          set({
            currentStreak: newStreak,
            lastActiveDate: today,
            longestStreak: Math.max(state.longestStreak, newStreak),
          });
          get().checkAchievements();
          return { streakUpdated: true, streakBroken: false };
        }
        
        // Streak broken - more than 1 day gap
        set({
          currentStreak: 1,
          lastActiveDate: today,
        });
        return { streakUpdated: true, streakBroken: true };
      },

      getUnlockedAchievements: () => {
        const state = get();
        return ACHIEVEMENTS.filter(a => state.unlockedAchievements.includes(a.id));
      },

      getLockedAchievements: () => {
        const state = get();
        return ACHIEVEMENTS.filter(a => !state.unlockedAchievements.includes(a.id));
      },

      getProgress: (achievementId: AchievementId) => {
        const state = get();
        
        switch (achievementId) {
          case 'seven_day_explorer':
            return Math.min(state.daysActive.length / 7, 1);
          case 'first_match':
            return state.matchCount >= 1 ? 1 : 0;
          case 'tried_10_things':
            return Math.min(state.activitiesCompleted.length / 10, 1);
          case 'deep_dive': {
            // Check if any category has all activities completed
            // This is simplified - in reality you'd need total activity count per category
            const categoryProgress = Object.values(state.categoriesCompleted).map(
              activities => activities.length / 10 // Assuming 10 activities per category for progress
            );
            return Math.max(0, ...categoryProgress);
          }
          case 'streak_3':
            return Math.min(state.currentStreak / 3, 1);
          case 'streak_7':
            return Math.min(state.currentStreak / 7, 1);
          case 'streak_30':
            return Math.min(state.currentStreak / 30, 1);
          default:
            return 0;
        }
      },

      checkAchievements: () => {
        const state = get();
        const newlyUnlocked: AchievementId[] = [];
        
        // Check each achievement
        ACHIEVEMENTS.forEach(achievement => {
          if (state.unlockedAchievements.includes(achievement.id)) return;
          
          let shouldUnlock = false;
          
          switch (achievement.id) {
            case 'seven_day_explorer':
              shouldUnlock = state.daysActive.length >= 7;
              break;
            case 'first_match':
              shouldUnlock = state.matchCount >= 1;
              break;
            case 'tried_10_things':
              shouldUnlock = state.activitiesCompleted.length >= 10;
              break;
            case 'deep_dive':
              // Check if any category is "complete" (simplified: 10+ activities)
              shouldUnlock = Object.values(state.categoriesCompleted).some(
                activities => activities.length >= 10
              );
              break;
            case 'streak_3':
              shouldUnlock = state.currentStreak >= 3;
              break;
            case 'streak_7':
              shouldUnlock = state.currentStreak >= 7;
              break;
            case 'streak_30':
              shouldUnlock = state.currentStreak >= 30;
              break;
          }
          
          if (shouldUnlock) {
            newlyUnlocked.push(achievement.id);
          }
        });
        
        if (newlyUnlocked.length > 0) {
          set({
            unlockedAchievements: [...state.unlockedAchievements, ...newlyUnlocked],
          });
        }
        
        return newlyUnlocked;
      },
    }),
    {
      name: 'spicesync-streak-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Hook for checking streak on app open
export function useStreakCheck() {
  const { checkAndUpdateStreak } = useStreakStore();
  return checkAndUpdateStreak;
}

// Get streak status for display
export function getStreakStatus() {
  const state = useStreakStore.getState();
  return {
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    isActiveToday: state.lastActiveDate === getTodayString(),
    daysActive: state.daysActive.length,
  };
}
