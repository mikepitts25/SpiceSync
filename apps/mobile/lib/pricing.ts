/** Configure this exact non-consumable product in both app stores. */
export const PRODUCT_SKUS = {
  PREMIUM_LIFETIME: 'spicesync_premium_lifetime',
} as const;

export type ProductSku = (typeof PRODUCT_SKUS)[keyof typeof PRODUCT_SKUS];
