import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AchievementId =
  // First steps
  | 'first_vote'
  | 'first_match'
  | 'first_favorite'
  // Exploration
  | 'explorer_10'
  | 'explorer_50'
  | 'explorer_100'
  | 'explorer_200'
  // Matching
  | 'matcher_5'
  | 'matcher_25'
  | 'matcher_50'
  | 'matcher_100'
  // Variety
  | 'variety_5_categories'
  | 'variety_10_categories'
  // Adventure
  | 'adventurous_try_5'
  | 'adventurous_try_10'
  // Intensity
  | 'intensity_beginner_master'
  | 'intensity_expert'
  // Social
  | 'social_connect_partner'
  | 'social_sync_streak_7'
  // Special
  | 'night_owl'
  | 'weekend_warrior'
  | 'completest';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  emoji: string;
  category: 'beginner' | 'explorer' | 'matcher' | 'adventurer' | 'social' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  condition: {
    type: 'votes_count' | 'matches_count' | 'favorites_count' | 'categories_count' | 'tried_count' | 'streak_days' | 'sync_count';
    target: number;
  };
  secret?: boolean; // Hidden until unlocked
}

export const ACHIEVEMENTS: Achievement[] = [
  // Beginner Achievements
  {
    id: 'first_vote',
    title: 'First Step',
    description: 'Cast your first vote',
    emoji: '🎯',
    category: 'beginner',
    tier: 'bronze',
    condition: { type: 'votes_count', target: 1 },
  },
  {
    id: 'first_match',
    title: 'First Match',
    description: 'Find your first mutual interest',
    emoji: '💑',
    category: 'beginner',
    tier: 'bronze',
    condition: { type: 'matches_count', target: 1 },
  },
  {
    id: 'first_favorite',
    title: 'Bookmarked',
    description: 'Save your first favorite',
    emoji: '⭐',
    category: 'beginner',
    tier: 'bronze',
    condition: { type: 'favorites_count', target: 1 },
  },
  
  // Explorer Achievements
  {
    id: 'explorer_10',
    title: 'Curious',
    description: 'Vote on 10 activities',
    emoji: '👀',
    category: 'explorer',
    tier: 'bronze',
    condition: { type: 'votes_count', target: 10 },
  },
  {
    id: 'explorer_50',
    title: 'Explorer',
    description: 'Vote on 50 activities',
    emoji: '🗺️',
    category: 'explorer',
    tier: 'silver',
    condition: { type: 'votes_count', target: 50 },
  },
  {
    id: 'explorer_100',
    title: 'Adventurer',
    description: 'Vote on 100 activities',
    emoji: '🧭',
    category: 'explorer',
    tier: 'gold',
    condition: { type: 'votes_count', target: 100 },
  },
  {
    id: 'explorer_200',
    title: 'Connoisseur',
    description: 'Vote on 200 activities',
    emoji: '🎩',
    category: 'explorer',
    tier: 'platinum',
    condition: { type: 'votes_count', target: 200 },
  },
  
  // Matcher Achievements
  {
    id: 'matcher_5',
    title: 'Syncing Up',
    description: 'Find 5 mutual interests',
    emoji: '🔗',
    category: 'matcher',
    tier: 'bronze',
    condition: { type: 'matches_count', target: 5 },
  },
  {
    id: 'matcher_25',
    title: 'In Sync',
    description: 'Find 25 mutual interests',
    emoji: '⚡',
    category: 'matcher',
    tier: 'silver',
    condition: { type: 'matches_count', target: 25 },
  },
  {
    id: 'matcher_50',
    title: 'Perfect Harmony',
    description: 'Find 50 mutual interests',
    emoji: '🎵',
    category: 'matcher',
    tier: 'gold',
    condition: { type: 'matches_count', target: 50 },
  },
  {
    id: 'matcher_100',
    title: 'Soulmates',
    description: 'Find 100 mutual interests',
    emoji: '💎',
    category: 'matcher',
    tier: 'platinum',
    condition: { type: 'matches_count', target: 100 },
  },
  
  // Variety Achievements
  {
    id: 'variety_5_categories',
    title: 'Well Rounded',
    description: 'Vote in 5 different categories',
    emoji: '🌈',
    category: 'explorer',
    tier: 'silver',
    condition: { type: 'categories_count', target: 5 },
  },
  {
    id: 'variety_10_categories',
    title: 'Renaissance',
    description: 'Vote in 10 different categories',
    emoji: '🎨',
    category: 'explorer',
    tier: 'gold',
    condition: { type: 'categories_count', target: 10 },
  },
  
  // Adventurer Achievements
  {
    id: 'adventurous_try_5',
    title: 'Doer',
    description: 'Mark 5 activities as tried',
    emoji: '✅',
    category: 'adventurer',
    tier: 'silver',
    condition: { type: 'tried_count', target: 5 },
  },
  {
    id: 'adventurous_try_10',
    title: 'Experienced',
    description: 'Mark 10 activities as tried',
    emoji: '🏆',
    category: 'adventurer',
    tier: 'gold',
    condition: { type: 'tried_count', target: 10 },
  },
  
  // Social Achievements
  {
    id: 'social_connect_partner',
    title: 'Connected',
    description: 'Link with your partner',
    emoji: '🤝',
    category: 'social',
    tier: 'bronze',
    condition: { type: 'sync_count', target: 1 },
  },
  {
    id: 'social_sync_streak_7',
    title: 'Weekly Sync',
    description: 'Sync with your partner 7 days in a row',
    emoji: '🔥',
    category: 'social',
    tier: 'gold',
    condition: { type: 'streak_days', target: 7 },
  },
  
  // Special (Secret) Achievements
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Use the app after midnight',
    emoji: '🦉',
    category: 'special',
    tier: 'silver',
    condition: { type: 'votes_count', target: 1 },
    secret: true,
  },
  {
    id: 'completest',
    title: 'The Completest',
    description: 'Vote on every single activity',
    emoji: '🏅',
    category: 'special',
    tier: 'platinum',
    condition: { type: 'votes_count', target: 329 },
    secret: true,
  },
];

interface AchievementsState {
  unlocked: AchievementId[];
  unlockedAt: Record<AchievementId, number>;
  showUnlockAnimation: AchievementId | null;
  
  // Actions
  unlock: (id: AchievementId) => void;
  isUnlocked: (id: AchievementId) => boolean;
  clearUnlockAnimation: () => void;
  
  // Stats for checking conditions
  stats: {
    totalVotes: number;
    totalMatches: number;
    totalFavorites: number;
    categoriesVoted: string[];
    activitiesTried: string[];
    partnerSyncStreak: number;
    lastSyncDate: string | null;
  };
  updateStats: (updates: Partial<AchievementsState['stats']>) => void;
  checkAchievements: () => AchievementId[];
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      unlocked: [],
      unlockedAt: {},
      showUnlockAnimation: null,
      
      stats: {
        totalVotes: 0,
        totalMatches: 0,
        totalFavorites: 0,
        categoriesVoted: [],
        activitiesTried: [],
        partnerSyncStreak: 0,
        lastSyncDate: null,
      },
      
      unlock: (id: AchievementId) => {
        const { unlocked, unlockedAt } = get();
        if (!unlocked.includes(id)) {
          set({
            unlocked: [...unlocked, id],
            unlockedAt: { ...unlockedAt, [id]: Date.now() },
            showUnlockAnimation: id,
          });
        }
      },
      
      isUnlocked: (id: AchievementId) => {
        return get().unlocked.includes(id);
      },
      
      clearUnlockAnimation: () => {
        set({ showUnlockAnimation: null });
      },
      
      updateStats: (updates) => {
        set((state) => ({
          stats: { ...state.stats, ...updates },
        }));
        // Check for new achievements after stats update
        get().checkAchievements();
      },
      
      checkAchievements: () => {
        const { stats, unlocked } = get();
        const newlyUnlocked: AchievementId[] = [];
        
        ACHIEVEMENTS.forEach((achievement) => {
          if (unlocked.includes(achievement.id)) return;
          
          let shouldUnlock = false;
          
          switch (achievement.condition.type) {
            case 'votes_count':
              shouldUnlock = stats.totalVotes >= achievement.condition.target;
              break;
            case 'matches_count':
              shouldUnlock = stats.totalMatches >= achievement.condition.target;
              break;
            case 'favorites_count':
              shouldUnlock = stats.totalFavorites >= achievement.condition.target;
              break;
            case 'categories_count':
              shouldUnlock = stats.categoriesVoted.length >= achievement.condition.target;
              break;
            case 'tried_count':
              shouldUnlock = stats.activitiesTried.length >= achievement.condition.target;
              break;
            case 'streak_days':
              shouldUnlock = stats.partnerSyncStreak >= achievement.condition.target;
              break;
          }
          
          if (shouldUnlock) {
            get().unlock(achievement.id);
            newlyUnlocked.push(achievement.id);
          }
        });
        
        return newlyUnlocked;
      },
    }),
    {
      name: 'spicesync-achievements',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper hook to track achievement progress
export function useAchievementProgress() {
  const { stats, unlocked } = useAchievementsStore();
  
  const progress = {
    beginner: {
      total: ACHIEVEMENTS.filter(a => a.category === 'beginner').length,
      unlocked: unlocked.filter(id => ACHIEVEMENTS.find(a => a.id === id)?.category === 'beginner').length,
    },
    explorer: {
      total: ACHIEVEMENTS.filter(a => a.category === 'explorer').length,
      unlocked: unlocked.filter(id => ACHIEVEMENTS.find(a => a.id === id)?.category === 'explorer').length,
    },
    matcher: {
      total: ACHIEVEMENTS.filter(a => a.category === 'matcher').length,
      unlocked: unlocked.filter(id => ACHIEVEMENTS.find(a => a.id === id)?.category === 'matcher').length,
    },
    adventurer: {
      total: ACHIEVEMENTS.filter(a => a.category === 'adventurer').length,
      unlocked: unlocked.filter(id => ACHIEVEMENTS.find(a => a.id === id)?.category === 'adventurer').length,
    },
    social: {
      total: ACHIEVEMENTS.filter(a => a.category === 'social').length,
      unlocked: unlocked.filter(id => ACHIEVEMENTS.find(a => a.id === id)?.category === 'social').length,
    },
    special: {
      total: ACHIEVEMENTS.filter(a => a.category === 'special').length,
      unlocked: unlocked.filter(id => ACHIEVEMENTS.find(a => a.id === id)?.category === 'special').length,
    },
  };
  
  return { progress, stats };
}
