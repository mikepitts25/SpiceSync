import { useSyncExternalStore } from 'react';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Product,
  type Purchase,
} from 'expo-iap';

import { getStoreKitAppAccountToken } from './storeKitAccountToken';
export { isPurchaseProviderConfigured } from './config';
import {
  createPurchaseService,
  type IapAdapter,
  type PurchaseUiState,
  type StoreProduct,
  type StorePurchase,
} from './purchaseServiceCore';

const iapAdapter: IapAdapter = {
  initConnection: () => initConnection(),
  endConnection: async () => {
    await endConnection();
  },
  fetchProducts: async (request) => {
    const products = await fetchProducts(request);
    return (products ?? []) as Product[] as StoreProduct[];
  },
  requestPurchase: (request) => requestPurchase(request),
  getAvailablePurchases: async () =>
    (await getAvailablePurchases({
      includeSuspendedAndroid: false,
      onlyIncludeActiveItemsIOS: true,
    })) as unknown as StorePurchase[],
  restorePurchases: () => restorePurchases(),
  finishTransaction: ({ purchase, isConsumable }) =>
    finishTransaction({
      purchase: purchase as unknown as Purchase,
      isConsumable,
    }),
  onPurchaseUpdated: (listener) =>
    purchaseUpdatedListener((purchase) => {
      void listener(purchase as unknown as StorePurchase);
    }),
  onPurchaseError: (listener) => purchaseErrorListener(listener),
};

async function optionalAppAccountToken(): Promise<string | null> {
  try {
    return await getStoreKitAppAccountToken();
  } catch (error) {
    console.warn('[Purchases] App account token unavailable:', error);
    return null;
  }
}

export const purchaseService = createPurchaseService(
  iapAdapter,
  optionalAppAccountToken
);

const getSnapshot = (): PurchaseUiState => purchaseService.getState();
const purchasePremium = () => purchaseService.purchasePremium();
const restorePremium = () => purchaseService.restorePremium();
const initializePurchases = () => purchaseService.initialize();

export function usePurchases() {
  const state = useSyncExternalStore(
    purchaseService.subscribe,
    getSnapshot,
    getSnapshot
  );

  return {
    ...state,
    purchase: purchasePremium,
    restore: restorePremium,
    initialize: initializePurchases,
  };
}

export type { PurchaseUiState, StoreProduct } from './purchaseServiceCore';
