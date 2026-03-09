// Pricing constants for SpiceSync
// New monetization model: $4.99 base premium + à la carte packs

export const PRICING = {
  // Base premium - lowered barrier to entry
  BASE_PREMIUM: 4.99,
  
  // Legacy premium price (grandfathered for existing users)
  LEGACY_PREMIUM: 19.99,
  
  // À la carte pack price
  PACK_PRICE: 2.99,
  
  // Gift subscription price
  GIFT_PRICE: 4.99,
} as const;

// Product IDs / SKUs for In-App Purchases
export const PRODUCT_SKUS = {
  // Base premium
  PREMIUM: 'spicesync_premium',
  PREMIUM_LIFETIME: 'spicesync_premium_lifetime',
  
  // Legacy (keep for reference)
  LEGACY_PREMIUM_LIFETIME: 'spicesync_premium_legacy',
  
  // À la carte packs
  PACK_VACATION: 'pack_vacation',
  PACK_KINKY201: 'pack_kinky201',
  PACK_DATENIGHT: 'pack_datenight',
  
  // Gift subscription
  GIFT_PREMIUM: 'spicesync_gift_premium',
} as const;

export type ProductSku = typeof PRODUCT_SKUS[keyof typeof PRODUCT_SKUS];
export type PackSku = typeof PRODUCT_SKUS.PACK_VACATION | typeof PRODUCT_SKUS.PACK_KINKY201 | typeof PRODUCT_SKUS.PACK_DATENIGHT;

// Pack definitions
export interface Pack {
  id: PackSku;
  name: string;
  emoji: string;
  description: string;
  price: number;
  previewActivities: string[]; // IDs of activities to show as preview
  color: string;
}

export const PACKS: Pack[] = [
  {
    id: PRODUCT_SKUS.PACK_VACATION,
    name: 'Vacation Pack',
    emoji: '🏖️',
    description: 'Travel & adventure themed activities for couples on the go',
    price: PRICING.PACK_PRICE,
    color: '#FF6B6B',
    previewActivities: [
      'vac-t1', // What's the wildest place you'd want me on vacation?
      'vac-d1', // Beach strip: remove one item like we're on a private beach
      'vac-r1', // Hotel strangers: we just met at the hotel bar
      'vac-fn1', // Describe our ideal vacation hookup scenario
      'vac-c1', // Mile high club simulation in the room
    ],
  },
  {
    id: PRODUCT_SKUS.PACK_KINKY201,
    name: 'Kinky 201',
    emoji: '🔥',
    description: 'Advanced & experimental activities for adventurous couples',
    price: PRICING.PACK_PRICE,
    color: '#9B59B6',
    previewActivities: [
      'k201-t1', // What's a kink you've been curious about but never tried?
      'k201-d1', // Light bondage: tie wrists with necktie
      'k201-r1', // Master/servant: full command scene
      'k201-c1', // Temperature play: ice and warm oil
      'k201-fn1', // Describe your darkest fantasy you want to try
    ],
  },
  {
    id: PRODUCT_SKUS.PACK_DATENIGHT,
    name: 'Date Night',
    emoji: '💕',
    description: 'Romantic evening focused activities to deepen connection',
    price: PRICING.PACK_PRICE,
    color: '#E91E63',
    previewActivities: [
      'dn-t1', // What's one thing I do that makes you feel loved?
      'dn-d1', // Slow dance: no music, just us moving together
      'dn-r1', // First date redo: pick me up at the door
      'dn-c1', // Eye gazing: 5 minutes of silent connection
      'dn-fn1', // Describe our perfect anniversary night
    ],
  },
];

// Gift subscription constants
export const GIFT_CONSTANTS = {
  CODE_LENGTH: 12,
  CODE_PREFIX: 'SPICE-',
  CODE_CHARS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Removed confusing chars (0, O, 1, I)
  REDEEM_PATH: '/redeem',
} as const;

// Helper functions
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function getPackById(id: PackSku): Pack | undefined {
  return PACKS.find(p => p.id === id);
}

export function isPackSku(sku: string): sku is PackSku {
  return sku === PRODUCT_SKUS.PACK_VACATION || 
         sku === PRODUCT_SKUS.PACK_KINKY201 || 
         sku === PRODUCT_SKUS.PACK_DATENIGHT;
}

export function isPremiumSku(sku: string): boolean {
  return sku === PRODUCT_SKUS.PREMIUM || 
         sku === PRODUCT_SKUS.PREMIUM_LIFETIME ||
         sku === PRODUCT_SKUS.LEGACY_PREMIUM_LIFETIME;
}
