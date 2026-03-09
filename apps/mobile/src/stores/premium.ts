import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  PRODUCT_SKUS, 
  PackSku, 
  ProductSku, 
  isPackSku, 
  isPremiumSku,
  GIFT_CONSTANTS 
} from '../lib/pricing';
import { ALL_PACK_CARDS, getCardPackId } from '../lib/packActivities';

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface Subscription {
  tier: SubscriptionTier;
  expiresAt: number | null; // timestamp or null for lifetime
  startedAt: number;
  productId: string | null;
  receipt: string | null;
  isGift: boolean; // Track if this was a gift subscription
  giftCode?: string; // The code used to redeem if applicable
}

export interface PackPurchase {
  packId: PackSku;
  purchasedAt: number;
  productId: string;
  receipt: string;
}

export interface GiftCode {
  code: string;
  createdAt: number;
  redeemed: boolean;
  redeemedAt?: number;
  redeemedBy?: string;
  productId: string;
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
  { id: 'base_game_cards', name: 'Base Game Cards', description: 'Access to premium base game cards', free: false, premium: true, pro: true },
  
  // Pro
  { id: 'cloud_backup', name: 'Cloud Backup', description: 'Automatic encrypted cloud backup', free: false, premium: false, pro: true },
  { id: 'sync_devices', name: 'Multi-Device Sync', description: 'Sync across unlimited devices', free: false, premium: false, pro: true },
  { id: 'exclusive_content', name: 'Exclusive Content', description: 'Access to premium activity packs', free: false, premium: false, pro: true },
  { id: 'therapist_mode', name: 'Therapist Features', description: 'Tools for couples therapists', free: false, premium: false, pro: true },
];

// Legacy pricing (for reference)
export const PRICING = {
  premium: {
    monthly: 4.99,
    yearly: 29.99,
    lifetime: 4.99, // New intro price
  },
  pro: {
    monthly: 9.99,
    yearly: 59.99,
    lifetime: 99.99,
  },
};

interface PremiumState {
  subscription: Subscription;
  packs: PackPurchase[];
  giftCodes: GiftCode[]; // Codes created by this user
  isLoading: boolean;
  
  // Actions
  upgrade: (tier: SubscriptionTier, productId: string, receipt: string, isGift?: boolean, giftCode?: string) => void;
  downgrade: () => void;
  restorePurchases: () => Promise<boolean>;
  checkFeature: (featureId: string) => boolean;
  getCurrentTier: () => SubscriptionTier;
  isPremium: () => boolean;
  isPro: () => boolean;
  
  // Pack actions
  purchasePack: (packId: PackSku, productId: string, receipt: string) => void;
  hasPack: (packId: PackSku) => boolean;
  hasPackAccess: (cardId: string) => boolean; // Check if user has access to a specific card
  getUnlockedPacks: () => PackSku[];
  
  // Gift subscription actions
  generateGiftCode: () => Promise<string>;
  redeemGiftCode: (code: string) => Promise<boolean>;
  validateGiftCode: (code: string) => boolean;
  
  // Paywall
  showPaywall: boolean;
  paywallFeature: string | null;
  triggerPaywall: (featureId: string) => void;
  closePaywall: () => void;
}

// Generate a random gift code
function generateRandomCode(): string {
  const chars = GIFT_CONSTANTS.CODE_CHARS;
  let code = '';
  for (let i = 0; i < GIFT_CONSTANTS.CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return GIFT_CONSTANTS.CODE_PREFIX + code;
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
        isGift: false,
      },
      packs: [],
      giftCodes: [],
      isLoading: false,
      showPaywall: false,
      paywallFeature: null,
      
      upgrade: (tier, productId, receipt, isGift = false, giftCode) => {
        set({
          subscription: {
            tier,
            expiresAt: null, // For lifetime or set expiration for subscription
            startedAt: Date.now(),
            productId,
            receipt,
            isGift,
            giftCode,
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
            isGift: false,
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
      
      // Pack methods
      purchasePack: (packId, productId, receipt) => {
        const newPack: PackPurchase = {
          packId,
          purchasedAt: Date.now(),
          productId,
          receipt,
        };
        set((state) => ({
          packs: [...state.packs, newPack],
        }));
      },
      
      hasPack: (packId) => {
        const { packs, subscription } = get();
        // Full premium unlocks all packs
        if (subscription.tier === 'premium' || subscription.tier === 'pro') {
          return true;
        }
        // Check individual pack purchase
        return packs.some(p => p.packId === packId);
      },
      
      hasPackAccess: (cardId) => {
        const { subscription, packs } = get();
        
        // Full premium unlocks everything
        if (subscription.tier === 'premium' || subscription.tier === 'pro') {
          return true;
        }
        
        // Check if card belongs to a pack the user owns
        const packId = getCardPackId(cardId);
        if (!packId) return false;
        
        return packs.some(p => p.packId === packId);
      },
      
      getUnlockedPacks: () => {
        const { packs, subscription } = get();
        if (subscription.tier === 'premium' || subscription.tier === 'pro') {
          return [PRODUCT_SKUS.PACK_VACATION, PRODUCT_SKUS.PACK_KINKY201, PRODUCT_SKUS.PACK_DATENIGHT];
        }
        return packs.map(p => p.packId);
      },
      
      // Gift subscription methods
      generateGiftCode: async () => {
        const code = generateRandomCode();
        const giftCode: GiftCode = {
          code,
          createdAt: Date.now(),
          redeemed: false,
          productId: PRODUCT_SKUS.GIFT_PREMIUM,
        };
        set((state) => ({
          giftCodes: [...state.giftCodes, giftCode],
        }));
        return code;
      },
      
      redeemGiftCode: async (code) => {
        // In real implementation, this would validate against a server
        // For now, simulate successful redemption
        const upperCode = code.toUpperCase().trim();
        
        // Check if code is valid format
        if (!upperCode.startsWith(GIFT_CONSTANTS.CODE_PREFIX)) {
          return false;
        }
        
        // Upgrade to premium as gift
        get().upgrade('premium', PRODUCT_SKUS.GIFT_PREMIUM, 'gift_receipt_' + upperCode, true, upperCode);
        
        return true;
      },
      
      validateGiftCode: (code) => {
        const upperCode = code.toUpperCase().trim();
        return upperCode.startsWith(GIFT_CONSTANTS.CODE_PREFIX) && 
               upperCode.length === GIFT_CONSTANTS.CODE_PREFIX.length + GIFT_CONSTANTS.CODE_LENGTH;
      },
      
      triggerPaywall: (featureId) => {
        set({ showPaywall: true, paywallFeature: featureId });
      },
      
      closePaywall: () => {
        set({ showPaywall: false, paywallFeature: null });
      },
    }),
    {
      name: 'spicesync-premium-v2',
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

// Helper hook for pack access
export function usePackAccess(cardId?: string) {
  const { hasPackAccess, hasPack, getUnlockedPacks } = usePremiumStore();
  
  return {
    canAccessCard: cardId ? hasPackAccess(cardId) : false,
    hasPack,
    unlockedPacks: getUnlockedPacks(),
  };
}
