import { PRODUCT_SKUS } from '../lib/pricing';
import { usePremiumStore } from '../src/stores/premium';

describe('premium store', () => {
  beforeEach(() => {
    usePremiumStore.getState().clearStoreEntitlement();
  });

  it('records only the lifetime store entitlement as premium', () => {
    usePremiumStore
      .getState()
      .setLifetimeEntitlement('signed-store-token', 1720000000000);

    const state = usePremiumStore.getState();
    expect(state.isPremium()).toBe(true);
    expect(state.subscription).toMatchObject({
      tier: 'premium',
      productId: PRODUCT_SKUS.PREMIUM_LIFETIME,
      receipt: 'signed-store-token',
      startedAt: 1720000000000,
    });
  });

  it('revokes cached access when the store reports no entitlement', () => {
    usePremiumStore
      .getState()
      .setLifetimeEntitlement('signed-store-token', 1720000000000);

    usePremiumStore.getState().clearStoreEntitlement();

    expect(usePremiumStore.getState().isPremium()).toBe(false);
    expect(usePremiumStore.getState().subscription.receipt).toBeNull();
  });
});
