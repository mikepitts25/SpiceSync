import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomActivity {
  id: string;
  title: string;
  description: string;
  category: string;
  intensityScale: number;
  estimatedTime?: string;
  tags: string[];
  createdBy: string;
  createdAt: number;
  isShared: boolean;
  shareCode?: string;
}

interface CustomActivitiesState {
  activities: CustomActivity[];
  
  // CRUD operations
  create: (activity: Omit<CustomActivity, 'id' | 'createdAt'>) => CustomActivity;
  update: (id: string, updates: Partial<CustomActivity>) => void;
  delete: (id: string) => void;
  getById: (id: string) => CustomActivity | undefined;
  getAll: () => CustomActivity[];
  
  // Sharing
  share: (id: string) => string; // returns share code
  unshare: (id: string) => void;
  importByCode: (code: string) => CustomActivity | null;
}

// Generate a simple share code
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const useCustomActivitiesStore = create<CustomActivitiesState>()(
  persist(
    (set, get) => ({
      activities: [],
      
      create: (activity) => {
        const newActivity: CustomActivity = {
          ...activity,
          id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          createdAt: Date.now(),
        };
        
        set((state) => ({
          activities: [newActivity, ...state.activities],
        }));
        
        return newActivity;
      },
      
      update: (id, updates) => {
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },
      
      delete: (id) => {
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== id),
        }));
      },
      
      getById: (id) => {
        return get().activities.find((a) => a.id === id);
      },
      
      getAll: () => {
        return get().activities;
      },
      
      share: (id) => {
        const code = generateShareCode();
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id ? { ...a, isShared: true, shareCode: code } : a
          ),
        }));
        return code;
      },
      
      unshare: (id) => {
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id ? { ...a, isShared: false, shareCode: undefined } : a
          ),
        }));
      },
      
      importByCode: (code) => {
        const activity = get().activities.find((a) => a.shareCode === code);
        if (activity && activity.isShared) {
          // Create a copy for the importer
          const imported: CustomActivity = {
            ...activity,
            id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            createdAt: Date.now(),
            createdBy: 'imported',
            isShared: false,
            shareCode: undefined,
          };
          
          set((state) => ({
            activities: [imported, ...state.activities],
          }));
          
          return imported;
        }
        return null;
      },
    }),
    {
      name: 'spicesync-custom-activities',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
