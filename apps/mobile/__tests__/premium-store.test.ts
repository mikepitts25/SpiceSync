import { usePremiumStore } from '../src/stores/premium';

describe('premium store', () => {
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

  it('validates gift-code format without redeeming typed codes locally', async () => {
    const code = 'SPICE-ABCDEFGHJKLM';

    expect(usePremiumStore.getState().validateGiftCode(code)).toBe(true);
    await expect(usePremiumStore.getState().redeemGiftCode(code)).resolves.toBe(
      false
    );
    expect(usePremiumStore.getState().subscription.tier).toBe('free');
  });
});
