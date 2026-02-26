import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NudgeType = 
  | 'new_matches'
  | 'streak_reminder'
  | 'partner_activity'
  | 'achievement_unlocked'
  | 'level_up'
  | 'daily_suggestion'
  | 'pack_complete';

export interface Nudge {
  id: string;
  type: NudgeType;
  title: string;
  message: string;
  action?: string;
  actionData?: any;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface NudgesState {
  nudges: Nudge[];
  unreadCount: number;
  
  addNudge: (nudge: Omit<Nudge, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNudge: (id: string) => void;
  clearAll: () => void;
  getUnread: () => Nudge[];
  getRecent: (count?: number) => Nudge[];
}

export const useNudgesStore = create<NudgesState>()(
  persist(
    (set, get) => ({
      nudges: [],
      unreadCount: 0,
      
      addNudge: (nudgeData) => {
        const nudge: Nudge = {
          ...nudgeData,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          read: false,
        };
        
        set((state) => ({
          nudges: [nudge, ...state.nudges].slice(0, 50), // Keep last 50
          unreadCount: state.unreadCount + 1,
        }));
      },
      
      markAsRead: (id) => {
        set((state) => ({
          nudges: state.nudges.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },
      
      markAllAsRead: () => {
        set((state) => ({
          nudges: state.nudges.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },
      
      clearNudge: (id) => {
        set((state) => {
          const nudge = state.nudges.find((n) => n.id === id);
          return {
            nudges: state.nudges.filter((n) => n.id !== id),
            unreadCount: nudge && !nudge.read 
              ? Math.max(0, state.unreadCount - 1) 
              : state.unreadCount,
          };
        });
      },
      
      clearAll: () => {
        set({ nudges: [], unreadCount: 0 });
      },
      
      getUnread: () => {
        return get().nudges.filter((n) => !n.read);
      },
      
      getRecent: (count = 10) => {
        return get().nudges.slice(0, count);
      },
    }),
    {
      name: 'spicesync-nudges',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper to generate contextual nudges
export function generateNudges(
  newMatchesCount: number,
  partnerVotesCount: number,
  streakDays: number,
  lastVisitDays: number
): Omit<Nudge, 'id' | 'timestamp' | 'read'>[] {
  const nudges: Omit<Nudge, 'id' | 'timestamp' | 'read'>[] = [];
  
  if (newMatchesCount > 0) {
    nudges.push({
      type: 'new_matches',
      title: 'New Matches!',
      message: `You and your partner matched on ${newMatchesCount} new activities.`,
      action: 'view_matches',
      priority: 'high',
    });
  }
  
  if (partnerVotesCount > 0) {
    nudges.push({
      type: 'partner_activity',
      title: 'Partner Voted',
      message: `Your partner voted on ${partnerVotesCount} activities today.`,
      action: 'view_matches',
      priority: 'medium',
    });
  }
  
  if (streakDays > 0 && streakDays % 7 === 0) {
    nudges.push({
      type: 'streak_reminder',
      title: 'Weekly Streak!',
      message: `You've synced with your partner for ${streakDays} days in a row!`,
      priority: 'medium',
    });
  }
  
  if (lastVisitDays > 3) {
    nudges.push({
      type: 'daily_suggestion',
      title: 'Time to Sync?',
      message: "It's been a few days. Check out what's new!",
      action: 'browse',
      priority: 'low',
    });
  }
  
  return nudges;
}
