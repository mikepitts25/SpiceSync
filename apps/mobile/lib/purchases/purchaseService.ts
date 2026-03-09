// Purchase service for handling In-App Purchases
// Supports both expo-in-app-purchases and react-native-iap patterns

import { Platform } from 'react-native';
import { 
  PRODUCT_SKUS, 
  PackSku, 
  ProductSku, 
  isPackSku, 
  isPremiumSku,
  PRICING 
} from '../pricing';
import { usePremiumStore } from '../../src/stores/premium';

// Product information for display
export interface ProductInfo {
  sku: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
}

// Purchase result
export interface PurchaseResult {
  success: boolean;
  sku?: string;
  receipt?: string;
  error?: string;
}

// All product SKUs to query
export const ALL_PRODUCT_SKUS = [
  PRODUCT_SKUS.PREMIUM_LIFETIME,
  PRODUCT_SKUS.PACK_VACATION,
  PRODUCT_SKUS.PACK_KINKY201,
  PRODUCT_SKUS.PACK_DATENIGHT,
  PRODUCT_SKUS.GIFT_PREMIUM,
];

class PurchaseService {
  private initialized = false;
  private products: Map<string, ProductInfo> = new Map();

  /**
   * Initialize the purchase service
   * Call this when the app starts
   */
  async initialize(): Promise<boolean> {
    try {
      // In production, initialize your IAP library here:
      // - For expo-in-app-purchases: await InAppPurchases.connectAsync()
      // - For react-native-iap: await RNIap.initConnection()
      
      console.log('[PurchaseService] Initialized');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[PurchaseService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Fetch product information from the store
   */
  async fetchProducts(): Promise<ProductInfo[]> {
    try {
      // In production, fetch from store:
      // const products = await InAppPurchases.getProductsAsync(ALL_PRODUCT_SKUS);
      
      // Mock products for development
      const mockProducts: ProductInfo[] = [
        {
          sku: PRODUCT_SKUS.PREMIUM_LIFETIME,
          title: 'SpiceSync Premium',
          description: 'Lifetime access to all premium features and packs',
          price: `$${PRICING.BASE_PREMIUM.toFixed(2)}`,
          priceAmount: PRICING.BASE_PREMIUM,
          currency: 'USD',
        },
        {
          sku: PRODUCT_SKUS.PACK_VACATION,
          title: 'Vacation Pack',
          description: 'Travel & adventure themed activities',
          price: `$${PRICING.PACK_PRICE.toFixed(2)}`,
          priceAmount: PRICING.PACK_PRICE,
          currency: 'USD',
        },
        {
          sku: PRODUCT_SKUS.PACK_KINKY201,
          title: 'Kinky 201 Pack',
          description: 'Advanced & experimental activities',
          price: `$${PRICING.PACK_PRICE.toFixed(2)}`,
          priceAmount: PRICING.PACK_PRICE,
          currency: 'USD',
        },
        {
          sku: PRODUCT_SKUS.PACK_DATENIGHT,
          title: 'Date Night Pack',
          description: 'Romantic evening focused activities',
          price: `$${PRICING.PACK_PRICE.toFixed(2)}`,
          priceAmount: PRICING.PACK_PRICE,
          currency: 'USD',
        },
        {
          sku: PRODUCT_SKUS.GIFT_PREMIUM,
          title: 'Gift SpiceSync Premium',
          description: 'Gift premium access to another couple',
          price: `$${PRICING.GIFT_PRICE.toFixed(2)}`,
          priceAmount: PRICING.GIFT_PRICE,
          currency: 'USD',
        },
      ];

      this.products.clear();
      mockProducts.forEach(p => this.products.set(p.sku, p));
      
      return mockProducts;
    } catch (error) {
      console.error('[PurchaseService] Failed to fetch products:', error);
      return [];
    }
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(sku: ProductSku): Promise<PurchaseResult> {
    try {
      console.log(`[PurchaseService] Purchasing ${sku}...`);
      
      // In production:
      // const { responseCode, results } = await InAppPurchases.purchaseItemAsync(sku);
      // if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      //   const purchase = results[0];
      //   return { success: true, sku, receipt: purchase.purchaseToken };
      // }
      
      // Simulate purchase delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful purchase
      const mockReceipt = `mock_receipt_${sku}_${Date.now()}`;
      
      // Update store based on purchase type
      const store = usePremiumStore.getState();
      
      if (isPremiumSku(sku)) {
        store.upgrade('premium', sku, mockReceipt);
      } else if (isPackSku(sku)) {
        store.purchasePack(sku, sku, mockReceipt);
      } else if (sku === PRODUCT_SKUS.GIFT_PREMIUM) {
        // Gift purchases don't upgrade the buyer
        const code = await store.generateGiftCode();
        return { success: true, sku, receipt: mockReceipt + '_gift_' + code };
      }
      
      return { success: true, sku, receipt: mockReceipt };
    } catch (error) {
      console.error(`[PurchaseService] Purchase failed for ${sku}:`, error);
      return { 
        success: false, 
        sku, 
        error: error instanceof Error ? error.message : 'Purchase failed' 
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult[]> {
    try {
      console.log('[PurchaseService] Restoring purchases...');
      
      // In production:
      // const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
      // if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      //   // Process restored purchases
      // }
      
      // Simulate restore delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check current store state for mock restoration
      const store = usePremiumStore.getState();
      const results: PurchaseResult[] = [];
      
      if (store.subscription.receipt) {
        results.push({
          success: true,
          sku: store.subscription.productId || PRODUCT_SKUS.PREMIUM_LIFETIME,
          receipt: store.subscription.receipt,
        });
      }
      
      store.packs.forEach(pack => {
        results.push({
          success: true,
          sku: pack.packId,
          receipt: pack.receipt,
        });
      });
      
      return results;
    } catch (error) {
      console.error('[PurchaseService] Restore failed:', error);
      return [{ success: false, error: 'Restore failed' }];
    }
  }

  /**
   * Acknowledge a purchase (required for Android)
   */
  async acknowledgePurchase(receipt: string): Promise<boolean> {
    try {
      // In production:
      // await InAppPurchases.acknowledgePurchaseAsync(receipt);
      
      console.log(`[PurchaseService] Acknowledged purchase: ${receipt}`);
      return true;
    } catch (error) {
      console.error('[PurchaseService] Acknowledge failed:', error);
      return false;
    }
  }

  /**
   * Get cached product info
   */
  getProductInfo(sku: string): ProductInfo | undefined {
    return this.products.get(sku);
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Finish a transaction (required for some IAP libraries)
   */
  async finishTransaction(receipt: string): Promise<boolean> {
    try {
      // In production:
      // await InAppPurchases.finishTransactionAsync(receipt, true);
      
      console.log(`[PurchaseService] Finished transaction: ${receipt}`);
      return true;
    } catch (error) {
      console.error('[PurchaseService] Finish transaction failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const purchaseService = new PurchaseService();

// React hook for using purchases
export function usePurchases() {
  const store = usePremiumStore();
  
  return {
    // State
    isPremium: store.isPremium(),
    hasPack: store.hasPack,
    hasPackAccess: store.hasPackAccess,
    unlockedPacks: store.getUnlockedPacks(),
    subscription: store.subscription,
    packs: store.packs,
    
    // Actions
    purchase: purchaseService.purchaseProduct.bind(purchaseService),
    restore: purchaseService.restorePurchases.bind(purchaseService),
    initialize: purchaseService.initialize.bind(purchaseService),
    fetchProducts: purchaseService.fetchProducts.bind(purchaseService),
    
    // Helpers
    canAccessCard: (cardId: string) => {
      if (store.isPremium()) return true;
      return store.hasPackAccess(cardId);
    },
  };
}
