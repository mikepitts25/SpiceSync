import { PRODUCT_SKUS } from '../lib/pricing';
import { purchaseService } from '../lib/purchases/purchaseService';
import { usePremiumStore } from '../src/stores/premium';

describe('purchase service', () => {
  beforeEach(() => {
    usePremiumStore.setState({
      subscription: {
        tier: 'free',
        expiresAt: null,
        startedAt: 1,
        productId: null,
        receipt: null,
        isGift: false,
      },
      packs: [],
      giftCodes: [],
      isLoading: false,
      showPaywall: false,
      paywallFeature: null,
    });
  });

  it('does not grant premium when purchases are not configured', async () => {
    const result = await purchaseService.purchaseProduct(
      PRODUCT_SKUS.PREMIUM_LIFETIME
    );

    expect(result).toEqual({
      success: false,
      sku: PRODUCT_SKUS.PREMIUM_LIFETIME,
      error: 'Purchases are not available yet.',
    });
    expect(usePremiumStore.getState().subscription.tier).toBe('free');
    expect(usePremiumStore.getState().subscription.receipt).toBeNull();
  });

  it('returns no restored purchases while purchases are unavailable', async () => {
    usePremiumStore
      .getState()
      .upgrade('premium', PRODUCT_SKUS.PREMIUM_LIFETIME, 'existing_receipt');

    await expect(purchaseService.restorePurchases()).resolves.toEqual([]);
  });
});
