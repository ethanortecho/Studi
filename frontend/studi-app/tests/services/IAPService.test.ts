/**
 * IAP Service Tests
 *
 * Focus: Testing IAP service functions without actual IAP connection
 * Scope: Product loading, purchase simulation, error handling
 *
 * Key Testing Areas:
 * 1. Product loading and validation
 * 2. Purchase flow simulation
 * 3. Premium status integration
 * 4. Error scenarios and recovery
 */

import { loadSubscriptionProducts, purchaseSubscription, testConnection, SUBSCRIPTION_ID } from '../../services/IAPService';

// Mock react-native-iap
const mockUseIAP = jest.fn();
jest.mock('react-native-iap', () => ({
  useIAP: () => mockUseIAP(),
}));

describe('IAP Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Suppress console logs in tests
    console.error = jest.fn();
  });

  describe('loadSubscriptionProducts', () => {
    it('should call fetchProducts with correct parameters', async () => {
      const mockFetchProducts = jest.fn().mockResolvedValue(undefined);

      await loadSubscriptionProducts(mockFetchProducts);

      expect(mockFetchProducts).toHaveBeenCalledWith({
        skus: [SUBSCRIPTION_ID],
        type: 'subs'
      });
    });

    it('should handle fetchProducts errors', async () => {
      const mockFetchProducts = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(loadSubscriptionProducts(mockFetchProducts))
        .rejects.toThrow('Network error');
    });

    it('should log success in development mode', async () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      const mockFetchProducts = jest.fn().mockResolvedValue(undefined);
      const consoleSpy = jest.spyOn(console, 'log');

      await loadSubscriptionProducts(mockFetchProducts);

      expect(consoleSpy).toHaveBeenCalledWith('🔧 Loading subscription products...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Subscription products loaded');

      (global as any).__DEV__ = originalDev;
      consoleSpy.mockRestore();
    });

    it('should not log in production mode', async () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = false;

      const mockFetchProducts = jest.fn().mockResolvedValue(undefined);
      const consoleSpy = jest.spyOn(console, 'log');

      await loadSubscriptionProducts(mockFetchProducts);

      expect(consoleSpy).not.toHaveBeenCalled();

      (global as any).__DEV__ = originalDev;
      consoleSpy.mockRestore();
    });
  });

  describe('purchaseSubscription', () => {
    const mockSubscription = {
      productId: SUBSCRIPTION_ID,
      id: SUBSCRIPTION_ID,
      title: 'Studi Premium Monthly',
      displayPrice: '$4.99'
    };

    const mockRequestPurchase = jest.fn().mockResolvedValue(undefined);

    it('should find subscription by productId and initiate purchase', async () => {
      const subscriptions = [mockSubscription];

      await purchaseSubscription(mockRequestPurchase, subscriptions);

      expect(mockRequestPurchase).toHaveBeenCalledWith({
        request: {
          ios: {
            sku: SUBSCRIPTION_ID
          },
          android: {
            skus: [SUBSCRIPTION_ID],
            subscriptionOffers: []
          }
        },
        type: 'subs'
      });
    });

    it('should find subscription by id field as fallback', async () => {
      const subscriptions = [{
        id: SUBSCRIPTION_ID,
        title: 'Studi Premium Monthly',
        displayPrice: '$4.99'
        // Missing productId field
      } as any];

      await purchaseSubscription(mockRequestPurchase, subscriptions);

      expect(mockRequestPurchase).toHaveBeenCalled();
    });

    it('should throw error when subscription not found', async () => {
      const subscriptions = [{
        productId: 'com.other.product',
        displayPrice: '$2.99'
      }];

      await expect(purchaseSubscription(mockRequestPurchase, subscriptions))
        .rejects.toThrow(`Subscription ${SUBSCRIPTION_ID} not found in available products`);

      expect(mockRequestPurchase).not.toHaveBeenCalled();
    });

    it('should handle empty subscriptions array', async () => {
      const subscriptions: any[] = [];

      await expect(purchaseSubscription(mockRequestPurchase, subscriptions))
        .rejects.toThrow(`Subscription ${SUBSCRIPTION_ID} not found in available products`);
    });

    it('should handle Android subscription offers', async () => {
      const subscriptionWithOffers = {
        ...mockSubscription,
        subscriptionOfferDetailsAndroid: [{
          offerToken: 'test-offer-token-123'
        }]
      };

      const subscriptions = [subscriptionWithOffers];

      await purchaseSubscription(mockRequestPurchase, subscriptions);

      expect(mockRequestPurchase).toHaveBeenCalledWith({
        request: {
          ios: {
            sku: SUBSCRIPTION_ID
          },
          android: {
            skus: [SUBSCRIPTION_ID],
            subscriptionOffers: [{
              sku: SUBSCRIPTION_ID,
              offerToken: 'test-offer-token-123'
            }]
          }
        },
        type: 'subs'
      });
    });

    it('should handle requestPurchase errors', async () => {
      const mockError = new Error('Purchase failed');
      const mockFailingRequestPurchase = jest.fn().mockRejectedValue(mockError);

      const subscriptions = [mockSubscription];

      await expect(purchaseSubscription(mockFailingRequestPurchase, subscriptions))
        .rejects.toThrow('Purchase failed');
    });

    it('should log purchase process in development', async () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      const consoleSpy = jest.spyOn(console, 'log');
      const subscriptions = [mockSubscription];

      await purchaseSubscription(mockRequestPurchase, subscriptions);

      expect(consoleSpy).toHaveBeenCalledWith('🚀 Starting subscription purchase...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Found subscription product:', SUBSCRIPTION_ID);
      expect(consoleSpy).toHaveBeenCalledWith('⏳ Purchase request sent successfully');

      (global as any).__DEV__ = originalDev;
      consoleSpy.mockRestore();
    });
  });

  describe('testConnection', () => {
    const mockFetchProducts = jest.fn();
    const mockSubscriptions = [{
      productId: SUBSCRIPTION_ID,
      displayPrice: '$4.99'
    }];

    beforeEach(() => {
      mockFetchProducts.mockClear();
    });

    it('should return early in production mode', async () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = false;

      const result = await testConnection(true, mockFetchProducts, mockSubscriptions);

      expect(result).toEqual({
        connected: true,
        products: mockSubscriptions,
        errors: []
      });

      expect(mockFetchProducts).not.toHaveBeenCalled();

      (global as any).__DEV__ = originalDev;
    });

    it('should test connection and products in development', async () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      mockFetchProducts.mockResolvedValue(undefined);

      const result = await testConnection(true, mockFetchProducts, mockSubscriptions);

      expect(result).toEqual({
        connected: true,
        products: mockSubscriptions,
        errors: []
      });

      expect(mockFetchProducts).toHaveBeenCalled();

      (global as any).__DEV__ = originalDev;
    });

    it('should handle connection failure', async () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      const result = await testConnection(false, mockFetchProducts, []);

      expect(result).toEqual({
        connected: false,
        products: [],
        errors: ['Not connected to IAP service']
      });

      (global as any).__DEV__ = originalDev;
    });

    it('should detect missing products', async () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      mockFetchProducts.mockResolvedValue(undefined);

      const result = await testConnection(true, mockFetchProducts, []);

      expect(result.errors).toContain(`Subscription ${SUBSCRIPTION_ID} not found in App Store Connect`);

      (global as any).__DEV__ = originalDev;
    });

    it('should handle product loading errors', async () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      mockFetchProducts.mockRejectedValue(new Error('Loading failed'));

      const result = await testConnection(true, mockFetchProducts, mockSubscriptions);

      expect(result.errors).toContain('Product loading failed: Loading failed');

      (global as any).__DEV__ = originalDev;
    });

    it('should handle unexpected errors', async () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      // Mock an error that would cause the loadSubscriptionProducts to throw
      const faultyFetchProducts = jest.fn().mockRejectedValue(new Error('Unexpected error'));

      const result = await testConnection(true, faultyFetchProducts, mockSubscriptions);

      // The function should still return connected: true but with errors
      expect(result.connected).toBe(true);
      expect(result.errors).toContain('Product loading failed: Unexpected error');

      (global as any).__DEV__ = originalDev;
    });
  });

  describe('SUBSCRIPTION_ID constant', () => {
    it('should export correct subscription ID', () => {
      expect(SUBSCRIPTION_ID).toBe('com.studi.premium.monthly');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full purchase flow simulation', async () => {
      const mockFetchProducts = jest.fn().mockResolvedValue(undefined);
      const mockRequestPurchase = jest.fn().mockResolvedValue(undefined);

      const subscriptions = [{
        productId: SUBSCRIPTION_ID,
        displayPrice: '$4.99'
      }];

      // Step 1: Load products
      await loadSubscriptionProducts(mockFetchProducts);
      expect(mockFetchProducts).toHaveBeenCalled();

      // Step 2: Purchase subscription
      await purchaseSubscription(mockRequestPurchase, subscriptions);
      expect(mockRequestPurchase).toHaveBeenCalled();
    });

    it('should handle product loading failure before purchase', async () => {
      const mockFetchProducts = jest.fn().mockRejectedValue(new Error('Network timeout'));
      const mockRequestPurchase = jest.fn();

      // Product loading fails
      await expect(loadSubscriptionProducts(mockFetchProducts))
        .rejects.toThrow('Network timeout');

      // Purchase should not be attempted
      expect(mockRequestPurchase).not.toHaveBeenCalled();
    });

    it('should validate subscription exists before purchase attempt', async () => {
      const mockRequestPurchase = jest.fn();

      // No matching subscriptions
      const subscriptions = [{
        productId: 'com.different.product',
        displayPrice: '$1.99'
      }];

      // Purchase should fail validation
      await expect(purchaseSubscription(mockRequestPurchase, subscriptions))
        .rejects.toThrow('not found in available products');

      // IAP purchase should not be attempted
      expect(mockRequestPurchase).not.toHaveBeenCalled();
    });
  });
});