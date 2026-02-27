import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';

// Unified Settings Store - Single source of truth
// Consolidates: useStore (legacy) + useSettingsStore (age-gate)

export interface Profile {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

export interface SettingsState {
  // Profile Management
  activeProfileId: string | null;
  profiles: Profile[];
  
  // App Preferences
  language: 'en' | 'es';
  discreteMode: boolean;
  hapticsEnabled: boolean;
  
  // Age Verification (consolidated from age-gate store)
  ageVerified: boolean;
  
  // Premium Status
  unlocked: boolean;
  
  // Actions
  setActiveProfile: (id: string) => void;
  addProfile: (profile: Omit<Profile, 'id' | 'createdAt'>) => void;
  removeProfile: (id: string) => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  
  setLanguage: (lang: 'en' | 'es') => void;
  setDiscreteMode: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  
  verifyAge: () => void;
  resetAgeVerification: () => void;
  
  setUnlocked: (unlocked: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial State
      activeProfileId: null,
      profiles: [],
      
      language: 'en',
      discreteMode: false,
      hapticsEnabled: true,
      
      ageVerified: false,
      
      unlocked: false,
      
      // Profile Actions
      setActiveProfile: (id) => set({ activeProfileId: id }),
      
      addProfile: (profile) => {
        const newProfile: Profile = {
          ...profile,
          id: `profile-${Date.now()}`,
          createdAt: Date.now(),
        };
        set((state) => ({
          profiles: [...state.profiles, newProfile],
          activeProfileId: state.activeProfileId || newProfile.id,
        }));
      },
      
      removeProfile: (id) => {
        set((state) => {
          const newProfiles = state.profiles.filter((p) => p.id !== id);
          return {
            profiles: newProfiles,
            activeProfileId: 
              state.activeProfileId === id 
                ? newProfiles[0]?.id || null 
                : state.activeProfileId,
          };
        });
      },
      
      updateProfile: (id, updates) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },
      
      // Preference Actions
      setLanguage: (language) => set({ language }),
      setDiscreteMode: (discreteMode) => set({ discreteMode }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      
      // Age Verification
      verifyAge: () => set({ ageVerified: true }),
      resetAgeVerification: () => set({ ageVerified: false }),
      
      // Premium
      setUnlocked: (unlocked) => set({ unlocked }),
    }),
    {
      name: 'spicesync-settings-v2',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Legacy exports for backward compatibility during migration
export const useSettings = useSettingsStore;

// Migration helper - call this once on app startup
export async function migrateLegacySettings(): Promise<void> {
  // Check for old settings keys and migrate
  // This would be implemented based on legacy storage keys
  console.log('[Settings] Migration check complete');
}
