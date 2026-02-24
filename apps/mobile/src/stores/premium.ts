import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface Subscription {
  tier: SubscriptionTier;
  expiresAt: number | null; // timestamp or null for lifetime
  startedAt: number;
  productId: string | null;
  receipt: string | null;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  free: boolean;
  premium: boolean;
  pro: boolean;
}

// Feature definitions
export const FEATURES: Feature[] = [
  // Core (Free)
  { id: 'browse', name: 'Browse Activities', description: 'Browse all 329+ activities', free: true, premium: true, pro: true },
  { id: 'vote', name: 'Vote on Activities', description: 'Like/dislike activities', free: true, premium: true, pro: true },
  { id: 'basic_matches', name: 'Basic Matching', description: 'See mutual matches', free: true, premium: true, pro: true },
  { id: 'single_profile', name: 'Single Profile', description: 'Create one user profile', free: true, premium: true, pro: true },
  
  // Premium
  { id: 'unlimited_profiles', name: 'Unlimited Profiles', description: 'Create multiple profiles for poly/ENM', free: false, premium: true, pro: true },
  { id: 'analytics', name: 'Match Insights', description: 'Detailed compatibility analytics', free: false, premium: true, pro: true },
  { id: 'custom_activities', name: 'Custom Activities', description: 'Create your own activities', free: false, premium: true, pro: true },
  { id: 'export_data', name: 'Export Data', description: 'Export your data as JSON', free: false, premium: true, pro: true },
  { id: 'priority_support', name: 'Priority Support', description: 'Get help faster', free: false, premium: true, pro: true },
  { id: 'advanced_filters', name: 'Advanced Filters', description: 'More filtering options', free: false, premium: true, pro: true },
  
  // Pro
  { id: 'cloud_backup', name: 'Cloud Backup', description: 'Automatic encrypted cloud backup', free: false, premium: false, pro: true },
  { id: 'sync_devices', name: 'Multi-Device Sync', description: 'Sync across unlimited devices', free: false, premium: false, pro: true },
  { id: 'exclusive_content', name: 'Exclusive Content', description: 'Access to premium activity packs', free: false, premium: false, pro: true },
  { id: 'therapist_mode', name: 'Therapist Features', description: 'Tools for couples therapists', free: false, premium: false, pro: true },
];

// Pricing
export const PRICING = {
  premium: {
    monthly: 4.99,
    yearly: 29.99,
    lifetime: 49.99,
  },
  pro: {
    monthly: 9.99,
    yearly: 59.99,
    lifetime: 99.99,
  },
};

interface PremiumState {
  subscription: Subscription;
  isLoading: boolean;
  
  // Actions
  upgrade: (tier: SubscriptionTier, productId: string, receipt: string) => void;
  downgrade: () => void;
  restorePurchases: () => Promise<boolean>;
  checkFeature: (featureId: string) => boolean;
  getCurrentTier: () => SubscriptionTier;
  isPremium: () => boolean;
  isPro: () => boolean;
  
  // Paywall
  showPaywall: boolean;
  paywallFeature: string | null;
  triggerPaywall: (featureId: string) => void;
  closePaywall: () => void;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      subscription: {
        tier: 'free',
        expiresAt: null,
        startedAt: Date.now(),
        productId: null,
        receipt: null,
      },
      isLoading: false,
      showPaywall: false,
      paywallFeature: null,
      
      upgrade: (tier, productId, receipt) => {
        set({
          subscription: {
            tier,
            expiresAt: null, // For lifetime or set expiration for subscription
            startedAt: Date.now(),
            productId,
            receipt,
          },
        });
      },
      
      downgrade: () => {
        set({
          subscription: {
            tier: 'free',
            expiresAt: null,
            startedAt: Date.now(),
            productId: null,
            receipt: null,
          },
        });
      },
      
      restorePurchases: async () => {
        // In real implementation, this would call store APIs
        // For now, simulate no restored purchases
        return false;
      },
      
      checkFeature: (featureId) => {
        const { subscription } = get();
        const feature = FEATURES.find(f => f.id === featureId);
        if (!feature) return false;
        
        switch (subscription.tier) {
          case 'free': return feature.free;
          case 'premium': return feature.premium;
          case 'pro': return feature.pro;
          default: return false;
        }
      },
      
      getCurrentTier: () => get().subscription.tier,
      
      isPremium: () => get().subscription.tier === 'premium' || get().subscription.tier === 'pro',
      
      isPro: () => get().subscription.tier === 'pro',
      
      triggerPaywall: (featureId) => {
        set({ showPaywall: true, paywallFeature: featureId });
      },
      
      closePaywall: () => {
        set({ showPaywall: false, paywallFeature: null });
      },
    }),
    {
      name: 'spicesync-premium',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper hook for feature gating
export function useFeature(featureId: string) {
  const { checkFeature, triggerPaywall } = usePremiumStore();
  
  const hasAccess = checkFeature(featureId);
  
  const requireAccess = (callback: () => void) => {
    if (hasAccess) {
      callback();
    } else {
      triggerPaywall(featureId);
    }
  };
  
  return { hasAccess, requireAccess };
}
