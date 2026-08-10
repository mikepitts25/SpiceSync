import { PRODUCT_SKUS } from '../lib/pricing';
import {
  createPurchaseService,
  type IapAdapter,
  type StorePurchase,
} from '../lib/purchases/purchaseServiceCore';
import { usePremiumStore } from '../src/stores/premium';

const premiumPurchase: StorePurchase = {
  productId: PRODUCT_SKUS.PREMIUM_LIFETIME,
  purchaseState: 'purchased',
  purchaseToken: 'store-signed-token',
  transactionDate: 1720000000000,
};

function makeAdapter(overrides: Partial<IapAdapter> = {}): IapAdapter & {
  emitPurchase: (purchase: StorePurchase) => Promise<void>;
} {
  let purchaseListener:
    | ((purchase: StorePurchase) => void | Promise<void>)
    | null = null;

  return {
    initConnection: jest.fn().mockResolvedValue(true),
    endConnection: jest.fn().mockResolvedValue(undefined),
    fetchProducts: jest.fn().mockResolvedValue([
      {
        id: PRODUCT_SKUS.PREMIUM_LIFETIME,
        title: 'SpiceSync Premium',
        description: 'Lifetime premium access',
        displayPrice: '$4.99',
        price: 4.99,
        currency: 'USD',
      },
    ]),
    requestPurchase: jest.fn().mockResolvedValue(null),
    getAvailablePurchases: jest.fn().mockResolvedValue([]),
    restorePurchases: jest.fn().mockResolvedValue(undefined),
    finishTransaction: jest.fn().mockResolvedValue(undefined),
    onPurchaseUpdated: jest.fn((listener) => {
      purchaseListener = listener;
      return { remove: jest.fn() };
    }),
    onPurchaseError: jest.fn(() => ({ remove: jest.fn() })),
    ...overrides,
    emitPurchase: async (purchase) => {
      if (!purchaseListener)
        throw new Error('Purchase listener not registered');
      await purchaseListener(purchase);
    },
  };
}

describe('purchase service', () => {
  beforeEach(() => {
    usePremiumStore.getState().clearStoreEntitlement();
  });

  it('restores a lifetime purchase from the native store during initialization', async () => {
    const adapter = makeAdapter({
      getAvailablePurchases: jest.fn().mockResolvedValue([premiumPurchase]),
    });
    const service = createPurchaseService(adapter, async () => null);

    await service.initialize();

    expect(adapter.fetchProducts).toHaveBeenCalledWith({
      skus: [PRODUCT_SKUS.PREMIUM_LIFETIME],
      type: 'in-app',
    });
    expect(usePremiumStore.getState().isPremium()).toBe(true);
    expect(usePremiumStore.getState().subscription.receipt).toBe(
      'store-signed-token'
    );
  });

  it('starts the platform purchase without granting premium locally', async () => {
    const adapter = makeAdapter();
    const accountToken = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    const service = createPurchaseService(adapter, async () => accountToken);
    await service.initialize();

    const result = await service.purchasePremium();

    expect(adapter.requestPurchase).toHaveBeenCalledWith({
      request: {
        apple: {
          sku: PRODUCT_SKUS.PREMIUM_LIFETIME,
          appAccountToken: accountToken,
        },
        google: { skus: [PRODUCT_SKUS.PREMIUM_LIFETIME] },
      },
      type: 'in-app',
    });
    expect(result).toEqual({ success: true, pending: true });
    expect(usePremiumStore.getState().isPremium()).toBe(false);
  });

  it('keeps purchasing disabled when the lifetime product is missing from the store', async () => {
    const adapter = makeAdapter({
      fetchProducts: jest.fn().mockResolvedValue([]),
    });
    const service = createPurchaseService(adapter, async () => null);

    await expect(service.initialize()).resolves.toBe(false);
    expect(service.getState()).toMatchObject({
      connected: false,
      product: null,
      error: 'Premium is not available in this app store yet.',
    });

    await expect(service.purchasePremium()).resolves.toEqual({
      success: false,
      error: 'Premium is not available in this app store yet.',
    });
    expect(adapter.requestPurchase).not.toHaveBeenCalled();
  });

  it('grants premium only after a completed matching store transaction', async () => {
    const adapter = makeAdapter();
    const service = createPurchaseService(adapter, async () => null);
    await service.initialize();

    await adapter.emitPurchase({
      ...premiumPurchase,
      productId: 'unrelated_product',
    });
    expect(usePremiumStore.getState().isPremium()).toBe(false);

    await adapter.emitPurchase(premiumPurchase);

    expect(adapter.finishTransaction).toHaveBeenCalledWith({
      purchase: premiumPurchase,
      isConsumable: false,
    });
    expect(usePremiumStore.getState().isPremium()).toBe(true);
  });

  it('removes a stale cached entitlement after a successful empty restore', async () => {
    usePremiumStore
      .getState()
      .setLifetimeEntitlement('cached-token', 1710000000000);
    const adapter = makeAdapter();
    const service = createPurchaseService(adapter, async () => null);

    await service.initialize();
    const restored = await service.restorePremium();

    expect(adapter.restorePurchases).toHaveBeenCalledTimes(1);
    expect(restored).toBe(false);
    expect(usePremiumStore.getState().isPremium()).toBe(false);
  });
});
