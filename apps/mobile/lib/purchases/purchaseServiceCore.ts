import { PRODUCT_SKUS } from '../pricing';
import { usePremiumStore } from '../../src/stores/premium';

export type StorePurchase = {
  productId: string;
  purchaseState: 'pending' | 'purchased' | 'unknown';
  purchaseToken?: string | null;
  transactionDate: number;
  isSuspendedAndroid?: boolean | null;
  revocationDateIOS?: number | null;
};

export type StoreProduct = {
  id: string;
  title: string;
  description: string;
  displayPrice: string;
  price?: number | null;
  currency: string;
};

type ListenerSubscription = { remove: () => void };

export interface IapAdapter {
  initConnection: () => Promise<boolean>;
  endConnection: () => Promise<void>;
  fetchProducts: (request: {
    skus: string[];
    type: 'in-app';
  }) => Promise<StoreProduct[]>;
  requestPurchase: (request: {
    request: {
      apple: { sku: string; appAccountToken?: string };
      google: { skus: string[] };
    };
    type: 'in-app';
  }) => Promise<unknown>;
  getAvailablePurchases: () => Promise<StorePurchase[]>;
  restorePurchases: () => Promise<void>;
  finishTransaction: (request: {
    purchase: StorePurchase;
    isConsumable: false;
  }) => Promise<void>;
  onPurchaseUpdated: (
    listener: (purchase: StorePurchase) => void | Promise<void>
  ) => ListenerSubscription;
  onPurchaseError: (
    listener: (error: { message: string; code?: string }) => void
  ) => ListenerSubscription;
}

export type PurchaseUiState = {
  connected: boolean;
  loading: boolean;
  product: StoreProduct | null;
  error: string | null;
};

function isValidPremiumPurchase(purchase: StorePurchase): boolean {
  return (
    purchase.productId === PRODUCT_SKUS.PREMIUM_LIFETIME &&
    purchase.purchaseState === 'purchased' &&
    purchase.isSuspendedAndroid !== true &&
    purchase.revocationDateIOS == null
  );
}

export function createPurchaseService(
  adapter: IapAdapter,
  getAppAccountToken: () => Promise<string | null>
) {
  let initialized = false;
  let product: StoreProduct | null = null;
  let error: string | null = null;
  let loading = false;
  let purchaseSubscription: ListenerSubscription | null = null;
  let errorSubscription: ListenerSubscription | null = null;
  const stateListeners = new Set<() => void>();
  let snapshot: PurchaseUiState = {
    connected: false,
    loading: false,
    product: null,
    error: null,
  };

  const emitState = () => {
    snapshot = { connected: initialized, loading, product, error };
    stateListeners.forEach((listener) => listener());
  };
  const setError = (message: string | null) => {
    error = message;
    emitState();
  };

  const applyPurchases = (purchases: StorePurchase[]): boolean => {
    const entitlement = purchases.find(isValidPremiumPurchase);
    if (!entitlement) {
      usePremiumStore.getState().clearStoreEntitlement();
      return false;
    }

    usePremiumStore
      .getState()
      .setLifetimeEntitlement(
        entitlement.purchaseToken ?? null,
        entitlement.transactionDate
      );
    return true;
  };

  const handlePurchase = async (purchase: StorePurchase) => {
    if (!isValidPremiumPurchase(purchase)) return;
    try {
      await adapter.finishTransaction({ purchase, isConsumable: false });
      usePremiumStore
        .getState()
        .setLifetimeEntitlement(
          purchase.purchaseToken ?? null,
          purchase.transactionDate
        );
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The purchase could not be completed.'
      );
    }
  };

  return {
    async initialize(): Promise<boolean> {
      if (initialized) return true;
      loading = true;
      emitState();
      try {
        purchaseSubscription = adapter.onPurchaseUpdated(handlePurchase);
        errorSubscription = adapter.onPurchaseError((purchaseError) => {
          setError(purchaseError.message || 'The purchase was not completed.');
        });
        const connected = await adapter.initConnection();
        if (!connected) throw new Error('Could not connect to the app store.');
        initialized = true;
        const products = await adapter.fetchProducts({
          skus: [PRODUCT_SKUS.PREMIUM_LIFETIME],
          type: 'in-app',
        });
        product =
          products.find(
            (candidate) => candidate.id === PRODUCT_SKUS.PREMIUM_LIFETIME
          ) ?? null;
        if (!product) {
          throw new Error('Premium is not available in this app store yet.');
        }
        applyPurchases(await adapter.getAvailablePurchases());
        error = null;
        return true;
      } catch (caught) {
        purchaseSubscription?.remove();
        errorSubscription?.remove();
        purchaseSubscription = null;
        errorSubscription = null;
        if (initialized) {
          await adapter.endConnection().catch(() => undefined);
        }
        initialized = false;
        error =
          caught instanceof Error
            ? caught.message
            : 'Purchases are unavailable right now.';
        return false;
      } finally {
        loading = false;
        emitState();
      }
    },

    async purchasePremium(): Promise<{
      success: boolean;
      pending?: boolean;
      error?: string;
    }> {
      if (!initialized && !(await this.initialize())) {
        return { success: false, error: error ?? 'Purchases are unavailable.' };
      }
      loading = true;
      setError(null);
      try {
        const accountToken = await getAppAccountToken();
        await adapter.requestPurchase({
          request: {
            apple: {
              sku: PRODUCT_SKUS.PREMIUM_LIFETIME,
              ...(accountToken ? { appAccountToken: accountToken } : {}),
            },
            google: { skus: [PRODUCT_SKUS.PREMIUM_LIFETIME] },
          },
          type: 'in-app',
        });
        return { success: true, pending: true };
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : 'The purchase was not started.';
        setError(message);
        return { success: false, error: message };
      } finally {
        loading = false;
        emitState();
      }
    },

    async restorePremium(): Promise<boolean> {
      if (!initialized && !(await this.initialize())) return false;
      loading = true;
      setError(null);
      try {
        await adapter.restorePurchases();
        const restored = applyPurchases(await adapter.getAvailablePurchases());
        if (!restored) setError('No previous Premium purchase was found.');
        return restored;
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : 'Restore purchases failed.'
        );
        return false;
      } finally {
        loading = false;
        emitState();
      }
    },

    getState(): PurchaseUiState {
      return snapshot;
    },

    subscribe(listener: () => void): () => void {
      stateListeners.add(listener);
      return () => stateListeners.delete(listener);
    },

    async dispose(): Promise<void> {
      purchaseSubscription?.remove();
      errorSubscription?.remove();
      purchaseSubscription = null;
      errorSubscription = null;
      if (initialized) await adapter.endConnection();
      initialized = false;
      emitState();
    },
  };
}

export type PurchaseService = ReturnType<typeof createPurchaseService>;
