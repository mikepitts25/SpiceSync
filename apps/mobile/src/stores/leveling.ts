import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Level {
  level: number;
  title: string;
  emoji: string;
  minXP: number;
  maxXP: number;
  color: string;
}

export const LEVELS: Level[] = [
  { level: 1, title: 'Curious', emoji: '🌱', minXP: 0, maxXP: 50, color: '#2ECC71' },
  { level: 2, title: 'Explorer', emoji: '🔍', minXP: 50, maxXP: 150, color: '#27AE60' },
  { level: 3, title: 'Adventurer', emoji: '🧭', minXP: 150, maxXP: 300, color: '#F39C12' },
  { level: 4, title: 'Enthusiast', emoji: '🔥', minXP: 300, maxXP: 500, color: '#E67E22' },
  { level: 5, title: 'Connoisseur', emoji: '👑', minXP: 500, maxXP: 750, color: '#9B59B6' },
  { level: 6, title: 'Expert', emoji: '🎓', minXP: 750, maxXP: 1000, color: '#8E44AD' },
  { level: 7, title: 'Master', emoji: '🏆', minXP: 1000, maxXP: 1500, color: '#E74C3C' },
  { level: 8, title: 'Legend', emoji: '💎', minXP: 1500, maxXP: Infinity, color: '#C0392B' },
];

export const XP_ACTIONS = {
  VOTE: 1,
  MATCH: 5,
  FAVORITE: 2,
  TRY_ACTIVITY: 10,
  RATE_ACTIVITY: 3,
  SHARE_WITH_PARTNER: 5,
  COMPLETE_PACK: 25,
  DAILY_STREAK: 10,
};

interface LevelingState {
  xp: number;
  totalXP: number;
  level: number;
  showLevelUp: boolean;
  
  addXP: (amount: number, reason?: string) => void;
  getCurrentLevel: () => Level;
  getNextLevel: () => Level | null;
  getProgress: () => { current: number; target: number; percentage: number };
  clearLevelUp: () => void;
}

export const useLevelingStore = create<LevelingState>()(
  persist(
    (set, get) => ({
      xp: 0,
      totalXP: 0,
      level: 1,
      showLevelUp: false,
      
      addXP: (amount: number, reason?: string) => {
        const { xp, level } = get();
        const newXP = xp + amount;
        const newTotalXP = get().totalXP + amount;
        
        // Check for level up
        const currentLevel = LEVELS.find(l => l.level === level)!;
        const nextLevel = LEVELS.find(l => l.level === level + 1);
        
        if (nextLevel && newXP >= nextLevel.minXP) {
          set({ 
            xp: newXP, 
            totalXP: newTotalXP, 
            level: level + 1, 
            showLevelUp: true 
          });
        } else {
          set({ xp: newXP, totalXP: newTotalXP });
        }
      },
      
      getCurrentLevel: () => {
        return LEVELS.find(l => l.level === get().level) || LEVELS[0];
      },
      
      getNextLevel: () => {
        return LEVELS.find(l => l.level === get().level + 1) || null;
      },
      
      getProgress: () => {
        const { xp, level } = get();
        const currentLevel = LEVELS.find(l => l.level === level)!;
        const nextLevel = LEVELS.find(l => l.level === level + 1);
        
        if (!nextLevel) {
          return { current: xp, target: currentLevel.maxXP, percentage: 100 };
        }
        
        const progress = xp - currentLevel.minXP;
        const target = nextLevel.minXP - currentLevel.minXP;
        const percentage = Math.min(100, Math.round((progress / target) * 100));
        
        return { current: progress, target, percentage };
      },
      
      clearLevelUp: () => set({ showLevelUp: false }),
    }),
    {
      name: 'spicesync-leveling',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
