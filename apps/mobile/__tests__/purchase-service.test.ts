import { PRODUCT_SKUS } from '../lib/pricing';
import { purchaseService } from '../lib/purchases/purchaseService';
import { usePremiumStore } from '../src/stores/premium';

jest.mock(
  '../lib/purchases/storeKitAccountToken',
  () => ({
    getStoreKitAppAccountToken: jest.fn(),
  })
);

const mockedGetStoreKitAppAccountToken = jest.requireMock(
  '../lib/purchases/storeKitAccountToken'
).getStoreKitAppAccountToken as jest.Mock;

describe('purchase service', () => {
  const originalPurchasesEnabled = process.env.EXPO_PUBLIC_PURCHASES_ENABLED;

  beforeEach(() => {
    if (originalPurchasesEnabled === undefined) {
      delete process.env.EXPO_PUBLIC_PURCHASES_ENABLED;
    } else {
      process.env.EXPO_PUBLIC_PURCHASES_ENABLED = originalPurchasesEnabled;
    }
    mockedGetStoreKitAppAccountToken.mockReset();
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

  it('uses the Supabase user id as the StoreKit account token when purchases are enabled', async () => {
    const appAccountToken = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    process.env.EXPO_PUBLIC_PURCHASES_ENABLED = 'true';
    mockedGetStoreKitAppAccountToken.mockResolvedValue(appAccountToken);

    const result = await purchaseService.purchaseProduct(
      PRODUCT_SKUS.PREMIUM_LIFETIME
    );

    expect(mockedGetStoreKitAppAccountToken).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      success: true,
      sku: PRODUCT_SKUS.PREMIUM_LIFETIME,
      appAccountToken,
    });
  });
});
