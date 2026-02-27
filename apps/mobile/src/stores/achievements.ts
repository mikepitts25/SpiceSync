import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  tier: AchievementTier;
  requirement: number;
  current: number;
  unlocked: boolean;
  unlockedAt?: number;
  category: 'voting' | 'matches' | 'game' | 'streak' | 'social' | 'explorer';
}

interface AchievementsState {
  achievements: Achievement[];
  totalUnlocked: number;
  
  // Actions
  initializeAchievements: () => void;
  incrementProgress: (achievementId: string, amount?: number) => void;
  unlockAchievement: (achievementId: string) => void;
  getAchievement: (id: string) => Achievement | undefined;
  getByCategory: (category: Achievement['category']) => Achievement[];
  getRecentUnlocks: (count?: number) => Achievement[];
  getProgress: () => { unlocked: number; total: number; percentage: number };
}

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'current' | 'unlocked' | 'unlockedAt'>[] = [
  // VOTING ACHIEVEMENTS
  {
    id: 'first-vote',
    title: 'First Steps',
    description: 'Cast your first vote',
    emoji: '🗳️',
    tier: 'bronze',
    requirement: 1,
    category: 'voting',
  },
  {
    id: 'voter-10',
    title: 'Getting Started',
    description: 'Cast 10 votes',
    emoji: '📊',
    tier: 'bronze',
    requirement: 10,
    category: 'voting',
  },
  {
    id: 'voter-50',
    title: 'Dedicated Voter',
    description: 'Cast 50 votes',
    emoji: '🎯',
    tier: 'silver',
    requirement: 50,
    category: 'voting',
  },
  {
    id: 'voter-100',
    title: ' Voting Machine',
    description: 'Cast 100 votes',
    emoji: '🏆',
    tier: 'gold',
    requirement: 100,
    category: 'voting',
  },
  {
    id: 'voter-500',
    title: 'Legendary Voter',
    description: 'Cast 500 votes',
    emoji: '👑',
    tier: 'platinum',
    requirement: 500,
    category: 'voting',
  },
  
  // MATCHES ACHIEVEMENTS
  {
    id: 'first-match',
    title: 'Connection Made',
    description: 'Get your first match',
    emoji: '💕',
    tier: 'bronze',
    requirement: 1,
    category: 'matches',
  },
  {
    id: 'matches-5',
    title: 'Chemistry Building',
    description: 'Get 5 matches',
    emoji: '🔥',
    tier: 'bronze',
    requirement: 5,
    category: 'matches',
  },
  {
    id: 'matches-20',
    title: 'Perfect Harmony',
    description: 'Get 20 matches',
    emoji: '✨',
    tier: 'silver',
    requirement: 20,
    category: 'matches',
  },
  {
    id: 'matches-50',
    title: 'Soulmates',
    description: 'Get 50 matches',
    emoji: '💑',
    tier: 'gold',
    requirement: 50,
    category: 'matches',
  },
  {
    id: 'matches-100',
    title: 'Match Made in Heaven',
    description: 'Get 100 matches',
    emoji: '🌟',
    tier: 'platinum',
    requirement: 100,
    category: 'matches',
  },
  
  // GAME ACHIEVEMENTS
  {
    id: 'first-game',
    title: 'Game On',
    description: 'Play your first Spice Dice game',
    emoji: '🎲',
    tier: 'bronze',
    requirement: 1,
    category: 'game',
  },
  {
    id: 'game-10',
    title: 'Player',
    description: 'Complete 10 game cards',
    emoji: '🎮',
    tier: 'bronze',
    requirement: 10,
    category: 'game',
  },
  {
    id: 'game-50',
    title: 'Game Master',
    description: 'Complete 50 game cards',
    emoji: '🏅',
    tier: 'silver',
    requirement: 50,
    category: 'game',
  },
  {
    id: 'all-categories',
    title: 'Well Rounded',
    description: 'Complete cards from all 5 categories',
    emoji: '🌈',
    tier: 'silver',
    requirement: 5,
    category: 'game',
  },
  
  // STREAK ACHIEVEMENTS
  {
    id: 'streak-3',
    title: 'Heating Up',
    description: '3 day streak',
    emoji: '🔥',
    tier: 'bronze',
    requirement: 3,
    category: 'streak',
  },
  {
    id: 'streak-7',
    title: 'On Fire',
    description: '7 day streak',
    emoji: '⚡',
    tier: 'silver',
    requirement: 7,
    category: 'streak',
  },
  {
    id: 'streak-30',
    title: 'Unstoppable',
    description: '30 day streak',
    emoji: '🚀',
    tier: 'gold',
    requirement: 30,
    category: 'streak',
  },
  {
    id: 'streak-100',
    title: 'Century Club',
    description: '100 day streak',
    emoji: '💯',
    tier: 'platinum',
    requirement: 100,
    category: 'streak',
  },
  
  // SOCIAL ACHIEVEMENTS
  {
    id: 'partner-connected',
    title: 'Better Together',
    description: 'Connect with a partner',
    emoji: '💑',
    tier: 'bronze',
    requirement: 1,
    category: 'social',
  },
  {
    id: 'premium-unlocked',
    title: 'All Access',
    description: 'Unlock premium features',
    emoji: '🔓',
    tier: 'silver',
    requirement: 1,
    category: 'social',
  },
  
  // EXPLORER ACHIEVEMENTS
  {
    id: 'categories-3',
    title: 'Explorer',
    description: 'Vote in 3 different categories',
    emoji: '🧭',
    tier: 'bronze',
    requirement: 3,
    category: 'explorer',
  },
  {
    id: 'categories-all',
    title: 'Category Master',
    description: 'Vote in all categories',
    emoji: '🌟',
    tier: 'gold',
    requirement: 8,
    category: 'explorer',
  },
  {
    id: 'intensity-5',
    title: 'Fearless',
    description: 'Vote yes on a level 5 activity',
    emoji: '🦁',
    tier: 'silver',
    requirement: 1,
    category: 'explorer',
  },
  {
    id: 'custom-activity',
    title: 'Creator',
    description: 'Create a custom activity',
    emoji: '✨',
    tier: 'silver',
    requirement: 1,
    category: 'explorer',
  },
];

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      achievements: [],
      totalUnlocked: 0,
      
      initializeAchievements: () => {
        const { achievements } = get();
        if (achievements.length === 0) {
          const newAchievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map((def) => ({
            ...def,
            current: 0,
            unlocked: false,
          }));
          set({ achievements: newAchievements });
        }
      },
      
      incrementProgress: (achievementId, amount = 1) => {
        set((state) => {
          const achievements = state.achievements.map((ach) => {
            if (ach.id === achievementId && !ach.unlocked) {
              const newCurrent = ach.current + amount;
              const shouldUnlock = newCurrent >= ach.requirement;
              
              return {
                ...ach,
                current: newCurrent,
                unlocked: shouldUnlock,
                unlockedAt: shouldUnlock ? Date.now() : undefined,
              };
            }
            return ach;
          });
          
          const newTotalUnlocked = achievements.filter((a) => a.unlocked).length;
          
          return { 
            achievements,
            totalUnlocked: newTotalUnlocked,
          };
        });
      },
      
      unlockAchievement: (achievementId) => {
        set((state) => {
          const achievements = state.achievements.map((ach) => {
            if (ach.id === achievementId && !ach.unlocked) {
              return {
                ...ach,
                current: ach.requirement,
                unlocked: true,
                unlockedAt: Date.now(),
              };
            }
            return ach;
          });
          
          const newTotalUnlocked = achievements.filter((a) => a.unlocked).length;
          
          return {
            achievements,
            totalUnlocked: newTotalUnlocked,
          };
        });
      },
      
      getAchievement: (id) => {
        return get().achievements.find((a) => a.id === id);
      },
      
      getByCategory: (category) => {
        return get().achievements.filter((a) => a.category === category);
      },
      
      getRecentUnlocks: (count = 5) => {
        return get().achievements
          .filter((a) => a.unlocked)
          .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
          .slice(0, count);
      },
      
      getProgress: () => {
        const { achievements } = get();
        const unlocked = achievements.filter((a) => a.unlocked).length;
        const total = achievements.length;
        return {
          unlocked,
          total,
          percentage: Math.round((unlocked / total) * 100),
        };
      },
    }),
    {
      name: 'spicesync-achievements',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper to get tier color
export const getTierColor = (tier: AchievementTier): string => {
  switch (tier) {
    case 'bronze':
      return '#CD7F32';
    case 'silver':
      return '#C0C0C0';
    case 'gold':
      return '#FFD700';
    case 'platinum':
      return '#E5E4E2';
    default:
      return '#CD7F32';
  }
};

// Helper to get tier icon
export const getTierIcon = (tier: AchievementTier): string => {
  switch (tier) {
    case 'bronze':
      return '🥉';
    case 'silver':
      return '🥈';
    case 'gold':
      return '🥇';
    case 'platinum':
      return '💎';
    default:
      return '🥉';
  }
};
